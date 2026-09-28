from __future__ import annotations

import hashlib
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from PIL import Image


SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "validate_template.py"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


class ValidateTemplateTests(unittest.TestCase):
    def make_package(self, *, transparent: bool = True) -> tuple[Path, tempfile.TemporaryDirectory[str]]:
        temporary = tempfile.TemporaryDirectory()
        root = Path(temporary.name)
        assets = root / "assets"
        assets.mkdir()
        image = Image.new("RGBA", (16, 16), (40, 60, 80, 255))
        if transparent:
            image.putpixel((0, 0), (0, 0, 0, 0))
        image.save(assets / "reference.png")
        image.save(assets / "preview.png")
        (root / "artifact-template.json").write_text(
            json.dumps(
                {
                    "schemaVersion": 1,
                    "kind": "image",
                    "galleryKind": "imagegen",
                    "reference": "assets/reference.png",
                    "preview": "assets/preview.png",
                }
            ),
            encoding="utf-8",
        )
        profile = {
            "schemaVersion": 1,
            "templateId": "test-template",
            "reference": {
                "path": "assets/reference.png",
                "sha256": digest(assets / "reference.png"),
                "mimeType": "image/png",
                "width": 16,
                "height": 16,
                "role": "template",
            },
            "profile": {
                "intendedUse": "Test reference-bound editing.",
                "assetType": "test image",
                "composition": ["Centered subject."],
                "visualHierarchy": [],
                "palette": [],
                "typography": [],
                "materials": [],
                "lighting": [],
                "brandElements": [],
                "unknowns": [],
            },
            "slots": [
                {
                    "id": "primary-subject",
                    "type": "subject",
                    "required": True,
                    "verbatim": False,
                    "description": "Replacement subject.",
                }
            ],
            "constraints": {
                "mustKeep": ["Composition."],
                "allowedChanges": ["slot:primary-subject"],
                "mustAvoid": ["Extra text."],
                "exactLayers": [],
            },
            "target": {
                "width": 16,
                "height": 16,
                "format": "png",
                "sizePolicy": "match-reference",
                "cropPolicy": "preserve",
                "background": "preserve",
                "requiresTransparency": transparent,
                "safeZonePx": {"top": 1, "right": 1, "bottom": 1, "left": 1},
            },
            "generation": {
                "mode": "edit",
                "executor": "builtin-imagegen",
                "actualReferenceRequired": True,
                "quality": "auto",
                "variants": 1,
                "outputNamingPattern": "test-v{variant}.png",
            },
            "validation": {
                "structural": ["decode", "reference-digest", "dimensions", "no-overwrite"],
                "visual": ["composition", "requested-change", "invariants", "defects"],
                "humanAcceptanceRequired": True,
            },
            "provenance": {
                "sourceFilename": "reference.png",
                "createdAt": "2026-08-09T00:00:00Z",
                "extractor": "reference-image-kernel",
                "extractorVersion": "1",
            },
        }
        (root / "image-template.json").write_text(json.dumps(profile), encoding="utf-8")
        return root, temporary

    def run_validator(self, root: Path, *extra: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, str(SCRIPT), "--package", str(root), *extra],
            check=False,
            text=True,
            capture_output=True,
        )

    def make_run_receipt(self, root: Path, *, route: str = "builtin-imagegen") -> Path:
        prompt = root / "prompt.txt"
        prompt.write_text("Replace only the primary-subject slot.\n", encoding="utf-8")
        candidate = root / "candidate.png"
        Image.new("RGB", (16, 16), (20, 30, 40)).save(candidate)
        reference = root / "assets" / "reference.png"
        profile = root / "image-template.json"
        profile_data = json.loads(profile.read_text(encoding="utf-8"))
        receipt = root / "run-receipt.json"
        receipt.write_text(
            json.dumps(
                {
                    "schemaVersion": 1,
                    "runId": "test-run-1",
                    "templateId": "test-template",
                    "createdAt": "2026-08-09T00:00:00Z",
                    "inputs": {
                        "references": [
                            {"path": str(reference), "sha256": digest(reference), "role": "template"}
                        ],
                        "profilePath": str(profile),
                        "profileSha256": digest(profile),
                        "promptPath": str(prompt),
                        "promptSha256": digest(prompt),
                        "requestedChanges": ["Replace the primary subject."],
                    },
                    "execution": {
                        "route": route,
                        "resolvedModel": "not-exposed-by-runtime",
                        "attempt": 1,
                    },
                    "output": {
                        "path": str(candidate),
                        "sha256": digest(candidate),
                        "format": "png",
                        "width": 16,
                        "height": 16,
                        "hasActualTransparency": False,
                    },
                    "validation": {
                        "structural": [{"id": check, "status": "passed", "detail": "Synthetic recorded check."}
                                       for check in profile_data["validation"]["structural"]],
                        "visual": [{"id": check, "status": "pending", "detail": "Awaiting review."}
                                   for check in profile_data["validation"]["visual"]],
                        "exactLayers": [{"id": layer["id"], "status": "pending", "detail": "Awaiting composition verification."}
                                        for layer in profile_data["constraints"]["exactLayers"]],
                    },
                    "authority": {
                        "generation": "completed",
                        "humanAcceptance": "pending",
                        "save": "not-requested",
                        "export": "not-requested",
                        "promotion": "not-requested",
                        "publication": "not-requested",
                    },
                }
            ),
            encoding="utf-8",
        )
        return receipt

    def test_valid_package_passes_and_reports_real_alpha(self) -> None:
        root, temporary = self.make_package()
        self.addCleanup(temporary.cleanup)
        result = self.run_validator(root)
        self.assertEqual(result.returncode, 0, result.stderr)
        receipt = json.loads(result.stdout)
        self.assertEqual(receipt["status"], "passed")
        self.assertTrue(receipt["reference"]["hasActualTransparency"])

    def test_hash_mismatch_fails(self) -> None:
        root, temporary = self.make_package()
        self.addCleanup(temporary.cleanup)
        profile_path = root / "image-template.json"
        profile = json.loads(profile_path.read_text(encoding="utf-8"))
        profile["reference"]["sha256"] = "0" * 64
        profile_path.write_text(json.dumps(profile), encoding="utf-8")
        result = self.run_validator(root)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("SHA-256", result.stderr)

    def test_path_escape_is_rejected(self) -> None:
        root, temporary = self.make_package()
        self.addCleanup(temporary.cleanup)
        profile_path = root / "image-template.json"
        profile = json.loads(profile_path.read_text(encoding="utf-8"))
        profile["reference"]["path"] = "../reference.png"
        profile_path.write_text(json.dumps(profile), encoding="utf-8")
        result = self.run_validator(root)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("assets/reference.png", result.stderr)

    def test_opaque_reference_allows_transparent_target_but_opaque_output_fails(self) -> None:
        root, temporary = self.make_package(transparent=False)
        self.addCleanup(temporary.cleanup)
        profile_path = root / "image-template.json"
        profile = json.loads(profile_path.read_text(encoding="utf-8"))
        profile["target"]["requiresTransparency"] = True
        profile["target"]["background"] = "transparent"
        profile_path.write_text(json.dumps(profile), encoding="utf-8")
        result = self.run_validator(root)
        self.assertEqual(result.returncode, 0, result.stderr)
        result = self.run_validator(root, "--candidate", str(root / "assets/reference.png"))
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("nonopaque pixels", result.stderr)

    def test_opaque_reference_accepts_transparent_output(self) -> None:
        root, temporary = self.make_package(transparent=False)
        self.addCleanup(temporary.cleanup)
        profile_path = root / "image-template.json"
        profile = json.loads(profile_path.read_text())
        profile["target"].update(background="transparent", requiresTransparency=True)
        profile_path.write_text(json.dumps(profile))
        candidate = root / "candidate.png"
        image = Image.new("RGBA", (16, 16), (20, 30, 40, 255))
        image.putpixel((0, 0), (0, 0, 0, 0))
        image.save(candidate)
        result = self.run_validator(root, "--candidate", str(candidate))
        self.assertEqual(result.returncode, 0, result.stderr)
        validated = json.loads(result.stdout)
        self.assertEqual(validated["authority"]["generation"], "not-established")
        self.assertTrue(validated["candidate"]["hasActualTransparency"])

    def test_receipts_do_not_overwrite(self) -> None:
        root, temporary = self.make_package()
        self.addCleanup(temporary.cleanup)
        receipt = root / "preflight-receipt.json"
        first = self.run_validator(root, "--receipt-out", str(receipt))
        second = self.run_validator(root, "--receipt-out", str(receipt))
        self.assertEqual(first.returncode, 0, first.stderr)
        self.assertNotEqual(second.returncode, 0)
        self.assertIn("File exists", second.stderr)

    def test_match_aspect_accepts_larger_candidate(self) -> None:
        root, temporary = self.make_package()
        self.addCleanup(temporary.cleanup)
        profile_path = root / "image-template.json"
        profile = json.loads(profile_path.read_text(encoding="utf-8"))
        profile["target"]["sizePolicy"] = "match-aspect"
        profile["target"]["requiresTransparency"] = False
        profile_path.write_text(json.dumps(profile), encoding="utf-8")
        candidate = root / "candidate.png"
        Image.new("RGB", (32, 32), (20, 30, 40)).save(candidate)
        result = self.run_validator(root, "--candidate", str(candidate))
        self.assertEqual(result.returncode, 0, result.stderr)
        receipt = json.loads(result.stdout)
        self.assertEqual(receipt["kind"], "template-image-candidate-validation")
        self.assertEqual(receipt["authority"]["generation"], "not-established")
        self.assertEqual(receipt["scope"], "candidate-structural-checks-only")
        self.assertIn({"id": "visual-review", "status": "pending"}, receipt["checks"])

    def test_exact_policy_rejects_larger_candidate(self) -> None:
        root, temporary = self.make_package()
        self.addCleanup(temporary.cleanup)
        profile_path = root / "image-template.json"
        profile = json.loads(profile_path.read_text(encoding="utf-8"))
        profile["target"]["sizePolicy"] = "exact"
        profile_path.write_text(json.dumps(profile), encoding="utf-8")
        candidate = root / "candidate.png"
        Image.new("RGB", (32, 32), (20, 30, 40)).save(candidate)
        result = self.run_validator(root, "--candidate", str(candidate))
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("do not match", result.stderr)

    def test_run_receipt_validates_hashes_and_authority(self) -> None:
        root, temporary = self.make_package(transparent=False)
        self.addCleanup(temporary.cleanup)
        receipt = self.make_run_receipt(root)
        result = subprocess.run(
            [sys.executable, str(SCRIPT), "--run-receipt", str(receipt)],
            check=False,
            text=True,
            capture_output=True,
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        validated = json.loads(result.stdout)
        self.assertEqual(validated["status"], "passed")
        self.assertEqual(validated["authority"]["humanAcceptance"], "pending")
        self.assertEqual(validated["assessment"]["overall"], "pending")
        self.assertEqual(validated["assessment"]["structural"], "passed")
        self.assertEqual(validated["scope"], "receipt-integrity-and-check-coverage")

    def test_run_receipt_accepts_explicit_image_api_cli_route(self) -> None:
        root, temporary = self.make_package(transparent=False)
        self.addCleanup(temporary.cleanup)
        receipt = self.make_run_receipt(root, route="openai-image-api-cli")
        result = subprocess.run(
            [sys.executable, str(SCRIPT), "--run-receipt", str(receipt)],
            check=False,
            text=True,
            capture_output=True,
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        validated = json.loads(result.stdout)
        self.assertEqual(validated["status"], "passed")
        self.assertEqual(validated["templateId"], "test-template")

    def test_run_receipt_rejects_output_hash_mismatch(self) -> None:
        root, temporary = self.make_package(transparent=False)
        self.addCleanup(temporary.cleanup)
        receipt = self.make_run_receipt(root)
        payload = json.loads(receipt.read_text(encoding="utf-8"))
        payload["output"]["sha256"] = "0" * 64
        receipt.write_text(json.dumps(payload), encoding="utf-8")
        result = subprocess.run(
            [sys.executable, str(SCRIPT), "--run-receipt", str(receipt)],
            check=False,
            text=True,
            capture_output=True,
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("output SHA-256 mismatch", result.stderr)

    def receipt_fixture(self):
        root, temporary = self.make_package(transparent=False)
        self.addCleanup(temporary.cleanup)
        path = self.make_run_receipt(root)
        return root, path, json.loads(path.read_text())

    def check_receipt(self, path, payload):
        path.write_text(json.dumps(payload))
        return subprocess.run([sys.executable, str(SCRIPT), "--run-receipt", str(path)],
                              check=False, text=True, capture_output=True)

    def test_empty_checklists_cannot_be_closed_by_acceptance_claim(self) -> None:
        _, path, payload = self.receipt_fixture()
        payload["authority"]["humanAcceptance"] = "accepted"
        payload["validation"] = {"structural": [], "visual": [], "exactLayers": []}
        result = self.check_receipt(path, payload)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("missing required checks", result.stderr)

    def test_each_required_gate_must_be_present_even_before_acceptance(self) -> None:
        for group in ("structural", "visual"):
            with self.subTest(group=group):
                _, path, payload = self.receipt_fixture()
                missing = payload["validation"][group].pop()["id"]
                result = self.check_receipt(path, payload)
                self.assertNotEqual(result.returncode, 0)
                self.assertIn(missing, result.stderr)

    def test_required_exact_layer_cannot_be_omitted(self) -> None:
        root, path, _ = self.receipt_fixture()
        profile_path = root / "image-template.json"
        profile = json.loads(profile_path.read_text())
        profile["constraints"]["exactLayers"] = [{"id": "caption", "kind": "copy", "source": "Fixture caption",
            "placement": "bottom", "verification": "deterministic-overlay-required"}]
        profile_path.write_text(json.dumps(profile))
        path = self.make_run_receipt(root)
        payload = json.loads(path.read_text())
        payload["validation"]["exactLayers"] = []
        result = self.check_receipt(path, payload)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("exactLayers missing required checks: caption", result.stderr)
        payload["validation"]["exactLayers"] = [{"id": "caption", "status": "pending", "detail": "Not checked."}]
        result = self.check_receipt(path, payload)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(json.loads(result.stdout)["assessment"]["exactLayers"], "pending")

    def test_duplicate_check_ids_are_rejected_in_each_group(self) -> None:
        for group in ("structural", "visual", "exactLayers"):
            with self.subTest(group=group):
                _, path, payload = self.receipt_fixture()
                repeated = {"id": "extra-check", "status": "passed", "detail": "Fixture."}
                payload["validation"][group].extend([repeated, repeated])
                result = self.check_receipt(path, payload)
                self.assertNotEqual(result.returncode, 0)
                self.assertIn("check IDs must be unique", result.stderr)

    def test_not_applicable_requires_a_nonblank_reason(self) -> None:
        _, path, payload = self.receipt_fixture()
        check = payload["validation"]["visual"][0]
        check.update(status="not-applicable", detail="  ")
        result = self.check_receipt(path, payload)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("require a reason", result.stderr)
        check["detail"] = "Illustrative scope exclusion supplied by the reviewer."
        result = self.check_receipt(path, payload)
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_completed_generation_can_have_recorded_failed_checks(self) -> None:
        _, path, payload = self.receipt_fixture()
        payload["validation"]["structural"][0].update(status="failed", detail="Recorded execution check failed.")
        result = self.check_receipt(path, payload)
        self.assertEqual(result.returncode, 0, result.stderr)
        assessed = json.loads(result.stdout)
        self.assertEqual(assessed["authority"]["generation"], "completed")
        self.assertEqual(assessed["assessment"]["overall"], "failed")

    def test_observed_bad_geometry_is_failed_despite_recorded_passes(self) -> None:
        root, path, payload = self.receipt_fixture()
        candidate = root / "candidate.png"
        Image.new("RGB", (32, 32), (20, 30, 40)).save(candidate)
        payload["output"].update(width=32, height=32, sha256=digest(candidate))
        result = self.check_receipt(path, payload)
        self.assertEqual(result.returncode, 0, result.stderr)
        assessed = json.loads(result.stdout)
        self.assertEqual(assessed["authority"]["generation"], "completed")
        self.assertEqual(assessed["assessment"]["structural"], "failed")
        self.assertEqual(assessed["assessment"]["overall"], "failed")

    def test_acceptance_claim_does_not_close_pending_assessment(self) -> None:
        _, path, payload = self.receipt_fixture()
        payload["authority"]["humanAcceptance"] = "accepted"
        result = self.check_receipt(path, payload)
        self.assertEqual(result.returncode, 0, result.stderr)
        assessed = json.loads(result.stdout)
        self.assertEqual(assessed["authority"]["humanAcceptance"], "accepted")
        self.assertEqual(assessed["assessment"]["overall"], "pending")
        self.assertIn("not-performed", assessed["authorityVerification"])

    def test_recorded_passes_do_not_create_acceptance(self) -> None:
        _, path, payload = self.receipt_fixture()
        for checks in payload["validation"].values():
            for check in checks:
                check.update(status="passed", detail="Recorded fixture assertion.")
        result = self.check_receipt(path, payload)
        self.assertEqual(result.returncode, 0, result.stderr)
        assessed = json.loads(result.stdout)
        self.assertEqual(assessed["assessment"]["overall"], "passed")
        self.assertEqual(assessed["authority"]["humanAcceptance"], "pending")

    def test_validation_does_not_modify_receipt(self) -> None:
        _, path, _ = self.receipt_fixture()
        original = path.read_bytes()
        result = subprocess.run([sys.executable, str(SCRIPT), "--run-receipt", str(path)], capture_output=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(path.read_bytes(), original)


if __name__ == "__main__":
    unittest.main()
