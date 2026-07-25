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

## Current shared-library zones

| Path under `assets/` | Purpose |
|---|---|
| `_inbox/{images,audio,models,character-packages}/` | Unattended or genuinely unclassified incoming work only |
| `_catalog/` | Upload registry, validated ID tables, migration manifests, and inventory records |
| `_tools/` | Shared-library validators and metadata tools |
| `_archive/` | Historical and migration snapshots |
| `source/{blender,pixelmator,terrain}/` | Editable source files |
| `runtime/roblox/` | Roblox-ready runtime payloads, including project-specific packages |
| `ui/{backgrounds,design,frames,icons,sprites}/` | Shared UI art |
| `ui/<project>/` | Project-presupposing UI bundles |
| `textures/{particles,skybox,surfaces,tileable}/` | Texture and VFX families |
| `models/`, `audio/`, `concept-art/`, `templates/` | Medium-specific production libraries |

Do not route new work to the retired `ai-output/`, `library/`, `scripts/`, or `3D-asset-art/`
top-level layouts. Invoke `roblox-dev:asset-conventions` for the current exact destination,
filename grammar, `_BLK/_FNL` status, registry, and promotion rules.

## Delivery patterns

- **Pattern A — referenced file:** reviewed 2D/audio payloads live in their canonical library
  zones and may be resolved locally through `rbxasset://trembus/` for Studio proof. That local URI
  is not upload, registry, publish, or shipping evidence.
- **Pattern B — uploaded runtime asset:** meshes and shipping image/audio assets require the
  applicable owner/group upload, moderation, recorded asset ID/checksum in `_catalog/`, consumer
  substitution to `rbxassetid://`, and post-upload regression evidence.

The owning pipeline must record each gate separately. File presence, an Asset Manager row, or a
local Studio import never implies a later gate.
