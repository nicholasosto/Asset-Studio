#!/usr/bin/env python3
"""Fail-fast validation for the ancient-tech P0 Roblox UI raster bundle."""

from __future__ import annotations

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parent
DERIVED = ROOT / "derived"

EXPECTED = {
    "panel-ancient-tech-monument-body_BLK.png": (512, 512),
    "panel-ancient-tech-monument-signal_BLK.png": (512, 512),
    "panel-ancient-tech-compact-body_BLK.png": (256, 256),
    "panel-ancient-tech-compact-signal_BLK.png": (256, 256),
    "panel-ancient-tech-control-body_BLK.png": (256, 96),
    "panel-ancient-tech-control-signal_BLK.png": (256, 96),
    "titlebar-ancient-tech-rail-body_BLK.png": (512, 96),
    "titlebar-ancient-tech-rail-signal_BLK.png": (512, 96),
    "tile-ancient-tech-obsidian_BLK.png": (128, 128),
}


def assert_frame(path: Path, expected_size: tuple[int, int], is_signal: bool) -> None:
    image = Image.open(path)
    assert image.mode == "RGBA", f"{path.name}: expected RGBA, got {image.mode}"
    assert image.size == expected_size, f"{path.name}: expected {expected_size}, got {image.size}"

    alpha = image.getchannel("A")
    minimum, maximum = alpha.getextrema()
    assert minimum == 0, f"{path.name}: expected transparent pixels"
    if is_signal:
        assert maximum >= 128, f"{path.name}: signal mask is unexpectedly faint"
    else:
        assert maximum == 255, f"{path.name}: expected fully opaque body pixels"
    assert alpha.getbbox() is not None, f"{path.name}: no visible pixels"

    visible_magenta = 0
    for red, green, blue, opacity in image.get_flattened_data():
        if opacity > 32 and min(red, blue) - green > 150:
            visible_magenta += 1
    assert visible_magenta == 0, f"{path.name}: {visible_magenta} likely chroma-key pixels remain"


def assert_signal(path: Path) -> None:
    image = Image.open(path)
    for red, green, blue, opacity in image.get_flattened_data():
        if opacity > 0:
            assert (red, green, blue) == (255, 255, 255), (
                f"{path.name}: signal layer must be white for runtime tinting"
            )


def assert_tile(path: Path) -> None:
    image = Image.open(path)
    assert image.mode == "RGBA", f"{path.name}: expected RGBA, got {image.mode}"
    assert image.size == EXPECTED[path.name], f"{path.name}: wrong dimensions"
    assert image.getchannel("A").getextrema() == (255, 255), f"{path.name}: tile must be opaque"

    pixels = image.load()
    width, height = image.size
    for y in range(height):
        assert pixels[0, y] == pixels[width - 1, y], f"{path.name}: horizontal wrap mismatch at y={y}"
    for x in range(width):
        assert pixels[x, 0] == pixels[x, height - 1], f"{path.name}: vertical wrap mismatch at x={x}"


def main() -> None:
    actual = {path.name for path in DERIVED.glob("*.png")}
    expected = set(EXPECTED)
    assert actual == expected, f"bundle mismatch: missing={sorted(expected - actual)} extra={sorted(actual - expected)}"

    for filename, size in EXPECTED.items():
        path = DERIVED / filename
        if filename.startswith("tile-"):
            assert_tile(path)
        else:
            is_signal = "-signal_" in filename
            assert_frame(path, size, is_signal)
            if is_signal:
                assert_signal(path)

    for stem in (
        "panel-ancient-tech-monument",
        "panel-ancient-tech-compact",
        "panel-ancient-tech-control",
        "titlebar-ancient-tech-rail",
    ):
        body = Image.open(DERIVED / f"{stem}-body_BLK.png")
        signal = Image.open(DERIVED / f"{stem}-signal_BLK.png")
        assert body.size == signal.size, f"{stem}: body/signal dimensions differ"

    print(f"PASS: {len(EXPECTED)} ancient-tech UI raster assets validated")


if __name__ == "__main__":
    main()
