# External locations — source map

Asset-Studio plans the **processes** that produce assets; it does **not** store the assets. Per
[decision 0001](../../_project/decisions/0001-reference-the-shared-asset-library-via-external-locations.md)
it references the canonical sources through the symlinks in this directory. The links are tracked in
git; their targets (and the payload beneath them) are not.

## Symlinks

| Link | Target | What it is |
|---|---|---|
| `external-locations/assets` | `~/Master-Managed/Assets/` | The canonical asset library + `ai-output/` staging + `scripts/` validators + the 193-id registry. |
| `external-locations/canonical` | `…/Project-Spaces/LLM-Agent-Development/canonical/` | The Trembus visual-grammar kit (`kits/visual-grammar/build.mjs`) + the `render-status-board` / `blender-mcp-craft` skills. |

## Key paths under `assets/`

- `ai-output/{images,audio,sfx,voice-previews,text}/` — staging for freshly generated, un-finalized output.
- `library/{props,rigs,effects,environment,layouts,accessories}/` — runtime TGL assets (`[CAT]_[SUB]_[PascalName]_[Status].rbxm`).
- `audio/{ability-combat-fx,ui-fx,world-fx,voice-dialog,bg-music,environment,generic}/` — finalized audio.
- `ui/`, `textures/`, `3D-asset-art/` — finalized 2D and 3D source art.
- `scripts/validate_asset_ids.py` — Roblox Economy-API id validation (the 193-id registry).
- `3D-asset-art/tools/validate-3d-asset-art.mjs` — source-art package validation.

## Ingestion patterns (carried forward from SS `inner-doll-1-asset-pipelines.md`)

- **Pattern A — symlink (2D / audio):** finalized files land under `assets/` and are served to Studio
  via the `rbxasset://trembus/` symlink. Zero upload.
- **Pattern B — upload (3D):** meshes are imported into `ServerStorage.TrembusGameLibrary` in Studio
  (requires an upload step), then validated against the id registry.
