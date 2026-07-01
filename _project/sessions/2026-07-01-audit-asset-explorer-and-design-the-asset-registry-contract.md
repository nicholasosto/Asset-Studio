---
title: "Audit Asset Explorer and design the asset-registry contract"
status: completed
updated: 2026-07-01
links:
  - { rel: references, target: roadmap/migrate-asset-explorer-into-the-command-center }
  - { rel: decided-in, target: decisions/0002-adopt-medium-and-mediumtype-as-the-asset-explorer-taxonomy }
---

# Audit Asset Explorer and design the asset-registry contract

> **Status:** completed (2026-07-01)

## Goal

Establish the real current-state of the Soul-Steel Asset Explorer and agree the target category system, so
[[migrate-asset-explorer-into-the-command-center]] can plan on evidence rather than guesses.

## Success Criteria

- The existing data model + taxonomy axes are documented (done below).
- A proposed game-agnostic taxonomy is on the table for owner sign-off.
- The roadmap's phases and open questions reflect the audit.

## Source References

- `Roblox-Development/Soul-Steel-Official/previews/dashboards/asset-explorer.html` — the artifact being migrated (349 KB single-file HTML, ~700 records)
- `…/asset-explorer-thumbs/` — 368 hashed thumbnails (`<hash>.png`, referenced by path, not base64)
- `Repositories/Trembus-Component-Library` — `@trembus/tokens · ui · viz · game-viz · icons` (React 19 · Vite · Storybook)
- `apps/command-center/package.json` — already depends on `@trembus/ui ^0.2.0` + `@trembus/viz ^0.3.0`
- `project-system.config.json` — the `medium` catalog + `mediumType` tag vocabulary we adopt as categories

## Decisions

- **Migrate as a *view* inside `apps/command-center`, not a standalone artifact** — the app is already
  Vite/React and already pulls the Trembus library.
- **The Explorer becomes contract-driven** — a scanner emits `asset-registry.json`; the view renders it.
  Mirrors the existing `render-hub.mjs` pattern.
- **Primary axis confirmed — `Medium ▸ MediumType`** (Asset-Studio's own config vocabulary), ratified in
  [[0002-adopt-medium-and-mediumtype-as-the-asset-explorer-taxonomy]].
- **`domain` (blood/robotic/…) dropped as structure**, retained only as an optional hidden tag so no data
  is lost — settled in the same ADR.

## Outputs

- Data-model audit — per-file record: `p, area, dir, base, stem, ext, kind, size, mtime, domain, tgl, status` + hashed thumbnail.
- Taxonomy census:
  - `kind`: image 366 · data 203 · model 77 · doc 59 · audio 58 · source/script/other 15 → **game-agnostic, keep**
  - `area`: ui 223 · scripts 186 · textures 77 · concept-art 72 · source 57 · 3D-asset-art 50 · audio 48 · library 41 · ai-output 13 · … → **messy, mixes media with code**
  - `domain`: robotic 30 · fateless 14 · shared 10 · blood 9 · decay 8 · spirit 6 · hub 1 → **Soul-Steel-specific, drop**
  - `status`: BLK 394 · FNL 3 · ALPHA 2
- Scaffolded [[migrate-asset-explorer-into-the-command-center]] (roadmap) + this session.
- **Phases 1–2 built** — `tools/build-asset-registry.mjs`, a zero-dep scanner emitting
  `previews/dashboards/asset-registry.json` (769 records). Preserves every existing field and adds derived
  `medium`/`mediumType` (leaning on the `CAT_SUB_name_STATUS` TGL grammar); `domain` kept as a tag, not a
  grouping axis; 0 `unknown`. Built + adversarially verified (3/3 checks pass) via a 4-phase workflow.
  Distribution: ui 220 · image 79 · 3d-model 73 · texture 63 · audio-sfx 33 · audio-voice 20 · 3d-rig 6 ·
  audio-music 6 · source/non-asset 269.

## Blockers

- none

## Next Action

Phase 3 — build the Explorer *view* in `apps/command-center`: a React gallery on `@trembus/ui` + `viz` +
`tokens` that reads `asset-registry.json`, browsing by `medium ▸ mediumType` with status/ext/recency
filters and a detail inspector. (Gets its own session when it starts.)

## Handoff Notes

- The Trembus library is a pnpm monorepo; the Command Center consumes published `@trembus/*` packages, so
  no workspace linking is needed to build the view.
- Thumbnails already exist as content-hashed PNGs — Phase 1 can reference them directly rather than
  regenerating, pending the "thumbnails" open question.
- Keep every raw metadata field on each record; the refactor *adds* a derived `medium`/`mediumType` and
  stops using `domain` for structure — it does not remove data.
- **Phase-2 polish (deferred, non-blocking):** the `reg` registry join matches 0 rows — a data reality (the
  `__master-asset-ids` CSV has empty `name` cells on its error rows), not a bug; meshy `texture_0.png`
  exports fall to `image` rather than `texture`; thumbnail generation + image dimensions are deferred to a
  later enrichment pass (the scanner reserves the content-hash `thumb` path but writes no PNGs yet).
- After these `_project/` edits, re-run `node .project-system/tools/render-hub.mjs` so the Command Center
  picks up the new roadmap + session.
</content>
