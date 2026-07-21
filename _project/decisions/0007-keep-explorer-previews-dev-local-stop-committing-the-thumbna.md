---
title: "Keep Explorer previews dev-local — stop committing the thumbnail bake"
status: accepted
updated: 2026-07-02
links:
  - { rel: references, target: decisions/0005-bake-asset-studio-owned-image-thumbnails-in-the-registry-bui }
  - { rel: references, target: roadmap/migrate-asset-explorer-into-the-command-center }
---

# Keep Explorer previews dev-local — stop committing the thumbnail bake

> **Status:** accepted (2026-07-02)

## Context

[[0005-bake-asset-studio-owned-image-thumbnails-in-the-registry-bui]] committed the baked
`previews/thumbs/` PNGs (362 files, ~9 MB) **because** the static `:4317` site serves straight off
disk and the Explorer was to work with previews from a clean checkout. The owner has since dropped
that requirement (2026-07-02): **the Asset Explorer does not need a published view** — previews only
need to work where the owner actually browses assets (the dev server, or a machine that has run the
builder). Committing the bake bought publish-parity nobody needs, at the cost of 362 binary files of
repo weight that re-diff whenever source art changes, and it pinned the bake at a repo-friendly 144px
— which the tiles then upscaled ~1.7×, visibly blurry.

## Decision

The thumbnail bake becomes a **local cache**: `previews/thumbs/` is gitignored and untracked
(`git rm -r --cached`), while `build-asset-registry.mjs` keeps baking exactly as before —
same path-hash names, same always-rebake + prune semantics, same `--no-thumbs` reuse. Freed from
repo weight, the bake resolution rises **144px → 320px** (crisp at 2× DPR in the ~150–190px tiles).

Everything else stays: `previews/app/` (the static Command Center bundle) and the
`previews/_assets` symlink remain committed — the planning dashboard is still published; it is only
the Explorer's *preview payload* that is dev-local now. On a machine with no bake, tiles degrade to
the ext-glyph plates (the pre-CF-1 look); the registry's `thumb` fields still resolve wherever a
bake exists because names hash the library path, not content.

## Consequences

- Repo sheds 362 binary artifacts and all future thumb-churn diffs; asset edits no longer produce
  binary noise in `git status`.
- Thumbnails are **sharper** (320px source for ~175px tiles) — the committed-size constraint was
  the only reason for 144px.
- A fresh clone's static `:4317` Explorer shows glyphs-not-thumbs until `node
  tools/build-asset-registry.mjs` runs once on that machine (macOS/`sips`; `--no-thumbs` cannot
  bootstrap a first bake). Accepted: single-owner, single-machine reality.
- ADR 0005's bake mechanics stand unchanged; only its "the PNGs are committed" clause is
  **superseded** by this decision.

## Options considered

- **Keep committing at 144px** — status quo; pays repo weight for a publish-parity requirement the
  owner explicitly dropped, and keeps the blurry upscale.
- **Retire the static Explorer surface entirely** (hide the tab in `previews/app/`) — more invasive
  than the ask; the static bundle is one SPA, and the Explorer still works there wherever a local
  bake exists. Revisit under roadmap P5 if the published Explorer confuses anyone.
- **Commit larger (320px) thumbs** — doubles down on the weight this reverses (~9 MB → more).

## Cites

- `tools/build-asset-registry.mjs` — `buildThumbs()` (now `-Z 320`), `THUMBS_DIR`, `--no-thumbs`
- `.gitignore` — `previews/thumbs/`
- [[0005-bake-asset-studio-owned-image-thumbnails-in-the-registry-bui]] — the bake this keeps, minus its commit clause
- [[0004-serve-the-shared-asset-library-to-the-command-center-spa]] — `/thumbs` serving, unchanged in both contexts

## Re-open if

The Explorer ever needs a truly published view again (multi-machine or shared-link use) — then either
recommit a small bake or add a build-time bake step to the static publish; or a portable
(non-`sips`) baker lands and makes fresh-clone bakes trivial everywhere.
