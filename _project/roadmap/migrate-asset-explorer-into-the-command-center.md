---
title: "Migrate Asset Explorer into the Command Center"
status: complete
updated: 2026-07-11
links:
  - { rel: references, target: decisions/0007-keep-explorer-previews-dev-local-stop-committing-the-thumbna }
  - { rel: references, target: decisions/0008-restructure-the-shared-assets-library-into-staging-library-r }
---

# Migrate Asset Explorer into the Command Center

> **Status:** complete (2026-07-11)

## Context

The **Asset Explorer** is a browser we like and want to keep — but it lives in another space and is wired
to Soul-Steel. Today it is a single 349 KB hand-built HTML file at
`Roblox-Development/Soul-Steel-Official/previews/dashboards/asset-explorer.html`: a file-registry gallery
over ~700 files, with hashed thumbnails in a sibling `asset-explorer-thumbs/` folder and per-file metadata
inlined as JSON (`p, area, dir, base, stem, ext, kind, size, mtime, domain, tgl, status`).

Three things make it a poor fit as-is, and this milestone fixes all three:

1. **It carries Soul-Steel lore as structure.** The `domain` axis
   (`robotic · fateless · blood · decay · spirit · hub · shared`) is game-specific folder organization.
   Asset-Studio is game-agnostic; this axis has to go.
2. **It is bespoke HTML, not the design system.** The Command Center is a Vite/React app that already
   depends on `@trembus/ui` and `@trembus/viz`. The Explorer should be a *view* in that app, rendered with
   the Trembus Component Library — not a separate hand-styled artifact.
3. **Its categories are messy.** The `area` axis conflates real media (textures, audio, concept-art, 3d)
   with code (scripts, source, library, ai-output). Asset-Studio already declares a clean, game-agnostic
   taxonomy in `project-system.config.json` — the `medium` catalog and the `mediumType` tag vocabulary
   (`image · texture · ui · audio-music · audio-sfx · audio-voice · 3d-model · 3d-rig · animation`). The
   migrated Explorer should browse by *that*.

Owner constraint: **keep the existing per-file metadata we set** — re-categorize, don't discard. And per
[[0001-reference-the-shared-asset-library-via-external-locations]], the Explorer reads the shared library
through `external-locations/`; it never duplicates it. Current-state established in
[[2026-07-01-audit-asset-explorer-and-design-the-asset-registry-contract]].

## Phases

The structured plan the Command Center renders as a Timeline. Phases 0–4 are complete (data + view +
surfaced live); **CF-1 preview parity — the Phase-5 blocker — is now resolved** (2026-07-01: real
image/audio/3D previews + reveal + copy landed and verified live on dev + static). Phase 5 — retiring the
Soul-Steel source — is **archived** (2026-07-11): a cross-repo change deliberately not pursued from here. The migrated Explorer fully replaces the source view, so this milestone is **complete**.

```json
[
  { "id": "p0", "label": "Audit & taxonomy decision", "status": "done", "detail": "Explorer audited and the target taxonomy chosen — Medium ▸ MediumType adopted, the Soul-Steel domain axis dropped (ADR 0002)." },
  { "id": "p1", "label": "Asset-registry contract", "status": "done", "detail": "tools/build-asset-registry.mjs (zero-dep) scans external-locations/assets → previews/dashboards/asset-registry.json: 598 records (was 769 pre-restructure — ADR 0008), every existing metadata field preserved." },
  { "id": "p2", "label": "Taxonomy refactor", "status": "done", "detail": "Deterministic medium/mediumType derivation in the scanner (leans on the TGL filename grammar); domain kept as a tag only; 0 unknown. Confirmed by a 3-way adversarial verify." },
  { "id": "p3", "label": "Explorer view in the app", "status": "done", "detail": "AssetExplorer.tsx + registry.ts in apps/command-center: summary stats + donut, medium/mediumType/status/ext/search filters, grouped card grid, detail inspector. Built on @trembus/ui; typecheck + build clean; adversarially verified." },
  { "id": "p4", "label": "Wire it Live", "status": "done", "detail": "The Command Center now builds as a self-contained SPA into previews/app/ (relative base; all contracts inlined); previews/index.html reworked to five Live lens cards incl. a deep-linked Asset Explorer (app/#explorer); the orphaned static command-center.html retired. Verified served from the :4317 static site." },
  { "id": "cf1", "label": "Preview parity (CF-1)", "status": "done", "detail": "Real previews landed: builder bakes 320px thumbs (sips → previews/thumbs, now untracked/dev-local — ADR 0007) + a served /_assets src; a Vite dev middleware + committed previews/_assets symlink serve /_assets & /thumbs identically on :5175 dev and :4317 static; MediaFrame shows image thumbs (tile) + full image + glb/gltf turntable, AudioWaveform plays audio in the inspector; reveal-in-Finder (POST /api/reveal, Assets-root guarded) with copy-abs fallback + copy-path/copy-id. ADRs 0004–0007. Verified live on dev + static, 0 console errors." },
  { "id": "p5", "label": "Retire the source artifact", "status": "skipped", "detail": "ARCHIVED (2026-07-11) — the migrated Explorer fully replaces the Soul-Steel asset-explorer.html, so this milestone's goal is met. Deprecating the *source* generator (tools/build-asset-explorer.mjs) is a cross-repo change deliberately not pursued from Asset-Studio; parked. If ever revisited, the deprecation banner goes in that generator." }
]
```

## Open questions

All five original questions are settled — kept with their resolutions so the trail stays legible:

- **Taxonomy derivation** — resolved (p2, ADR 0002): a deterministic first-match-wins cascade in
  `tools/build-asset-registry.mjs` (`deriveMedium`/`deriveMediumType`) — TGL category first, then
  folder area, then filename tokens; 0 `unknown` on the current corpus.
- **What happens to `domain`?** — resolved (ADR 0002): demoted to a display-only tag, never a
  grouping axis; still emitted per record.
- **Scan scope** — resolved (p1 + ADR 0002): the whole shared library is scanned; non-asset kinds
  (data · doc · script · source) emit `medium: null` and hide behind the Explorer's
  "show source" toggle.
- **Thumbnails** — resolved (ADR 0005, CF-1; later ADR 0007): regenerated into the Asset-Studio-owned
  `previews/thumbs/` (`sips`, 320px, path-hash names, always-rebake), now untracked/dev-local (ADR 0007);
  the Soul-Steel `asset-explorer-thumbs/` cache is not reused.
- **Status vocab** — resolved implicitly (ADR 0002 keeps it as a filter facet): `BLK · ALPHA ·
  BETA · FNL` unchanged; no Asset-Studio re-mapping.
</content>
</invoke>
