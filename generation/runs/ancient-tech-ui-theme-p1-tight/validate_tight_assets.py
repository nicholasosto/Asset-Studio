#!/usr/bin/env python3
"""Validate the eight tightly cropped ancient-tech UI frame layers."""

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parent
DERIVED = ROOT / "derived"

PAIRS = (
    ("panel-ancient-tech-monument-tight-body_BLK.png", "panel-ancient-tech-monument-tight-signal_BLK.png"),
    ("panel-ancient-tech-compact-tight-body_BLK.png", "panel-ancient-tech-compact-tight-signal_BLK.png"),
    ("panel-ancient-tech-control-tight-body_BLK.png", "panel-ancient-tech-control-tight-signal_BLK.png"),
    ("titlebar-ancient-tech-rail-tight-body_BLK.png", "titlebar-ancient-tech-rail-tight-signal_BLK.png"),
)


def main() -> None:
    expected = {name for pair in PAIRS for name in pair}
    actual = {path.name for path in DERIVED.glob("*.png")}
    assert actual == expected, f"bundle mismatch: missing={sorted(expected - actual)} extra={sorted(actual - expected)}"

    for body_name, signal_name in PAIRS:
        body = Image.open(DERIVED / body_name).convert("RGBA")
        signal = Image.open(DERIVED / signal_name).convert("RGBA")
        assert body.size == signal.size, f"{body_name}: body/signal dimensions differ"
        assert body.getchannel("A").getbbox() is not None, f"{body_name}: body is empty"
        assert signal.getchannel("A").getbbox() is not None, f"{signal_name}: signal is empty"

        body_bbox = body.getchannel("A").getbbox()
        margins = (
            body_bbox[0],
            body_bbox[1],
            body.width - body_bbox[2],
            body.height - body_bbox[3],
        )
        assert max(margins) <= 2, f"{body_name}: unexpected outer alpha margin {margins}"

        for red, green, blue, opacity in signal.get_flattened_data():
            if opacity > 0:
                assert (red, green, blue) == (255, 255, 255), (
                    f"{signal_name}: signal pixels must remain white for runtime tinting"
                )

    print(f"PASS: {len(expected)} tight ancient-tech UI frame layers validated")


if __name__ == "__main__":
    main()
