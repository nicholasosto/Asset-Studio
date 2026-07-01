---
title: "Migrate Asset Explorer into the Command Center"
status: active
updated: 2026-07-01
---

# Migrate Asset Explorer into the Command Center

> **Status:** active (2026-07-01)

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

The structured plan the Command Center renders as a Timeline. Phases 0–3 are complete (data + view);
Phase 4 — surfacing it — is next.

```json
[
  { "id": "p0", "label": "Audit & taxonomy decision", "status": "done", "detail": "Explorer audited and the target taxonomy chosen — Medium ▸ MediumType adopted, the Soul-Steel domain axis dropped (ADR 0002)." },
  { "id": "p1", "label": "Asset-registry contract", "status": "done", "detail": "tools/build-asset-registry.mjs (zero-dep) scans external-locations/assets → previews/dashboards/asset-registry.json: 769 records, every existing metadata field preserved." },
  { "id": "p2", "label": "Taxonomy refactor", "status": "done", "detail": "Deterministic medium/mediumType derivation in the scanner (leans on the TGL filename grammar); domain kept as a tag only; 0 unknown. Confirmed by a 3-way adversarial verify." },
  { "id": "p3", "label": "Explorer view in the app", "status": "done", "detail": "AssetExplorer.tsx + registry.ts in apps/command-center: summary stats + donut, medium/mediumType/status/ext/search filters, grouped card grid, detail inspector. Built on @trembus/ui; typecheck + build clean; adversarially verified." },
  { "id": "p4", "label": "Wire it Live", "status": "planned", "detail": "Add the Explorer to previews/index.html and flip its card Soon → Live, alongside the Hub lens." },
  { "id": "p5", "label": "Retire the source artifact", "status": "planned", "detail": "Cross-link from Soul-Steel and deprecate the standalone asset-explorer.html once parity is verified." }
]
```

## Open questions

- **Taxonomy derivation.** The exact rule set mapping `kind` + `ext` + `area` + filename → `mediumType`
  (e.g. an `image` under `area:textures` → `texture`; a `.mp3` tagged `-ambient`/`-impact` → `audio-sfx`
  vs `-cast`/voice → `audio-voice`). Deterministic and reviewable — the heart of Phase 2.
- **What happens to `domain`?** Drop entirely, or demote to an *optional freeform tag* (off by default, no
  longer a folder) so nothing is lost.
- **Scan scope.** The whole shared `Assets/` library, or a declared subtree? What's excluded (code, data,
  docs)?
- **Thumbnails.** Reuse the existing hashed `asset-explorer-thumbs/`, or regenerate into an
  Asset-Studio-owned cache.
- **Status vocab.** Current stamps are `BLK · FNL · ALPHA`. Map to an Asset-Studio asset-status
  vocabulary, or keep as-is.
</content>
</invoke>
