---
title: "Adopt the TCL MediaFrame in the Explorer"
status: completed
updated: 2026-07-01
links:
  - { rel: references, target: roadmap/migrate-asset-explorer-into-the-command-center }
---

# Adopt the TCL MediaFrame in the Explorer

> **Status:** completed (2026-07-01)

## Goal

Phase 3.1 of [[migrate-asset-explorer-into-the-command-center]] — consume the freshly-published
`@trembus/ui 0.4.0` + `@trembus/game-viz 0.2.0` and replace the Explorer's hand-rolled thumbnail frame
with the new `MediaFrame` component.

## Success Criteria

- Command Center on `@trembus/ui ^0.4.0` + `@trembus/game-viz ^0.2.0`; `pnpm typecheck` + `pnpm build` clean.
- Both card + inspector frames render via `MediaFrame`; no console errors in the live app.

## Source References

- `apps/command-center/src/AssetExplorer.tsx` — the `MediaFrame` swap + `toFrameData` mapping
- `apps/command-center/src/main.tsx` — added `@trembus/game-viz/styles.css`
- `@trembus/game-viz` `MediaFrame` — glTF/GLB 3D stage + format-aware placeholder plate
- The Explorer component review: [[tcl-components-for-explorer]] (memory)

## Decisions

- **`MediaFrame` owns the media surface** — the hand-rolled `.cc-explorer__thumb` glyph box (card +
  inspector) is gone; `MediaFrame` renders the bracket-cornered plate now and lights up real image/3D
  previews once served asset URLs land.
- **Registry `medium` → MediaFrame `medium` mapping:** `image→image`, `audio→audio`, **`3d→model`**,
  `null→doc`. The published API uses `'model'` (not `'3d'`) and adds a `'doc'` category — caught by reading
  the shipped `.d.ts`, not assuming the proposal.
- **Summary layout tidied** — the meter/donut split went from a row (thin meter floating beside a 494px
  donut, a big void) to a column (meter full-width above the donut).

## Outputs

- Deps bumped: `@trembus/ui 0.2.0 → 0.4.0`, added `@trembus/game-viz 0.2.0`; `@trembus/game-viz/styles.css`
  imported.
- `MediaFrame` wired into the card + inspector (`toFrameData` helper); dead thumb/glyph CSS removed.
- Verified live: bracket-cornered frames render tone-by-medium, summary void gone, 0 console errors,
  typecheck + build green. `model-viewer` is a code-split chunk (loads only when a 3D preview renders).

## Blockers

- none

## Next Action

Phase 3.2 (optional) — adopt `VirtualAssetGrid` (kills the 200-card cap + adds roving-key a11y), handling
its listbox select-vs-activate so arrow-keys don't reopen the inspector. Then Phase 4 (surface on the
landing) + Phase 5 (retire the source HTML).

## Handoff Notes

- `AudioWaveform` is built + ready but needs a served audio `src`; our assets live in `external-locations/`
  and aren't served yet, so it stays dormant until the thumbnail/URL enrichment pass. `MediaFrame`'s image
  poster + 3D `src` are the same story — previews light up automatically once URLs exist.
- `MediaFrame`'s 3D turntable (Effigy) only loads glTF/GLB; `.fbx/.blend/.rbxm/.obj` need a pre-rendered
  poster.
</content>
