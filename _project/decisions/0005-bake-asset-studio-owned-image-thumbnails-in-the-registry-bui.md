---
title: "Bake Asset-Studio-owned image thumbnails in the registry builder"
status: accepted
updated: 2026-07-01
links:
  - { rel: references, target: roadmap/migrate-asset-explorer-into-the-command-center }
---

# Bake Asset-Studio-owned image thumbnails in the registry builder

> **Status:** accepted (2026-07-01)

## Context

The migrated Asset Explorer rendered image tiles as ext-glyph placeholders because `asset-registry.json`
carried no `thumb` — the v1 builder deferred thumbnail generation (part of CF-1, the Phase-5 blocker on
[[migrate-asset-explorer-into-the-command-center]]). The to-be-retired Soul-Steel `asset-explorer.html` (roadmap p5) has working
thumbnails: its generator baked 144px PNGs with macOS `sips`. We want that fidelity for the 362 image assets
(png · jpg · jpeg · webp) without (a) touching the vendored zero-dep framework, (b) writing into the read-only
shared library ([[0001-reference-the-shared-asset-library-via-external-locations]]), or (c) reusing the
Soul-Steel-owned thumbs directory.

Empirically verified this session: `sips` is present (`/usr/bin/sips`); the `-Z 144 -s format png` recipe
succeeds on all sampled images **including the lone `.webp`** (362 baked / 0 failed); output is
**byte-deterministic** (two bakes of the same source are sha-identical → re-baking causes no git churn);
footprint is **~9.3 MB across 362 files**.

## Decision

Add a `buildThumbs()` pass to the **project-owned** `tools/build-asset-registry.mjs` (the zero-dep rule binds
`.project-system/`, **not** `tools/`, so this tool may shell out). For every `medium === 'image'` record it runs
`sips -Z 144 -s format png <src> --out previews/thumbs/<sha1(p)[:12]>.png` into a **new Asset-Studio-owned** cache
`previews/thumbs/` (not the Soul-Steel `asset-explorer-thumbs/`), and sets `rec.thumb` to the **bare filename**;
the app builds the URL at render time (`thumbUrl` → `/thumbs/<name>`) and feeds it to the Trembus `MediaFrame`
as the image poster/src — **no TCL change**. The bake is:

- **Always rebake** (no mtime skip) — the thumb name hashes the **path**, not content, so an mtime-based
  skip would keep a **stale** thumbnail after a same-path content swap that preserved mtime (`cp -p`,
  `rsync -a`, restore, `git checkout` of an older-authored asset) while the served `src` streams the new
  bytes. `sips` output is byte-stable, so unconditional rebaking is correct at the cost of only seconds of
  CPU and **zero git churn**. (`--no-thumbs` skips the pass entirely.)
- **Fail-soft** — on any `sips` error, delete `rec.thumb`, leaving the field **absent** (the field-presence
  contract) so the tile placeholders. Covers future unreadable formats with no special-casing.
- **Skippable** — a `--no-thumbs` flag yields fast metadata-only runs; `--print-json` stays a pure,
  side-effect-free metadata dump (the bake + symlink calls sit after its early return — verified: `--print-json`
  emits no `thumb`/`src` and writes nothing).

The generated PNGs are **committed** to git (~9.3 MB / 362 files). This matches the Soul-Steel precedent and the
already-committed `previews/app/`, and is required because the static preview server (`python3 -m http.server
--directory previews`, no build step) serves the files straight off disk. Nothing is added to `.gitignore`.

## Consequences

- The Explorer shows real image thumbnails from a clean checkout on both dev and the static `:4317` site —
  closing the image half of CF-1. Tiles load the small `/thumbs/` PNG (not the full image), so a 362-image grid
  stays light (verified: tiles fetch only `/thumbs/`, never `/_assets/`).
- **Determinism preserved:** no wall-clock in the thumb derivation (the only clock read stays the `built/builtMs`
  stamp); `sips` output is byte-stable, so re-baking unchanged sources rewrites byte-identical PNGs → no git diff.
- **Adds a macOS-only dependency (`sips`) to the full build path.** Non-mac contributors run `--no-thumbs`
  (Explorer falls back to placeholders — same as before) until a portable baker (sharp/ImageMagick) lands.
  Acceptable: this repo is authored on macOS and the baked PNGs are committed, so readers/CI consume them without
  needing `sips`.
- Audio/3D previews are **out of scope here** — they stream from the served full-asset URL
  ([[0004-serve-the-shared-asset-library-to-the-command-center-spa]]), not a baked cache. This ADR is image
  thumbnails only; 3D poster-baking (a headless render) is a possible future pass.
- `previews/thumbs/` joins `previews/app/` as a committed generated artifact; the two-build-steps regen story is
  unchanged (`render-hub.mjs` for the planning contract; `build-asset-registry.mjs` for the Explorer — the latter
  now also bakes thumbs and self-heals the `previews/_assets` symlink). See [[asset-registry-pipeline]].

## Options considered

- **Reuse the Soul-Steel `asset-explorer-thumbs/`.** Rejected: cross-repo coupling to a space we're retiring;
  Asset-Studio must own its cache.
- **Portable baker (sharp / ImageMagick) now.** Rejected for v1: adds an npm/native dep and yields visually
  identical 144px PNGs; `sips` is already present and the output is committed. Left as a follow-up for non-mac.
- **Generate thumbnails in the app / on the fly.** Rejected: the static site has no runtime; thumbnails must be
  pre-baked to disk.

## Cites

- `tools/build-asset-registry.mjs` — `buildThumbs()`, `thumbName()`, `--no-thumbs`, `previews/thumbs/`
- `apps/command-center/src/registry.ts` — `thumbUrl(thumb)` resolves the bare name to `/thumbs/<name>`
- [[0004-serve-the-shared-asset-library-to-the-command-center-spa]] — how `/thumbs/` is served in both contexts
- [[asset-registry-pipeline]] — the Explorer's data pipeline this extends

## Re-open if

A non-macOS contributor or CI needs to regenerate thumbnails (add the portable baker), or 3D/audio assets want
baked posters (a separate headless-render pass).
