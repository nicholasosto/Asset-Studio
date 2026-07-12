---
title: "Background music audio"
status: draft
updated: 2026-07-12
links:
  - { rel: references, target: mediums/audio }
---

# Background music audio

> **Status:** draft (2026-07-12)

## Purpose

<the outcome this process reliably produces>

## Workflow

<!-- lanes: who acts; kind is one of human, ai, system, tool, neutral.
     steps: each needs a lane + label. Optional: status (done|active|pending|blocked|skipped)
     tints the card; detail shows on the card; note shows in the inspector when the step is
     clicked; to[] lists the next step id(s) ([] marks a terminal step). -->
```json
{
  "caption": "<one line: what this process reliably produces>",
  "lanes": [
    { "id": "you", "label": "You", "kind": "human" },
    { "id": "system", "label": "System", "kind": "system" }
  ],
  "steps": [
    { "id": "start", "lane": "you", "label": "<trigger>", "status": "done", "detail": "<shown on the card>", "to": ["work"] },
    { "id": "work", "lane": "system", "label": "<step>", "status": "active", "note": "<shown in the inspector on click>", "to": [] }
  ]
}
```
