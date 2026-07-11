---
title: "Workflows compose by call and handoff"
status: accepted
updated: 2026-07-11
---

# Workflows compose by call and handoff

> **Status:** accepted (2026-07-11)

## Context

The character factory made composition real before the model had a word for it:
[[character-creation]] is a workflow whose steps run other workflows — five visual stages each run
[[image-generation]], the optional audio identity runs [[audio-production]], and the 3D handoff
seeds a [[3d-asset]] pipeline. That composition lived in prose and one inconsistent step ref: the
graph couldn't distinguish *composes* from *mentions*, four of six call-sites were invisible to
the emitted contract, and no rule said how deep nesting may go. Meanwhile the rel vocabulary is
fixed by the vendored schema (eight values; `.project-system/` is never edited in place), so any
first-class "runs" edge is an upstream Project-System change, not a project one.

## Decision

Workflows compose by exactly two verbs, and composites stay one level deep.

- **Two species, derivable — no new kind.** A *leaf* workflow is one medium's production loop
  (image-generation · audio-production · 3d-asset · lore-creation). A *composite* orchestrates
  leaves (character-creation). Species is derived from the steps, never declared.
- **Call** — a step that runs another workflow *inside* the composite's own pipeline; the sub-run
  is tracked as `stepOutcomes` on the composite's runs. (The roguex-33 audio retro-credit is the
  existence proof.)
- **Handoff** — a terminal step that *seeds a new pipeline* on the target workflow; tracking
  transfers to that pipeline, and the composite's exit criterion is "the seeded pipeline exists."
- **Depth 1.** Composites call only leaves. Orchestration larger than one composite (rosters,
  factions) is expressed as handoffs — one pipeline per member — never deeper call nesting.
- **Call-sites carry step refs, rel `references`.** Every call/handoff step carries
  `refs: [{ rel: references, target: workflows/<callee> }]`, and the composite's frontmatter
  `links` list all callees. A workflow-kind target on a workflow step *is* the composition edge —
  no new rel is minted while the vocabulary is upstream-owned.
- **Calls are parameterized.** A call binds at least: the composition ref (template), the filename
  grammar, and the destination. Leaves declare the parameter point in the brief ("target slot");
  the binding lives on the call-step's detail/note. A composite overriding a leaf's default
  placement (character sheets → lore-brain `Media/visual/`, not the library) is legal and stated,
  never silent.
- **Medium ↔ leaf pairing.** Each medium has exactly one leaf workflow, and the leaf carries
  `links: [{ rel: references, target: mediums/<medium> }]`. [[lore-creation]] completes the 4×4.

## Consequences

- **Easier:** the Command Center derives call edges from data already in the contract (step-ref
  drill-down into the callee's swimlane already works end-to-end); run accounting has a clean
  boundary (a leaf's own runs = its direct pipelines; composite invocations = stepOutcomes);
  roster-scale work needs no new machinery (handoffs); the graph separates composes-from-mentions
  with zero schema changes.
- **Harder:** leaf run-counts undercount total invocations (composite calls don't appear as leaf
  runs — by design); depth-1 forbids composite-calls-composite even where it might read naturally
  (use a handoff); call vs handoff is a convention enforced by review, not by the validator.

## Options considered

- **Mint first-class rels (`runs`, `seeds`) now** — rejected for now: the rel enum lives in the
  vendored schema, so this is an upstream change + re-vendor. The derived convention loses nothing
  today and converts mechanically if the rels land upstream.
- **A `composite-workflow` kind** — rejected: species is derivable from the steps; a new kind adds
  ontology without information.
- **Inline-expanding the child board inside the parent swimlane** — rejected: parent and child
  lane sets don't overlap, runs are tracked at the parent grain, and nesting explodes the board.
  Drill-down (the BPMN call-activity idiom) instead.
- **Status quo (prose-only composition)** — rejected: invisible to the graph and the step drawer;
  four of six call-sites weren't navigable.

## Cites

- `_project/workflows/character-creation.md` (the composite: call-sites + the 3D handoff)
- `_project/pipeline/roguex-33-character.md` (stepOutcome tracking, incl. the audio retro-credit)
- `_project/workflows/lore-creation.md` (the fourth leaf, closing the medium pairing)
- [[0001-reference-the-shared-asset-library-via-external-locations]] (the by-reference treaty the
  parameterized destination honors)
- BPMN call activity / subprocess marker (the drill-down idiom the Command Center mirrors)

## Re-open if

Composition genuinely needs depth >1; or upstream Project-System adds first-class composition rels
(`runs`/`seeds`) or a native call-step field to the swimlane schema — migrate the derived
convention onto them.
