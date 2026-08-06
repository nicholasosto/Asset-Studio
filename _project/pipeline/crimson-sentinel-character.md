---
title: "Crimson Sentinel character"
status: build
updated: 2026-07-29
links:
  - { rel: references, target: workflows/character-creation }
---

# Crimson Sentinel character

> **Status:** build (2026-07-29)

## Context

Roster-standardization pass for the Soul Steel Crimson Sentinel. The lore-brain already carries a
canon engram and an older dark portrait, but it lacks the bright full-body promotional concept
grammar visible in the Gary Gears and Raspmutant source art.

Lore authority remains read-only during this pass:

- lore-brain `Concepts/Crimson Sentinel.md`
- source bestiary `lore/game-docs/soul-steel/bestiary/crimson-sentinel.md`
- identity image `lore-brain/Media/visual/Crimson-Sentinel_portrait.png`

This pipeline does not promote new lore. The first run's concept is owner-accepted and filed to the
shared Assets library as `_BLK`; Lore Brain filing, engram updates, upload registration, `_FNL`
promotion, and publish remain separate gates.

## Build plan

1. **Lore lock** — preserve Captain Aldric Thorne's established identity: twice-player scale,
   corroded crimson plate, closed helm and crimson eyes, crystallized-blood chains, and the
   blood-fused greatsword.
2. **Promotional concept** — run
   `generation/contracts/crimson-sentinel-promo-concept-v1.md` with the character concept template
   plus the old portrait, Gary Gears promotion, and Raspmutant promotion as role-labelled
   references.
3. **Human review** — evaluate identity continuity, text accuracy, silhouette, brightness, and
   roster fit. Iterate under a new immutable contract if needed.
4. **File and link** — only after acceptance, route the reviewed image through the owning asset
   convention and request approval before any lore-brain media or engram write.

## Exit criteria

- One accepted promotional concept exists under the character filename grammar.
- The visual preserves the established Sentinel identity and matches the roster's 2:3 promotional
  sheet grammar.
- Filing and lore-brain linking are evidenced separately from candidate staging.

## Runs

```json
[
  {
    "id": "run-1",
    "label": "Roster-standardized promotional concept",
    "status": "done",
    "startedAt": "2026-07-29",
    "trigger": "operator request to standardize Crimson Sentinel against Gary Gears and Raspmutant promotional art",
    "note": "The operator approved the 1024x1536 roster candidate and authorized shared-library filing on 2026-07-29. It is filed as ui/soul-steel/portraits/crimson-sentinel/portrait_BLK.png with Trembus raster metadata. _BLK is not an upload-ready declaration; Lore Brain filing, engram edits, Roblox registration, _FNL promotion, upload, and publish remain unperformed.",
    "stepOutcomes": [
      { "step": "lore-lock", "status": "done" },
      { "step": "concept", "status": "done" },
      { "step": "human-review", "status": "done" },
      { "step": "file-blockout", "status": "done" }
    ],
    "outputs": [
      { "label": "generation/contracts/crimson-sentinel-promo-concept-v1.md", "kind": "doc" },
      { "label": "generation/work/crimson-sentinel-promo-concept-v1/candidates/crimson-sentinel-promo-concept-v1_vrosterc1.png (sha256 09b9ca3d828d97af39ed7c195c2c4f645c2d358c95f12384261935e36f5c8095)", "kind": "doc" },
      { "label": "external-locations/assets/ui/soul-steel/portraits/crimson-sentinel/portrait_BLK.png (sha256 09b9ca3d828d97af39ed7c195c2c4f645c2d358c95f12384261935e36f5c8095)", "kind": "doc" }
    ]
  }
]
```
