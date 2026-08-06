---
title: "Lore system research — what a full-fledged lore system contains"
status: active
updated: 2026-07-26
tags: { last-active: 2026-07-26T07:02, kos: "memory, mediums, decisions" }
---

# Lore system research — what a full-fledged lore system contains

> **Status:** active (2026-07-26)

## Goal

Establish what a *full-fledged* lore system contains at Warhammer scale — the structural
components, not the content — then audit what the two local brains (`lore-brain`,
`artificial-brain`) actually hold against that model, and name the gap.

## Success Criteria

- A written component model of a mature lore system (the layers/axes a Warhammer-tier setting
  carries), stated as structure so it can be checked against any graph.
- A factual inventory of what `lore-brain` and `artificial-brain` currently contain — realities,
  note counts, subtypes, canon status — read from the vaults, not assumed.
- The two mapped against each other: which components the brains already cover, which are absent,
  and which exist but are thin.
- A recorded verdict on the smallest next move (author, restructure, or documentation-only).

## Source References

- `lore-brain` plugin — `/lore-brain:recall`, `/lore-brain:health`, `reality` protocol
- `artificial-brain` plugin — `/artificial-brain:brain-recall`, `brain-health`
- `_project/mediums/lore.md` — the studio-side lore medium card (brain/v1.1 contract, three
  deliverable classes, three declared realities)
- `_project/workflows/lore-creation.md` — the fourth leaf (brief → recall → author → canon → link)
- `_project/roadmap/character-factory-lore-medium.md` — lore as first-class upstream medium

## Decisions

- **A full lore system = 12 content layers + 4 meta-layers.** Content: cosmology · chronology ·
  geography · factions · personae · bestiary · power-system-with-cost · material culture ·
  language/onomastics · religion & doctrine · economy & logistics · military doctrine. Meta:
  in-world epistemology (sources written by fallible in-world authors) · canon tiers & retcon
  policy · aesthetic bible · generativity (deliberate blanks downstream creators may fill). The
  meta-layers are what separate a *big setting* from a *lore system* — Warhammer's durability comes
  from them, not from volume.
- **The brains are split correctly and have drifted.** `lore-brain` holds instances (154 notes),
  `artificial-brain` holds the system design (514 notes, incl. `Lore Factory`,
  `Narrative Timeline System`, `Vault-Driven Creative Process`). The Soul Steel cortex exists in
  both and cross-references cleanly — lore-brain = what is true in-world, artificial-brain = how
  it is built and sold. But designs authored in artificial-brain were never grown in lore-brain.
- **The lore graph is spatially and thematically rich, temporally flat.** `domain_alignment` sits
  on 108/154 notes (70%) and `faction_alignment` on 64 (42%) — both are read back by the game's
  domain system. `era:` sits on **5/154 (3%)**, and only 4 epoch notes exist with no calendar or
  dated spine ordering them. Same law as the 2026-07-25 metadata session, in a different medium:
  **the axis nothing reads back drifts to near-zero.**
- **`canon_status` is already overloaded and visibly straining.** It is a two-value flag
  (canon 116 / speculative 36), and two notes carry inline YAML comments doing the work the schema
  cannot — "*NOT in canonical game-docs … awaiting canonization OR rename*". That is the retcon
  policy asking to exist.
- **The continuity-scar slot exists and is empty.** `Reflexes/` and `Traces/` are 0 in lore-brain
  while artificial-brain's `Reflexes/` holds 48 (its `Scar - …` corpus). Contradictions found
  during authoring have nowhere to land, so `lore-creation`'s continuity gate has no memory.
- **Verdict: documentation + one schema move, not an authoring push.** The graph does not need
  more entities; it needs the chronology axis made real and readable. Smallest next move is the
  `era`/timeline spine, because it is the only gap that already has a design note waiting
  (`Narrative Timeline System`) and it unblocks the three meta-layers that depend on ordering.

## First-Principles Candidates

- The axis nothing reads back drifts to near-zero — proven twice now in two unrelated media:
  generation xattrs at 14% vs the upload ledger's 100%, and lore `era:` at 3% vs
  `domain_alignment`'s 70%. The predictor is not effort or importance, it is whether a consumer
  exists → memory (promote to a named law; it is no longer a one-off observation)
- A lore graph inventoried by *subtype counts* looks healthy while being structurally lopsided;
  inventory it by **layer coverage** instead and the holes appear immediately (22 personae and
  0 onomastics notes read very differently as "characters: strong" vs "language layer: absent")
  → memory (audit craft)
- Contradiction is a feature when the setting has in-world sources to attribute it to, and a bug
  when it does not. Warhammer keeps contradictions as texture because a fallible in-universe author
  owns each claim; a graph in authorial voice must instead resolve them → decision (if the
  epistemology layer is ever adopted)
- A two-value canon flag cannot express "designed here, awaiting canonization" — when authors start
  writing YAML comments beside an enum, the enum is the thing that needs changing → none yet
  (feeds the retcon-policy decision)

## Outputs

- The 12+4 layer model of a full lore system, and the coverage map of both brains against it
  (recorded in Decisions above; delivered in-session).
- Measured baseline for `lore-brain`: 154 notes · 146 Concepts / 3 Cortices / 2 Circuits /
  1 Dream / 0 Logs / 0 Reflexes / 0 Traces · realities soul-steel 137, tessera 13, cross-reality 1,
  claude-lab 1 (declared, content-empty) · 13-value `engram_subtype` vocabulary · canon 116 /
  speculative 36 · 104 notes carrying `lore_source_ref` · 22 with `sensory_assets`.

## Blockers

- None.

## Next Action

Decide whether to execute the chronology spine — populate `era:` across the soul-steel corpus
against an ordered epoch list, per the `Narrative Timeline System` design already sitting in
artificial-brain — or record the layer model as a decision first and defer execution.

## Handoff Notes

- Coverage by layer, not by count. **Strong:** cosmology (10 cosmological-entity + an explicit
  Exoverse → Universe → Void/Creation → Epochs → Domains hierarchy), personae (22), bestiary (21),
  material culture (18 artifact), power-system-with-cost (13 ability + 6 domain + 9 class — the
  richest layer, because the game reads it back). **Moderate:** geography (14 region),
  factions (10), economy (present as theme — Soul Economy, Domain Currencies, Hollow Tithe — not as
  a modeled layer). **Weak/absent:** chronology (3% `era`), language & onomastics (0 notes — the
  individual names are excellent, the grammar producing them is unstated), military doctrine (0),
  religion (real but diffused into faction/persona notes, no subtype of its own).
- Meta-layers: in-world epistemology is **thin but pre-loaded** — the notes are in authorial voice,
  yet Ashael and the Custodian of the Ledger already exist as narrator personae with cast voice IDs
  ([[soul-steel-narrator-voices]]). The raw material for attributed in-world sources is built and
  unused. Aesthetic bible is thin: ~20 images in `Media/visual` and 22 notes with `sensory_assets`,
  but only 2 notes state a visual identity rule. Generativity is the weakest: 2 Circuits, 1 Dream.
- artificial-brain is the design shelf for all of this: `Lore Factory` (Core + Projection —
  medium-agnostic lore entities, thin per-medium bindings), `Narrative Timeline System` (the
  chronology layer, with schema and Gantt visualization), `Vault-Driven Creative Process`
  (gap-detection-as-creativity — the generativity engine). None of the three has been executed
  against the lore graph.
- `claude-lab` is a registered reality with a placeholder cortex and zero entities since
  2026-05-01. Either seed it or retire it; a declared-but-empty reality inflates the reality count
  without adding a setting.
