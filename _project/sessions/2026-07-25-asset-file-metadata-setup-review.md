---
title: "Asset file metadata setup review"
status: completed
updated: 2026-07-26
tags: { last-active: 2026-07-25T08:38, kos: "assets-library, explorer, mediums" }
---

# Asset file metadata setup review

> **Status:** completed (2026-07-26)

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

- **Six metadata layers, one closed loop** — filename + folder path (derived, drive the whole
  Explorer), generation xattrs, Finder comment, `.trembus.json` / `.trembus.md` sidecars, and the
  Roblox upload ledger. Only the upload layer had a write→validate→read loop; that is exactly why
  it sat at 36/36 while the generation layer drifted to 14%.
- **Read the xattrs rather than retire them** (the cheap option of the two) —
  `build-asset-registry.mjs` now attaches `rec.gen` (preset · stylePack · transparent ·
  aspectRatio) and a `counts.generation` coverage block. Chose measurement before schema work:
  the coverage number tells us whether the metadata earns a bigger investment.
- **Eligibility is images, the read is wider** — `trembus-image` is a raster pipeline, so coverage
  is measured against the 331 image records (47 tagged, 14%). The xattr read still probes all 490
  real-medium records so a tagged model can't hide; it would surface as `taggedOffMedium`
  (currently 0). Measuring against 490 would have diluted the gap to 10% and made the Explorer's
  untagged worklist useless by padding it with 159 models and audio files.
- **`--no-xattrs` warns, a missing `xattr` binary aborts** — mirrors the existing all-thumbs-failed
  guard. Silently emitting a registry with `rec.gen` stripped everywhere would regress the
  committed contract at exit 0; the abort fires before the thumb bake, so it fails fast.
- **Malformed values survive verbatim** — `transparent` becomes a boolean only for exactly
  `"true"`/`"false"`, otherwise the raw string is kept, so a bad write is visible in the contract
  rather than silently coerced to `false`.

## First-Principles Candidates

- A metadata layer without a validator will drift to near-zero coverage; the layer that had one sat
  at 36/36 while four that didn't sat at 0–14%. "Who reads this back?" is the question that decides
  whether a write is a feature or a no-op → memory (asset-registry / pipeline craft)
- Coverage denominators are a design decision, not a detail: the same 47 tagged files read as 14%
  (of eligible images) or 10% (of all real mediums), and only the first produces a usable worklist.
  Scope the denominator to what was actually in scope for the writer → memory
- Reading N files' xattrs is one chunked `xattr -l` call, not N — but multi-file output is
  `path: key: value` where both key and value may contain `": "`, so parse against the exact set of
  paths you asked about instead of splitting greedily → memory (shell/tooling craft)
- A CSS grid child with a definite `grid-row` and an auto column is placed BEFORE auto-placed
  siblings, so it claims column 1 and shoves them right; pin both axes when you mean "top right"
  → memory (frontend craft; cost a real layout bug in the artifact)

## Outputs

_(reconstructed at close-out, 2026-07-26)_

- Commit `7f849ff` — "Registry reads the generation xattrs; Explorer surfaces them" (7 files,
  +596/−19): `tools/build-asset-registry.mjs` attaches `rec.gen` + `counts.generation`;
  `apps/command-center/src/registry.ts` + `AssetExplorer.tsx` add the Generation facet
  (Tagged 47 / Untagged 284) and four inspector rows; registry, static bundle and dashboard
  contracts rebuilt.
- The metadata-layer map itself, recorded in this file's Decisions section: six layers (filename +
  folder path, generation xattrs, Finder comment, `.trembus.json` / `.trembus.md` sidecars, Roblox
  upload ledger), each attributed to its writer and reader.
- Measured coverage baseline: generation xattrs 47/331 images (14%), `taggedOffMedium` 0, against
  the upload ledger's 36/36.

## Blockers

- None.

## Next Action

_(reconstructed at close-out, 2026-07-26)_ — Decide whether the 14% generation-xattr coverage
earns a backfill: the Explorer's Untagged facet (284 images) is now the worklist, and the
measurement was taken explicitly to answer that question.

## Handoff Notes

_(reconstructed at close-out, 2026-07-26)_

- The session's governing finding: **a metadata layer without a validator drifts to near-zero
  coverage.** Only the upload ledger had a write→validate→read loop, and only it sat at 36/36.
  The generation layer now has a reader; it still has no validator.
- Two layers remain write-only and unmeasured — Finder comments and the `.trembus.*` sidecars.
  Neither was instrumented this session.
- `--no-xattrs` produces a registry with `rec.gen` stripped everywhere; that output must never be
  committed. A missing `xattr` binary aborts at exit 1 before the thumb bake.
- Four First-Principles Candidates are queued in this file for /reflect or memory capture,
  including the chunked `xattr -l` parsing rule and the CSS definite-`grid-row` placement trap.
