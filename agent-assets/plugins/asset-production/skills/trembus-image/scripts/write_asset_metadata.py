#!/usr/bin/env python3
"""Write minimal Trembus macOS metadata to a saved asset."""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path


VALID_ASPECTS = {"square", "portrait", "wide", "custom"}
VALID_BOOLEANS = {"true", "false"}
VALID_SIDECARS = {"auto", "none", "json", "md", "both"}
DEFAULT_STYLE = "general"
CUSTOM_STYLE_PREFIX = "custom-"
MAX_STYLE_SLUG_LENGTH = 48

PRESET_METADATA_DEFAULTS = {
    "icon": {"transparent": "true", "aspect": "square"},
    "menu-icon": {"transparent": "true", "aspect": "square"},
    "badge-emblem": {"transparent": "true", "aspect": "square"},
    "map-marker": {"transparent": "true", "aspect": "square"},
    "tab-icon": {"transparent": "true", "aspect": "square"},
    "status-effect-icon": {"transparent": "true", "aspect": "square"},
    "tileable-part-texture": {"transparent": "false", "aspect": "square"},
    "particle-flipbook-texture": {"transparent": "true", "aspect": "square"},
    "beam-strip-texture": {"transparent": "true", "aspect": "wide"},
    "item-card-art": {"transparent": "false", "aspect": "portrait"},
    "portrait-bust": {"transparent": "false", "aspect": "portrait"},
    "journal-illustration": {"transparent": "false", "aspect": "custom"},
    "banner-key-art": {"transparent": "false", "aspect": "wide"},
    "transparent-cutout": {"transparent": "true", "aspect": "custom"},
    "raster-default": {"transparent": "false", "aspect": "custom"},
}

KNOWN_STYLE_SLUGS = {
    "default-house",
    "flat-glyph",
    "painted-fantasy",
    "clean-ui",
    "clean-sci-fi",
    "cozy-flat",
    "heroic-ornate",
    "parchment-adventure",
    "neon-arcade",
    "tactical-mono",
    "robloxify",
}

VFX_RECOMMENDATIONS = {
    "particle-flipbook-texture": {
        "target_class": "ParticleEmitter",
        "texture_property": "Texture",
        "asset_kind": "flipbook-spritesheet",
        "recommended_configuration": {
            "FlipbookLayout": "Grid4x4",
            "FlipbookMode": "Loop",
            "FlipbookFramerate": {"min": 12, "max": 12, "units": "fps"},
            "FlipbookBlendFrames": True,
            "FlipbookStartRandom": False,
        },
        "configuration_notes": [
            "Treat these as Trembus starting defaults, not hard requirements.",
            "The texture size must be an exact multiple of the chosen flipbook layout size.",
            "Use Grid2x2 for very short effects and Grid8x8 only when the effect genuinely needs many frames.",
            "For static spritesheet variation, set FlipbookFramerate to 0 and FlipbookStartRandom to true.",
            "Keep transparent spacing between frames to reduce filtering bleed.",
            "Roblox flipbooks have a maximum supported framerate of 30 FPS.",
        ],
    },
    "beam-strip-texture": {
        "target_class": "Beam",
        "texture_property": "Texture",
        "asset_kind": "beam-strip",
        "recommended_configuration": {
            "TextureMode": "Wrap",
            "TextureLength": 1,
            "TextureSpeed": 1,
            "Segments": 10,
        },
        "configuration_notes": [
            "Treat these as Trembus starting defaults, not hard requirements.",
            "Use Wrap when the strip should repeat by beam length.",
            "Use Stretch only when you want a fixed number of repetitions across the beam.",
            "Increase Segments for stronger curvature or more color/transparency keypoints.",
            "Use negative TextureSpeed to reverse the scroll direction.",
            "Design the strip so the left and right edges loop cleanly.",
        ],
    },
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Write Trembus Finder comment and xattrs to a saved raster asset."
    )
    parser.add_argument("path", help="Path to the saved asset")
    parser.add_argument("--preset", required=True, help="Asset preset slug or human-readable preset name")
    parser.add_argument(
        "--style",
        help=(
            "Resolved style preset slug or freeform style text. "
            "Omitted style metadata defaults to general."
        ),
    )
    parser.add_argument(
        "--transparent",
        choices=sorted(VALID_BOOLEANS),
        help="Override whether the asset has a transparent background",
    )
    parser.add_argument(
        "--aspect",
        choices=sorted(VALID_ASPECTS),
        help="Override the normalized aspect category",
    )
    parser.add_argument(
        "--sidecar",
        default="auto",
        choices=sorted(VALID_SIDECARS),
        help="Write Trembus sidecar metadata: auto, none, json, md, or both.",
    )
    return parser.parse_args()


def normalize_slug(value: str) -> str:
    slug = value.strip().lower()
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    slug = re.sub(r"-{2,}", "-", slug).strip("-")
    return slug


def escape_applescript_string(value: str) -> str:
    return value.replace("\\", "\\\\").replace('"', '\\"')


def run(command: list[str]) -> None:
    result = subprocess.run(command, capture_output=True, text=True, check=False)
    if result.returncode != 0:
        message = result.stderr.strip() or result.stdout.strip() or "command failed"
        raise RuntimeError(message)


def write_xattr(path: Path, key: str, value: str) -> None:
    run(["xattr", "-w", key, value, str(path)])


def write_finder_comment(path: Path, comment: str) -> None:
    escaped_path = escape_applescript_string(str(path))
    escaped_comment = escape_applescript_string(comment)
    script = (
        'tell application "Finder" to set comment of '
        f'(POSIX file "{escaped_path}" as alias) to "{escaped_comment}"'
    )
    run(["osascript", "-e", script])


def to_yes_no(value: str) -> str:
    return "yes" if value == "true" else "no"


def resolve_preset(raw_value: str) -> str:
    preset = normalize_slug(raw_value)
    if preset not in PRESET_METADATA_DEFAULTS:
        available = ", ".join(sorted(PRESET_METADATA_DEFAULTS))
        raise ValueError(f"Unknown preset '{raw_value}'. Expected one of: {available}")
    return preset


def resolve_style(raw_value: str | None) -> str:
    if not raw_value or not raw_value.strip():
        return DEFAULT_STYLE

    style = normalize_slug(raw_value)
    if not style:
        return DEFAULT_STYLE
    if style in KNOWN_STYLE_SLUGS:
        return style
    if not style.startswith(CUSTOM_STYLE_PREFIX):
        style = f"{CUSTOM_STYLE_PREFIX}{style}"
    return style[:MAX_STYLE_SLUG_LENGTH].rstrip("-")


def derive_transparent(preset: str, override: str | None) -> str:
    if override is not None:
        return override
    return PRESET_METADATA_DEFAULTS[preset]["transparent"]


def derive_aspect(preset: str, override: str | None) -> str:
    if override is not None:
        return override
    return PRESET_METADATA_DEFAULTS[preset]["aspect"]


def resolve_sidecar_mode(preset: str, requested_mode: str) -> str:
    if requested_mode != "auto":
        return requested_mode
    if preset in VFX_RECOMMENDATIONS:
        return "both"
    return "none"


def build_sidecar_paths(path: Path) -> tuple[Path, Path]:
    stem = path.stem
    return (
        path.with_name(f"{stem}.trembus.json"),
        path.with_name(f"{stem}.trembus.md"),
    )


def build_json_sidecar_payload(
    path: Path,
    preset: str,
    style: str,
    transparent: str,
    aspect: str,
) -> dict[str, object]:
    payload: dict[str, object] = {
        "trembus_metadata_version": "1",
        "asset_path": str(path),
        "asset_preset": preset,
        "style_pack": style,
        "transparent": transparent == "true",
        "aspect_ratio": aspect,
    }

    recommendation = VFX_RECOMMENDATIONS.get(preset)
    if recommendation:
        payload["roblox_recommendations"] = recommendation

    return payload


def build_markdown_sidecar(
    path: Path,
    preset: str,
    style: str,
    transparent: str,
    aspect: str,
) -> str:
    lines = [
        "# Trembus Asset Sidecar",
        "",
        f"- Asset: `{path.name}`",
        f"- Preset: `{preset}`",
        f"- Style: `{style}`",
        f"- Transparent: `{transparent}`",
        f"- Aspect: `{aspect}`",
    ]

    recommendation = VFX_RECOMMENDATIONS.get(preset)
    if recommendation:
        lines.extend(
            [
                "",
                "## Roblox Recommendations",
                "",
                f"- Target class: `{recommendation['target_class']}`",
                f"- Texture property: `{recommendation['texture_property']}`",
                f"- Asset kind: `{recommendation['asset_kind']}`",
                "",
                "## Starting Configuration",
                "",
            ]
        )

        configuration = recommendation["recommended_configuration"]
        for key, value in configuration.items():
            if isinstance(value, dict):
                rendered = ", ".join(f"{k}={v}" for k, v in value.items())
            else:
                rendered = str(value)
            lines.append(f"- `{key}`: `{rendered}`")

        lines.extend(["", "## Notes", ""])
        for note in recommendation["configuration_notes"]:
            lines.append(f"- {note}")

    return "\n".join(lines) + "\n"


def write_sidecars(
    path: Path,
    preset: str,
    style: str,
    transparent: str,
    aspect: str,
    mode: str,
) -> list[Path]:
    if mode == "none":
        return []

    json_path, md_path = build_sidecar_paths(path)
    written: list[Path] = []

    if mode in {"json", "both"}:
        payload = build_json_sidecar_payload(path, preset, style, transparent, aspect)
        json_path.write_text(json.dumps(payload, indent=2) + "\n")
        written.append(json_path)

    if mode in {"md", "both"}:
        markdown = build_markdown_sidecar(path, preset, style, transparent, aspect)
        md_path.write_text(markdown)
        written.append(md_path)

    return written


def main() -> int:
    args = parse_args()
    path = Path(args.path).expanduser().resolve()

    if not path.exists():
        print(f"status: fail\nreason: file not found\npath: {path}")
        return 1

    try:
        preset = resolve_preset(args.preset)
        style = resolve_style(args.style)
        transparent = derive_transparent(preset, args.transparent)
        aspect = derive_aspect(preset, args.aspect)
        sidecar_mode = resolve_sidecar_mode(preset, args.sidecar)
    except ValueError as exc:
        print(f"status: fail\nreason: {exc}\npath: {path}")
        return 1

    comment = (
        f"trembus; preset={preset}; style={style}; "
        f"transparent={to_yes_no(transparent)}; aspect={aspect}"
    )

    try:
        write_xattr(path, "com.trembus.asset-preset", preset)
        write_xattr(path, "com.trembus.style-pack", style)
        write_xattr(path, "com.trembus.transparent", transparent)
        write_xattr(path, "com.trembus.aspect-ratio", aspect)
        write_finder_comment(path, comment)
        written_sidecars = write_sidecars(path, preset, style, transparent, aspect, sidecar_mode)
    except RuntimeError as exc:
        print(f"status: fail\nreason: {exc}\npath: {path}")
        return 1

    print(f"path: {path}")
    print(f"finder_comment: {comment}")
    print("xattrs:")
    print(f"- com.trembus.asset-preset={preset}")
    print(f"- com.trembus.style-pack={style}")
    print(f"- com.trembus.transparent={transparent}")
    print(f"- com.trembus.aspect-ratio={aspect}")
    print(f"sidecar_mode: {sidecar_mode}")
    if written_sidecars:
        print("sidecars:")
        for sidecar_path in written_sidecars:
            print(f"- {sidecar_path}")
    print("status: pass")
    return 0


if __name__ == "__main__":
    sys.exit(main())
