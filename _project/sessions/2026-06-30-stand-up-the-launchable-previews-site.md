---
title: "Stand up the launchable previews site"
status: completed
updated: 2026-06-30
---

# Stand up the launchable previews site

> **Status:** completed (2026-06-30)

## Goal

Make the command center launchable from inside the project space, and give it a project-owned entry
shell that can grow to hold all three `render-status-board` lenses — without touching the generated
phenotypes or the vendored framework.

## Success Criteria

- `preview_start("command-center")` serves the site; the landing page renders.
- The Command Center and `graph.json` resolve *through* the server (HTTP 200, not 404).
- The entry shell is project-owned and hand-editable — separated from the generated dashboards.
- Validation stays at 0 errors after the session entity is added.

## Source References

- `previews/index.html` — the project-owned site shell (entry point at `/`)
- `.claude/launch.json` — the Claude Preview config (`command-center`, port 4317)
- `previews/dashboards/asset-studio-command-center.html` — the generated hub phenotype it frames
- `.project-system/tools/render-hub.mjs` — regenerates the phenotype from the validated graph
- [[0001-reference-the-shared-asset-library-via-external-locations]] — context for why dashboards *derive*, never duplicate

## Decisions

- **Server roots at `previews/`, not repo root** — keeps `_project/` and `.project-system/` off the HTTP
  surface and gives the shell a clean `/` entry.
- **`previews/index.html` is a hand-editable shell, explicitly NOT a generated phenotype.** The
  dashboards it links to remain generated; regenerate them via `render-hub.mjs`.
- **`python3 -m http.server`** (zero-install on macOS) chosen over `npx serve` (network fetch).
- Preview server pinned to **port 4317**.

## Outputs

- `.claude/launch.json` — `command-center` preview config (port 4317).
- `previews/index.html` — site shell / nav landing. Command Center is **Live**; Decision Tree and
  Plan/Pipeline Board are reserved as **Soon**.
- This session entity (the space's first `session`).

## Blockers

- none

## Next Action

Wire the **Decision-Tree** lens (the `render-status-board` ledger) so the second card flips from
**Soon** to **Live**.

## Handoff Notes

- The two **Soon** cards are honest placeholders — only the **Hub** lens is rendered today. Bringing one
  Live is a `render-status-board` job; then flip its card class `soon → live` and set the `href`.
- After any `_project/` edit, re-run `node .project-system/tools/render-hub.mjs` — the shell auto-picks
  up the refreshed phenotype.
- Launch from in here: `preview_start("command-center")` → `http://localhost:4317/`.
- `proseStatusEnforcement` is still at `warn`; ratchet to `error` once the corpus settles.
