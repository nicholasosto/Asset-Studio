---
title: "Add a FolderTree side-nav and VirtualAssetGrid to the Asset Explorer"
status: completed
updated: 2026-07-11
links:
  - { rel: references, target: roadmap/migrate-asset-explorer-into-the-command-center }
  - { rel: references, target: decision/0002-adopt-medium-and-mediumtype-as-the-asset-explorer-taxonomy }
---

# Add a FolderTree side-nav and VirtualAssetGrid to the Asset Explorer

> **Status:** completed (2026-07-11)

## Goal

Make the Asset Explorer navigable by the library's **real folder hierarchy** (not just the flat
medium/type/status/ext filters) by adding a `@trembus/ui` `FolderTree` side-nav, and modernize the
results grid at the same time — replacing the hand-rolled card grid + `INITIAL_CAP` slicing with the
virtualized, sectioned `VirtualAssetGrid`.

## Success Criteria

- `FolderTree` renders the library's real folder tree (roots `ui`/`textures`/`runtime`/`audio`/…) with
  subtree asset counts; selecting a folder filters the grid to that subtree and **composes** (AND) with
  the existing search/medium/type filters, with a removable "Folder" chip + Clear-all reset.
- The grid is virtualized + `mediumType`-sectioned (`VirtualAssetGrid`): windows at scale, keeps the
  `MediaFrame` tile and the Dialog inspector intact.
- No `@trembus/ui` version bump, no cross-repo TCL work, no `asset-registry` pipeline change.
- `tsc --noEmit` + `vite build` clean; verified live on `:5175`.

## Source References

- `apps/command-center/src/registry.ts` — `buildAssetTree` / `assetTree` / `underFolder`
- `apps/command-center/src/AssetExplorer.tsx` — `selectedPath` facet, app-shell layout, `FolderTree` +
  `VirtualAssetGrid`, presentational `AssetTile`
- `apps/command-center/src/styles/app.css` — `.cc-explorer__body/__tree/__main` + retargeted tile styles
- [[migrate-asset-explorer-into-the-command-center]] — the Explorer this extends
- [[0002-adopt-medium-and-mediumtype-as-the-asset-explorer-taxonomy]] — the taxonomy the grid sections use
- The `tcl-components-for-explorer` memory — `FolderTree` + `VirtualAssetGrid` were the wishlist, now wired

## Decisions

- **Tree spine = folder path** (from record `dir`/`p`), not a medium▸type tree — the medium taxonomy is
  already covered by the donut/Stat tiles/Selects, so a folder tree is the *orthogonal new* axis. (owner call)
- **Scope = also modernize the grid**: adopt `VirtualAssetGrid` (built-but-unused in `@trembus/ui 0.4.0`)
  rather than keep the bespoke cap/grouping. (owner call)
- Folder selection is a **filter facet** folded into the existing `matches()` conjunction (composes + gets
  a removable chip for free), not a separate navigate/replace mode.
- **No ADR**: the change uses already-published components + ADR 0002's taxonomy; no architectural option
  was rejected that needs recording. (Re-open as an ADR only if the app-shell/scroll model is revisited.)

## Outputs

- `registry.ts`: `buildAssetTree(records)` → folders-only `FolderNode[]` (node id = full path prefix,
  subtree counts in labels), module-level `assetTree`, and `underFolder(r, folder)` predicate.
- `AssetExplorer.tsx`: `selectedPath` facet (`matches()`/`anyFilter`/chips/`removeChip`); app-shell layout
  (full-width summary + filter chrome over a bounded `.cc-explorer__body` = tree aside + grid); `FolderTree`
  side-nav (built-in filter, default-expanded roots); grid swapped to `VirtualAssetGrid<AssetRecord>`
  (`groupBy` mediumType + `groupOrder`, `onSelect`→inspector, `renderTile` injects the `MediaFrame`+badges
  tile); `AssetTile` demoted to presentational (no `Card`); deleted `INITIAL_CAP`/`showAll`/grouping machinery.
- `app.css`: `.cc-explorer__body/__tree/__main` layout (+ `<60rem` stack) and retargeted `.cc-explorer__card`
  from TCL `Card` internals to the presentational div.
- Verified live on `:5175` (folder select 512→75/58 shown + chip + tree highlight; sectioned windowed grid;
  thumbnails 320px; tile→inspector); `tsc --noEmit` + `vite build` clean; committed static bundle refreshed.
- De-drift: the `tcl-components-for-explorer` memory updated (VAG/FolderTree now wired; tile composition
  rewritten) and this session + the CLAUDE.md status entry added.

## Blockers

- none.

## Next Action

Commit the Asset-Studio changes (`registry.ts` · `AssetExplorer.tsx` · `app.css`, the regenerated planning
contract + static bundle, and this session).

## Handoff Notes

- **No version bump**: `FolderTree` + `VirtualAssetGrid` both ship in the installed `@trembus/ui 0.4.0`
  (`FolderTree` was already used by the Field Guide panel). Tree data is derived client-side from record
  `dir`/`p` — no `asset-registry` rebuild needed; it refreshes on app rebuild like the rest.
- **Bounded-height is load-bearing**: `VirtualAssetGrid` is `height:100%` + an internal `overflow:auto`
  scroller, so its parent must have a definite height or it stops windowing. `.cc-explorer__body` uses
  `calc(100vh - 22rem)` backstopped by `min-height:28rem` — the `22rem` offset is a heuristic worth tuning
  per monitor. The narrow (`<60rem`) breakpoint MUST give `.cc-explorer__main` a **definite** height (set
  `70vh`); a bare `min-height` left VAG unbounded and it grew to full content height (caught + fixed in verify).
- Summary + filter are **normal-flow chrome** (scroll with the window); only the grid scrolls internally.
  Pinning them (`position:sticky` or a viewport-height flex shell) is an open refinement if wanted.
- Keep the tile's `MediaFrame` **non-interactive** — VAG's `role="option"` owns click/keyboard/focus; the
  tile fills the cell via `.cc-explorer__cardmedia` absolute-seat + `object-fit:contain` (whole asset, never cropped).
