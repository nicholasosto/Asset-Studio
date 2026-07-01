# Command Center — Asset Studio

A live web surface for **Asset-Studio's** `ProjectEntity` graph, rendered with the
[Trembus Component Library](../../external-locations/canonical/kits/visual-grammar)
(`@trembus/ui` + `@trembus/viz`). Forked from the Project-System command-center and repointed at
this space's own contract (decision: own app island, 2026-06-30).

## The boundary (read this first)

The framework core (`.project-system/`) is **zero runtime dependencies**. This app is a
**separate dependency island** — its own `package.json`, its own `node_modules`, its own build:

- It consumes the core only as the **emitted JSON contract** — never by importing
  `.project-system/tools/` or `lib/` as packages. So the app's deps never leak into the core.
- Build artifacts (`dist/`, `node_modules/`, `.vite/`) are git-ignored.

## Data flow

```
_project/*.md ──(node .project-system/tools/render-hub.mjs)──▶ previews/dashboards/asset-studio-*.json ──▶ this app
   source of truth            zero-dep JSON emit                        the input contract             Trembus viz
```

The app reads **only** `previews/dashboards/asset-studio-graph.json` and `asset-studio-hub.json`.
It never re-reads `_project/`. `src/contract.ts` is the single consumer of that contract.

> **Two renderers, one contract.** This React app is the *live, interactive* surface (swimlanes,
> step drawer, run replay). The static `previews/dashboards/asset-studio-command-center.html`
> (built by the visual-grammar `build.mjs`) is the *self-contained* phenotype. Both read the same
> emitted JSON — see the project memory `dashboard-regen-is-two-steps`.

## Run it

```sh
cd apps/command-center
pnpm install
pnpm dev            # http://localhost:5175
```

`pnpm dev` runs Vite with a `liveContract` plugin that watches `_project/**.md` +
`project-system.config.json` + `.project-system/schema/` and re-runs `render-hub.mjs` on save, so
edits hot-reload. From the Claude preview: `preview_start("command-center")`.

## How the Trembus packages are wired

`@trembus/ui` + `@trembus/viz` install from the npm registry (`@trembus/tokens` transitively).
`@trembus/viz` brings its own runtime deps (`d3-hierarchy`, `@dagrejs/dagre`); `react`/`react-dom`
are peer deps this app provides. `vite.config.ts` keeps `dedupe: ['react','react-dom']` so a
transitive copy can't shadow the app's React. CSS arrives via each package's `./styles.css`,
imported in load-bearing order in `main.tsx` (ui → viz → app chrome).

## Scripts

- `pnpm dev` — Vite dev server (live contract regen + HMR)
- `pnpm build` — `tsc --noEmit` + production bundle to `dist/`
- `pnpm preview` — serve the built `dist/`
- `pnpm typecheck` — `tsc --noEmit`
- `pnpm verify:contract` — zero-dep integrity check that every emitted edge resolves to a node

## What renders

The nav is **derived from the contract** (no hardcoded tabs): Overview (the Hub hex) · Roadmap
(planning artifacts incl. sessions) · Decisions · Mediums · Workflows (the 3 swimlanes, with the
step drawer + `example-prop-batch` run replay) · Field Guide. Adding a kind or a `## Workflow`
block surfaces automatically on the next `render-hub.mjs`.
