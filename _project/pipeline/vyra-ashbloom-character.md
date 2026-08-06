---
title: "Vyra Ashbloom character"
status: build
updated: 2026-07-29
links:
  - { rel: references, target: workflows/character-creation }
---

# Vyra Ashbloom character

> **Status:** build (2026-07-29)

## Context

Speculative roster-visualization pass for Soul Steel's Vyra Ashbloom. The Lore Brain currently
defines her as a Veil-touched Spirit mystic but provides only one direct physical cue—eyes shifting
between deep violet and pale silver—and no character image. The operator asked to see her through
the visual language of the supplied ethereal-alien customizer.

Lore Brain resolves that source under the speculative `Luminari` species engram and its concept
board. Neither source says Vyra is Luminari. This run therefore combines two speculative designs
for visual evaluation only. The roster-format concept is owner-accepted and filed to the shared
Assets library as `_BLK`. That filing does not establish Vyra as Luminari; canon decisions, Lore
Brain filing, graph edits, upload registration, `_FNL` promotion, upload, and publish remain
separate gates.

## Build plan

1. **Source lock** — preserve Vyra's dual-layer sight, violet/silver eye shift, listening
   disposition, and Spirit/Veil identity while preserving the Luminari living-lattice body,
   expressive energy tendrils, crystal crown, and Violet Light scholar-seer silhouette.
2. **Promotional concept** — run
   `generation/contracts/vyra-ashbloom-luminari-promo-v1.md` with the supplied customizer, the
   Lore Brain Luminari board, the composition template, and the staged roster promotions.
3. **Human review** — evaluate whether Vyra remains recognizable as a compassionate, uncanny
   dual-world seer; evaluate Luminari anatomy, text accuracy, silhouette, brightness, and
   side-by-side roster fit. Any revision receives a new immutable contract.
4. **Canon and filing decision** — only after owner acceptance, separately decide whether this
   cross-design changes Vyra's species or remains an alternate visual. Request approval before any
   Lore Brain media or engram write.

## Exit criteria

- One accepted visual exploration shows Vyra through the Luminari design language.
- The candidate reads as both Vyra and Luminari without implying an approved species retcon.
- Any eventual canon decision and Lore Brain filing are evidenced separately from candidate
  staging.

## Runs

```json
[
  {
    "id": "run-1",
    "label": "Speculative Luminari roster promotion",
    "status": "done",
    "startedAt": "2026-07-29",
    "trigger": "operator request to visualize Vyra Ashbloom as an Illuminari race character",
    "note": "The operator approved the 1024x1536 speculative Luminari roster candidate and authorized shared-library filing on 2026-07-29. It is filed as ui/soul-steel/portraits/vyra-ashbloom/portrait_BLK.png with Trembus raster metadata. The local Lore Brain calls the speculative species Luminari; the supplied customizer labels it Lumineth. Acceptance for filing does not establish Vyra's species or modify Lore Brain. _BLK is not an upload-ready declaration.",
    "stepOutcomes": [
      { "step": "source-lock", "status": "done" },
      { "step": "concept", "status": "done" },
      { "step": "human-review", "status": "done" },
      { "step": "file-blockout", "status": "done" }
    ],
    "outputs": [
      { "label": "generation/contracts/vyra-ashbloom-luminari-promo-v1.md", "kind": "doc" },
      { "label": "generation/work/vyra-ashbloom-luminari-promo-v1/candidates/vyra-ashbloom-luminari-promo-v1_vrosterc1.png (sha256 f6345ac2b75c89508737ea4ace9f01298bb88480b138edbd3f5eb7ae9d771e6c)", "kind": "doc" },
      { "label": "external-locations/assets/ui/soul-steel/portraits/vyra-ashbloom/portrait_BLK.png (sha256 f6345ac2b75c89508737ea4ace9f01298bb88480b138edbd3f5eb7ae9d771e6c)", "kind": "doc" }
    ]
  }
]
```
