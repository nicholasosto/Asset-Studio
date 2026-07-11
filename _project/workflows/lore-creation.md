---
title: "Lore creation"
status: draft
updated: 2026-07-11
links:
  - { rel: references, target: mediums/lore }
---

# Lore creation

> **Status:** draft (2026-07-11)

## Purpose

A lore deliverable — engram, production brief, or shippable text — taken from brief through a
continuity-checked authoring pass into the lore-brain graph, canonized and reciprocally linked.
**By reference only** per the [[lore]] medium's output convention (the
[[0001-reference-the-shared-asset-library-via-external-locations]] treaty, second application):
the graph is the library; nothing files into Asset-Studio or the shared `Assets/` library.

This is the fourth leaf, closing the medium ↔ leaf pairing (image · audio · 3d · lore).
[[character-creation]] calls it at `lore-lock`; its terminal gate — visual tells on the engram —
is exactly what that call consumes. Roguex-33's run-2 (continuity pass → Visual Identity
canonized) is the de-facto pilot run.

## Workflow

```json
{
  "caption": "A lore deliverable — engram · brief · shippable text — authored into the lore-brain, by reference only.",
  "lanes": [
    { "id": "brief", "label": "Brief", "kind": "human" },
    { "id": "recall", "label": "Recall (lore-brain)", "kind": "tool" },
    { "id": "author", "label": "Author", "kind": "ai" },
    { "id": "canon", "label": "Canon review", "kind": "human" },
    { "id": "link", "label": "Link + gate", "kind": "system" }
  ],
  "steps": [
    { "id": "write-brief", "lane": "brief", "label": "Write the lore brief", "detail": "reality · deliverable class · register", "note": "Three deliverable classes per the medium card: engram (canon source) · brief (what downstream workflows consume) · shippable text (dialog, flavor, lyrics).", "status": "pending", "to": ["recall-pass"] },
    { "id": "recall-pass", "lane": "recall", "label": "Continuity pass (/lore-brain:recall)", "detail": "neighborhood + scars", "note": "Quality bar: no contradictions with established attributes; scars surfaced before authoring. Briefs quote the graph, never invent.", "status": "pending", "to": ["author"] },
    { "id": "author", "lane": "author", "label": "Author / generate", "detail": "/capture · /create (creative-director)", "note": "Content matches the reality's declared register (soul-steel cyber-gothic · tessera process-philosophy · claude-lab speculative-fiction).", "status": "pending", "refs": [{ "rel": "references", "target": "mediums/lore" }], "to": ["canon-review"] },
    { "id": "canon-review", "lane": "canon", "label": "Canon review", "detail": "tone · canon_status honest", "note": "Tone matches the register; canon_status set honestly (speculative stays speculative until promoted). Approve, or send back.", "status": "pending", "to": ["reciprocal-link", "revise"] },
    { "id": "revise", "lane": "brief", "label": "Tighten the brief", "note": "Re-run the continuity pass if the revision touches established attributes.", "status": "pending", "to": ["author"] },
    { "id": "reciprocal-link", "lane": "link", "label": "Reciprocal link to the reality cortex", "detail": "brain/v1.1 contract", "status": "pending", "to": ["lore-lock-gate"] },
    { "id": "lore-lock-gate", "lane": "link", "label": "Lore-lock gate (asset-bound personas)", "detail": "palette · silhouette · materials · signature tell", "note": "Only for asset-bound personas/regions: the engram must carry visual tells before any downstream medium starts. This gate is what character-creation's lore-lock step calls. Skip for lore that never becomes an asset.", "status": "pending", "to": [] }
  ]
}
```
