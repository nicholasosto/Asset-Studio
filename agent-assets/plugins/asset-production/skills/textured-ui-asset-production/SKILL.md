---
name: textured-ui-asset-production
version: 0.1.0
description: >
  Use when producing or validating image-backed Roblox UI art such as 9-slice panels, seamless
  fills, atlases, sprite sheets, body/signal pairs, textured buttons, and themed frames, or for
  ScaleType.Slice, SliceCenter, SliceScale, ScaleType.Tile, ImageRectOffset, ImageRectSize,
  textured Roblox UI, panel borders, UI atlases, or Studio acceptance of raster UI assets.
---

# Textured UI Asset Production

> **Skill version: 0.1.0.** This skill owns the art contract and visual acceptance of
> image-backed Roblox UI. `roblox-dev:asset-conventions` owns paths, prefixes, `_BLK/_FNL`,
> registration, and promotion. Roblox-UI-Studio owns the runtime-neutral prototype and Studio QA.

## 1. Lock the contract

Record:

- surface and visual direction;
- interaction states;
- supported viewports and input modes;
- localizable/dynamic text;
- source dimensions and runtime derivative dimensions;
- alpha, tint, filtering, seam, safe-zone, slice, tile, or atlas geometry;
- the evidence required at owner acceptance.

Approval authorizes local `_BLK` work and Studio proof only. It does not authorize `_FNL`,
upload, publication, or shipping references.

## 2. Choose native versus image-backed layers

- Keep layout, semantics, focus targets, dynamic values, and localizable copy in native Roblox UI.
- Use `ImageLabel` for non-interactive art.
- Use `ImageButton` only when the image itself is the semantic control; otherwise layer native
  controls over non-interactive art.
- Use `Fit` for a complete undistorted image, `Crop` for cover behavior, `Slice` for bordered
  resizable chrome, `Tile` for repeating fills, and `Stretch` only when distortion is acceptable.
- Use `ImageRectOffset` and `ImageRectSize` for atlas cells. Never combine an atlas sub-rect with
  `Tile`.

## 3. Write the art contract before generation

- 9-slice: lock `SliceCenter` in runtime-source pixels, define the smallest supported control,
  and specify the `SliceScale` range.
- Seamless fill: require four-edge continuity, no framed focal object, no directional baked
  lighting, and an intentional `TileSize` test range.
- Atlas or sheet: record rows, columns, cell size, state order, gutters, and bleed policy.
- Body/signal pairs: keep shared geometry identical; isolate emissive or state information in the
  signal layer.
- Keep localizable text out of pixels.
- Use white source regions where `ImageColor3` tinting is part of the contract.
- Call the immutable `asset-studio-batch` process for generation.

## 4. Preflight images

Verify:

- PNG and alpha where required;
- dimensions match the contract and remain within Roblox limits;
- no visible seams or one-pixel edge discontinuities;
- corners and edge bands remain intact after slicing;
- atlas cells align exactly and do not bleed;
- source and runtime derivative geometry agree;
- no baked localizable text;
- no detail whose readability depends on a single collapsing pixel.

Use deterministic builders and validators for extraction, resizing, paired layers, or repeated
families. Track those tools; keep generated and QA rasters in ignored work space.

An alpha-channel check alone does not prove transparency: a fully opaque RGBA image can pass it.
Inspect pixel alpha or visually verify the background before acceptance.

## 5. File and prove

1. Invoke `roblox-dev:asset-conventions` for the exact shared-library path and `_BLK` filename.
2. Open the sibling Roblox-UI-Studio workspace (or the explicitly named owning lab) and load its
   project-local `roblox-ui-studio` skill before building the prototype. It is a handoff authority,
   not a globally installed Asset-Studio skill.
3. Persist source/prototype work in Edit mode; use Play only for disposable behavioral QA.
4. Test native and scaled sizes, the smallest supported control, desktop, phone, tablet,
   mouse/touch/controller focus, long strings, safe areas, loading, and missing-image fallback.
5. Use `rbxasset://trembus/` only for local Studio proof. Shipping requires an approved upload,
   moderation, recorded ID, `rbxassetid://` swap, and a post-upload regression pass.

## 6. Acceptance and promotion

- Route image defects back to the art contract.
- Route property, layout, focus, or behavior defects back to the runtime prototype.
- Record evidence and remaining gates in the owning Asset-Studio pipeline.
- `_BLK → _FNL` occurs only after the owner accepts the rendered Studio proof and explicitly
  declares the source upload-ready.
- Upload and publish remain separate authority gates.

## Non-negotiable traps

- Do not wallpaper a whole trim sheet onto a surface; UV-map one measured geometry band to one
  strip.
- Do not bake dynamic/localized text into raster art.
- Do not treat an Asset Manager row, local URI, or imported image as registry or publish proof.
- Do not animate `UIStroke.Thickness` on text; animate transparency or crossfade fixed strokes.
- Do not depend on beta-only UI features for shipping.
