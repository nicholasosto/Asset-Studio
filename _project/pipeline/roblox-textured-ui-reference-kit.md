---
title: "Roblox textured UI reference kit"
status: build
updated: 2026-07-12
links:
  - { rel: references, target: workflows/roblox-textured-ui-ux }
---

# Roblox textured UI reference kit

> **Status:** build (2026-07-12)

## Context

First planned instance of [[roblox-textured-ui-ux]]. Its job is to prove the full workflow with a
small, inspectable reference kit before applying the process to a production screen. Codex is the
run lead: it maintains the pipeline record, prepares the generation contract, produces/coordinates
the art, builds the Studio proof, runs the checks, and reports evidence at the two owner gates.

The proposed kit exercises the three image-backed behaviors most likely to fail differently:

1. one resizable 9-slice panel (`ScaleType.Slice`),
2. one seamless textured fill (`ScaleType.Tile`), and
3. one 2×2 icon/state atlas (`ImageRectOffset` + `ImageRectSize`).

The aesthetic, component name, target project (shared vs project-specific), and exact sizes remain
unlocked until plan approval. The safe default is a game-agnostic material specimen under the
shared `ui/` kit—not a Soul Steel-specific asset. No asset payload is written into Asset-Studio.

## Build plan

1. **Approval / brief lock** — owner selects or confirms the visual direction, shared-vs-project
   scope, target component name, supported viewports/input modes, and whether the run may proceed
   only through local Studio proof or through Roblox upload as well.
2. **Specification sheet** — Codex records source dimensions, 9-slice border coordinates,
   `SliceScale` test range, tile size, atlas cell size/order, tint rules, state list, filename
   grammar, and library target slots. Default draft dimensions: 256×256 panel, 256×256 tile, and
   256×256 atlas with four 128×128 cells; these are provisional until the visual brief is locked.
3. **Image-generation call** — create an annotated composition reference and a bounded
   `generation/BATCH.md`; run candidates through the existing image-generation leaf; stop its
   generation pass in `generation/staging/`, then review against seam/slice/atlas constraints.
4. **Preflight + `_BLK` filing** — verify format, dimensions, alpha, file size, seam continuity,
   safe slice borders, atlas cell boundaries, tint behavior, and no baked localizable text. File
   reviewed winners under the correct `~/Master-Managed/Assets/ui/.../*_BLK.png` paths.
5. **Studio proof** — in a connected Roblox Studio session, confirm the local asset link and build
   `ReplicatedStorage.UIMockups/TexturedUIReferenceKit` in Edit mode. Show the panel at short/wide/
   tall sizes, the tiled fill at multiple scales, and all four atlas cells; include hover, pressed,
   disabled, loading, and missing-asset states where applicable.
6. **QA pass** — use Device Emulator across desktop, phone portrait/landscape, and tablet; use
   Controller Emulator for focus/activation; check long/localized text, safe areas, native vs
   scaled sharpness, `Default` vs `Pixelated` filtering, loading/fallback behavior, and any
   slice-border overlap at the smallest supported control.
7. **Owner acceptance gate** — present screenshots, property manifest, resolved local paths, test
   matrix, and remaining tradeoffs. Rejected checks loop only the failed art or implementation
   layer; accepted art can be promoted from `_BLK` to `_FNL`.
8. **Optional publish handoff** — only if plan approval includes upload: upload to the confirmed
   owner/group, wait for moderation, record IDs, replace `rbxasset://trembus/` with centralized
   `rbxassetid://` references in the shipping consumer, and rerun the same proof against cloud art.
9. **Close the run** — append a `## Runs` record with step outcomes, outputs, and verification
   evidence; render the Asset-Studio hub so the completed instance replays on this process.

## Exit criteria

- The source spec records ScaleType, filtering, slice/tile/atlas geometry, states, and target paths.
- Three reviewed `_BLK` assets exist in the correct shared-library `ui/` slots with valid names.
- A real Studio proof renders every technique and state without distortion, border overlap,
  broken atlas cells, baked localizable text, or silent missing-image failure.
- Desktop, phone, tablet, and controller checks are recorded against the approved support matrix.
- The owner has accepted the rendered Studio proof. Nothing is marked `_FNL` before that approval.
- If upload was authorized, moderation has cleared, production references use recorded
  `rbxassetid://` values, and the post-upload regression pass is clean.
- The pipeline contains a final run record, and the Command Center contracts render with no errors.

## Approval boundary

Approving this plan authorizes Codex to carry out all **local** steps through the Studio QA report,
including creating batch contracts, generated candidates, shared-library `_BLK` files, and a
non-shipping mockup. It does not by itself authorize `_FNL` promotion or Roblox upload; those occur
only at the owner acceptance gate, with the upload owner/group explicitly confirmed.

## Source specification

**Approved default brief (2026-07-12):** game-agnostic shared kit; brushed graphite + restrained
cool cyan; local Studio proof only. No `_FNL` promotion and no Roblox upload in this run.

| Asset | Generated source | Runtime derivative | Roblox configuration | Shared-library target |
|---|---:|---:|---|---|
| 9-slice panel | 1024×1024 opaque PNG | 256×256 | `ScaleType.Slice`; draft `SliceCenter = Rect.new(32, 32, 224, 224)`; test `SliceScale` 0.5–1.0 | `ui/frames/graphite-cyan-reference-panel_BLK.png` |
| Seamless fill | 1024×1024 opaque PNG | 256×256 | `ScaleType.Tile`; test `TileSize` 64, 128, 256 px; `ResampleMode.Default` | `ui/backgrounds/graphite-cyan-reference-tile_BLK.png` |
| State atlas | 1024×1024 opaque PNG | 256×256, 2×2 | `ImageRectSize = Vector2.new(128,128)`; offsets `(0,0)`, `(128,0)`, `(0,128)`, `(128,128)`; never combine with `Tile` | `ui/sprites/graphite-cyan-reference-controls_BLK.png` |

Text stays native Roblox UI. The atlas carries only a geometric glyph. All three assets use exact
lower-kebab names with `_BLK`; their local proof URIs are `rbxasset://trembus/` plus the paths above.

## Runs

```json
[
  {
    "id": "run-1",
    "label": "Recommended pilot — local Studio acceptance",
    "status": "partial",
    "startedAt": "2026-07-12",
    "trigger": "owner approved recommended pilot exercises",
    "note": "Generation, _BLK filing, Studio structure, interaction wiring, and responsive QA are complete. Rendered-asset acceptance is paused because the Studio content symlink rbxasset://trembus is missing after an app update; _FNL promotion and upload remain unauthorized.",
    "stepOutcomes": [
      { "step": "lock-brief", "status": "done" },
      { "step": "choose-rendering", "status": "done" },
      { "step": "write-art-contract", "status": "done" },
      { "step": "generate-art", "status": "done" },
      { "step": "preflight-images", "status": "done" },
      { "step": "file-blockout", "status": "done" },
      { "step": "build-studio-proof", "status": "blocked" },
      { "step": "wire-behavior", "status": "done" },
      { "step": "device-qa", "status": "done" },
      { "step": "quality-qa", "status": "blocked" }
    ],
    "outputs": [
      { "label": "generation/BATCH.md — roblox-textured-ui-reference-kit", "kind": "doc" },
      { "label": "Source specification — panel, tile, atlas", "kind": "doc" },
      { "label": "ui/frames/graphite-cyan-reference-panel_BLK.png", "kind": "doc" },
      { "label": "ui/backgrounds/graphite-cyan-reference-tile_BLK.png", "kind": "doc" },
      { "label": "ui/sprites/graphite-cyan-reference-controls_BLK.png", "kind": "doc" },
      { "label": "ReplicatedStorage.UIMockups.TexturedUIReferenceKit", "kind": "doc" }
    ]
  }
]
```

## Verification evidence

### Asset preflight

- Built-in image generation produced three 1254×1254 RGB PNG candidates; reviewed runtime
  derivatives are exactly 256×256 RGB PNGs at 72.8–81.8 KiB each.
- Panel flip-difference averages were 3.95–4.10 RGB horizontally and 6.53–6.86 vertically on a
  0–255 scale; the accepted Studio draft uses `SliceCenter = Rect.new(48,48,208,208)` and
  `SliceScale` 0.48–0.58 for the three proportions.
- Tile opposite-edge differences averaged 3.31–3.36 RGB left/right and 4.76–5.36 top/bottom;
  this is the accepted pre-Studio seam threshold for the pilot.
- Atlas foreground bounds differ by at most about 5% across cells; the pressed inset is intentional.
  The runtime derivative is an exact 256×256 sheet with four 128×128 cells.
- Asset registry rebuilt after filing: 613 files scanned; 377 image thumbs baked; zero bake failures;
  all three new files classify as `mediumType: ui`.

### Studio proof

- Active place: **User Interface Development**, Edit-mode master at
  `ReplicatedStorage.UIMockups.TexturedUIReferenceKit` (88 descendants) plus the visible
  `StarterGui.TexturedUIReferenceKitPreview` clone.
- Embedded `Manifest` and `GenerationManifest` carry the three local URIs, slice/tile/atlas
  properties, run identity, and the no-final/no-upload boundary.
- Runtime controller maps idle/hover/pressed/disabled atlas offsets, preloads the three valid
  images, exposes a legible missing-image fallback, adapts narrow layouts, and never animates
  `UIStroke.Thickness`.
- Mouse activation incremented the counter; selection focus moved to the image button; Return
  activation incremented the counter. The MCP `ButtonA` injection did not fire `Activated`, so a
  genuine controller-button pass remains unverified even though the focus path is sound.
- Console check after playtesting contained no prototype errors or warnings.

### Responsive matrix

| Target | Effective viewport | Shell in bounds | Text fit | Control size |
|---|---:|---|---|---:|
| Average Laptop | 1365×768 | yes | title + long/short/tall samples fit | 128×128 |
| iPhone 17 Pro · landscape | 750×361 | yes | all samples fit | 128×128 |
| iPhone 17 Pro · portrait | 401×778 | yes | all samples fit after compact-status fix | 96×96 |
| iPad Pro M5 13-inch | 1375×1032 | yes | all samples fit | 128×128 |
| Samsung Galaxy A06 · landscape | 705×338 | yes | all samples fit | 128×128 |

Studio Device Simulator was restored to the default viewport and landscape orientation after the
matrix. The previously enabled mini-map preview was restored to its original state.

## Current blocker

`/Applications/RobloxStudio.app/Contents/Resources/content/trembus` is not linked. The supported
repair script refuses to modify the app bundle while Studio is running and needs an interactive
`sudo` session. Save and quit Studio, then run:

```bash
/Users/nicholasosto/Master-Managed/Project-Spaces/Trembus-Technologies/tools/rbx-asset-sync.sh link
```

After Studio relaunches and the MCP reconnects, rerun only the rendered-asset checks: confirm 3/3
preload, inspect the short/wide/tall 9-slice panels, inspect 64/128/256 tiling seams, inspect all
four atlas crops and state transitions, and capture the owner-acceptance screenshots. No new image
generation or layout work is expected.
