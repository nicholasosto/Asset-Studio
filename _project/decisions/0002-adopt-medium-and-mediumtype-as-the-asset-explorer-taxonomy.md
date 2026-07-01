---
title: "Adopt medium and mediumType as the Asset Explorer taxonomy"
status: accepted
updated: 2026-07-01
links:
  - { rel: references, target: roadmap/migrate-asset-explorer-into-the-command-center }
---

# Adopt medium and mediumType as the Asset Explorer taxonomy

> **Status:** accepted (2026-07-01)

## Context

The Asset Explorer being migrated in [[migrate-asset-explorer-into-the-command-center]] arrives with two
category axes that don't belong in a game-agnostic studio: `domain` (`blood · robotic · fateless · decay ·
spirit · hub · shared`) is Soul-Steel lore, and `area` (`ui · scripts · textures · concept-art · source ·
3D-asset-art · audio · library · ai-output`) conflates real media with code. We need one browse axis that
is game-agnostic and, ideally, already ours.

It is: `project-system.config.json` already declares a `medium` catalog (image · audio · 3d) and a
`mediumType` tag vocabulary (`image · texture · ui · audio-music · audio-sfx · audio-voice · 3d-model ·
3d-rig · animation`). Reusing it means the planning layer and the asset browser speak one language.

## Decision

Adopt **`Medium ▸ MediumType`** as the Explorer's primary two-level browse axis, derived deterministically
from each record's existing `kind` + `ext` + `area` + filename signals:

- **Image** → `image` (concept/illustration) · `texture` (`area:textures`) · `ui` (`area:ui`)
- **Audio** → `audio-music` · `audio-sfx` · `audio-voice` (by filename hints; `audio-sfx` as fallback)
- **3D** → `3d-model` · `3d-rig` · `animation`

Supporting rules:
- **`domain` is dropped as structure**, retained only as an optional hidden tag so no data is lost.
- **Non-asset kinds** (`data · doc · source · script`) collapse into a hidden "Source & Docs" bucket — this
  is an *asset* explorer.
- **Secondary facets are filters, not folders:** `status` (BLK/FNL/ALPHA) · `ext` · recency (`mtime`) · size.
- **Every raw per-file metadata field is preserved.** The refactor *adds* derived `medium`/`mediumType`;
  it removes nothing the owner set.

## Consequences

- **Easier:** one taxonomy across `_project/` mediums and the asset browser; the Explorer becomes portable
  to any project that adopts Asset-Studio, with no game coupling.
- **Easier:** categories map straight onto the existing `medium` entities, so counts/filters can cross-link
  to the capability catalog later.
- **Harder:** the derivation is now the core work of Phase 2 — it needs a reviewable, deterministic rule set.
  Audio (`music`/`sfx`/`voice`) has no clean signal today and will lean on filename heuristics + an
  `audio-sfx` fallback; ambiguous records need an override path (manual `mediumType` on the record).
- Records that resist classification land in an explicit `unknown` bucket rather than being silently dropped.

## Options considered

- **Flat by media type (`kind` only)** — Image · Texture · UI · Audio · 3D as one level. Simpler, but throws
  away the `mediumType` sub-tiers the config already defines.
- **Cleaned `area` axis** — keep `area`, strip the code buckets. Least re-derivation, but keeps a
  folder-shaped axis instead of a real medium taxonomy, and stays coupled to how files happen to be filed.
- **Keep `domain`** — rejected outright: it is game-specific and the explicit reason for the migration.

## Cites

- [[migrate-asset-explorer-into-the-command-center]] — the milestone this serves
- [[2026-07-01-audit-asset-explorer-and-design-the-asset-registry-contract]] — the audit + taxonomy census
- [[0001-reference-the-shared-asset-library-via-external-locations]] — assets are referenced, never duplicated
- `project-system.config.json` — the `medium` catalog + `mediumType` tag registry this adopts

## Re-open if

The `mediumType` vocabulary proves too coarse or too fine for real browsing, or a second Explorer consumer
needs a different primary axis (at which point medium becomes one facet among several).
</content>
