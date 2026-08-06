---
title: "Kael Thornwood character"
status: build
updated: 2026-07-29
links:
  - { rel: references, target: workflows/character-creation }
---

# Kael Thornwood character

> **Status:** build (2026-07-29)

## Context

Roster-visualization pass for Soul Steel's Kael Thornwood. Lore Brain establishes a compelling
character hook—an Ashen Order deserter who survived beneath the World-Ash and emerged with
bark-hardened forearms, thorn scars, and a luminous green left eye—but provides no portrait,
physical-design section, model sheet, weapon, or face.

This run's Rootscar Guardian promotional concept is owner-accepted and filed to the shared Assets
library as `_BLK`. It separates established source cues from provisional visual choices and makes
no Lore Brain mutation. Acceptance for filing does not canonize the provisional face, removed
badge, or sword; canon decisions, upload registration, `_FNL` promotion, upload, and publish remain
separate gates.

## Build plan

1. **Source lock** — preserve the bark forearms, thorn scars, green left eye, grey cloak,
   burnished steel, ex-Ashen-Order history, Fateless alignment, and protective disposition.
2. **Provisional design** — use one restrained adult face, removed-badge patch, travel-worn armor,
   and plain unnamed sword solely to make the candidate drawable. Do not treat those choices as
   character canon.
3. **Promotional concept** — run
   `generation/contracts/kael-thornwood-promo-concept-v1.md` with the composition template and
   established roster style references.
4. **Human review** — evaluate character readability, bark/steel material separation, left-eye
   accuracy, stance, text, brightness, and side-by-side roster fit. Any revision receives a new
   immutable contract.
5. **Canon and filing decision** — only after acceptance, separately decide which provisional
   design choices should enter Kael's engram. Request approval before any Lore Brain media or
   engram write.

## Exit criteria

- One accepted Rootscar Guardian promotional concept exists under the character filename grammar.
- Kael reads as a grounded guardian rather than a druid, paladin, or plant monster.
- Established and provisional choices remain distinguishable in the durable record.
- Filing and Lore Brain linking are evidenced separately from candidate staging.

## Runs

```json
[
  {
    "id": "run-1",
    "label": "Rootscar Guardian roster promotion",
    "status": "done",
    "startedAt": "2026-07-29",
    "trigger": "operator approval of the recommended Rootscar Guardian visual direction",
    "note": "The operator approved the 1024x1536 Rootscar Guardian roster candidate and authorized shared-library filing on 2026-07-29. It is filed as ui/soul-steel/portraits/kael-thornwood/portrait_BLK.png with Trembus raster metadata. Kael and the Ashen Order remain speculative; the face, removed-badge patch, and plain sword remain provisional visual choices. Lore Brain is unchanged, and _BLK is not an upload-ready declaration.",
    "stepOutcomes": [
      { "step": "source-lock", "status": "done" },
      { "step": "concept", "status": "done" },
      { "step": "human-review", "status": "done" },
      { "step": "file-blockout", "status": "done" }
    ],
    "outputs": [
      { "label": "generation/contracts/kael-thornwood-promo-concept-v1.md", "kind": "doc" },
      { "label": "generation/work/kael-thornwood-promo-concept-v1/candidates/kael-thornwood-promo-concept-v1_vrosterc1.png (sha256 c5a54e1cf0a656c0c06f5f063a4c405cc0b9f261e06bea04b0f6861d0126e2e7)", "kind": "doc" },
      { "label": "external-locations/assets/ui/soul-steel/portraits/kael-thornwood/portrait_BLK.png (sha256 c5a54e1cf0a656c0c06f5f063a4c405cc0b9f261e06bea04b0f6861d0126e2e7)", "kind": "doc" }
    ]
  }
]
```
