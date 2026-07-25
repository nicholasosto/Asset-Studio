#!/usr/bin/env python3
"""Build tightly cropped, body/signal-aligned ancient-tech UI frame variants.

This corrective pass never overwrites the P0 files. Each body/signal pair uses
one union crop so the two layers remain pixel-aligned. The resulting assets
remove transparent outer canvas that previously compounded with SliceCenter,
SliceScale, and content padding in Roblox.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parent
P0 = ROOT.parent / "ancient-tech-ui-theme-p0" / "derived"
DERIVED = ROOT / "derived"
QA = ROOT / "qa"


@dataclass(frozen=True)
class TightSpec:
    name: str
    body_source: str
    signal_source: str
    body_output: str
    signal_output: str
    slice_center: tuple[int, int, int, int]
    slice_scale: float
    targets: tuple[tuple[int, int], ...]


SPECS = (
    TightSpec(
        name="monument",
        body_source="panel-ancient-tech-monument-body_BLK.png",
        signal_source="panel-ancient-tech-monument-signal_BLK.png",
        body_output="panel-ancient-tech-monument-tight-body_BLK.png",
        signal_output="panel-ancient-tech-monument-tight-signal_BLK.png",
        slice_center=(90, 84, 410, 404),
        slice_scale=0.55,
        targets=((620, 360), (380, 220), (1440, 260)),
    ),
    TightSpec(
        name="compact",
        body_source="panel-ancient-tech-compact-body_BLK.png",
        signal_source="panel-ancient-tech-compact-signal_BLK.png",
        body_output="panel-ancient-tech-compact-tight-body_BLK.png",
        signal_output="panel-ancient-tech-compact-tight-signal_BLK.png",
        slice_center=(45, 36, 205, 196),
        slice_scale=0.55,
        targets=((232, 128), (84, 84), (360, 180)),
    ),
    TightSpec(
        name="control",
        body_source="panel-ancient-tech-control-body_BLK.png",
        signal_source="panel-ancient-tech-control-signal_BLK.png",
        body_output="panel-ancient-tech-control-tight-body_BLK.png",
        signal_output="panel-ancient-tech-control-tight-signal_BLK.png",
        slice_center=(32, 18, 144, 46),
        slice_scale=1.0,
        targets=((232, 58), (496, 58), (720, 50)),
    ),
    TightSpec(
        name="title-rail",
        body_source="titlebar-ancient-tech-rail-body_BLK.png",
        signal_source="titlebar-ancient-tech-rail-signal_BLK.png",
        body_output="titlebar-ancient-tech-rail-tight-body_BLK.png",
        signal_output="titlebar-ancient-tech-rail-tight-signal_BLK.png",
        slice_center=(88, 28, 287, 65),
        slice_scale=0.65,
        targets=((512, 54), (1440, 62), (280, 50)),
    ),
)


def alpha_union_bbox(body: Image.Image, signal: Image.Image, padding: int = 2) -> tuple[int, int, int, int]:
    body_bbox = body.getchannel("A").getbbox()
    signal_bbox = signal.getchannel("A").getbbox()
    if body_bbox is None or signal_bbox is None:
        raise RuntimeError("Expected both body and signal layers to contain visible pixels")

    left = max(0, min(body_bbox[0], signal_bbox[0]) - padding)
    top = max(0, min(body_bbox[1], signal_bbox[1]) - padding)
    right = min(body.width, max(body_bbox[2], signal_bbox[2]) + padding)
    bottom = min(body.height, max(body_bbox[3], signal_bbox[3]) + padding)
    return left, top, right, bottom


def checkerboard(size: tuple[int, int], cell: int = 12) -> Image.Image:
    image = Image.new("RGBA", size)
    draw = ImageDraw.Draw(image)
    colors = ((17, 23, 29, 255), (28, 36, 43, 255))
    for y in range(0, size[1], cell):
        for x in range(0, size[0], cell):
            draw.rectangle(
                (x, y, min(size[0], x + cell), min(size[1], y + cell)),
                fill=colors[(x // cell + y // cell) % 2],
            )
    return image


def tint_signal(signal: Image.Image, color: tuple[int, int, int]) -> Image.Image:
    tinted = Image.new("RGBA", signal.size, (*color, 0))
    tinted.putalpha(signal.getchannel("A"))
    return tinted


def slice_resize(
    image: Image.Image,
    target: tuple[int, int],
    rect: tuple[int, int, int, int],
    slice_scale: float,
) -> Image.Image:
    source_width, source_height = image.size
    x1, y1, x2, y2 = rect
    left = round(x1 * slice_scale)
    right = round((source_width - x2) * slice_scale)
    top = round(y1 * slice_scale)
    bottom = round((source_height - y2) * slice_scale)

    if left + right >= target[0]:
        ratio = (target[0] - 1) / max(1, left + right)
        left = max(1, round(left * ratio))
        right = max(1, target[0] - left - 1)
    if top + bottom >= target[1]:
        ratio = (target[1] - 1) / max(1, top + bottom)
        top = max(1, round(top * ratio))
        bottom = max(1, target[1] - top - 1)

    source_x = (0, x1, x2, source_width)
    source_y = (0, y1, y2, source_height)
    target_x = (0, left, target[0] - right, target[0])
    target_y = (0, top, target[1] - bottom, target[1])
    output = Image.new("RGBA", target)

    for row in range(3):
        for column in range(3):
            source_box = (
                source_x[column],
                source_y[row],
                source_x[column + 1],
                source_y[row + 1],
            )
            target_box = (
                target_x[column],
                target_y[row],
                target_x[column + 1],
                target_y[row + 1],
            )
            target_size = (target_box[2] - target_box[0], target_box[3] - target_box[1])
            if target_size[0] <= 0 or target_size[1] <= 0:
                continue
            patch = image.crop(source_box).resize(target_size, Image.Resampling.LANCZOS)
            output.alpha_composite(patch, (target_box[0], target_box[1]))

    return output


def build() -> None:
    DERIVED.mkdir(parents=True, exist_ok=True)
    QA.mkdir(parents=True, exist_ok=True)

    rows: list[tuple[TightSpec, Image.Image, Image.Image, tuple[int, int, int, int]]] = []
    for spec in SPECS:
        body = Image.open(P0 / spec.body_source).convert("RGBA")
        signal = Image.open(P0 / spec.signal_source).convert("RGBA")
        if body.size != signal.size:
            raise RuntimeError(f"{spec.name}: body/signal source dimensions differ")

        crop_box = alpha_union_bbox(body, signal)
        tight_body = body.crop(crop_box)
        tight_signal = signal.crop(crop_box)
        tight_body.save(DERIVED / spec.body_output, optimize=True)
        tight_signal.save(DERIVED / spec.signal_output, optimize=True)
        rows.append((spec, tight_body, tight_signal, crop_box))

    sheet = Image.new("RGBA", (1180, 280 * len(rows)), (7, 11, 15, 255))
    draw = ImageDraw.Draw(sheet)
    for row_index, (spec, body, signal, crop_box) in enumerate(rows):
        y = row_index * 280
        draw.text(
            (16, y + 10),
            (
                f"{spec.name}  source-crop={crop_box}  tight-size={body.size}  "
                f"slice={spec.slice_center}  scale={spec.slice_scale}"
            ),
            fill=(220, 236, 241, 255),
        )
        x = 16
        for target in spec.targets:
            sliced_body = slice_resize(body, target, spec.slice_center, spec.slice_scale)
            sliced_signal = slice_resize(signal, target, spec.slice_center, spec.slice_scale)
            composite = checkerboard(target)
            composite.alpha_composite(sliced_body)
            composite.alpha_composite(tint_signal(sliced_signal, (55, 222, 255)))

            preview_scale = min(1.0, 350 / target[0], 205 / target[1])
            preview_size = (
                max(1, round(target[0] * preview_scale)),
                max(1, round(target[1] * preview_scale)),
            )
            preview = composite.resize(preview_size, Image.Resampling.LANCZOS)
            sheet.alpha_composite(preview, (x, y + 44))
            draw.text(
                (x, y + 50 + preview_size[1]),
                f"{target[0]} x {target[1]}",
                fill=(137, 158, 169, 255),
            )
            x += 380

    sheet.convert("RGB").save(QA / "ancient-tech-ui-tight-slice-sheet.jpg", quality=94)


if __name__ == "__main__":
    build()
