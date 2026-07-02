---
title: "Serve the shared asset library to the Command Center SPA"
status: accepted
updated: 2026-07-01
links:
  - { rel: references, target: roadmap/migrate-asset-explorer-into-the-command-center }
---

# Serve the shared asset library to the Command Center SPA

> **Status:** accepted (2026-07-01)

## Context

The migrated Asset Explorer rendered every asset as a placeholder plate — parity gap **CF-1**, the blocker
for Phase 5 of [[migrate-asset-explorer-into-the-command-center]]. To show real image/audio/3D previews it
needs the shared, game-independent library (`~/Master-Managed/Assets`, reached read-only via
`external-locations/assets` — [[0001-reference-the-shared-asset-library-via-external-locations]]) plus baked
thumbnails ([[0005-bake-asset-studio-owned-image-thumbnails-in-the-registry-bui]]) reachable as HTTP URLs.
The SPA runs in **two mount contexts that must behave identically**:

- **dev** — Vite at `:5175`, app mounted at `/`.
- **static** — `python3 -m http.server 4317 --directory previews`, with the built SPA (`base: './'`,
  `outDir: previews/app`) served at `/app/`.

The Soul-Steel original (retirement pending — roadmap p5) served media via a **relative** `../_assets/<p>` URL, which worked only
because its consumer HTML sat one level under `previews/`. A relative scheme is `document.baseURI`-dependent
and does **not** resolve identically across our two mounts, and a dev middleware needs a *fixed* prefix to
intercept. Empirically verified (this session, Python 3.12): `http.server` **follows** a directory symlink,
**decodes** `%20`, and still **blocks** `..` traversal — so the static side needs only a symlink, no code.

## Decision

Serve under **two absolute URL prefixes** that resolve the same in both contexts:

- **`/_assets/<per-segment `encodeURIComponent` of the library-relative path `p`>`** — full media.
- **`/thumbs/<baked-thumbnail filename>`** — thumbnails.

**Static server:** rooted at `previews/`, so `/_assets/*` → `previews/_assets/*` (a committed symlink to the
library realpath) and `/thumbs/*` → `previews/thumbs/*`. **Zero server code.**

**Dev server:** a `configureServer` middleware (`asset-studio:live-assets`, `apply: 'serve'`, sibling to
`liveContract` in `apps/command-center/vite.config.ts`) intercepts the same two prefixes, `decodeURIComponent`s
each path segment, **contains** the result to the resolved root (403 on escape), sets `Content-Type` by
extension, and streams the file; a miss falls through to Vite. It streams from the library **realpath**, so no
`server.fs.allow` change is needed. The same plugin hosts `POST /api/reveal`
([[0006-reveal-in-finder-and-copy-asset-id-from-the-explorer]]).

The `previews/_assets` symlink is **created idempotently** by `tools/build-asset-registry.mjs`
(`ensureAssetsLink()`) **and committed as a tracked symlink** — per the `.project-system` convention of
tracking the link, not the payload (mirrors the already-committed `external-locations/assets`). App code gets
`assetUrl(p)` + `thumbUrl(thumb)` helpers in `src/registry.ts`; the builder also bakes each real record's
`src` as a ready `/_assets/…` URL so the frame-data mapper stays a pure pass-through.

## Consequences

- **One scheme, both contexts.** App code emits absolute `/_assets` + `/thumbs` URLs with no per-context
  branching; dev parity is a ~40-line plugin, static parity is a symlink. Verified live on both `:5175` (dev
  middleware) and a `python3 -m http.server` static mount: image tiles, full images, audio, and a glTF
  turntable all render, 0 console errors, 0 failed requests.
- **No library duplication.** Media streams live through the read-only symlink; nothing is copied. Only
  thumbnails (small, baked) are materialized.
- **Portability is machine-scoped, by design.** The committed `previews/_assets` target is absolute
  (`/Users/nicholasosto/Master-Managed/Assets`), consistent with
  [[0001-reference-the-shared-asset-library-via-external-locations]]. On a machine without that path, static
  media 404s (committed thumbnails still render) until the link is repointed.
- **Security.** `http.server` blocks `..` (verified); the dev middleware re-checks containment against the
  realpath'd root (literal and `%2e%2e`-encoded traversals both return 403 — verified). Both expose the
  library **read-only** over localhost — fine for a local dev/preview tool, not a public deployment.
  *Amended 2026-07-01 (deep review):* "over localhost" was only true of the dev server — `python3 -m
  http.server` binds ALL interfaces by default and auto-lists directories through the `_assets` symlink,
  so the `previews-static` launch config now passes an explicit `--bind 127.0.0.1`. Residual asymmetry:
  python blocks only `..` and follows symlinks, so a symlink placed *inside* the library would be served
  on static; the dev middleware's realpath containment would 403 it.
- **Deferred:** HTTP range/`206` is not implemented — fine for `<img>`, the AudioWaveform player, and glTF
  GETs at this corpus size. Add `Accept-Ranges` only if audio scrubbing needs it.

## Options considered

- **Relative `../_assets/` from `document.baseURI`** (the original's scheme). Rejected: resolves differently
  at `/` (dev) vs `/app/` (static) and gives the dev middleware no fixed prefix to intercept.
- **An Asset-Studio-owned poster/thumbnail cache for *everything* (copy full media in).** Rejected: violates
  the never-duplicate-the-library rule and bloats the repo; only downscaled thumbnails are materialized.
- **A standing node file server for both contexts.** Rejected: the static site is a committed artifact that
  should serve off plain `http.server`; a symlink + a dev-only plugin is less surface.

## Cites

- `apps/command-center/vite.config.ts` — the `liveAssets()` dev plugin (`/_assets`, `/thumbs`, `/api/reveal`)
- `apps/command-center/src/registry.ts` — `assetUrl` / `thumbUrl` / `assetsRootAbs` / `absPathOf`
- `tools/build-asset-registry.mjs` — bakes `src`, `ensureAssetsLink()`, the committed `previews/_assets`
- [[0005-bake-asset-studio-owned-image-thumbnails-in-the-registry-bui]] · [[0006-reveal-in-finder-and-copy-asset-id-from-the-explorer]]

## Re-open if

The static site must serve from a non-root mount (revisit absolute vs relative), a non-macOS/CI host needs
the media (repoint or containerize the link), or audio scrubbing needs HTTP range support.
