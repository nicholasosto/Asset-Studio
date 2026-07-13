---
title: "Example prop batch"
status: build
updated: 2026-06-30
links:
  - { rel: references, target: workflows/3d-asset }
---

# Example prop batch

> **Status:** build (2026-06-30)

## Context

An illustrative production *instance* — a small batch of tower-defense-style props run end-to-end through
the [[3d-asset]] workflow to exercise the studio's 3D path. **Example — replace with (or delete in favor
of) real batches.**

## Build plan

1. Pull the concept boards for the batch.
2. Blockout each prop in Blender (`blender-mcp-craft`).
3. Model + texture to spec.
4. Export glTF → `.rbxm`.
5. Validate: `validate-3d-asset-art.mjs`, then `validate_asset_ids.py` after import.
6. Import to Studio (Pattern B → `ServerStorage.TrembusGameLibrary`).

## Exit criteria

- Every prop passes `validate-3d-asset-art.mjs` and `validate_asset_ids.py`.
- Runtime `.rbxm` present under `library/props/` and registered in the asset-id registry.

## Runs

```json
[
  {
    "id": "run-1",
    "label": "First pass — 2 of 5 props",
    "status": "partial",
    "startedAt": "2026-06-30",
    "trigger": "studio kickoff",
    "note": "Blockouts landed for the first two props; modeling in progress.",
    "stepOutcomes": [
      {
        "step": "board", "status": "done",
        "outputs": [
          { "label": "Assets/_inbox/3d/example-prop-batch/prop-a/board.png", "kind": "doc" },
          { "label": "Assets/_inbox/3d/example-prop-batch/prop-b/board.png", "kind": "doc" }
        ]
      },
      {
        "step": "blockout", "status": "done",
        "outputs": [
          { "label": "Assets/_inbox/3d/example-prop-batch/prop-a/prop-a_blockout.blend", "kind": "log" },
          { "label": "Assets/_inbox/3d/example-prop-batch/prop-b/prop-b_blockout.blend", "kind": "log" }
        ]
      },
      { "step": "model-tex", "status": "active" }
    ],
    "outputs": [
      { "label": "2 blockout .blend files", "kind": "doc" }
    ]
  }
]
```
