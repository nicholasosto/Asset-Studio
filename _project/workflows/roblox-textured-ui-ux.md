---
title: "Roblox textured UI/UX"
status: draft
updated: 2026-07-12
links:
  - { rel: references, target: mediums/image }
  - { rel: references, target: workflows/image-generation }
  - { rel: references, target: decisions/0001-reference-the-shared-asset-library-via-external-locations }
  - { rel: references, target: decisions/0009-workflows-compose-by-call-and-handoff }
---

# Roblox textured UI/UX

> **Status:** draft (2026-07-12)

## Purpose

A responsive Roblox UI component or screen whose image-backed material, ornament, icons, and
interaction states retain their intended texture without sacrificing localization, input behavior,
loading resilience, or device fit. The process first decides what should remain native Roblox UI
and what genuinely benefits from `ImageLabel` / `ImageButton`; it then calls [[image-generation]]
for the image set, validates it locally through `rbxasset://trembus/`, and promotes it for upload
only after an in-Studio acceptance gate.

This is a **specialized composite** under [[0009-workflows-compose-by-call-and-handoff]]: the
`generate-art` step calls the image-generation leaf with a bound asset brief, filename grammar,
and `ui/` target slot. Asset-Studio stores the process and its run record, not the produced assets.

**Standing style kit:** the graphite-cyan reference set (9-slice panel · seamless tile · 2×2 state
atlas, produced by the `roblox-textured-ui-reference-kit` run) lives in the library
`Assets/templates/ui-style/graphite-cyan/` per ADR 0010 and is the default specimen kit for the
`write-art-contract` step. Full template index: [[mediums/image]] § Template registry.

## Roblox rendering standard

- Use `ImageLabel` for non-interactive art and `ImageButton` only when the image itself is the
  control. Keep localizable or dynamic copy in `TextLabel` / `TextButton`; Roblox automatic text
  capture cannot extract text baked into images.
- Select the rendering mode deliberately: `Fit` for a complete undistorted image, `Crop` for a
  cover image, `Slice` for resizable bordered panels, `Tile` for repeating fills, and `Stretch`
  only where distortion is acceptable. Use `ImageRectOffset` + `ImageRectSize` for atlas cells;
  do not combine atlas sub-rects with `Tile`.
- For 9-slice art, lock `SliceCenter` in source pixels and test the smallest supported control.
  Tune `SliceScale` when thick borders would consume short chips or buttons.
- Export runtime UI art as PNG when transparency is required; keep each image at or below
  4096×4096 and 20 MB, and match its resolution to expected on-screen pixels rather than the
  platform ceiling. Use white source regions when runtime `ImageColor3` tinting is required.
- Use `ResampleMode.Pixelated` only for intentionally nearest-neighbor art. Default filtering is
  the baseline for painted, photographic, or smoothly scaled art.
- Prototype locally from the shared library with `rbxasset://trembus/ui/.../<slug>_BLK.png`.
  That URI is Studio-only; shipping requires an approved upload and an `rbxassetid://<id>` reference.
- Prefer production-safe modifiers. `UIGradient`, `UICorner`, `UIPadding`, and `UIStroke` can
  complement the texture; beta-only UI features are not a shipping dependency. Never animate
  `UIStroke.Thickness` on text—animate transparency or crossfade fixed strokes instead.

## Workflow

```json
{
  "caption": "A briefed Roblox UI surface: render strategy → image-generation call → local Studio proof → approved upload handoff.",
  "lanes": [
    { "id": "owner", "label": "Owner gates", "kind": "human" },
    { "id": "lead", "label": "Codex run lead", "kind": "ai" },
    { "id": "art", "label": "Image production", "kind": "ai" },
    { "id": "library", "label": "Shared library", "kind": "tool" },
    { "id": "studio", "label": "Roblox Studio", "kind": "tool" },
    { "id": "ship", "label": "Publish", "kind": "system" }
  ],
  "steps": [
    { "id": "lock-brief", "lane": "owner", "label": "Lock UX + visual brief", "detail": "surface · states · devices · input · locale", "note": "Name the UI surface, visual direction, interaction states, target viewports, input modes, localizable text, and acceptance evidence. Approval authorizes local work through Studio validation; final promotion remains a separate gate.", "status": "pending", "to": ["choose-rendering"] },
    { "id": "choose-rendering", "lane": "lead", "label": "Choose native vs image-backed layers", "detail": "Fit · Crop · Slice · Tile · atlas", "note": "Use native frames/text/layout for structure and semantics. Record why each image-backed layer needs ImageLabel or ImageButton and lock ScaleType, ResampleMode, SliceCenter/SliceScale, TileSize, or atlas cell geometry before generation.", "status": "pending", "to": ["write-art-contract"] },
    { "id": "write-art-contract", "lane": "lead", "label": "Write the art contract", "detail": "dimensions · alpha · seams · safe zones", "note": "Bind the call: composition reference = annotated component/specimen layout; filename grammar = lower-kebab + _BLK.png; destination = shared Assets ui/<slot>/ (or ui/<project>/<bundle>/ when project-specific). Keep text out of pixels and define all hover/pressed/disabled variants.", "status": "pending", "to": ["generate-art"] },
    { "id": "generate-art", "lane": "art", "label": "Call image-generation", "detail": "candidate set → reviewed winner", "note": "Run image-generation with the bound composition reference, filename grammar, and ui/ target slot. The leaf owns its generation/BATCH.md and staging/review loop; this pipeline tracks the accepted art set as this step's outcome.", "status": "pending", "refs": [{ "rel": "references", "target": "workflows/image-generation" }], "to": ["preflight-images"] },
    { "id": "preflight-images", "lane": "lead", "label": "Preflight the image set", "detail": "format · size · alpha · borders · atlas", "note": "Verify PNG/alpha where needed, <=4096 per axis, <=20 MB, exact atlas cell geometry, seamless tile edges, 9-slice corner/edge integrity, tint-safe white regions, and absence of embedded localizable text.", "status": "pending", "to": ["file-blockout"] },
    { "id": "file-blockout", "lane": "library", "label": "File the _BLK assets", "detail": "Assets/ui/<slot>/<slug>_BLK.png", "note": "Asset-Studio never stores the payload. Route shared UI art to ui/icons, ui/frames, ui/sprites, ui/backgrounds, or ui/design; route project-presupposing art below ui/<project>/. Generated uncertain drops may pause in _inbox/images, but reviewed work moves into ui/.", "status": "pending", "refs": [{ "rel": "references", "target": "decisions/0001-reference-the-shared-asset-library-via-external-locations" }], "to": ["build-studio-proof"] },
    { "id": "build-studio-proof", "lane": "studio", "label": "Build the Studio proof", "detail": "ReplicatedStorage.UIMockups/<Name>", "note": "In Edit mode, construct a real ScreenGui/component using rbxasset://trembus paths. Preserve the generating Luau or component source and save an .rbxm reference when durability is required.", "status": "pending", "to": ["wire-behavior"] },
    { "id": "wire-behavior", "lane": "lead", "label": "Wire states + load behavior", "detail": "hover · press · disabled · fallback", "note": "Use ImageButton for interactive image controls, or layer a semantic button over non-interactive art. Exercise hover/press/disabled states, guard initial loading with IsLoaded or ContentProvider:PreloadAsync, and ensure a missing image fails legibly.", "status": "pending", "to": ["device-qa"] },
    { "id": "device-qa", "lane": "studio", "label": "Device + input + locale QA", "detail": "desktop · phone · tablet · controller", "note": "Use Studio emulation to test smallest/largest supported sizes, landscape/portrait where applicable, mouse/touch/controller focus, long/localized strings, safe areas, and the smallest 9-slice control. Text must remain readable and borders must not overlap content.", "status": "pending", "to": ["quality-qa"] },
    { "id": "quality-qa", "lane": "lead", "label": "Visual + performance QA", "detail": "native pixels · filtering · memory · flicker", "note": "Inspect at native and scaled sizes, validate Fit/Crop/Tile/Slice behavior, reject compression artifacts or one-pixel details that collapse, avoid frequently rebuilding UIGradient sequences, and never tween UIStroke.Thickness on text.", "status": "pending", "to": ["accept", "revise"] },
    { "id": "revise", "lane": "lead", "label": "Revise the narrowest failed layer", "detail": "art contract or Studio implementation", "note": "Route image defects back to generate-art; route property/layout/state defects back to build-studio-proof. Record which acceptance check failed before revising.", "status": "pending", "to": ["generate-art", "build-studio-proof"] },
    { "id": "accept", "lane": "owner", "label": "Approve final UI set", "detail": "visual + UX acceptance gate", "note": "The owner reviews the actual Studio proof and QA evidence. Approval promotes local art from _BLK to _FNL and authorizes the publish handoff; rejection follows the revise branch.", "status": "pending", "to": ["promote-final"] },
    { "id": "promote-final", "lane": "library", "label": "Promote _BLK → _FNL", "detail": "upload-ready local source", "note": "Preserve source files and update every local reference. _FNL means upload-ready, not shipped.", "status": "pending", "to": ["upload"] },
    { "id": "upload", "lane": "ship", "label": "Upload + clear moderation", "detail": "correct owner/group · image asset IDs", "note": "Upload under the intended experience owner/group, wait for moderation, and record the resulting IDs. A pending or rejected image is not shippable.", "status": "pending", "to": ["swap-runtime-ids"] },
    { "id": "swap-runtime-ids", "lane": "lead", "label": "Swap to rbxassetid:// + recheck", "detail": "production references + preload", "note": "Replace Studio-only rbxasset://trembus references in the shipping consumer, centralize IDs when reused, rerun the Studio/device checks against uploaded assets, and capture the final evidence in the pipeline run.", "status": "pending", "to": [] }
  ]
}
```
