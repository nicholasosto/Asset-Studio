---
title: "Execute the Assets-library restructure and walk the surface checklist"
status: completed
updated: 2026-07-03
links:
  - { rel: references, target: decisions/0008-restructure-the-shared-assets-library-into-staging-library-r }
---

# Execute the Assets-library restructure and walk the surface checklist

> **Status:** completed (2026-07-03)

## Goal

Apply the reviewed migration manifest to `~/Master-Managed/Assets` (ADR 0008) and update every
tool, doc, and agent surface that referenced the old layout — one truth, no third generation of
drift.

## Success Criteria

- Migration executes with 0 missing sources and the tree reconciles per-zone against the manifest.
- Registry rebuilds with **identical medium counts** (image 362 · audio 59 · 3d 79) and 0 unknown.
- The Explorer renders the new tree with working 320px thumbs and the `_catalog` CSV join.
- Every live (non-historical) reference to a moved path is updated across repos, memories, skills.

## Source References

- `tools/migrate-assets-library.mjs` — the plan/execute/rollback harness
- `~/Master-Managed/Assets/_catalog/migration-2026-07-03.csv` (+ `.log.json`) — the applied manifest
- [[0008-restructure-the-shared-assets-library-into-staging-library-r]] — the decision

## Decisions

- Cache/pycache files became explicit `delete` rows (182) rather than migrating — regenerable,
  past TTL, and `CACHE_DIR` follows the script to `_tools/.cache/`.
- `runtime …/ui/screens` conformance carve-out keyed to `segs[3]`; machinery zones
  (`_archive/_catalog/_tools/.codex`) excluded from the registry scan.
- Historical records (shelved manifests, session notes, dated ADR bodies in other spaces) keep
  their old paths — only forward-looking guidance was rewritten.

## Outputs

- Migration executed: 282 moved · 182 deleted · 125 empty dirs pruned · log in `_catalog/`.
- Registry rebuilt: 576 records / 500 real mediums, medium tallies identical pre/post, ui 220→223
  and image 79→76 (the three adopted design concepts), 362 thumbs rebaked, 103 orphans pruned.
- Explorer verified live on `:5175` (500 shown, thumbs 200-serving at 320px, no console errors).
- Patched: `build-asset-registry.mjs` (rules/skips/CSV path), `_tools/validate_asset_ids.py` +
  `backfill_unique_kinds.py` + `validate-3d-asset-art.mjs` (roots/paths), new `Assets/README.md`,
  rewritten `models/` + `runtime/roblox/soul-steel/` + `_tools/` READMEs, Codex loop yaml +
  `~/.codex/config.toml` trust entry.
- Cross-repo fixes: `build-battle-room.lua` MASTER_DIR, `showcase/install.luau`, three Soul-Steel
  conventions docs, steel-city concept manifests/READMEs, `steel-city-tokens.ts` comment,
  testing-env `COMPATIBILITY.md` (sync root + example URIs → new zones).
- Agent-surface sweep delegated to three subagents: asset-conventions skill chain (source +
  3 distribution copies), project-space CLAUDE/AGENTS + vault notes, and cross-project memories.

## Blockers

- none (pre-existing: `models/pets-mounts/dragonling` never satisfied the package contract — the
  validator flags it in the old and new layout alike)

## Next Action

Commit the Asset-Studio changes (`ADR 0008`, migration harness, builder patch, regenerated
contracts + static bundle, this session).

## Handoff Notes

`rbxasset://trembus/` verification: live game code carries **no literal trembus URIs** (comments
only — assets are wired by uploaded id), so the internal moves broke nothing at runtime. The
Explorer registry now scans 11 zones with `_inbox` included; `previews/_assets` symlink and reveal
endpoint are root-anchored and unchanged. If anything surfaces missing, the reverse map is
`_catalog/migration-2026-07-03.csv` + `--rollback --confirm`.
