---
title: "Restructure the shared Assets library into staging, library, runtime, and machinery zones"
status: accepted
updated: 2026-07-03
links:
  - { rel: references, target: decisions/0001-reference-the-shared-asset-library-via-external-locations }
  - { rel: references, target: decisions/0002-adopt-medium-and-mediumtype-as-the-asset-explorer-taxonomy }
---

# Restructure the shared Assets library into staging, library, runtime, and machinery zones

> **Status:** accepted (2026-07-03)

## Context

`~/Master-Managed/Assets` (593 active files, ~960 MB, **not a git repository**) has grown past its
framework: the top level interleaves **four organizing logics** — mediums (`audio/ textures/ ui/
concept-art/`), lifecycle stages (`ai-output/ pre-stamp/ source/ gitf-exports/ _archive/` + six
`__master-*` ledgers loose at root), one game's runtime store (`library/` = the Soul-Steel TGL, a
6×6 category/domain matrix now 27/47 empty folders), and tooling (`scripts/` with ~160 cache JSONs).
Soul-Steel content threads unlabeled through the agnostic zones (`ui/bestiary` etc.), and `source/`
mixes DCC working files with exports and raw Meshy drops. Meanwhile the naming layer is healthy:
401/593 files already carry `_BLK/_ALPHA/_BETA/_FNL` status tokens.

A 2026-07-03 sweep also found **second-generation drift**: many agent surfaces (the
`roblox-dev:asset-conventions` skill both Soul-Steel docs call "the authority", most
Trembus-Technologies memories, blockout tool docs) still describe the library's *previous* home,
`~/GameDev/assets/`, which no longer exists. The owner wants a structure a stranger could navigate,
agnostic to any one project — and this reorg is the moment to collapse all surfaces to one truth.

## Decision

The top level answers one question per folder, in two families:

```
_inbox/    _catalog/    _tools/    _archive/          ← machinery (underscore = about the library)
audio/  concept-art/  models/  textures/  ui/         ← master library (finished/workable assets)
source/                                                ← DCC working files only
runtime/<platform>/<project>/                          ← engine-ready containers (TGL moves here)
```

Three rules make it navigable and project-agnostic:

1. **Folders say *what*, filename tokens say *how done*, `runtime/` says *who consumes*.** The
   `_BLK → _FNL` promotion-by-rename workflow and the TGL filename contract
   (`[CAT]_[SUB]_[Name]_[Status].rbxm` — "the filename is the contract") are unchanged;
   `library/<cat>/<domain>` relocates verbatim to `runtime/roblox/soul-steel/<cat>/<domain>`.
2. **A folder may only presuppose a project if an ancestor names that project.**
   `ui/soul-steel/bestiary/` ✓, `ui/bestiary/` ✗. No `shared/` folders — shared is the default,
   projects are the exception (kills the empty-matrix failure mode permanently).
3. **`_inbox/` is the only place machine output lands, and it is transient by contract.** Absorbs
   `ai-output/` + `pre-stamp/`, keeps tool-facing modality subfolders. Compatible with the
   2026-04-23 production-direct staging policy: humans route direct; unattended MCP drops land
   `_inbox/` pending triage.

Mediums keep their working shape (`audio/{music,sfx,ui,voice,ambient}`, `ui/{icons,frames,sprites,
backgrounds,design}` + `ui/soul-steel/…`, `textures/` as-is); `models/` adopts the proven
3D-asset-art per-asset package contract (`models/<collection>/<slug>/{README,manifest,boards,
prompts/,exports/}`); registries/ledgers gather in `_catalog/`; `scripts/` becomes `_tools/`.
Naming: kebab-case, no spaces, status tokens on workable assets (TGL PascalCase survives inside
`runtime/`).

**Migration is manifest-driven and reversible**: `tools/migrate-assets-library.mjs --plan` emits a
reviewable (and hand-editable) old→new CSV; `--execute` applies exactly that CSV — per-file renames,
plus explicit `delete` rows for regenerable ephemera only (the validator's past-TTL API cache +
`__pycache__`; its `CACHE_DIR` derives from the script location, so it repopulates at `_tools/.cache/`)
— and prunes emptied dirs; `--rollback` reverses every move (deletes are regenerable by definition).
The manifest is the undo map — essential because the library has no git history.

## Consequences

- **Asset-Studio patches** (one file each): `tools/build-asset-registry.mjs` folder rules
  (`deriveMediumType` areas, walk ignores, CSV-join path — the new names *simplify* the rules),
  then a full thumb rebake (names hash paths). `validate_asset_ids.py` CSV paths, the 3D-asset-art
  validator root, `library/README.md`'s dead `tgl-import.sh` pointer.
- **~30 agent surfaces need path updates**, inventoried 2026-07-03 (see the session memory
  `assets-library-redesign`): the `asset-conventions` skill chain **first** (dev source
  `Vault-Repositories/roblox-dev` → `assets-repo` marketplace → Claude + Codex installs), then
  Claude memories in four project spaces, CLAUDE/AGENTS.md in three, `~/.codex/config.toml:212`,
  three roblox-brain / one artificial-brain vault notes, and Trembus blockout docs.
- **Landmine**: `rbxasset://trembus/<Assets-relative-path>` URIs hardcode paths inside game code —
  internal moves break dev-time references. Execution includes a grep over
  `Repositories/Gaming/Roblox-Repositories` for `rbxasset://trembus/` + hardcoded asset paths.
- A stranger (or a fresh agent session) can now answer "where does X go" from folder names alone;
  the per-project rule keeps the structure stable as new games/projects arrive.
- One-time churn: consuming docs briefly reference two layouts until the checklist is walked.

## Options considered

- **Project-first split (`projects/<name>/` vs `shared/`)** — doubles the tree, forces a
  shared-vs-project call on every asset, recreates the empty-matrix problem; consumers reference
  upload ids, not paths, so physical co-location buys nothing.
- **`library/` wrapper over the mediums** — adds depth to the hottest paths and collides with the
  existing TGL meaning of "library" during migration.
- **Docs-only cleanup (keep the tree)** — leaves four logics interleaved; the confusion is
  structural, not documentary.
- **Pure medium purism (`images/{ui,textures,concept-art}`)** — deeper paths in the most-trafficked
  zones; game-art practice treats ui/textures/concept-art as sibling asset classes.

## Cites

- `tools/migrate-assets-library.mjs` — the plan/execute/rollback migration harness (this repo)
- `~/Master-Managed/Assets/__migration-manifest.csv` — the reviewable old→new manifest
  (`--execute` relocates it to `_catalog/migration-2026-07-03.csv`)
- `~/Master-Managed/Assets/library/README.md` — the TGL filename contract this decision preserves
- `Repositories/Vault-Repositories/roblox-dev/skills/asset-conventions/` — the conventions
  authority to update + republish first
- [[0002-adopt-medium-and-mediumtype-as-the-asset-explorer-taxonomy]] — the Explorer taxonomy,
  unchanged by this decision (only its folder-derivation inputs move)

## Re-open if

`_inbox/` rots (drops accumulate untriaged — the zone contract failed); a second platform target
arrives and `runtime/<platform>/<project>/` proves the wrong grain; or the library gains version
control (git + LFS), which would change the migration-safety calculus and the manifest's role as
the undo map.
