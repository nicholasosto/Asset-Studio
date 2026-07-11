---
title: "Audio production"
status: active
updated: 2026-07-11
links:
  - { rel: references, target: mediums/audio }
---

# Audio production

> **Status:** active (2026-07-11)

## Purpose

A briefed audio cue — music bed, SFX, or voice line — generated, reviewed, and filed into its
target slot. Generation runs through ElevenLabs (music / sound-effect / TTS); placement follows
**Pattern A** (symlink, zero-upload) per
[[0001-reference-the-shared-asset-library-via-external-locations]] — the brief's *target slot*
names the destination (library `audio/<context>/` by default; a calling workflow may bind a
by-reference destination such as lore-brain `Media/audio/`, where the Roguex-33 theme mixes live).

## Workflow

```json
{
  "caption": "A briefed audio cue, generated → reviewed → filed into its target slot (Pattern A).",
  "lanes": [
    { "id": "brief", "label": "Brief", "kind": "human" },
    { "id": "gen", "label": "Generate", "kind": "ai" },
    { "id": "stage", "label": "Staging", "kind": "system" },
    { "id": "review", "label": "Review", "kind": "human" },
    { "id": "place", "label": "Place + validate", "kind": "tool" }
  ],
  "steps": [
    { "id": "write-brief", "lane": "brief", "label": "Write the audio brief", "detail": "type (music/sfx/voice) · mood · length · target slot", "note": "The target slot is the leaf's parameter point: library audio/<context>/ by default; a calling workflow (e.g. character-creation's audio-identity) may bind a by-reference destination.", "status": "pending", "to": ["generate"] },
    { "id": "generate", "lane": "gen", "label": "Generate with ElevenLabs", "detail": "music · sound_effect · tts", "status": "pending", "to": ["stage-out"] },
    { "id": "stage-out", "lane": "stage", "label": "Stage to _inbox/audio/", "detail": "external-locations/assets/_inbox/audio/", "note": "_inbox/ is the only place machine output lands, transient by contract (ADR 0008). Triage moves keeps onward; drops die here.", "status": "pending", "to": ["review-take"] },
    { "id": "review-take", "lane": "review", "label": "Audition takes", "note": "Approve a take, or regenerate.", "status": "pending", "to": ["finalize", "revise"] },
    { "id": "revise", "lane": "brief", "label": "Adjust the brief", "status": "pending", "to": ["generate"] },
    { "id": "finalize", "lane": "review", "label": "Finalize (_BLK)", "detail": "kebab-case + status suffix", "status": "pending", "to": ["place-asset"] },
    { "id": "place-asset", "lane": "place", "label": "Place per the brief's target slot", "detail": "library audio/<context>/ — or a bound destination", "status": "pending", "refs": [{ "rel": "references", "target": "decisions/0001-reference-the-shared-asset-library-via-external-locations" }], "to": ["validate-ids"] },
    { "id": "validate-ids", "lane": "place", "label": "_tools/validate_asset_ids.py", "status": "pending", "to": [] }
  ]
}
```
