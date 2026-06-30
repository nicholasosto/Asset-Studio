---
title: "Reference the shared asset library via external-locations"
status: accepted
updated: 2026-06-30
---

# Reference the shared asset library via external-locations

> **Status:** accepted (2026-06-30)

## Context

Asset production (images, audio, 3D) had no dedicated planning home — its processes lived as sub-plans
inside game spaces (e.g. Soul-Steel's `inner-doll-1-asset-pipelines.md`). Meanwhile the *assets
themselves* already live game-independently at `~/Master-Managed/Assets/` (the canonical library +
`ai-output/` staging + a 193-id registry under `scripts/`). Standing up Asset-Studio as the
game-agnostic **process** layer raises one load-bearing question: where do the assets live relative to
this space?

## Decision

Asset-Studio **references** the shared library — it does not contain or duplicate it. Two symlinks under
`external-locations/` bind the space to the canonical sources:

- `assets → ~/Master-Managed/Assets/` (library + `ai-output/` staging + validators)
- `canonical → …/LLM-Agent-Development/canonical/` (the visual-grammar kit + skills)

The library keeps its own taxonomy and the 193-id registry; Asset-Studio's `_project/` plans the
**processes** that fill it. Two ingestion patterns carry forward from the existing pipeline doc:
**Pattern A** (symlink, zero-upload) for 2D/audio, **Pattern B** (Studio upload into
`ServerStorage.TrembusGameLibrary`) for 3D. Symlink *targets* are gitignored — the links are tracked,
the payload is not.

## Consequences

- **Easier:** one source of asset truth; no drift between a copy and the library; the registry stays
  single-owned; planning stays game-agnostic and reusable across consumers.
- **Harder:** Asset-Studio depends on the library's on-disk location (a move breaks the symlinks — see
  Re-open if); the repo is not self-contained (cloning it elsewhere needs the library present or the
  links repaired).

## Options considered

- **Copy/vendor assets into Asset-Studio** — rejected: duplicates the canonical store and the 193-id
  registry, and guarantees drift (the exact failure the SS command-center migration just fixed).
- **Nest Asset-Studio inside a game space** — rejected: re-couples production to one game; the entire
  motivation is a game-agnostic factory.
- **Document absolute paths only (no symlinks)** — rejected: the skills/tools (kit build, validators)
  expect a stable relative path (`external-locations/assets/...`).

## Cites

- `external-locations/references/source-locations.md` (the path map + Pattern A/B)
- `~/Master-Managed/Assets/` (canonical library + `scripts/validate_asset_ids.py`)
- Soul-Steel-Official `_project/roadmap/inner-doll-1-asset-pipelines.md` (Pattern A/B origin)

## Re-open if

The shared library moves or is replaced, or a second independent consumer of Asset-Studio's outputs
needs an ingestion path the symlink model can't express.
