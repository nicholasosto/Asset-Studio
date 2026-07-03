# Command Center — Asset Studio

A live web surface for **Asset-Studio's** `ProjectEntity` graph, rendered with the Trembus
Component Library (`@trembus/ui` + `@trembus/viz` + `@trembus/game-viz`, published to npm from the
sibling `~/Master-Managed/Repositories/Trembus-Component-Library` repo). Forked from the
Project-System command-center and repointed at this space's own contract (decision: own app
island, 2026-06-30).

## The boundary (read this first)

The framework core (`.project-system/`) is **zero runtime dependencies**. This app is a
**separate dependency island** — its own `package.json`, its own `node_modules`, its own build:

- It consumes the core only as the **emitted JSON contract** — never by importing
  `.project-system/tools/` or `lib/` as packages. So the app's deps never leak into the core.
- The production build lands in the committed `previews/app/` — the self-contained static bundle
  the previews site serves at `/app/`. Dev artifacts (`node_modules/`, `.vite/`) stay git-ignored.

## Data flow

```
_project/*.md ──(node .project-system/tools/render-hub.mjs)──▶ previews/dashboards/asset-studio-*.json ──▶ this app
   source of truth            zero-dep JSON emit                        the input contract             Trembus viz
```

The app reads the planning contract (`previews/dashboards/asset-studio-graph.json` +
`asset-studio-hub.json`, via `src/contract.ts`) and the Asset Explorer's `asset-registry.json`
(via `src/registry.ts`). It never re-reads `_project/`.

> **One renderer.** This React app is the only surface. `pnpm build` emits a self-contained static
> bundle into `previews/app/` (all contracts inlined), which the previews site serves at `/app/`.
> The old single-file `asset-studio-command-center.html` phenotype was retired once this app
> superseded it — `render-hub.mjs` now emits JSON only.

## Run it

```sh
cd apps/command-center
pnpm install
pnpm dev            # http://localhost:5175
```

`pnpm dev` runs Vite with a `liveContract` plugin that watches `_project/**.md` +
`project-system.config.json` + `.project-system/schema/` and re-runs `render-hub.mjs` on save, so
edits hot-reload. From the Claude preview: `preview_start("command-center")`.

To refresh the committed static bundle the previews site serves:

```sh
pnpm --dir apps/command-center build   # tsc --noEmit && vite build → previews/app/
```

### Served media (Asset Explorer)

The Explorer shows real image/audio/3D previews from the shared library. Two absolute URL prefixes resolve
identically on dev and the static site: **`/_assets/<encoded p>`** (full media) and **`/thumbs/<name>`**
(baked 320px thumbnails — a **local, untracked** cache; decision 0007 dropped the published-Explorer
requirement, so `previews/thumbs/` is gitignored and machines without a bake show ext glyphs). On dev, the
`liveAssets()` Vite plugin (`vite.config.ts`) streams both from the library realpath + `previews/thumbs/`
and also hosts `POST /api/reveal` (`open -R`, guarded to the Assets root). On the static `:4317` site,
`python -m http.server` serves them straight off `previews/` via the committed `previews/_assets` symlink +
whatever local `previews/thumbs/` bake exists (no server code); reveal degrades to copy-path.
`node tools/build-asset-registry.mjs` bakes the thumbnails, the served `src`, and the symlink (`--no-thumbs`
to skip the macOS-only `sips` bake). See decisions 0004–0007.

Serve the whole previews site (shell + `app/`) with `preview_start("previews-static")` → `http://localhost:4317/`.

## How the Trembus packages are wired

`@trembus/ui` + `@trembus/viz` + `@trembus/game-viz` (MediaFrame, the Explorer's media surface)
install from the npm registry (`@trembus/tokens` transitively). `@trembus/viz` brings its own
runtime deps (`d3-hierarchy`, `@dagrejs/dagre`); `react`/`react-dom` are peer deps this app
provides. `vite.config.ts` keeps `dedupe: ['react','react-dom']` so a transitive copy can't
shadow the app's React. CSS arrives via each package's `./styles.css`, imported in load-bearing
order in `main.tsx` (ui → viz → game-viz → app chrome).

## Scripts

- `pnpm dev` — Vite dev server (live contract regen + HMR + served media + `/api/reveal`)
- `pnpm build` — `tsc --noEmit` + production bundle to the committed `previews/app/`
- `pnpm preview` — serve the built bundle *shell only*: no `/_assets`, `/thumbs`, or reveal
  middleware runs under `vite preview`, so Explorer media 404s — use
  `preview_start("previews-static")` (`:4317`) to exercise the real static site instead
- `pnpm typecheck` — `tsc --noEmit`
- `pnpm verify:contract` — zero-dep integrity check that every emitted edge resolves to a node

## What renders

The nav is **derived from the contract** (no hardcoded tabs): Overview (the Hub hex) · Roadmap
(planning artifacts incl. sessions) · Decisions · Mediums · Workflows (the 3 swimlanes, with the
step drawer + `example-prop-batch` run replay) · **Explorer** (the Asset Explorer, over
`asset-registry.json`) · Field Guide. Adding a kind or a `## Workflow` block surfaces
automatically on the next `render-hub.mjs`.
