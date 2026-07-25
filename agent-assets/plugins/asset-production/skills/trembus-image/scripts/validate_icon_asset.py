#!/usr/bin/env python3
"""Validate Trembus icon assets with macOS sips."""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path


SIPS_KEYS = ("format", "pixelWidth", "pixelHeight", "hasAlpha")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Validate that an icon asset is a square PNG with an alpha channel."
    )
    parser.add_argument("path", help="Path to the raster asset to inspect")
    return parser.parse_args()


def load_properties(path: Path) -> dict[str, str]:
    command = ["sips"]
    for key in SIPS_KEYS:
        command.extend(["-g", key])
    command.append(str(path))

    result = subprocess.run(command, capture_output=True, text=True, check=False)
    if result.returncode != 0:
        message = result.stderr.strip() or result.stdout.strip() or "sips failed"
        raise RuntimeError(message)

    properties: dict[str, str] = {}
    for raw_line in result.stdout.splitlines():
        line = raw_line.strip()
        if ": " not in line:
            continue
        key, value = line.split(": ", 1)
        if key in SIPS_KEYS:
            properties[key] = value.strip()

    missing = [key for key in SIPS_KEYS if key not in properties]
    if missing:
        raise RuntimeError(f"Missing sips property output: {', '.join(missing)}")

    return properties


def is_truthy(value: str) -> bool:
    return value.strip().lower() in {"yes", "true", "1"}


def main() -> int:
    args = parse_args()
    path = Path(args.path).expanduser().resolve()

    if not path.exists():
        print(f"status: fail\nreason: file not found\npath: {path}")
        return 1

    try:
        properties = load_properties(path)
    except RuntimeError as exc:
        print(f"status: fail\nreason: {exc}\npath: {path}")
        return 1

    failures: list[str] = []
    image_format = properties["format"].lower()
    width = properties["pixelWidth"]
    height = properties["pixelHeight"]
    has_alpha = properties["hasAlpha"]

    if image_format != "png":
        failures.append(f"format must be png, got {image_format}")

    if width != height:
        failures.append(f"image must be square, got {width}x{height}")

    if not is_truthy(has_alpha):
        failures.append(f"image must have an alpha channel, got hasAlpha={has_alpha}")

    print(f"path: {path}")
    print(f"format: {image_format}")
    print(f"pixelWidth: {width}")
    print(f"pixelHeight: {height}")
    print(f"hasAlpha: {has_alpha}")

    if failures:
        print("status: fail")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print("status: pass")
    return 0


if __name__ == "__main__":
    sys.exit(main())
