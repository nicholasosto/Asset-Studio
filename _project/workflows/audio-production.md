---
title: "Audio production"
status: draft
updated: 2026-06-30
---

# Audio production

> **Status:** draft (2026-06-30)

## Purpose

A briefed audio cue — music bed, SFX, or voice line — generated, reviewed, and filed into the shared
library. Generation runs through ElevenLabs (music / sound-effect / TTS); placement follows **Pattern A**
(symlink, zero-upload) per [[0001-reference-the-shared-asset-library-via-external-locations]].

## Workflow

```json
{
  "caption": "A briefed audio cue, generated → reviewed → filed into the library (Pattern A).",
  "lanes": [
    { "id": "brief", "label": "Brief", "kind": "human" },
    { "id": "gen", "label": "Generate", "kind": "tool" },
    { "id": "stage", "label": "Staging", "kind": "system" },
    { "id": "review", "label": "Review", "kind": "human" },
    { "id": "place", "label": "Place + validate", "kind": "tool" }
  ],
  "steps": [
    { "id": "write-brief", "lane": "brief", "label": "Write the audio brief", "detail": "type (music/sfx/voice) · mood · length", "status": "pending", "to": ["generate"] },
    { "id": "generate", "lane": "gen", "label": "Generate with ElevenLabs", "detail": "music · sound_effect · tts", "status": "pending", "to": ["stage-out"] },
    { "id": "stage-out", "lane": "stage", "label": "Stage to ai-output/audio/", "detail": "external-locations/assets/ai-output/audio/", "status": "pending", "to": ["review-take"] },
    { "id": "review-take", "lane": "review", "label": "Audition takes", "note": "Approve a take, or regenerate.", "status": "pending", "to": ["finalize", "revise"] },
    { "id": "revise", "lane": "brief", "label": "Adjust the brief", "status": "pending", "to": ["generate"] },
    { "id": "finalize", "lane": "review", "label": "Finalize (_BLK)", "detail": "kebab-case + status suffix", "status": "pending", "to": ["place-asset"] },
    { "id": "place-asset", "lane": "place", "label": "Place in audio/<context>/", "status": "pending", "refs": [{ "rel": "references", "target": "decisions/0001-reference-the-shared-asset-library-via-external-locations" }], "to": ["validate-ids"] },
    { "id": "validate-ids", "lane": "place", "label": "validate_asset_ids.py", "status": "pending", "to": [] }
  ]
}
```
