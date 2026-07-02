---
title: "Reveal in Finder and copy asset id from the Explorer"
status: accepted
updated: 2026-07-01
links:
  - { rel: references, target: roadmap/migrate-asset-explorer-into-the-command-center }
---

# Reveal in Finder and copy asset id from the Explorer

> **Status:** accepted (2026-07-01)

## Context

The migrated Explorer's inspector ended in a **disabled ghost** IconButton ("Open in library") tooltipped
"isn't wired in yet" — a visible parity gap against the to-be-retired Soul-Steel `asset-explorer.html` (roadmap p5), which let you
(1) reveal any asset in Finder and (2) copy its ids. We want both, without a standing backend and without ever
revealing a path outside the shared library. This is the last slice of CF-1 on
[[migrate-asset-explorer-into-the-command-center]].

Two runtime surfaces exist (`.claude/launch.json`): the dev server (Vite `:5175`) and the committed static site
(`python3 -m http.server :4317`). The static server **cannot handle POST**. Reveal is a native side effect
(`open -R`) — inherently local, only meaningful on the developer's own machine.

Verified this session: `open -R "<abs asset>"` returns exit 0; `realpath(external-locations/assets)` is
`~/Master-Managed/Assets`; a realpath-then-prefix containment check accepts a real asset and blocks
`../../../../etc/passwd` (both literal and `%2e%2e`-encoded → 403).

## Decision

### 1 — Reveal-in-Finder (dev endpoint) + copy-path fallback (everywhere else)

Add a dev-only `POST /api/reveal { path }` to the `liveAssets` Vite plugin
([[0004-serve-the-shared-asset-library-to-the-command-center-spa]]) that runs `open -R <abs>`. **The client
sends the library-relative `p`**; the server prefixes the realpath'd Assets root, so a caller can never name an
absolute target (least authority). The guard: strip any `external-locations/assets/` prefix + leading slashes,
`realpathSync(join(root, rel))`, and require the result to equal or sit under `root + '/'` — else 403. Use
`execFile('open', ['-R', abs])` (arg array, no shell), a 5 s timeout, a 4 KB body cap, and a NUL-byte reject.

We do **not** stand up a node server for the static `:4317` site (rejected below). Instead the client treats
**any** reveal failure — no route (the whole static site → python `501`), non-2xx, or throw — as one branch:
copy the **absolute** path to the clipboard and flash "No helper — path copied", so the user pastes into Finder's
Go-to-Folder (⇧⌘G). One code path covers "dev with helper" and "static without".

### 2 — Copy asset id (`p` · absolute · `reg.id`)

The inspector footer replaces the disabled button with an action row:
- **Copy path** → the library-relative `p` (the primary, stable id the whole app keys on).
- **Reveal in Finder** → reveal, degrading to copy-absolute (§1); the abs path also rides in the button's Tooltip.
- **Copy id** → `rbxassetid://<reg.id>`, rendered **only when `record.reg` exists**.

Clipboard writes use `navigator.clipboard.writeText` with a `<textarea>` + `document.execCommand('copy')` fallback
(ported from the original) so copy also works in a non-secure-context webview. The absolute path comes from
`assetsRootAbs` (= `realpathSync(ASSETS_ROOT)`), baked into the registry payload and exported as `absPathOf(r)`.

**On the corpus as first shipped, `record.reg` was empty (0/769)** and "Copy id" was therefore absent: the
master asset-id CSV keys on Roblox-catalog upload *names* (only 8/193 rows carry one). *Amended 2026-07-01
(deep review):* the "none match" premise was partly a join **bug**, not pure data reality — CSV names carry a
`"Collection: name"` display prefix that the key derivation kept, so 2 ok-status rows that DO correspond to
local files never joined. `joinRegistry` now strips the prefix → `reg` is 2/769 and "Copy id" surfaces for
those records. The always-available id remains `p`.

## Consequences

- Dev gets true one-click reveal (verified: `POST /api/reveal` → `{ok:true}`, Finder focuses the file, button
  flashes "Shown in Finder ✓"); the static site degrades cleanly to copy-abs — no new server, no launch-config
  change, no standing process, zero new prod deps.
- The reveal endpoint is a **hard allow-list** to `~/Master-Managed/Assets`; path-traversal and symlink-escape are
  blocked at realpath (403 verified for literal and `%2e%2e` inputs). It never writes.
- The disabled-button markup and its orphan CSS (`.cc-explorer__disabledwrap`) are removed; the `IconButton`
  import stays (still used by Clear-search). A transient inline flash label confirms each action.
- **Clipboard note:** copy could not be exercised end-to-end in the headless preview (clipboard is permission-
  sandboxed there — `readText` → `NotAllowedError`); the helper is standard + ported from the working original,
  localhost is a secure context for real users, and the reveal→copy fallback shares the same helper.
- "Copy id" depends on the CSV `reg` join yielding matches (a data question, above), not on more code.

## Options considered

- **A tiny project-owned node server (`tools/serve-previews.mjs`) replacing the `previews-static` python launcher**
  to serve `previews/` + handle `/api/reveal`. Rejected: new surface + a launch swap to buy reveal on the
  rarely-used static path, when copy-abs already degrades cleanly there. Revisit only if reveal-from-the-committed-
  site becomes a real workflow.
- **Client sends the absolute path to `/api/reveal`.** Rejected as the primary shape: sending `p` lets the server
  own the containment root (least authority).
- **`file://` reveal / `window.open`.** Not possible — browsers can't invoke Finder; a helper process is required,
  which is exactly what the dev endpoint is.

## Cites

- `apps/command-center/vite.config.ts` — `POST /api/reveal` (containment guard, `open -R`)
- `apps/command-center/src/AssetExplorer.tsx` — `revealOrCopy` / `copyText` + the inspector action row
- `apps/command-center/src/registry.ts` — `assetsRootAbs` / `absPathOf`
- `tools/build-asset-registry.mjs` — the (already-wired) CSV `loadRegistry` / `joinRegistry` that would populate `reg`

## Re-open if

Reveal-from-the-static-site becomes a real need (add a node preview server), or the asset-id CSV gains name↔file
correspondence (verify "Copy id" surfaces), or the clipboard helper misbehaves in a real (non-headless) browser.
