---
title: "Explorer asset actions: dev-only move endpoint, warn-don't-write on the Roblox ledger"
status: accepted
updated: 2026-07-18
links:
  - { rel: references, target: decisions/0006-reveal-in-finder-and-copy-asset-id-from-the-explorer }
  - { rel: references, target: decisions/0008-restructure-the-shared-assets-library-into-staging-library-r }
---

# Explorer asset actions: dev-only move endpoint, warn-don't-write on the Roblox ledger

> **Status:** accepted (2026-07-18)

## Context

The Asset Explorer's cosmetic upgrade (TCL ui 0.4.0 → 0.8.x) added a per-asset **command bar** —
an inspector Toolbar + a tile ⋯ kebab Menu — whose action set includes *file moves*: "Move to
`_resort`" (triage pen) and "Move to `_archive`" (retirement). Moves are a mutation of the shared
Assets library from a browser UI, which forces three calls: how the endpoint is scoped and
hardened, what a move does to the Roblox upload ledger's exact-path join
(`record.p === row.local_path` — a move silently orphans it), and what the undocumented-but-live
`_resort/` zone actually is.

## Decision

`POST /api/move` lives in the dev server's `liveAssets()` plugin (`apply:'serve'` — **dev only**,
exactly like `/api/reveal`, whose hardening it mirrors line-for-line: POST-only, localhost-Origin
CSRF gate, 4 KB body cap, single-buffer decode, null-byte reject, per-request realpath'd Assets
root, `within()` containment on the source **and** the destination parent). On top of that:

- **`dest` is a server-owned enum** (`resort | archive`), never a caller path — a free-form
  destination would be an arbitrary-write primitive over the library. Destinations:
  `_resort/<basename>` (flat, matching the zone) and `_archive/<YYYY-MM-DD>-explorer/<basename>`
  (matching the dated-retirement convention).
- **Collisions abort with 409** (migrate-assets-library parity) — no silent suffixing in a
  non-git tree; the human resolves in Finder.
- **Respond first, rebuild in background**: the endpoint answers `{ok, from, to}` immediately,
  then runs `tools/build-asset-registry.mjs` as a single-flight coalesced subprocess (the
  liveContract pattern). Waiting would be pointless — the rewritten registry JSON full-reloads
  the page, wiping the very feedback the client is showing.
- **The Roblox ledger is never written** (warn-don't-write): moving a joined record shows a
  confirm dialog naming the assetId and stating the mapping orphans until
  `_catalog/roblox-upload-registry.jsonl`'s `local_path` is hand-edited. `_archive` always
  confirms; `_resort` confirms only when a ledger join is at stake.
- **Static-site degradation is disabled-with-reason**, gated on `import.meta.env.DEV` (exact —
  the route exists iff dev): unlike reveal there is no honest fallback, so the move controls
  render disabled with a "Dev server only" hint and never probe.
- **`_resort/` is now documented** in the library README Map: the flat triage pen — scanned and
  visible in the Explorer (unlike skip-listed `_archive/`), transient like `_inbox/`.
- **"View online"** is constructed from the verified assetId
  (`creatorStoreUrl ?? https://create.roblox.com/store/asset/<id>`; click-tested 2026-07-18 —
  the store URL returns 200 directly for an unlisted uploaded Image, so it leads; the Creator
  Dashboard configure page is the overflow-menu alternative). Both stay checksum-gated.

## Consequences

- Triage happens where the assets are seen: pull-to-`_resort` and retire-to-`_archive` are one
  menu action + one auto-rebuild, with the registry (thumbs, joins, counts) self-healing.
- A moved Roblox-joined file **knowingly** orphans its upload row until the ledger is hand-fixed
  — visible immediately as `orphaned` in the registry diagnostics bar. Ledger rewriting is
  deliberately deferred until a real workflow demands it.
- The static `:4317` Explorer stays read-only; nothing mutates outside `pnpm dev`.
- Every-move full rescans are seconds-cheap today (~560 records); an incremental path is not
  worth its complexity yet.

## Options considered

- **Free-form destination path** — rejected: turns a triage affordance into an arbitrary-write
  primitive; the two zones are the only sanctioned targets.
- **Auto-updating the ledger `local_path` on move** — rejected for v1: the endpoint would write
  the canonical `_catalog` paper trail; blast radius outweighs the 8 affected records.
- **Blocking moves on Roblox-joined records** — rejected: those records are precisely the ones
  worth triaging; an informed confirm beats a wall.
- **Suffixing on collision** — rejected: silent duplicates in a non-git tree are unaccountable.

## Cites

- `apps/command-center/vite.config.ts` (`/api/move`, single-flight rebuild)
- `apps/command-center/src/assetActions.ts` (action vocabulary · confirm fact sheet)
- `~/Master-Managed/Assets/README.md` Map — the `_resort/` row (edit recorded here; the library
  is not a git repo)

## Re-open if

A real pipeline needs moves to *preserve* the Roblox join (then build ledger rewriting with its
own audit trail), moves need to run outside the dev server, or `_resort/` grows structure that
contradicts "flat triage pen".
