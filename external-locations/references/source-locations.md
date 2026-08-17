# External locations — source map

Asset-Studio plans the processes that produce assets; it does not store the payloads. Per
[decision 0001](../../_project/decisions/0001-reference-the-shared-asset-library-via-external-locations.md),
it references canonical sources through the symlinks in this directory. Git tracks the links, not
their target payloads.

## Symlinks

| Link | Target | Authority |
|---|---|---|
| `external-locations/assets` | `~/Master-Managed/Assets/` | Canonical shared asset library, catalog, ingestion zones, and validators |
| `external-locations/canonical` | `…/Project-Spaces/LLM-Agent-Development/canonical/` | Legacy shared visual-grammar kit and a small set of canonical skills |

Agent capability ownership and runtime installs are registered separately in
`agent-assets/capabilities.yaml`.

## Current shared-library doors

**The Foundry decides the tree and the names** — `Foundry/Core.html` `FOLDERS_ASSETS` · `NAME_RULES`
(`kebab-media`, `tgl-asset`), measured by `Foundry/tools/scan-drift.mjs`. Decided 2026-08-17
(`asy-20260817-091725`; ADR 0013 records it here). This map is a pointer, not the law.

| Path under `assets/` | Purpose |
|---|---|
| `image/{ui,textures,concept,reference,source/pixelmator}/` | 2D — layer 1 is where a thing is consumed; `ui/icon/` and `textures/tile/` are the only rooms a Foundry contract has earned below it; a package stays whole as its own folder; the subject goes in the name, never a project folder |
| `audio/{ambient,music,sfx,ui,voice/<character>}/` | Audio, by role |
| `video/` | Moving image |
| `3d/models/<category>/<slug>/` · `3d/source/{blender,terrain}/` | Per-asset 3D packages · DCC working files — no naming law under `3d/` |
| `runtime/roblox/soul-steel/<category>/<domain>/` | Engine containers, `{CAT}_{SUB}_{Name}.rbxm` |
| `_inbox/{image,audio,video,3d}/` | The only landing zone for unattended tool output |
| `_catalog/` | Upload registry, validated ID tables, migration manifests, and inventory records |
| `_tools/` | Shared-library validators, metadata tools, and package scaffolds |
| `_archive/` | Retired drops, bucketed by retire date — moved whole, never renamed |

Do not route new work to the retired July zones (root-level `ui/ textures/ concept-art/ templates/
models/ source/ _resort/`) or the older `ai-output/ library/ scripts/ 3D-asset-art/` layouts. No
live name carries a `_BLK/_FNL` token. Invoke `roblox-dev:asset-conventions` as the routing guide
for the exact destination, filename grammar, registry, and upload rules — it points at the Foundry;
it is not the law.

## Delivery patterns

- **Pattern A — referenced file:** reviewed 2D/audio payloads live in their canonical library
  zones and may be resolved locally through `rbxasset://trembus/` for Studio proof. That local URI
  is not upload, registry, publish, or shipping evidence.
- **Pattern B — uploaded runtime asset:** meshes and shipping image/audio assets require the
  applicable owner/group upload, moderation, recorded asset ID/checksum in `_catalog/`, consumer
  substitution to `rbxassetid://`, and post-upload regression evidence.

The owning pipeline must record each gate separately. File presence, an Asset Manager row, or a
local Studio import never implies a later gate.
