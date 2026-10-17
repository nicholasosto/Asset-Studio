---
title: "3D asset"
status: draft
updated: 2026-08-17
links:
  - { rel: references, target: mediums/3d }
  - { rel: references, target: decisions/0013-assets-by-medium-the-foundry-decides }
---

# 3D asset

> **Status:** draft (2026-06-30)

## Purpose

A 3D prop taken from concept board through Blender blockout, modeling/texturing,
export and Studio inspection. Use `blender-mcp` and its selected Roblox interchange
profile. Local import, remote upload, metadata registration and consumer binding
require separate evidence. `ServerStorage.TrembusGameLibrary` is an in-place
container, not a remote upload destination. The owning pipeline supplies any later
authorized upload, moderation and consumer-regression gates per
[[0001-reference-the-shared-asset-library-via-external-locations]]. This workflow
remains draft; it does not select an uploader, account, place or shipping consumer.

## Workflow

```json
{
  "caption": "A 3D prop: concept → Blender blockout → export → local Studio inspection; later remote and consumer gates are pipeline-owned.",
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
      "outputs": ["Assets/3d/models/<category>/<slug>/<slug>-production-board.png"],
      "to": ["blockout"]
    },
    {
      "id": "blockout", "lane": "model", "label": "Blockout in Blender", "detail": "blender-mcp",
      "note": "Greybox the form at correct scale before detailing.", "status": "pending",
      "substeps": [
        "Greybox the form at correct scale",
        "Name the runtime container per {CAT}_{SUB}_{Name} (tgl-asset — no status tail; under 3d/ the DCC owns the names)",
        "Stage to Assets/_inbox/3d/ for review"
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
        "Assets/3d/models/<category>/<slug>/exports/<slug>.glb",
        "Assets/runtime/roblox/soul-steel/<category>/<domain>/CAT_SUB_Name.rbxm"
      ],
      "to": ["validate-art"]
    },
    { "id": "validate-art", "lane": "qa", "label": "_tools/validate-3d-asset-art.mjs", "detail": "3d/models package check", "status": "pending", "to": ["studio-import"] },
    {
      "id": "studio-import", "lane": "import", "label": "Import and inspect locally in Studio", "detail": "ServerStorage.TrembusGameLibrary", "note": "Verify the intended Studio place and inspect geometry, materials, scale and pivots. Record any actual remote upload separately; local presence is not upload, moderation, registration or adoption proof.", "status": "pending",
      "inputs": ["The .rbxm from export", "ServerStorage.TrembusGameLibrary target"],
      "outputs": ["Assets/runtime/roblox/soul-steel/props/<domain>/PRP_SUB_Name.rbxm"],
      "to": ["validate-ids"]
    },
    { "id": "validate-ids", "lane": "qa", "label": "Check observed upload mappings when present", "detail": "conditional registry check; later shipping gates remain pending", "note": "Use the owning registry checks only for actual observed uploaded IDs and exact local bytes. Without such an ID report the remote gate as pending. Registration records an existing upload; it does not upload bytes or establish consumer binding.", "status": "pending", "to": [] }
  ]
}
```
