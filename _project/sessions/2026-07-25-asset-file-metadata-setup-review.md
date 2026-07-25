---
title: "Asset file metadata setup review"
status: active
updated: 2026-07-25
tags: { last-active: 2026-07-25T08:38, kos: "assets-library, explorer, mediums" }
---

# Asset file metadata setup review

> **Status:** active (2026-07-25)

## Goal

Answer "what is our asset file metadata setup like?" — trace the end-to-end metadata story for a
produced asset file: what metadata is written, where it lives (in-file · sidecar · xattr · ledger ·
registry), which tool owns each layer, and where the layers disagree.

## Success Criteria

- A written map of every metadata layer an asset file carries, each attributed to the tool that
  writes it and the consumer that reads it.
- Named gaps / drift between layers (e.g. sidecar vs registry vs upload ledger), not just a
  catalog of what exists.
- A recorded verdict on whether the setup needs a change (and if so, what the smallest one is) or
  is documentation-only this session.

## Source References

- `tools/build-asset-registry.mjs` — the Explorer's registry builder ([[asset-registry-pipeline]])
- `Assets/_tools/roblox_asset_metadata.py` + `asset_type_enum.py` + `validate_asset_ids.py` — the
  library-side metadata/ledger tooling ([[roblox-upload-registration]])
- `Assets/_catalog/roblox-upload-registry.jsonl` — the Roblox upload ledger
- `_project/mediums/` — per-medium capability cards (where sidecar rules are stated)
- `roblox-dev:asset-conventions` — the naming/folder grammar the filename layer encodes

## Decisions

- <decision made this session>

## First-Principles Candidates

<…>

## Outputs

- <artifact produced>

## Blockers

- <blocker, or “none”>

## Next Action

<the single next concrete action>

## Handoff Notes

<what the next session needs to know>
