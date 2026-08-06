---
title: "Penitent Knight character"
status: build
updated: 2026-07-29
links:
  - { rel: references, target: workflows/character-creation }
---

# Penitent Knight character

> **Status:** build (2026-07-29)

## Context

Roster-standardization pass for the Soul Steel Penitent Knight. The lore-brain already carries a
canon persona engram and a mature visual pack—portrait, model sheets, gameplay three-quarter,
weapon concept, and material details—but it lacks the brighter full-body promotional-sheet grammar
now represented by Gary Gears, Raspmutant, and the staged Crimson Sentinel candidate.

Lore authority remains read-only during this pass:

- lore-brain `Concepts/Penitent Knight.md` (canon persona and physical design)
- lore-brain `Concepts/Penitent Knight Vowbrand.md` (speculative artifact design)
- the existing `Media/visual/Penitent-Knight_*` reference pack

This run adds no new lore and does not promote the speculative Vowbrand artifact. Its promotional
candidate is owner-accepted and filed to the shared Assets library as `_BLK`; graph edits, upload
registration, `_FNL` promotion, upload, and publish remain separate gates.

## Build plan

1. **Lore lock** — preserve the Knight's obsidian mythic plate, disciplined posture, narrow
   crimson eyes, worn battle-cloth, honor markings, and sacred-first embedded technology.
2. **Promotional concept** — run
   `generation/contracts/penitent-knight-promo-concept-v1.md` with the concept template, existing
   gameplay/model/weapon references, and the Crimson Sentinel promotion as the roster-style anchor.
3. **Human review** — evaluate identity continuity, Vowbrand fidelity, text accuracy, silhouette,
   brightness, and side-by-side roster fit. Any revision receives a new immutable contract.
4. **File and link** — only after acceptance, route the reviewed image through the owning asset
   convention and request approval before any lore-brain media or engram write.

## Exit criteria

- One accepted Penitent Knight promotional concept exists under the character filename grammar.
- The image reads as the established Knight and as a sibling of the Crimson Sentinel promotion.
- Vowbrand inclusion remains explicitly distinct from artifact canon promotion.
- Filing and lore-brain linking are evidenced separately from candidate staging.

## Runs

```json
[
  {
    "id": "run-1",
    "label": "Roster-standardized promotional concept",
    "status": "done",
    "startedAt": "2026-07-29",
    "trigger": "operator request for a Penitent Knight promotion matching the Crimson Sentinel standard",
    "note": "The operator approved the 1024x1536 roster candidate and authorized shared-library filing on 2026-07-29. It is filed as ui/soul-steel/portraits/penitent-knight/portrait_BLK.png with Trembus raster metadata; the older flat portrait remains preserved. The Vowbrand artifact remains speculative. _BLK is not an upload-ready declaration; Lore Brain edits, Roblox registration, _FNL promotion, upload, and publish remain unperformed.",
    "stepOutcomes": [
      { "step": "lore-lock", "status": "done" },
      { "step": "concept", "status": "done" },
      { "step": "human-review", "status": "done" },
      { "step": "file-blockout", "status": "done" }
    ],
    "outputs": [
      { "label": "generation/contracts/penitent-knight-promo-concept-v1.md", "kind": "doc" },
      { "label": "generation/work/penitent-knight-promo-concept-v1/candidates/penitent-knight-promo-concept-v1_vrosterc1.png (sha256 b18c8b4881c57e60533c0a683a8069d41ccdd7bc78f157825f26c33309bcf207)", "kind": "doc" },
      { "label": "external-locations/assets/ui/soul-steel/portraits/penitent-knight/portrait_BLK.png (sha256 b18c8b4881c57e60533c0a683a8069d41ccdd7bc78f157825f26c33309bcf207)", "kind": "doc" }
    ]
  }
]
```
