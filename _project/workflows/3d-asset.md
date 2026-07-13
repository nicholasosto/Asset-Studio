---
title: "3D asset"
status: draft
updated: 2026-07-11
links:
  - { rel: references, target: mediums/3d }
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
    {
      "id": "board", "lane": "concept", "label": "Concept / production board", "detail": "silhouette · scale · domain", "status": "pending",
      "inputs": ["A prop brief — silhouette · scale · domain"],
      "outputs": ["Assets/_inbox/3d/<name>/board.png"],
      "to": ["blockout"]
    },
    {
      "id": "blockout", "lane": "model", "label": "Blockout in Blender", "detail": "blender-mcp-craft",
      "note": "Greybox the form at correct scale before detailing.", "status": "pending",
      "substeps": [
        "Greybox the form at correct scale",
        "Name per [CAT]_[SUB]_[Name]_[Status]",
        "Stage to Assets/_inbox for review"
      ],
      "inputs": ["The concept board", "Target scale + domain"],
      "refs": [{ "rel": "references", "target": "decisions/0001-reference-the-shared-asset-library-via-external-locations" }],
      "to": ["model-tex"]
    },
    {
      "id": "model-tex", "lane": "model", "label": "Model + texture", "status": "pending",
      "substeps": [
        "Retopo + UV-unwrap the blockout",
        "Author PBR textures",
        "Pack textures into the .blend"
      ],
      "to": ["export-gltf"]
    },
    {
      "id": "export-gltf", "lane": "export", "label": "Export glTF / rbxm", "status": "pending",
      "substeps": ["Bake + pack textures", "Export glTF (.glb)", "Convert to Studio .rbxm"],
      "outputs": [
        "Assets/source-art/3d/<name>/<name>.glb",
        "Assets/source-art/3d/<name>/<name>.rbxm"
      ],
      "to": ["validate-art"]
    },
    { "id": "validate-art", "lane": "qa", "label": "_tools/validate-3d-asset-art.mjs", "detail": "source-art package check", "status": "pending", "to": ["studio-import"] },
    {
      "id": "studio-import", "lane": "import", "label": "Import (Pattern B upload)", "detail": "ServerStorage.TrembusGameLibrary", "status": "pending",
      "inputs": ["The .rbxm from export", "ServerStorage.TrembusGameLibrary target"],
      "outputs": ["library/props/<name>.rbxm"],
      "to": ["validate-ids"]
    },
    { "id": "validate-ids", "lane": "qa", "label": "_tools/validate_asset_ids.py", "detail": "registry check", "status": "pending", "to": [] }
  ]
}
```
