---
title: "3D asset"
status: draft
updated: 2026-06-30
---

# 3D asset

> **Status:** draft (2026-06-30)

## Purpose

A 3D prop taken from concept board through a Blender blockout, modeling/texturing, and export, then
imported into Studio and validated. Modeling runs through the Blender MCP (see the `blender-mcp-craft`
skill); 3D follows **Pattern B** (upload into `ServerStorage.TrembusGameLibrary`) per
[[0001-reference-the-shared-asset-library-via-external-locations]].

## Workflow

```json
{
  "caption": "A 3D prop: concept → Blender blockout → export → validated Pattern-B import.",
  "lanes": [
    { "id": "concept", "label": "Concept", "kind": "human" },
    { "id": "model", "label": "Blender", "kind": "tool" },
    { "id": "export", "label": "Export", "kind": "tool" },
    { "id": "import", "label": "Studio import", "kind": "system" },
    { "id": "qa", "label": "Validate", "kind": "tool" }
  ],
  "steps": [
    { "id": "board", "lane": "concept", "label": "Concept / production board", "detail": "silhouette · scale · domain", "status": "pending", "to": ["blockout"] },
    { "id": "blockout", "lane": "model", "label": "Blockout in Blender", "detail": "blender-mcp-craft", "note": "Greybox the form at correct scale before detailing.", "status": "pending", "refs": [{ "rel": "references", "target": "decisions/0001-reference-the-shared-asset-library-via-external-locations" }], "to": ["model-tex"] },
    { "id": "model-tex", "lane": "model", "label": "Model + texture", "status": "pending", "to": ["export-gltf"] },
    { "id": "export-gltf", "lane": "export", "label": "Export glTF / rbxm", "status": "pending", "to": ["validate-art"] },
    { "id": "validate-art", "lane": "qa", "label": "validate-3d-asset-art.mjs", "detail": "source-art package check", "status": "pending", "to": ["studio-import"] },
    { "id": "studio-import", "lane": "import", "label": "Import (Pattern B upload)", "detail": "ServerStorage.TrembusGameLibrary", "status": "pending", "to": ["validate-ids"] },
    { "id": "validate-ids", "lane": "qa", "label": "validate_asset_ids.py", "detail": "registry check", "status": "pending", "to": [] }
  ]
}
```
