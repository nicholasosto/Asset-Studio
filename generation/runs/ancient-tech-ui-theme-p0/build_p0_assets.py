#!/usr/bin/env python3
"""Derive aligned Roblox UI body/signal layers from chroma-key source art.

The generated source images remain untouched in ``sources/``. This script:

1. removes the flat #FF00FF extraction field;
2. fits the extracted object into its production canvas;
3. separates cyan emission into a white, tintable signal mask;
4. neutralizes baked cyan in the structural body;
5. makes the quiet obsidian background edge-periodic; and
6. writes compact visual QA sheets.

Run with the Codex workspace Python runtime, which bundles Pillow:

    /Users/nicholasosto/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 \
        output/imagegen/ancient-tech-ui-theme-p0/build_p0_assets.py
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parent
SOURCES = ROOT / "sources"
DERIVED = ROOT / "derived"
QA = ROOT / "qa"


@dataclass(frozen=True)
class FrameSpec:
    source: str
    body: str
    signal: str
    size: tuple[int, int]
    padding: int


FRAME_SPECS = (
    FrameSpec(
        source="monument-source.png",
        body="panel-ancient-tech-monument-body_BLK.png",
        signal="panel-ancient-tech-monument-signal_BLK.png",
        size=(512, 512),
        padding=8,
    ),
    FrameSpec(
        source="compact-source.png",
        body="panel-ancient-tech-compact-body_BLK.png",
        signal="panel-ancient-tech-compact-signal_BLK.png",
        size=(256, 256),
        padding=5,
    ),
    FrameSpec(
        source="control-source.png",
        body="panel-ancient-tech-control-body_BLK.png",
        signal="panel-ancient-tech-control-signal_BLK.png",
        size=(256, 96),
        padding=4,
    ),
    FrameSpec(
        source="titlebar-source.png",
        body="titlebar-ancient-tech-rail-body_BLK.png",
        signal="titlebar-ancient-tech-rail-signal_BLK.png",
        size=(512, 96),
        padding=5,
    ),
)

SLICE_SPECS = {
    "panel-ancient-tech-monument-body": {
        "rect": (96, 96, 416, 416),
        "scale": 0.55,
        "targets": ((420, 280), (300, 170), (220, 220)),
    },
    "panel-ancient-tech-compact-body": {
        "rect": (48, 48, 208, 208),
        "scale": 0.55,
        "targets": ((220, 100), (140, 140), (300, 180)),
    },
    "panel-ancient-tech-control-body": {
        "rect": (48, 24, 208, 72),
        "scale": 0.70,
        "targets": ((180, 56), (320, 72), (110, 44)),
    },
    "titlebar-ancient-tech-rail-body": {
        "rect": (96, 24, 416, 72),
        "scale": 0.60,
        "targets": ((280, 56), (640, 64), (900, 64)),
    },
}


def smoothstep(edge0: float, edge1: float, value: float) -> float:
    if edge0 == edge1:
        return 0.0
    t = max(0.0, min(1.0, (value - edge0) / (edge1 - edge0)))
    return t * t * (3.0 - 2.0 * t)


def remove_magenta(source: Image.Image) -> Image.Image:
    """Remove a magenta screen and decontaminate antialiased edge pixels."""

    rgb = source.convert("RGB")
    output = Image.new("RGBA", rgb.size)
    src_pixels = rgb.load()
    dst_pixels = output.load()

    for y in range(rgb.height):
        for x in range(rgb.width):
            r, g, b = src_pixels[x, y]

            # Pure magenta has a key score of 255. Neutral metal and cyan have
            # low or negative scores, so they remain opaque.
            key_score = float(min(r, b) - g)
            keyed = smoothstep(34.0, 232.0, key_score)
            alpha = 1.0 - keyed

            if alpha <= 0.015:
                dst_pixels[x, y] = (0, 0, 0, 0)
                continue

            # Reverse compositing over #FF00FF to prevent a pink fringe.
            inv_alpha = 1.0 - alpha
            clean_r = (r - inv_alpha * 255.0) / alpha
            clean_g = g / alpha
            clean_b = (b - inv_alpha * 255.0) / alpha

            dst_pixels[x, y] = (
                round(max(0.0, min(255.0, clean_r))),
                round(max(0.0, min(255.0, clean_g))),
                round(max(0.0, min(255.0, clean_b))),
                round(alpha * 255.0),
            )

    # Suppress isolated low-alpha chroma noise without eroding crisp geometry.
    alpha = output.getchannel("A")
    alpha = alpha.point(lambda value: 0 if value < 12 else value)
    output.putalpha(alpha)
    return output


def fit_to_canvas(image: Image.Image, size: tuple[int, int], padding: int) -> Image.Image:
    alpha = image.getchannel("A")
    bbox = alpha.getbbox()
    if bbox is None:
        raise RuntimeError("Chroma extraction produced no visible pixels")

    cropped = image.crop(bbox)
    available = (size[0] - padding * 2, size[1] - padding * 2)
    scale = min(available[0] / cropped.width, available[1] / cropped.height)
    resized = cropped.resize(
        (max(1, round(cropped.width * scale)), max(1, round(cropped.height * scale))),
        Image.Resampling.LANCZOS,
    )

    canvas = Image.new("RGBA", size)
    offset = ((size[0] - resized.width) // 2, (size[1] - resized.height) // 2)
    canvas.alpha_composite(resized, offset)
    return canvas


def split_body_signal(extracted: Image.Image) -> tuple[Image.Image, Image.Image]:
    body = Image.new("RGBA", extracted.size)
    signal_alpha = Image.new("L", extracted.size)

    src_pixels = extracted.load()
    body_pixels = body.load()
    signal_pixels = signal_alpha.load()

    for y in range(extracted.height):
        for x in range(extracted.width):
            r, g, b, alpha = src_pixels[x, y]
            if alpha == 0:
                body_pixels[x, y] = (0, 0, 0, 0)
                signal_pixels[x, y] = 0
                continue

            cyan_delta = max(0.0, float(min(g, b) - r - 10))
            chroma_strength = smoothstep(5.0, 104.0, cyan_delta)
            light_strength = smoothstep(34.0, 210.0, float(max(g, b)))
            signal_strength = chroma_strength * (0.4 + light_strength * 0.6)
            signal_pixels[x, y] = round(alpha * signal_strength)

            # Retain relief and material shading while replacing baked cyan
            # with a cool-neutral recessed metal. The signal layer restores
            # arbitrary runtime color on top.
            luma = r * 0.22 + g * 0.56 + b * 0.22
            groove = (
                max(4, min(70, round(luma * 0.28))),
                max(6, min(76, round(luma * 0.31))),
                max(8, min(84, round(luma * 0.36))),
            )
            neutralize = min(1.0, signal_strength * 1.12)
            body_pixels[x, y] = (
                round(r * (1.0 - neutralize) + groove[0] * neutralize),
                round(g * (1.0 - neutralize) + groove[1] * neutralize),
                round(b * (1.0 - neutralize) + groove[2] * neutralize),
                alpha,
            )

    # A restrained halo preserves the authored illuminated seam without baking
    # its hue into the body.
    halo = signal_alpha.filter(ImageFilter.GaussianBlur(radius=0.65))
    signal_alpha = ImageChops.lighter(signal_alpha, halo)
    signal = Image.new("RGBA", extracted.size, (255, 255, 255, 0))
    signal.putalpha(signal_alpha)
    return body, signal


def harmonize_opposite_edges(image: Image.Image, strip: int = 14) -> Image.Image:
    """Blend paired edge pixels so the final tile wraps without a seam."""

    tile = image.convert("RGB")
    pixels = tile.load()
    width, height = tile.size

    for distance in range(strip):
        weight = 0.5 * (1.0 - distance / max(1, strip - 1))
        left_x = distance
        right_x = width - 1 - distance
        for y in range(height):
            left = pixels[left_x, y]
            right = pixels[right_x, y]
            average = tuple(round((left[channel] + right[channel]) * 0.5) for channel in range(3))
            pixels[left_x, y] = tuple(
                round(left[channel] * (1.0 - weight * 2.0) + average[channel] * weight * 2.0)
                for channel in range(3)
            )
            pixels[right_x, y] = tuple(
                round(right[channel] * (1.0 - weight * 2.0) + average[channel] * weight * 2.0)
                for channel in range(3)
            )

    for distance in range(strip):
        weight = 0.5 * (1.0 - distance / max(1, strip - 1))
        top_y = distance
        bottom_y = height - 1 - distance
        for x in range(width):
            top = pixels[x, top_y]
            bottom = pixels[x, bottom_y]
            average = tuple(round((top[channel] + bottom[channel]) * 0.5) for channel in range(3))
            pixels[x, top_y] = tuple(
                round(top[channel] * (1.0 - weight * 2.0) + average[channel] * weight * 2.0)
                for channel in range(3)
            )
            pixels[x, bottom_y] = tuple(
                round(bottom[channel] * (1.0 - weight * 2.0) + average[channel] * weight * 2.0)
                for channel in range(3)
            )

    return tile.convert("RGBA")


def make_mirrored_periodic_tile(source: Image.Image, size: int = 128) -> Image.Image:
    """Build a derivative-continuous tile from one generated material swatch.

    A mirrored quadrant makes both the pixel values and their first visual
    transition agree at the repeat boundary. The source texture is deliberately
    low-contrast, so the symmetry reads as material grain rather than a motif.
    """

    quadrant_size = size // 2
    source_rgb = source.convert("RGB")
    crop_size = min(source_rgb.width, source_rgb.height)
    left = (source_rgb.width - crop_size) // 2
    top = (source_rgb.height - crop_size) // 2
    quadrant = source_rgb.crop((left, top, left + crop_size, top + crop_size))
    quadrant = quadrant.resize((quadrant_size, quadrant_size), Image.Resampling.LANCZOS)

    tile = Image.new("RGB", (size, size))
    tile.paste(quadrant, (0, 0))
    tile.paste(quadrant.transpose(Image.Transpose.FLIP_LEFT_RIGHT), (quadrant_size, 0))
    tile.paste(quadrant.transpose(Image.Transpose.FLIP_TOP_BOTTOM), (0, quadrant_size))
    tile.paste(
        quadrant.transpose(Image.Transpose.FLIP_LEFT_RIGHT).transpose(Image.Transpose.FLIP_TOP_BOTTOM),
        (quadrant_size, quadrant_size),
    )
    return tile.convert("RGBA")


def tint_signal(signal: Image.Image, color: tuple[int, int, int]) -> Image.Image:
    tinted = Image.new("RGBA", signal.size, (*color, 0))
    tinted.putalpha(signal.getchannel("A"))
    return tinted


def checkerboard(size: tuple[int, int], cell: int = 16) -> Image.Image:
    canvas = Image.new("RGBA", size)
    draw = ImageDraw.Draw(canvas)
    colors = ((19, 25, 31, 255), (28, 36, 43, 255))
    for y in range(0, size[1], cell):
        for x in range(0, size[0], cell):
            draw.rectangle(
                (x, y, min(size[0], x + cell), min(size[1], y + cell)),
                fill=colors[(x // cell + y // cell) % 2],
            )
    return canvas


def slice_resize(
    image: Image.Image,
    target: tuple[int, int],
    rect: tuple[int, int, int, int],
    slice_scale: float,
) -> Image.Image:
    """Approximate Roblox ScaleType.Slice for offline distortion review."""

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


def build_slice_qa(
    pairs: list[tuple[str, Image.Image, Image.Image]],
) -> None:
    width = 1024
    row_height = 300
    sheet = Image.new("RGBA", (width, row_height * len(pairs)), (8, 12, 16, 255))
    draw = ImageDraw.Draw(sheet)

    for row, (label, body, signal) in enumerate(pairs):
        spec = SLICE_SPECS[label]
        y = row * row_height
        draw.text(
            (16, y + 12),
            f"{label}  center={spec['rect']}  scale={spec['scale']}",
            fill=(222, 238, 242, 255),
        )
        cursor_x = 16
        for target in spec["targets"]:
            sliced_body = slice_resize(body, target, spec["rect"], spec["scale"])
            sliced_signal = slice_resize(signal, target, spec["rect"], spec["scale"])
            composite = checkerboard(target)
            composite.alpha_composite(sliced_body)
            composite.alpha_composite(tint_signal(sliced_signal, (52, 220, 255)))

            max_width = 310
            max_height = 220
            preview_scale = min(1.0, max_width / target[0], max_height / target[1])
            preview_size = (
                max(1, round(target[0] * preview_scale)),
                max(1, round(target[1] * preview_scale)),
            )
            preview = composite.resize(preview_size, Image.Resampling.LANCZOS)
            sheet.alpha_composite(preview, (cursor_x, y + 48))
            draw.text(
                (cursor_x, y + 54 + preview_size[1]),
                f"{target[0]} x {target[1]}",
                fill=(142, 163, 174, 255),
            )
            cursor_x += max_width + 18

    sheet.convert("RGB").save(QA / "ancient-tech-ui-p0-slice-sheet.jpg", quality=93)


def build_qa_sheet(
    pairs: list[tuple[str, Image.Image, Image.Image]],
    tile: Image.Image,
) -> None:
    width = 1180
    row_height = 270
    sheet = Image.new("RGBA", (width, row_height * len(pairs) + 250), (8, 12, 16, 255))
    draw = ImageDraw.Draw(sheet)

    for row, (label, body, signal) in enumerate(pairs):
        y = row * row_height
        draw.text((18, y + 12), label, fill=(222, 238, 242, 255))
        max_height = row_height - 52
        max_width = 360
        scale = min(max_width / body.width, max_height / body.height)
        preview_size = (round(body.width * scale), round(body.height * scale))
        body_preview = body.resize(preview_size, Image.Resampling.LANCZOS)
        signal_preview = signal.resize(preview_size, Image.Resampling.LANCZOS)

        for column, (name, color) in enumerate(
            (("body", None), ("cyan", (52, 220, 255)), ("amber", (255, 174, 50)))
        ):
            x = 18 + column * 385
            backing = checkerboard(preview_size)
            backing.alpha_composite(body_preview)
            if color is not None:
                backing.alpha_composite(tint_signal(signal_preview, color))
            sheet.alpha_composite(backing, (x, y + 42))
            draw.text((x, y + 47 + preview_size[1]), name, fill=(142, 163, 174, 255))

    repeat_y = row_height * len(pairs)
    draw.text((18, repeat_y + 14), "obsidian tile — 3 x 3 repeat", fill=(222, 238, 242, 255))
    repeat = Image.new("RGBA", (384, 192))
    for y in range(0, repeat.height, tile.height):
        for x in range(0, repeat.width, tile.width):
            repeat.alpha_composite(tile, (x, y))
    sheet.alpha_composite(repeat, (18, repeat_y + 42))
    sheet.convert("RGB").save(QA / "ancient-tech-ui-p0-extraction-sheet.jpg", quality=92)
    repeat.convert("RGB").save(QA / "obsidian-tile-3x3-repeat.jpg", quality=94)


def main() -> None:
    DERIVED.mkdir(parents=True, exist_ok=True)
    QA.mkdir(parents=True, exist_ok=True)

    qa_pairs: list[tuple[str, Image.Image, Image.Image]] = []
    for spec in FRAME_SPECS:
        source = Image.open(SOURCES / spec.source)
        extracted = fit_to_canvas(remove_magenta(source), spec.size, spec.padding)
        body, signal = split_body_signal(extracted)
        body.save(DERIVED / spec.body, optimize=True)
        signal.save(DERIVED / spec.signal, optimize=True)
        qa_pairs.append((spec.body.removesuffix("_BLK.png"), body, signal))

    tile_source = Image.open(SOURCES / "obsidian-tile-source.png").convert("RGB")
    tile = make_mirrored_periodic_tile(tile_source)
    tile.save(DERIVED / "tile-ancient-tech-obsidian_BLK.png", optimize=True)

    build_qa_sheet(qa_pairs, tile)
    build_slice_qa(qa_pairs)


if __name__ == "__main__":
    main()
