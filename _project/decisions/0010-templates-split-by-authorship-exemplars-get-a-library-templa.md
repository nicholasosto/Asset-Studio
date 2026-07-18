---
title: "Templates split by authorship - exemplars get a library templates zone"
status: accepted
updated: 2026-07-18
links:
  - { rel: references, target: decisions/0001-reference-the-shared-asset-library-via-external-locations }
  - { rel: references, target: decisions/0008-restructure-the-shared-assets-library-into-staging-library-r }
  - { rel: references, target: mediums/image }
---

# Templates split by authorship - exemplars get a library templates zone

> **Status:** accepted (2026-07-18)

## Context

The 2026-07-18 template/workflow coverage review found template-grade images in four locations, three
of them accidental: the healthy `templates/character/` set (Asset-Studio, cited by character-creation),
six unregistered themed comp-refs buried in `Assets/concept-art/templates/`, the graphite-cyan UI
reference kit split across `ui/frames`·`ui/backgrounds`·`ui/sprites` (one set filed by consumption
format), and spec boards in `_resort/` triage limbo. Only character-creation cites its templates;
everything else is discoverable by folklore only. Two structural facts force the shape of the fix:
the shared Assets library is **not git-versioned** (authored SVG masters need version history), and
[[0001-reference-the-shared-asset-library-via-external-locations]] keeps heavy generated art out of
this repo.

## Decision

A template's home follows its **authorship**, not its usage:

1. **Authored structural masters** (SVG layout/geometry/guides, edited over time) are process
   artifacts → Asset-Studio `templates/<class>/` with `png/` twins (the established
   character-creation pattern; git-versioned).
2. **Generated exemplars** (themed comp-refs, style kits, spec boards — finished PNGs produced by the
   workflows they later guide) are creative assets → a new **top-level library zone
   `Assets/templates/<set>/`** (kebab names; no status suffix required — pre-production reference
   material, like `source/`).
3. **A template set is one folder.** Set pieces are never filed by consumption format (the
   graphite-cyan lesson).
4. **Registration is mandatory.** `mediums/image` § Template registry is the authoritative index;
   a workflow that binds a template cites its exact path in the relevant step note or prose.

Moves are **name-stable** and recorded in `Assets/_catalog/templates-migration-2026-07-18.csv`;
historical run records keep old paths by design (the
[[0008-restructure-the-shared-assets-library-into-staging-library-r]] precedent).

## Consequences

Easier: one-click discovery (the new zone auto-classifies as `image` in the asset registry — zero
builder changes — and surfaces as a `templates` branch in the Explorer FolderTree); workflows can bind
domain-skinned alternates; sets stay whole; the missing pieces of a set become visible (no
`shared`-domain turnaround exists yet).

Harder: two homes to remember — mitigated by this rule being one sentence, a `templates/README.md`
index on the studio side, and the registry section. The graphite-cyan kit's Studio test paths change
(`rbxasset://trembus/templates/ui-style/graphite-cyan/…` now); no live code referenced the old paths
(grepped 2026-07-18 — only the `roblox-textured-ui-reference-kit` pipeline run record, which keeps
its historical paths).

## Options considered

- **Everything in Asset-Studio `templates/`** — rejected: 12 MB+ of generated PNG in the repo that
  decision 0001 deliberately keeps asset-free, growing with every themed set; the Explorer stops
  indexing them.
- **Everything in the library** — rejected: no git for authored SVG masters; process artifacts drift
  from the workflows that define them; the SVG→png-twin convention loses its versioned master.
- **Status quo** — rejected: four locations, one cited; the coverage review's "buried" finding is the
  cost, restated.

## Cites

- Coverage review artifact (2026-07-18): https://claude.ai/code/artifact/106c8534-186e-4a96-b7f2-2bf9b4ca3f4b
- Decision brief artifact (2026-07-18): https://claude.ai/code/artifact/23d316bc-895c-4745-b24d-efabfaa01648
- Move manifest: `Assets/_catalog/templates-migration-2026-07-18.csv`

## Re-open if

A template needs runtime consumption at a stable shipped path (would argue for a `runtime/` home), the
shared library gains version control, or per-project template forks appear (would argue for
`ui/<project>/`-style scoping inside the zone).
