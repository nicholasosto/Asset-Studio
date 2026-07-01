---
title: "Session review — Explorer migration and TCL round-trip"
status: complete
updated: 2026-07-01
links:
  - { rel: references, target: roadmap/migrate-asset-explorer-into-the-command-center }
---

# Session review — Explorer migration and TCL round-trip

> **Status:** complete (2026-07-01)

## Outcome

**What shipped** (commits `c8a475b … d28dc36`, all on `origin/main`)

- The **Asset Explorer migration** to 4/6 phases: the `tools/build-asset-registry.mjs` scanner →
  `previews/dashboards/asset-registry.json` (769 records), the `medium`/`mediumType` taxonomy, the React
  Explorer view (`apps/command-center/src/AssetExplorer.tsx`), and its adoption of the Trembus `MediaFrame`.
- A full **TCL round-trip**: the component review → building `AudioWaveform` + `VirtualAssetGrid`
  (`@trembus/ui 0.4.0`) + `MediaFrame` (`@trembus/game-viz 0.2.0`) in the sibling repo → publish → consume.
- The **roadmap model** made explicit ([[0003-roadmap-equals-one-initiative-the-ribbon-is-the-project-mile]])
  + the milestone ribbon seeded; the taxonomy decision ([[0002-adopt-medium-and-mediumtype-as-the-asset-explorer-taxonomy]]).
- **Anti-drift capture**: refreshed `CLAUDE.md` (Map + Conventions + Status) and memory
  ([[asset-registry-pipeline]], [[command-center-consumes-tcl]], [[tcl-components-for-explorer]]).

**What didn't** — see Carry-forward.

## Surprises

- **"Published" ≠ on npm.** The TCL build session bumped + committed `0.4.0`/`0.2.0` and published the
  Storybook docs, but `pnpm publish` (owner's token) hadn't run — `npm view @trembus/ui@0.4.0` was E404.
  Pattern: *verify the registry, don't trust a "done" report.*
- **The shipped API differed from the proposal.** `MediaFrame` uses `medium: 'model'` (not `'3d'`) and adds
  `'doc'`. Caught by reading the shipped `.d.ts`. Pattern: *read the real type, never assume your own spec.*
- **A verifier agent returned junk** (`verdict: "test"`, findings `a/b/c`). Pattern: *sanity-check verifier
  output too — re-ran the critic standalone, which then found real corrections (PathBreadcrumb ≈ existing
  Breadcrumb; the missed `@trembus/icons`).*
- **game-viz was invisible** at first because the initial scout only read `@trembus/ui` + `viz`. The whole
  game-viz suite (Effigy/MediaFrame) was one package away. Pattern: *enumerate all packages before concluding.*
- **Framework link resolution** needs folder-qualified targets ([[internal-links-need-folder-prefix]]); the
  DonutChart's legend height created a summary layout void (fixed: row → column).

## Decisions made

- **D1 — Roadmap = one initiative; the ribbon is the milestone index.** Formalized in
  [[0003-roadmap-equals-one-initiative-the-ribbon-is-the-project-mile]].
- **D2 — `Medium ▸ MediumType` taxonomy; `domain` dropped as structure.**
  [[0002-adopt-medium-and-mediumtype-as-the-asset-explorer-taxonomy]].
- **D3 — MediaFrame owns the media surface now; `VirtualAssetGrid` deferred** (its listbox select-vs-activate
  needs care before it replaces the grid).
- **D4 — TCL work happens in a dedicated sibling-repo session; publish is the owner's step** (npm token).

## Carry-forward

- `[CF-1]` **Serve asset URLs + pre-render posters** → real image/audio/3D previews (unblocks `MediaFrame`
  posters + the dormant `AudioWaveform`). The single biggest visual unlock.
- `[CF-2]` **Adopt `VirtualAssetGrid`** (Phase 3.2) — kills the 200-card cap + adds roving-key a11y.
- `[CF-3]` **Phase 4** (surface the Explorer on `previews/index.html`) + **Phase 5** (retire the Soul-Steel
  `asset-explorer.html`).
- `[CF-4]` **Minor taxonomy polish** — meshy `texture_0.png` → `texture`; add asset extensions to the TCL
  `EXT_GLYPH` so `extToGlyph` themes `png/glb/wav` (a small upstream TCL contribution).
- `[CF-5]` **Unbuilt TCL ideas** — `FacetBar`, `MetadataList` (as `<dl>`), `SegmentedControl` (as a
  `RadioGroup` variant), `BulkSelectionTray`.

## Verification evidence

| Gate | Method | Evidence |
|---|---|---|
| Corpus validity | `validate.mjs` | 15 entities, 0/0/0 |
| Registry correctness | scanner re-run + 3-way adversarial workflow | 769 records, 0 `unknown`, fidelity/taxonomy/constraints all PASS |
| App health | `pnpm typecheck` + `pnpm build` | clean; `model-viewer` code-split |
| Live behavior | preview QA (Explorer render, filter drill-in, inspector, MediaFrame frames) | screenshots; 0 console errors |
| TCL published | `npm view` | `@trembus/ui@0.4.0`, `@trembus/game-viz@0.2.0` (latest) |
| Synced | `git push` | `origin/main` at `d28dc36`, tree clean |
</content>
