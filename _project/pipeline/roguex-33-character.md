---
title: "Roguex-33 character"
status: build
updated: 2026-07-04
links:
  - { rel: references, target: workflows/character-creation }
---

# Roguex-33 character

> **Status:** build (2026-07-04)

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
  }
]
```
