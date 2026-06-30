---
title: "Image generation"
status: draft
updated: 2026-06-30
---

# Image generation

> **Status:** draft (2026-06-30)

## Purpose

A briefed 2D image — UI icon, sprite, portrait, or texture — taken from prompt to a finalized file in
the shared library, with a review gate and a revise loop. Generation is AI-assisted (OpenAI / Figma);
placement follows **Pattern A** (symlink, zero-upload) per
[[0001-reference-the-shared-asset-library-via-external-locations]].

## Workflow

```json
{
  "caption": "A briefed 2D image, generated → reviewed → finalized into the shared library (Pattern A).",
  "lanes": [
    { "id": "brief", "label": "Brief", "kind": "human" },
    { "id": "gen", "label": "Generate", "kind": "ai" },
    { "id": "stage", "label": "Staging", "kind": "system" },
    { "id": "review", "label": "Review", "kind": "human" },
    { "id": "place", "label": "Place + validate", "kind": "tool" }
  ],
  "steps": [
    { "id": "write-brief", "lane": "brief", "label": "Write the image brief", "detail": "subject · style · target slot", "status": "pending", "to": ["generate"] },
    { "id": "generate", "lane": "gen", "label": "Generate candidates", "detail": "OpenAI / Figma", "note": "Produce N candidates from the brief.", "status": "pending", "to": ["stage-out"] },
    { "id": "stage-out", "lane": "stage", "label": "Stage to ai-output/images/", "detail": "external-locations/assets/ai-output/images/", "status": "pending", "to": ["review-cand"] },
    { "id": "review-cand", "lane": "review", "label": "Review candidates", "note": "Approve one, or send back for another pass.", "status": "pending", "to": ["finalize", "revise"] },
    { "id": "revise", "lane": "brief", "label": "Refine the brief", "note": "Tighten the prompt and regenerate.", "status": "pending", "to": ["generate"] },
    { "id": "finalize", "lane": "review", "label": "Finalize (_BLK → _FNL)", "detail": "name + status suffix", "status": "pending", "to": ["place-asset"] },
    { "id": "place-asset", "lane": "place", "label": "Place in library (ui/ | textures/)", "status": "pending", "refs": [{ "rel": "references", "target": "decisions/0001-reference-the-shared-asset-library-via-external-locations" }], "to": ["validate-ids"] },
    { "id": "validate-ids", "lane": "place", "label": "validate_asset_ids.py", "detail": "registry check", "status": "pending", "to": [] }
  ]
}
```
