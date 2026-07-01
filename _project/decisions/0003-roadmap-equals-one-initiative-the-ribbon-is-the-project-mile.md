---
title: "Roadmap equals one initiative; the ribbon is the project milestone index"
status: accepted
updated: 2026-07-01
links:
  - { rel: references, target: roadmap/migrate-asset-explorer-into-the-command-center }
---

# Roadmap equals one initiative; the ribbon is the project milestone index

> **Status:** accepted (2026-07-01)

## Context

The word "roadmap" was carrying three meanings at once and getting muddy: the **Roadmap panel** (a view
in the Command Center), the **`roadmap` kind** (a `_project/roadmap/*.md` entity), and **"the Roadmap"**
(the project's forward plan — the milestone-progress ribbon). Adding the first roadmap entity
([[migrate-asset-explorer-into-the-command-center]]) and discovering the panel's three zones (ribbon ·
per-entity Timeline · planning-artifacts table) forced the question: what altitude is a roadmap entity,
and which sense is "the Roadmap"?

## Decision

**A `roadmap` entity is one initiative** — milestone-sized, spanning multiple sessions with at least one
real fork. Its `## Phases` fenced-JSON block is its Timeline. **"The Roadmap" is the curated milestone
index**, authored by hand in `project-system.config.json → render.ribbon`.

- Two honest altitudes: the **ribbon** answers "where's the project?"; each roadmap's **Timeline** answers
  "where's this initiative?"
- Ribbon status maps to progress: roadmap `complete → shipped` · `active → current` · `proposed → planned`.
- A ribbon entry usually maps to a roadmap entity, but a small shipped milestone can be ribbon-only (the
  previews site is exactly that — a ribbon beat backed by just a session, no roadmap).
- Everything hangs off its roadmap: sessions `reference` it, decisions are `decided-in`, a `report` closes
  it out. Create a roadmap only when the depth warrants it; a single focused push stays a `session`.

## Consequences

- **Easier:** each initiative is self-contained with its own phase Timeline; the model scales as
  initiatives accrue; it fits the framework's grain (entities carry phases, the ribbon is the exec layer).
- **Harder:** the ribbon is hand-maintained. The vendored framework in `.project-system/` is read-only, so
  `render.ribbon` cannot be auto-derived from roadmap entities — someone must update it when a milestone
  starts or ships. Mitigated by keeping the ribbon deliberately small.
- Two homes touch "the plan" (config ribbon + roadmap entities); kept coherent by the status mapping above.

## Options considered

- **Roadmap = the single project plan** — one roadmap entity for all of Asset-Studio, milestones as its
  phases. Rejected: a multi-phase initiative (the Explorer migration has 6 phases) would collapse to a
  single line; no per-initiative Timeline.
- **Two-tier (spine + initiatives)** — one project spine roadmap driving the ribbon, plus an initiative
  roadmap per milestone. Rejected for now: richest structure but the most to keep in sync; revisit if the
  project outgrows a flat list of initiatives.

## Cites

- [[migrate-asset-explorer-into-the-command-center]] — the first roadmap entity, which surfaced the question
- [[0002-adopt-medium-and-mediumtype-as-the-asset-explorer-taxonomy]] — the sibling model decision
- `project-system.config.json → render.ribbon` — where "the Roadmap" is authored
- `apps/command-center/src/App.tsx` (`RoadmapBoard`) — the panel that renders ribbon + Timeline + artifacts

## Re-open if

The project accrues enough initiatives that a project-level spine above them becomes necessary (adopt the
two-tier model), or the framework gains ribbon-derivation from entities (revisit the hand-maintenance).
</content>
