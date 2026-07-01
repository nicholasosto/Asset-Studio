---
title: "Build the Asset Explorer view"
status: completed
updated: 2026-07-01
links:
  - { rel: references, target: roadmap/migrate-asset-explorer-into-the-command-center }
---

# Build the Asset Explorer view

> **Status:** completed (2026-07-01)

## Goal

Phase 3 of [[migrate-asset-explorer-into-the-command-center]] — turn `asset-registry.json` into a
browsable Explorer *view* inside the Command Center, on the Trembus component library.

## Success Criteria

- A new **Explorer** tab renders the 500 real assets, browsable by `medium ▸ mediumType`.
- Filters (medium · mediumType · status · ext · search) + a show-source toggle (off by default).
- A detail inspector surfaces every metadata field.
- `pnpm typecheck` + `pnpm build` clean; no console errors in the live app.

## Source References

- `apps/command-center/src/registry.ts` — typed reader of `previews/dashboards/asset-registry.json`
- `apps/command-center/src/AssetExplorer.tsx` — the panel component
- `apps/command-center/src/App.tsx` — nav union + `deriveNav` + `renderPanel` wiring
- `@trembus/ui` — Stat · Meter · DonutChart · Card · Badge · Input · Select · Switch · Dialog · EmptyState · DataStatusBar

## Decisions

- **Built as a native Command Center tab**, not a standalone artifact — the payoff of
  [[0002-adopt-medium-and-mediumtype-as-the-asset-explorer-taxonomy]] and the "view a contract" pattern.
- **`source` bucket (medium=null, 269 files) hidden by default** — the default view is the ~500 real assets.
- **Metadata cards for v1** (medium-tinted placeholder frame + a glyph); real thumbnails slot in later.
- **Modal `Dialog` inspector** (full metadata dump) rather than the relationship-oriented detail drawer.

## Outputs

- `AssetExplorer.tsx` (~23 KB) + `registry.ts` — the Explorer, on 18 real `@trembus/ui` components.
- App wiring: `panel` union + Explorer nav entry (after Roadmap) + `renderPanel` dispatch; scoped
  `.cc-explorer*` styles.
- Built + verified via a 4-phase workflow (study → design → build → verify); both adversarial passes
  (build-clean · integration+data-correct) green. Live QA: drill-in, filter chips, grouping, and the
  inspector all confirmed; summary stat-row layout polished to a compact 4-up grid.

## Blockers

- none

## Next Action

Phase 4 — surface the Explorer beyond the app tab (an entry on the `previews/index.html` landing shell),
then Phase 5 — retire the standalone Soul-Steel `asset-explorer.html` once parity is confirmed.

## Handoff Notes

- Thumbnails, image dimensions, and the registry `reg` join are still deferred (see the prior session's
  handoff); the inspector already has present-safe rows for them, so they light up automatically when the
  enrichment pass lands.
- The Explorer reads the committed `asset-registry.json`; after re-running
  `node tools/build-asset-registry.mjs`, the view refreshes on reload (Vite imports the JSON).
- Meshy `texture_0.png` exports still classify as `image` not `texture` — the one known minor
  mis-derivation, logged as Phase-2 polish.
</content>
