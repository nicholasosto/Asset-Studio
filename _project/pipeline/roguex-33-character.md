---
title: "Roguex-33 character"
status: build
updated: 2026-07-18
links:
  - { rel: references, target: workflows/character-creation }
---

# Roguex-33 character

> **Status:** build (2026-07-09)

## Context

Pilot instance of the [[character-creation]] workflow. Roguex-33 is the lore-brain's most
fully-realized persona — canon engram, full voice/dialog section, Grid District stall lore, and
**two finished theme mixes** (`soul-steel-ghost-in-the-grid` v1 + 80s v2) — yet he has *zero*
visuals. The most lopsided asset gap in the brain, and the ideal pilot: the audio stage is
already done, which exercises the tracking model (retro-credited runs, optional lanes) on day one.

Lore source of truth: lore-brain `Concepts/Roguex-33.md` (soul-steel, cyber-gothic). Read:
*"a Han Solo archetype rendered in chrome and circuitry"* — smooth-talking Grid District broker,
constant vocoder patter, hidden lethality, one soft tell.

## Build plan

1. **Lore lock** — add explicit visual tells to the Roguex-33 engram (chrome/gunmetal palette
   against Grid District neon-noir; lean broker silhouette vs. the Collective's standardized
   units; stall-counter context; one signature detail worth a detail sheet — e.g. the vocoder
   grille or the ledger of the eleven).
2. **Visual ladder** — run stages 1–5 per the workflow, each an [[image-generation]] run with its
   `templates/character/` composition ref: concept → portrait → model sheet → detail passes
   (vocoder / stall counter) → poses (patter gestures + the quiet-moment threat pose).
3. **Audio identity** — ✅ already landed (two Ghost in the Grid mixes, lore-brain `Media/audio/`).
4. **File + link** — `Roguex-33_<stage>-v<N>.png` to lore-brain `Media/visual/`, `sensory_assets`
   refs on the engram.
5. **3D handoff** — seed a [[3d-asset]] run; he's the emotional anchor of the Steel City slice
   (Roguex Depot map) and will need a model eventually.

## Exit criteria

- All five visual deliverables filed under the grammar and linked on the engram.
- `set-review` passed: crops match templates; palette matches the engram; the Broker reads as
  the same being from concept to pose sheet.
- 3D handoff seeded (a 3d-asset pipeline exists referencing the turnaround as spec).

## Runs

```json
[
  {
    "id": "run-1",
    "label": "Retro-credit — audio identity landed before the workflow existed",
    "status": "partial",
    "startedAt": "2026-07-04",
    "trigger": "character-creation pilot kickoff",
    "note": "Ghost in the Grid v1 + 80s v2 predate this pipeline; credited to the audio-identity step. Visual ladder not started — lore-lock is the active step.",
    "stepOutcomes": [
      { "step": "lore-lock", "status": "active" },
      { "step": "audio-identity", "status": "done" }
    ],
    "outputs": [
      { "label": "soul-steel-ghost-in-the-grid-v1.mp3", "kind": "doc" },
      { "label": "soul-steel-ghost-in-the-grid-80s-v2.mp3", "kind": "doc" }
    ]
  },
  {
    "id": "run-2",
    "label": "Lore lock landed — Visual Identity on the engram",
    "status": "partial",
    "startedAt": "2026-07-06",
    "trigger": "lore medium quality bar, first exercise",
    "note": "Continuity pass across Grid District / Roguex Depot / Ghost in the Grid / Monkey-Bot, then a Visual Identity section canonized on the engram: gunmetal chrome + warm amber neon (never gold — that's the tithe's mark), merchant-first silhouette with the Monkey-Bot perch plate, mixed-run materials, and three tells (amber-flicker vocoder grille, authenticator loupe, eleven uncounted copper pins). Visual specs speculative until set-review promotes them. Concept stage is next.",
    "stepOutcomes": [
      { "step": "lore-lock", "status": "done" },
      { "step": "concept", "status": "active" }
    ],
    "outputs": [
      { "label": "Roguex-33 engram § Visual Identity (lore-brain)", "kind": "doc" }
    ]
  },
  {
    "id": "run-3",
    "label": "Concept review — two winners filed; face refinement deferred to portrait",
    "status": "partial",
    "startedAt": "2026-07-18",
    "trigger": "salvage review of the stalled 2026-07-04 concept batches (r1 + r2, 12 candidates)",
    "note": "The 07-04 batches were the exploration that fed the 07-06 lore-lock, then stalled unreviewed (their batch contract was overwritten 07-12). Reviewed 07-18 against the engram's Visual Identity: v2 lane (poncho/cape, skull-faces) cut per the mischief-never-menace call; winners r2_v3c1 (counter-lean stall scene — the amber-vs-cold lighting thesis) filed as concept-v1 and r1_v1c2 (clean studio silhouette, template-pure) as concept-v2. No candidate fully lands the wry-smirk face canon — carried into the portrait stage as its hard constraint. Portrait batch (roguex-33-portrait, 3 face variants × 2 candidates, portrait.png template + filed concepts as identity anchors) written; awaiting the operator's Codex trigger.",
    "stepOutcomes": [
      { "step": "concept", "status": "done" },
      { "step": "portrait", "status": "active" }
    ],
    "outputs": [
      { "label": "Roguex-33_concept-v1.png (lore-brain Media/visual)", "kind": "doc" },
      { "label": "Roguex-33_concept-v2.png (lore-brain Media/visual)", "kind": "doc" },
      { "label": "generation/BATCH.md — roguex-33-portrait", "kind": "doc" }
    ]
  }
]
```
