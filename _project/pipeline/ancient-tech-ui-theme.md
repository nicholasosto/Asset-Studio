---
title: "Ancient-tech UI theme"
status: build
updated: 2026-07-24
links:
  - { rel: references, target: workflows/roblox-textured-ui-ux }
  - { rel: references, target: workflows/image-generation }
  - { rel: references, target: mediums/image }
---

# Ancient-tech UI theme

> **Status:** build (2026-07-24)

## Context

The first production application of the ancient-tech UI component language: generated concept
sheets were converted into a local `_BLK` theme with neutral structural body layers plus aligned,
white runtime-tintable signal layers. The work exercised [[roblox-textured-ui-ux]] across raster
extraction, 9-slice recipes, package integration, and an owned Studio specimen.

This run began in the legacy ignored `output/imagegen/` lane rather than an immutable generation
contract. Its large source/derived images remain there and its reviewed `_BLK` payloads remain in
the shared Assets library. The durable briefs, manifests, builders, and validators are now tracked
under `generation/runs/ancient-alien-ui-component-concepts/`,
`generation/runs/ancient-tech-ui-theme-p0/`, and
`generation/runs/ancient-tech-ui-theme-p1-tight/`.

Authority remains deliberately split: this pipeline records state and evidence; the tracked run
records preserve lightweight provenance; the shared library owns the PNGs; the consuming package
owns theme code; the selected Studio DataModel owns current rendering. No local `_BLK`, Studio
specimen, or passing Play check establishes upload, registry, package release, place save, or publish.

## Build plan

1. ~~**Lock the visual language**~~ — **done 2026-07-23.** Three ancient-tech component concept
   sheets defined obsidian mass, iridium lips, black gaskets, sparse cyan state signals, and live
   Roblox text/icons. Durable notes + manifest:
   `generation/runs/ancient-alien-ui-component-concepts/`.
2. ~~**Build the P0 raster slice**~~ — **done 2026-07-23.** Deterministically extract four aligned
   body/signal pairs plus one seamless obsidian tile; validate alpha, chroma removal, tintability,
   dimensions, and wrap edges. Durable recipe:
   `generation/runs/ancient-tech-ui-theme-p0/`.
3. ~~**Integrate the theme locally**~~ — **done 2026-07-23.** Add an opt-in theme/provider and
   image-backed primitives on the isolated `codex/ancient-tech-ui-theme` package branch; retain the
   image-free Tactical Futurism default for existing consumers.
4. ~~**Build and Play-check the Studio specimen**~~ — **done 2026-07-23.** Owned root
   `StarterGui.AncientTechUIThemeLab`; 47/47 image instances loaded, 37 visible live-text labels,
   and zero relevant console errors observed. Studio returned to Edit mode; no explicit save or
   publish action was invoked.
5. ~~**Repair the 9-slice transforms**~~ — **done 2026-07-24.** Union-crop each aligned
   body/signal pair, recalculate `SliceCenter`, enforce matching canvas/center/scale, keep one
   structural inset, and apply the requested layout polish. Durable recipe:
   `generation/runs/ancient-tech-ui-theme-p1-tight/`.
6. **Owner visual acceptance** — inspect the tight recipes at their supported sizes and choose
   which assets, if any, may promote from `_BLK` to `_FNL`.
7. **Optional shipping handoff** — only after separate authorization: upload under the intended
   owner/group, record IDs/checksums, substitute centralized `rbxassetid://` references in a
   game-owned catalog, and repeat the Studio/device checks against uploaded assets.

## Exit criteria

- Durable generation records cite every reusable brief, manifest, builder, and validator without
  duplicating the binary payload into Asset-Studio.
- Every body/signal pair uses the same source canvas, union crop, `SliceCenter`, and `SliceScale`;
  signal pixels stay white for runtime tinting.
- The local Studio proof loads every image and exercises idle, hover, pressed, selected, locked,
  disabled, focus, compact, and wide states without body/signal separation or live-text overflow.
- Owner acceptance is recorded before any `_FNL` promotion.
- Upload, registry, package release, place save, and place publish remain explicit later gates.

## Runs

```json
[
  {
    "id": "run-p0",
    "label": "P0 local body/signal theme slice",
    "status": "partial",
    "startedAt": "2026-07-23",
    "trigger": "interactive Codex production pass from the ancient-tech component concept family",
    "note": "Legacy out-of-contract run recovered into tracked generation records. Nine local _BLK rasters validated; opt-in package theme and owned Studio specimen passed Edit + disposable Play review. No upload, registry promotion, package release, save, or publish.",
    "stepOutcomes": [
      { "step": "lock-brief", "status": "done" },
      { "step": "choose-rendering", "status": "done" },
      { "step": "write-art-contract", "status": "done" },
      { "step": "generate-art", "status": "done" },
      { "step": "preflight-images", "status": "done" },
      { "step": "file-blockout", "status": "done" },
      { "step": "build-studio-proof", "status": "done" },
      { "step": "wire-behavior", "status": "done" },
      { "step": "device-qa", "status": "done" },
      { "step": "quality-qa", "status": "done" },
      { "step": "accept", "status": "pending" }
    ],
    "outputs": [
      { "label": "generation/runs/ancient-alien-ui-component-concepts/", "kind": "doc" },
      { "label": "generation/runs/ancient-tech-ui-theme-p0/", "kind": "doc" },
      { "label": "StarterGui.AncientTechUIThemeLab — local Studio proof", "kind": "doc" }
    ]
  },
  {
    "id": "run-p1-tight",
    "label": "Tight-crop repair + P2 layout polish",
    "status": "partial",
    "startedAt": "2026-07-24",
    "trigger": "owner review found body/signal separation and excess transparent inset",
    "note": "Eight new _BLK frame layers added without overwriting P0. Twenty-three body/signal pairs repaired in the specimen; 47/47 images loaded, zero slice mismatches, zero live-text overflow, three requested layout corrections verified, zero relevant console errors observed. Owner promotion gate remains open.",
    "stepOutcomes": [
      { "step": "write-art-contract", "status": "done" },
      { "step": "generate-art", "status": "done" },
      { "step": "preflight-images", "status": "done" },
      { "step": "file-blockout", "status": "done" },
      { "step": "build-studio-proof", "status": "done" },
      { "step": "device-qa", "status": "done" },
      { "step": "quality-qa", "status": "done" },
      { "step": "accept", "status": "pending" }
    ],
    "outputs": [
      { "label": "generation/runs/ancient-tech-ui-theme-p1-tight/", "kind": "doc" },
      { "label": "StarterGui.AncientTechUIThemeLab — repaired local proof", "kind": "doc" },
      { "label": "ReplicatedStorage.AncientTechUIRepairBackups — local rollback snapshots", "kind": "doc" }
    ]
  }
]
```

## Verification evidence

- P0 raster validator: `PASS: 9 ancient-tech UI raster assets validated`.
- P1 validator: `PASS: 8 tight ancient-tech UI frame layers validated`.
- P1 manifest records 23 repaired pairs / 46 updated layers, 47/47 loaded image instances, zero
  body/signal slice mismatches, 37 visible live-text labels, zero overflow instances, and zero
  observed console errors.
- The original ignored binary working sets remain preserved under
  `output/imagegen/ancient-tech-ui-theme-p0/` and
  `output/imagegen/ancient-tech-ui-theme-p1-tight/`.
