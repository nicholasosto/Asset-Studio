---
title: "Soul Steel domain sigil exploration"
status: build
updated: 2026-07-30
links:
  - { rel: references, target: workflows/image-generation }
---

# Soul Steel domain sigil exploration

> **Status:** build (2026-07-30)

## Context

Create a comparative examples sheet for Soul Steel's domain icon language so the owner can
evaluate several constructions per alignment before choosing any official marks. Lore Brain
establishes Blood, Decay, Spirit, Robot, and Fateless as alignment values. Void is included only
as an explicitly labeled speculative candidate.

The work is a visual exploration, not a Lore Brain mutation or asset promotion. The sheet will
use a shared construction grammar while preserving each domain's established metaphysical and
material cues.

## Build plan

1. **Source lock** — preserve the five established alignment identities and keep Void visibly
   outside that authority boundary.
2. **Sigil grammar** — use common forged frames, central negative space, bold small-scale
   silhouettes, and one large plus four derived marks per domain.
3. **Examples sheet** — run
   `generation/contracts/soul-steel-domain-sigil-exploration-v1.md` as one 3:2 landscape grid.
4. **Human review** — compare silhouette distinction, lore fidelity, icon-family cohesion,
   64-pixel readability, spelling, and whether Void is clearly speculative.
5. **Selection and production decision** — any selected marks require a new source-art contract,
   individual exports, asset-conventions review, and explicit owner approval before filing or
   Lore Brain linking.

## Exit criteria

- One staged examples sheet contains five variations for each of the six labeled concepts.
- Blood, Decay, Spirit, Robot, and Fateless remain distinguishable without relying on color.
- Void is visibly marked as speculative.
- No proposed mark is represented as official, registered, promoted, uploaded, or canonical.

## Runs

```json
[
  {
    "id": "run-1",
    "label": "Domain sigil exploration sheet",
    "status": "done",
    "startedAt": "2026-07-29",
    "trigger": "operator request for an examples sheet filled with variations of each Soul Steel domain icon or symbol",
    "note": "The 1536x1024 landscape comparison sheet was staged on 2026-07-29 and the operator responded positively to the main sigils and several variations. This closes the comparison-sheet pass but does not make any mark official.",
    "stepOutcomes": [
      { "step": "source-lock", "status": "done" },
      { "step": "sigil-grammar", "status": "done" },
      { "step": "concept", "status": "done" },
      { "step": "human-review", "status": "done" }
    ],
    "outputs": [
      { "label": "generation/contracts/soul-steel-domain-sigil-exploration-v1.md", "kind": "doc" },
      { "label": "generation/work/soul-steel-domain-sigil-exploration-v1/candidates/soul-steel-domain-sigil-exploration-v1_vgridc1.png (sha256 222f2796eba45b076755a33ec32b1ca4ad3dcf019653c4ced3114d3e9b533388)", "kind": "doc" }
    ]
  },
  {
    "id": "run-2",
    "label": "Blood transparent sigil trio",
    "status": "done",
    "startedAt": "2026-07-29",
    "trigger": "operator request for three individual Blood sigils with transparent backgrounds",
    "note": "The first execution preserved the selected designs but produced 1254x1254 opaque PNGs with a baked checkerboard instead of native alpha. All three failed the technical output contract and are retained only as ignored run evidence. Corrective execution moved to a new immutable v2 contract using gpt-image-1.5 with background=transparent.",
    "stepOutcomes": [
      { "step": "blood-source-selection", "status": "done" },
      { "step": "blood-alpha", "status": "failed" }
    ],
    "outputs": [
      { "label": "generation/contracts/soul-steel-blood-sigils-transparent-v1.md", "kind": "doc" },
      { "label": "generation/work/soul-steel-blood-sigils-transparent-v1/candidates/ (three rejected opaque checkerboard renders)", "kind": "doc" }
    ]
  },
  {
    "id": "run-3",
    "label": "Blood transparent sigil trio native-alpha correction",
    "status": "done",
    "startedAt": "2026-07-29",
    "trigger": "technical validation failure of run-2 transparency and dimensions",
    "note": "The corrective API pass completed on 2026-07-30. Core, crest, and combat candidates are each 1024x1024 PNGs with real alpha, transparent corner pixels, and clean isolated coverage. The owner approved all three for filing on 2026-07-30. Exact byte-for-byte copies were filed in the shared Assets ui/icons library as _BLK with the icon, heroic-ornate, transparent, and square Trembus metadata. Registration, _FNL promotion, upload, publish, consumer shipping, and Lore Brain mutation remain separate later gates.",
    "stepOutcomes": [
      { "step": "blood-source-selection", "status": "done" },
      { "step": "native-alpha-correction", "status": "done" },
      { "step": "technical-validation", "status": "done" },
      { "step": "human-review", "status": "done" },
      { "step": "file-blockout", "status": "done" }
    ],
    "outputs": [
      { "label": "generation/contracts/soul-steel-blood-sigils-transparent-v2.md", "kind": "doc" },
      { "label": "generation/work/soul-steel-blood-sigils-transparent-v2/candidates/soul-steel-blood-sigils-transparent-v2_vcorec1.png (sha256 08b8ffade02491a54e8ad160acb3bc5b7385053e81f659ebb4a60a9478ca547a)", "kind": "doc" },
      { "label": "generation/work/soul-steel-blood-sigils-transparent-v2/candidates/soul-steel-blood-sigils-transparent-v2_vcrestc1.png (sha256 0b34fe7cc852c9cd4aa394ca05716643ba063f80c137899e3abb3e676e160521)", "kind": "doc" },
      { "label": "generation/work/soul-steel-blood-sigils-transparent-v2/candidates/soul-steel-blood-sigils-transparent-v2_vcombatc1.png (sha256 a7bf69f170aae80d11732740a174b8ec14a96e2551293442559b0e96be76b37a)", "kind": "doc" },
      { "label": "external-locations/assets/ui/icons/glyph-blood-domain_BLK.png (sha256 08b8ffade02491a54e8ad160acb3bc5b7385053e81f659ebb4a60a9478ca547a)", "kind": "doc" },
      { "label": "external-locations/assets/ui/icons/glyph-blood-domain-crest_BLK.png (sha256 0b34fe7cc852c9cd4aa394ca05716643ba063f80c137899e3abb3e676e160521)", "kind": "doc" },
      { "label": "external-locations/assets/ui/icons/glyph-blood-domain-combat_BLK.png (sha256 a7bf69f170aae80d11732740a174b8ec14a96e2551293442559b0e96be76b37a)", "kind": "doc" }
    ]
  }
]
```
