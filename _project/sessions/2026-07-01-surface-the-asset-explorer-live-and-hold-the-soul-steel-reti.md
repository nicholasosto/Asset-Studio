---
title: "Surface the Asset Explorer live and hold the Soul-Steel retire"
status: completed
updated: 2026-07-01
links:
  - { rel: references, target: roadmap/migrate-asset-explorer-into-the-command-center }
---

# Surface the Asset Explorer live and hold the Soul-Steel retire

> **Status:** completed (2026-07-01)

## Goal

Close [[migrate-asset-explorer-into-the-command-center]] Phase 4 — make the Explorer reachable from
the previews site as a first-class, Live lens — and resolve Phase 5 (retire the Soul-Steel source).

## Success Criteria

- The previews site serves the Command Center as a self-contained static bundle (no dev server).
- The Explorer is a Live, deep-linkable card on `previews/index.html` (not a stale "Soon").
- The orphaned static `asset-studio-command-center.html` is gone; docs no longer claim it.
- Verified live: `/app/#explorer` opens the Explorer tab, 0 console errors.

## Source References

- Roadmap: [[migrate-asset-explorer-into-the-command-center]] (Phases 4–5)
- Prior review: [[2026-07-01-session-review-explorer-migration-and-tcl-round-trip]] (carry-forwards CF-1/CF-3)
- App: `apps/command-center/vite.config.ts`, `src/App.tsx`; shell: `previews/index.html`

## Decisions

- **Build the SPA into `previews/app/`.** `vite build` with `base: './'` + `outDir: previews/app`
  emits a self-contained bundle (all three JSON contracts inlined) the :4317 static server serves —
  the "launchable previews site" goal, no dev server required. Retired the single-file static hub
  phenotype (already dead: `render-hub.mjs` emits JSON only).
- **Deep-link tabs by hash.** `App.tsx` seeds the active tab from `location.hash` (validated against
  the nav), so the shell can link `app/#explorer`, `app/#decisions`, etc.
- **Hold Phase 5 (retire the Soul-Steel `asset-explorer.html`) on CF-1 preview parity.** The source
  is *generated* (a banner must live in its generator) and still has working baked thumbnails +
  full-size image/audio previews the migrated Explorer renders as placeholders until asset URLs are
  served. No cross-repo change made. P5 → `parked`.

## Outputs

- `previews/app/` — the built Command Center SPA (self-contained; `model-viewer` code-split).
- Reworked `previews/index.html`: five Live lens cards (Command Center · Asset Explorer · Roadmap ·
  Decisions · Workflows), corrected stats (16/7/11/0) and build+serve footer.
- Vite config: `base: './'`, `outDir → previews/app`, `emptyOutDir`.
- `App.tsx`: hash-seeded initial tab.
- Deleted `previews/dashboards/asset-studio-command-center.html`; corrected `apps/command-center/README.md`.
- Roadmap: P4 → done, P5 → parked.

## Blockers

- **CF-1 (served asset URLs + pre-rendered posters)** blocks Phase 5. Until real previews reach
  parity with the Soul-Steel thumbnails, the old Explorer stays the richer browser and shouldn't be
  deprecated.

## Next Action

Land CF-1: decide how the shared `Assets/` library is served (static mount vs. copied posters), wire
`MediaFrame`/`AudioWaveform` to real URLs, then execute Phase 5 (cross-link + deprecate via the
Soul-Steel generator).

## Handoff Notes

- Rebuild the static site with `pnpm --dir apps/command-center build` (→ `previews/app/`); serve via
  `preview_start("previews-static")` → `http://localhost:4317/`. The dev server (`command-center`,
  :5175) is still the hot-reload path.
- `previews/index.html` stats are hand-authored — refresh them when the corpus count changes.
- CF-3 (`VirtualAssetGrid`) still open: kills the 200-card cap + adds roving-key a11y.
</content>
</invoke>
