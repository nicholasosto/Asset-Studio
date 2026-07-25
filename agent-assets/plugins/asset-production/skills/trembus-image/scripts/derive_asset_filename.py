#!/usr/bin/env python3
"""Derive a standalone fallback Trembus filename for a saved raster asset.

Project-bound assets should use the active workspace's asset conventions instead.
"""

from __future__ import annotations

import argparse
from pathlib import Path

from write_asset_metadata import KNOWN_STYLE_SLUGS, PRESET_METADATA_DEFAULTS, normalize_slug


DEFAULT_STYLE_SLOT = "general"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Derive a standalone fallback Trembus filename using preset-style-subject grammar. "
            "Do not use this for project-bound assets when a project asset convention exists."
        )
    )
    parser.add_argument("--preset", required=True, help="Asset preset slug or human-readable preset name")
    parser.add_argument(
        "--style",
        default="",
        help="Named style preset slug or freeform style text. Leave empty to use the default general slot.",
    )
    parser.add_argument("--subject", required=True, help="Primary asset subject text")
    parser.add_argument("--ext", required=True, help="Output extension with or without a leading dot")
    parser.add_argument(
        "--name-override",
        help="Override only the subject segment with an explicit kebab-case or human-readable name",
    )
    parser.add_argument(
        "--target-dir",
        help="Optional directory used to detect collisions and append -v2, -v3, and so on",
    )
    return parser.parse_args()


def resolve_preset(raw_value: str) -> str:
    preset = normalize_slug(raw_value)
    if preset not in PRESET_METADATA_DEFAULTS:
        available = ", ".join(sorted(PRESET_METADATA_DEFAULTS))
        raise ValueError(f"Unknown preset '{raw_value}'. Expected one of: {available}")
    return preset


def resolve_style_segment(raw_value: str | None) -> str:
    if not raw_value or not raw_value.strip():
        return DEFAULT_STYLE_SLOT

    style = normalize_slug(raw_value)
    if not style:
        return DEFAULT_STYLE_SLOT
    if style in KNOWN_STYLE_SLUGS:
        return style
    return style


def strip_boundary_duplicate(value: str, pattern: str) -> str:
    if not pattern or value == pattern:
        return value

    prefix = f"{pattern}-"
    suffix = f"-{pattern}"

    if value.startswith(prefix):
        candidate = value[len(prefix) :]
        if candidate:
            value = candidate

    if value.endswith(suffix):
        candidate = value[: -len(suffix)]
        if candidate:
            value = candidate

    return value


def resolve_subject_segment(
    raw_subject: str,
    preset: str,
    style: str,
    override: str | None,
) -> str:
    source = override if override and override.strip() else raw_subject
    subject = normalize_slug(source)
    if not subject:
        raise ValueError("Subject segment is empty after normalization")

    if not override:
        subject = strip_boundary_duplicate(subject, preset)
        if style != DEFAULT_STYLE_SLOT:
            subject = strip_boundary_duplicate(subject, style)

    if not subject:
        raise ValueError("Subject segment became empty after duplicate stripping")

    return subject


def resolve_extension(raw_value: str) -> str:
    ext = raw_value.strip().lower().lstrip(".")
    if not ext:
        raise ValueError("Extension is required")
    return ext


def resolve_collision(filename: str, target_dir: str | None) -> tuple[str, str]:
    if not target_dir:
        return filename, "none"

    directory = Path(target_dir).expanduser()
    if directory.exists() and not directory.is_dir():
        raise ValueError(f"Target path is not a directory: {directory}")

    stem, ext = filename.rsplit(".", 1)
    candidate = directory / filename
    if not candidate.exists():
        return filename, "none"

    version = 2
    while True:
        versioned = f"{stem}-v{version}.{ext}"
        if not (directory / versioned).exists():
            return versioned, f"v{version}"
        version += 1


def main() -> int:
    args = parse_args()

    try:
        preset = resolve_preset(args.preset)
        style = resolve_style_segment(args.style)
        subject = resolve_subject_segment(args.subject, preset, style, args.name_override)
        ext = resolve_extension(args.ext)
        stem = f"{preset}-{style}-{subject}"
        filename, collision_suffix = resolve_collision(f"{stem}.{ext}", args.target_dir)
    except ValueError as exc:
        print(f"status: fail\nreason: {exc}")
        return 1

    print(f"preset: {preset}")
    print(f"style: {style}")
    print(f"subject: {subject}")
    print(f"stem: {stem}")
    print(f"filename: {filename}")
    print(f"collision_suffix: {collision_suffix}")
    if args.target_dir:
        print(f"target_dir: {Path(args.target_dir).expanduser()}")
    print("status: pass")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
