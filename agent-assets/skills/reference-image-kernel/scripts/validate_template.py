#!/usr/bin/env python3
"""Validate a Template Creator image package and its companion image-template.json."""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal

from PIL import Image
from pydantic import BaseModel, ConfigDict, Field, ValidationError, field_validator, model_validator


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Reference(StrictModel):
    path: Literal["assets/reference.png"]
    sha256: str = Field(pattern=r"^[0-9a-f]{64}$")
    mimeType: Literal["image/png"]
    width: int = Field(gt=0)
    height: int = Field(gt=0)
    role: Literal["template", "composition", "identity", "style", "palette-material", "lighting", "typography"]


class Profile(StrictModel):
    intendedUse: str = Field(min_length=1)
    assetType: str = Field(min_length=1)
    composition: list[str]
    visualHierarchy: list[str]
    palette: list[str]
    typography: list[str]
    materials: list[str]
    lighting: list[str]
    brandElements: list[str]
    unknowns: list[str]

    @field_validator("composition", "visualHierarchy", "palette", "typography", "materials", "lighting", "brandElements", "unknowns")
    @classmethod
    def nonblank_entries(cls, values: list[str]) -> list[str]:
        if any(not value.strip() for value in values):
            raise ValueError("profile lists cannot contain blank entries")
        return values


class Slot(StrictModel):
    id: str = Field(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    type: Literal["text", "image", "subject", "palette", "style"]
    required: bool
    verbatim: bool
    description: str = Field(min_length=1)


class ExactLayer(StrictModel):
    id: str = Field(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    kind: Literal["copy", "logo", "data", "legal", "other"]
    source: str = Field(min_length=1)
    placement: str = Field(min_length=1)
    verification: Literal["deterministic-overlay-required"]


class Constraints(StrictModel):
    mustKeep: list[str] = Field(min_length=1)
    allowedChanges: list[str] = Field(min_length=1)
    mustAvoid: list[str]
    exactLayers: list[ExactLayer]

    @field_validator("mustKeep", "allowedChanges", "mustAvoid")
    @classmethod
    def nonblank_entries(cls, values: list[str]) -> list[str]:
        if any(not value.strip() for value in values):
            raise ValueError("constraint lists cannot contain blank entries")
        return values


class SafeZone(StrictModel):
    top: int = Field(ge=0)
    right: int = Field(ge=0)
    bottom: int = Field(ge=0)
    left: int = Field(ge=0)


class Target(StrictModel):
    width: int = Field(gt=0)
    height: int = Field(gt=0)
    format: Literal["png"]
    sizePolicy: Literal["match-reference", "match-aspect", "exact"]
    cropPolicy: Literal["preserve", "fit", "fill", "none"]
    background: Literal["preserve", "transparent", "opaque", "auto"]
    requiresTransparency: bool
    safeZonePx: SafeZone

    @model_validator(mode="after")
    def transparency_is_consistent(self) -> "Target":
        if self.background == "transparent" and not self.requiresTransparency:
            raise ValueError("transparent background requires requiresTransparency=true")
        return self


class Generation(StrictModel):
    mode: Literal["edit"]
    executor: Literal["builtin-imagegen"]
    actualReferenceRequired: Literal[True]
    quality: Literal["low", "medium", "high", "auto"]
    variants: int = Field(ge=1, le=4)
    outputNamingPattern: str = Field(min_length=1)


class ValidationRules(StrictModel):
    structural: list[str] = Field(min_length=1)
    visual: list[str] = Field(min_length=1)
    humanAcceptanceRequired: Literal[True]


class Provenance(StrictModel):
    sourceFilename: str = Field(min_length=1)
    createdAt: datetime
    extractor: Literal["reference-image-kernel"]
    extractorVersion: str = Field(pattern=r"^[0-9]+(?:\.[0-9]+){0,2}$")

    @field_validator("sourceFilename")
    @classmethod
    def basename_only(cls, value: str) -> str:
        if Path(value).name != value:
            raise ValueError("sourceFilename must not contain a path")
        return value


class ImageTemplate(StrictModel):
    schemaVersion: Literal[1]
    templateId: str = Field(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    reference: Reference
    profile: Profile
    slots: list[Slot] = Field(min_length=1)
    constraints: Constraints
    target: Target
    generation: Generation
    validation: ValidationRules
    provenance: Provenance

    @model_validator(mode="after")
    def cross_field_rules(self) -> "ImageTemplate":
        slot_ids = [slot.id for slot in self.slots]
        if len(slot_ids) != len(set(slot_ids)):
            raise ValueError("slot IDs must be unique")
        exact_layer_ids = [layer.id for layer in self.constraints.exactLayers]
        if len(exact_layer_ids) != len(set(exact_layer_ids)):
            raise ValueError("exact-layer IDs must be unique")
        for change in self.constraints.allowedChanges:
            if change.startswith("slot:") and change[5:] not in slot_ids:
                raise ValueError(f"allowed change references unknown slot: {change}")
        if self.target.sizePolicy == "match-reference" and (
            self.target.width != self.reference.width or self.target.height != self.reference.height
        ):
            raise ValueError("match-reference target dimensions must equal reference dimensions")
        if self.target.sizePolicy == "match-aspect" and (
            self.target.width * self.reference.height != self.target.height * self.reference.width
        ):
            raise ValueError("match-aspect target ratio must equal the reference ratio")
        if self.target.safeZonePx.left + self.target.safeZonePx.right >= self.target.width:
            raise ValueError("horizontal safe zones leave no usable width")
        if self.target.safeZonePx.top + self.target.safeZonePx.bottom >= self.target.height:
            raise ValueError("vertical safe zones leave no usable height")
        observed = (
            self.profile.composition
            + self.profile.visualHierarchy
            + self.profile.palette
            + self.profile.typography
            + self.profile.materials
            + self.profile.lighting
            + self.profile.brandElements
        )
        if not observed:
            raise ValueError("profile must record at least one observable visual property")
        required_structural = {"decode", "reference-digest", "dimensions", "no-overwrite"}
        required_visual = {"composition", "requested-change", "invariants", "defects"}
        if not required_structural.issubset(set(self.validation.structural)):
            raise ValueError("structural validation list is missing required gates")
        if not required_visual.issubset(set(self.validation.visual)):
            raise ValueError("visual validation list is missing required gates")
        return self


class ReceiptReference(StrictModel):
    path: str = Field(min_length=1)
    sha256: str = Field(pattern=r"^[0-9a-f]{64}$")
    role: Literal["template", "composition", "identity", "style", "palette-material", "lighting", "typography"]


class ReceiptInputs(StrictModel):
    references: list[ReceiptReference] = Field(min_length=1)
    profilePath: str = Field(min_length=1)
    profileSha256: str = Field(pattern=r"^[0-9a-f]{64}$")
    promptPath: str = Field(min_length=1)
    promptSha256: str = Field(pattern=r"^[0-9a-f]{64}$")
    requestedChanges: list[str] = Field(min_length=1)


class ReceiptExecution(StrictModel):
    route: Literal["builtin-imagegen", "openai-image-api-cli"]
    resolvedModel: str = Field(min_length=1)
    attempt: int = Field(ge=1)


class ReceiptOutput(StrictModel):
    path: str = Field(min_length=1)
    sha256: str = Field(pattern=r"^[0-9a-f]{64}$")
    format: Literal["png"]
    width: int = Field(gt=0)
    height: int = Field(gt=0)
    hasActualTransparency: bool


class ReceiptCheck(StrictModel):
    id: str = Field(min_length=1)
    status: Literal["passed", "failed", "pending", "not-applicable"]
    detail: str

    @model_validator(mode="after")
    def explain_non_applicability(self) -> "ReceiptCheck":
        if self.status == "not-applicable" and not self.detail.strip():
            raise ValueError("not-applicable checks require a reason in detail")
        return self


class ReceiptValidation(StrictModel):
    structural: list[ReceiptCheck]
    visual: list[ReceiptCheck]
    exactLayers: list[ReceiptCheck]

    @model_validator(mode="after")
    def unique_check_ids(self) -> "ReceiptValidation":
        for group in ("structural", "visual", "exactLayers"):
            ids = [check.id for check in getattr(self, group)]
            if len(ids) != len(set(ids)):
                raise ValueError(f"{group} check IDs must be unique")
        return self


class ReceiptAuthority(StrictModel):
    generation: Literal["completed", "failed"]
    humanAcceptance: Literal["pending", "accepted", "rejected"]
    save: Literal["not-requested", "completed", "failed"]
    export: Literal["not-requested", "completed", "failed"]
    promotion: Literal["not-requested", "completed", "failed"]
    publication: Literal["not-requested", "completed", "failed"]


class TemplateImageRunReceipt(StrictModel):
    schemaVersion: Literal[1]
    runId: str = Field(min_length=1)
    templateId: str = Field(min_length=1)
    createdAt: datetime
    inputs: ReceiptInputs
    execution: ReceiptExecution
    output: ReceiptOutput
    validation: ReceiptValidation
    authority: ReceiptAuthority


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def contained_path(root: Path, relative: str) -> Path:
    candidate = (root / relative).resolve()
    try:
        candidate.relative_to(root)
    except ValueError as exc:
        raise ValueError(f"path escapes package: {relative}") from exc
    return candidate


def load_json(path: Path) -> object:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def resolve_receipt_path(receipt_path: Path, recorded_path: str) -> Path:
    candidate = Path(recorded_path).expanduser()
    if not candidate.is_absolute():
        candidate = receipt_path.parent / candidate
    return candidate.resolve()


def inspect_png(path: Path) -> dict[str, object]:
    with Image.open(path) as image:
        image.verify()
    with Image.open(path) as image:
        image.load()
        if image.format != "PNG":
            raise ValueError(f"expected PNG, received {image.format}")
        bands = image.getbands()
        has_alpha_channel = "A" in bands or "transparency" in image.info
        alpha = image.convert("RGBA").getchannel("A")
        alpha_min, alpha_max = alpha.getextrema()
        corners = [alpha.getpixel((0, 0)), alpha.getpixel((image.width - 1, 0)), alpha.getpixel((0, image.height - 1)), alpha.getpixel((image.width - 1, image.height - 1))]
        visible_bbox = alpha.getbbox()
        return {
            "format": "png",
            "mode": image.mode,
            "width": image.width,
            "height": image.height,
            "hasAlphaChannel": has_alpha_channel,
            "hasActualTransparency": alpha_min < 255,
            "alphaExtrema": [alpha_min, alpha_max],
            "transparentCornerCount": sum(1 for value in corners if value == 0),
            "visibleBoundingBox": list(visible_bbox) if visible_bbox else None,
        }


def candidate_checks(profile: ImageTemplate, inspection: dict[str, object]) -> list[dict[str, str]]:
    width, height = int(inspection["width"]), int(inspection["height"])
    target = profile.target
    if target.sizePolicy == "match-aspect":
        geometry_ok = width * target.height == height * target.width
        geometry_detail = f"candidate aspect {width}:{height}; target {target.width}:{target.height}"
    else:
        geometry_ok = width == target.width and height == target.height
        geometry_detail = f"candidate dimensions {width}x{height}; exact target {target.width}x{target.height}"
    transparency_ok = inspection["hasAlphaChannel"] and inspection["hasActualTransparency"]
    return [
        {"id": "candidate-decode", "status": "passed", "detail": "Fully decoded PNG."},
        {"id": "candidate-geometry", "status": "passed" if geometry_ok else "failed",
         "detail": geometry_detail if geometry_ok else f"{geometry_detail} do not match"},
        {"id": "candidate-transparency",
         "status": ("passed" if transparency_ok else "failed") if target.requiresTransparency else "not-applicable",
         "detail": ("Output requires alpha and genuinely nonopaque pixels." if target.requiresTransparency
                    else "The selected target does not require transparency.")},
    ]


def summarize_checks(statuses: list[str]) -> str:
    if "failed" in statuses:
        return "failed"
    if "pending" in statuses:
        return "pending"
    return "passed" if "passed" in statuses else "not-applicable"


def validate_check_coverage(receipt: TemplateImageRunReceipt, profile: ImageTemplate) -> dict[str, list[str]]:
    required = {
        "structural": profile.validation.structural,
        "visual": profile.validation.visual,
        "exactLayers": [layer.id for layer in profile.constraints.exactLayers],
    }
    for group, expected_ids in required.items():
        recorded_ids = {check.id for check in getattr(receipt.validation, group)}
        missing = set(expected_ids) - recorded_ids
        if missing:
            raise ValueError(f"receipt {group} missing required checks: {', '.join(sorted(missing))}")
    return required


def validate_package(package: Path, profile_name: str, candidate: Path | None = None) -> dict[str, object]:
    root = package.expanduser().resolve()
    if not root.is_dir():
        raise ValueError(f"package directory does not exist: {root}")
    profile_path = contained_path(root, profile_name)
    artifact_path = contained_path(root, "artifact-template.json")
    preview_path = contained_path(root, "assets/preview.png")
    if not profile_path.is_file():
        raise ValueError(f"profile does not exist: {profile_path}")
    if not artifact_path.is_file():
        raise ValueError("artifact-template.json is required")
    if not preview_path.is_file():
        raise ValueError("assets/preview.png is required")

    payload = load_json(profile_path)
    profile = ImageTemplate.model_validate(payload)
    artifact = load_json(artifact_path)
    expected_artifact = {
        "schemaVersion": 1,
        "kind": "image",
        "reference": "assets/reference.png",
        "preview": "assets/preview.png",
    }
    if not isinstance(artifact, dict):
        raise ValueError("artifact-template.json must be an object")
    for key, expected in expected_artifact.items():
        if artifact.get(key) != expected:
            raise ValueError(f"artifact-template.json {key} must equal {expected!r}")
    if artifact.get("galleryKind") not in {"imagegen", "product-design"}:
        raise ValueError("artifact-template.json galleryKind must be imagegen or product-design")

    reference_path = contained_path(root, profile.reference.path)
    if not reference_path.is_file():
        raise ValueError(f"reference does not exist: {reference_path}")
    reference_hash = sha256(reference_path)
    if reference_hash != profile.reference.sha256:
        raise ValueError("reference SHA-256 does not match image-template.json")

    reference_inspection = inspect_png(reference_path)
    preview_inspection = inspect_png(preview_path)
    if reference_inspection["width"] != profile.reference.width or reference_inspection["height"] != profile.reference.height:
        raise ValueError("decoded reference dimensions do not match image-template.json")
    result: dict[str, object] = {
        "schemaVersion": 1,
        "kind": "template-image-preflight",
        "status": "passed",
        "scope": "package-preflight",
        "checkedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "templateId": profile.templateId,
        "package": str(root),
        "profile": {
            "path": str(profile_path),
            "sha256": sha256(profile_path),
        },
        "reference": {
            "path": str(reference_path),
            "sha256": reference_hash,
            **reference_inspection,
        },
        "preview": {
            "path": str(preview_path),
            "sha256": sha256(preview_path),
            **preview_inspection,
        },
        "checks": [
            {"id": "package-boundaries", "status": "passed"},
            {"id": "artifact-template-v1", "status": "passed"},
            {"id": "profile-contract", "status": "passed"},
            {"id": "decode", "status": "passed"},
            {"id": "reference-digest", "status": "passed"},
            {"id": "dimensions", "status": "passed"},
            {"id": "reference-transparency-observation", "status": "passed",
             "detail": "Input alpha was inspected; target transparency applies only to the output."},
            {"id": "human-acceptance-required", "status": "passed"},
        ],
        "authority": {
            "generation": "not-performed",
            "humanAcceptance": "pending",
            "save": "not-requested",
            "export": "not-requested",
            "promotion": "not-requested",
            "publication": "not-requested",
        },
    }
    if candidate is not None:
        candidate_path = candidate.expanduser().resolve()
        if not candidate_path.is_file():
            raise ValueError(f"candidate does not exist: {candidate_path}")
        candidate_inspection = inspect_png(candidate_path)
        observed_checks = candidate_checks(profile, candidate_inspection)
        failures = [check["detail"] for check in observed_checks if check["status"] == "failed"]
        if failures:
            raise ValueError("; ".join(failures))
        result["kind"] = "template-image-candidate-validation"
        result["scope"] = "candidate-structural-checks-only"
        result["candidate"] = {
            "path": str(candidate_path),
            "sha256": sha256(candidate_path),
            **candidate_inspection,
        }
        checks = result["checks"]
        assert isinstance(checks, list)
        checks.extend(observed_checks)
        checks.append({"id": "visual-review", "status": "pending"})
        authority = result["authority"]
        assert isinstance(authority, dict)
        authority["generation"] = "not-established"
    return result


def validate_run_receipt(receipt_path: Path) -> dict[str, object]:
    path = receipt_path.expanduser().resolve()
    if not path.is_file():
        raise ValueError(f"run receipt does not exist: {path}")
    receipt = TemplateImageRunReceipt.model_validate(load_json(path))

    verified_references: list[dict[str, str]] = []
    for reference in receipt.inputs.references:
        reference_path = resolve_receipt_path(path, reference.path)
        if not reference_path.is_file():
            raise ValueError(f"receipt reference does not exist: {reference_path}")
        actual_hash = sha256(reference_path)
        if actual_hash != reference.sha256:
            raise ValueError(f"receipt reference SHA-256 mismatch: {reference_path}")
        verified_references.append({"path": str(reference_path), "sha256": actual_hash, "role": reference.role})

    profile_path = resolve_receipt_path(path, receipt.inputs.profilePath)
    prompt_path = resolve_receipt_path(path, receipt.inputs.promptPath)
    output_path = resolve_receipt_path(path, receipt.output.path)
    for label, recorded_path, expected_hash in (
        ("profile", profile_path, receipt.inputs.profileSha256),
        ("prompt", prompt_path, receipt.inputs.promptSha256),
        ("output", output_path, receipt.output.sha256),
    ):
        if not recorded_path.is_file():
            raise ValueError(f"receipt {label} does not exist: {recorded_path}")
        if sha256(recorded_path) != expected_hash:
            raise ValueError(f"receipt {label} SHA-256 mismatch: {recorded_path}")

    package_validation = validate_package(profile_path.parent, profile_path.name)
    profile = ImageTemplate.model_validate(load_json(profile_path))
    required_checks = validate_check_coverage(receipt, profile)
    if package_validation["templateId"] != receipt.templateId:
        raise ValueError("receipt templateId does not match profile templateId")
    if not any(reference["sha256"] == package_validation["reference"]["sha256"] for reference in verified_references):
        raise ValueError("receipt references do not include the profile's retained reference")
    output_inspection = inspect_png(output_path)
    if output_inspection["width"] != receipt.output.width or output_inspection["height"] != receipt.output.height:
        raise ValueError("receipt output dimensions do not match decoded output")
    if output_inspection["hasActualTransparency"] != receipt.output.hasActualTransparency:
        raise ValueError("receipt transparency claim does not match decoded output")

    observed_checks = candidate_checks(profile, output_inspection)
    assessment = {
        group: summarize_checks([check.status for check in getattr(receipt.validation, group)] +
                                ([check["status"] for check in observed_checks] if group == "structural" else []))
        for group in ("structural", "visual", "exactLayers")
    }
    assessment["overall"] = summarize_checks(list(assessment.values()))

    return {
        "schemaVersion": 1,
        "kind": "template-image-run-receipt-validation",
        "status": "passed",
        "scope": "receipt-integrity-and-check-coverage",
        "receipt": str(path),
        "runId": receipt.runId,
        "templateId": receipt.templateId,
        "verifiedReferences": verified_references,
        "profileSha256": receipt.inputs.profileSha256,
        "promptSha256": receipt.inputs.promptSha256,
        "outputSha256": receipt.output.sha256,
        "requiredChecks": required_checks,
        "observedCandidateChecks": observed_checks,
        "assessment": assessment,
        "assessmentBasis": "Structural status combines observed and recorded checks; visual and exact-layer statuses summarize recorded claims.",
        "authorityVerification": "not-performed; authority fields are recorded claims, not proof of execution or human action",
        "authority": receipt.authority.model_dump(),
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument("--package", help="Absolute or relative artifact-template package directory")
    source.add_argument("--run-receipt", help="TemplateImageRunReceiptV1 file to validate")
    parser.add_argument("--profile", default="image-template.json", help="Package-relative profile path")
    parser.add_argument("--candidate", help="Optional generated PNG to validate against the target geometry")
    parser.add_argument("--receipt-out", help="Optional path for a no-overwrite preflight receipt")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        if args.run_receipt:
            if args.candidate:
                raise ValueError("--candidate cannot be combined with --run-receipt")
            result = validate_run_receipt(Path(args.run_receipt))
        else:
            result = validate_package(Path(args.package), args.profile, Path(args.candidate) if args.candidate else None)
        rendered = json.dumps(result, indent=2, sort_keys=True) + "\n"
        if args.receipt_out:
            receipt_path = Path(args.receipt_out).expanduser().resolve()
            receipt_path.parent.mkdir(parents=True, exist_ok=True)
            with receipt_path.open("x", encoding="utf-8") as handle:
                handle.write(rendered)
        sys.stdout.write(rendered)
        return 0
    except (OSError, ValueError, json.JSONDecodeError, ValidationError) as exc:
        sys.stderr.write(json.dumps({"status": "failed", "error": str(exc)}, indent=2) + "\n")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
