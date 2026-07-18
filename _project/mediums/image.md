---
title: "Image"
status: experimental
updated: 2026-07-18
links:
  - { rel: references, target: workflows/image-generation }
  - { rel: references, target: decisions/0010-templates-split-by-authorship-exemplars-get-a-library-templa }
tags: { mediumType: image, tool: openai, pattern: symlink }
---

# Image

> **Status:** experimental (2026-06-30)

## Purpose

The studio's 2D raster capability — UI icons, sprites, portraits, and tileable textures produced via
AI generation and finalized into the shared library. Process: [[image-generation]].

## Standard

PNG (raster). Kebab-case descriptor + `_BLK` → `_FNL` status suffix; sized to the target slot (icon,
sprite sheet, tileable texture). Transparency where the slot requires it.

## Tooling

OpenAI image generation + Figma (the `figma` MCP). Finalize / slice locally.

## Output convention

Generated via the Codex batch contract into `generation/staging/` (unattended MCP drops use library
`_inbox/images/`); finalized per the brief's target slot — `ui/<group>/`, `textures/<group>/`, or a
bound by-reference destination. **Pattern A** (symlink, zero-upload) per
[[0001-reference-the-shared-asset-library-via-external-locations]].

## Quality bar

Correct dimensions for the slot; clean alpha where required; registered + passing `validate_asset_ids.py`.

## Template registry

The authoritative index of composition-ref templates (ADR 0010: authored masters live in Asset-Studio
`templates/`; generated exemplars live in the library `Assets/templates/` zone; a template that isn't
listed here is buried).

| Template | Home | Bound by |
|---|---|---|
| Character stage masters ×5 (concept · portrait · turnaround · detail-callouts · pose-sheet) | `templates/character/*.svg` (+ `png/` twins) | [[character-creation]] stages 1–5 |
| Domain-themed turnarounds ×5 (blood · decay · fateless · robot · spirit; `shared` missing) | library `templates/turnaround-themes/` | [[character-creation]] modelsheet — optional domain-skinned alternates |
| Character promo key-art layout | library `templates/key-art/character-promo-boxing-theme.png` | unbound — no workflow produces promo art yet |
| Graphite-cyan UI style kit ×3 (9-slice panel · seamless tile · 2×2 state atlas) | library `templates/ui-style/graphite-cyan/` | [[roblox-textured-ui-ux]] write-art-contract — standing specimen kit (produced by the `roblox-textured-ui-reference-kit` run) |

Production copies of the graphite-cyan kit exist as consumables (owner call, 2026-07-18):
`ui/frames/panel-graphite-cyan_BLK.png` · `ui/backgrounds/tile-graphite-cyan_BLK.png` ·
`ui/sprites/atlas-graphite-cyan-states_BLK.png`. The copies are free to iterate/promote
independently; the template set stays frozen reference.
