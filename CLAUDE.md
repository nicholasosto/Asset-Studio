# Asset-Studio — Workspace

## What This Is

**Asset-Studio** is the game-agnostic **planning layer for asset production** — the repeatable
workflows that turn briefs into finished creative assets (images, audio, 3D), independent of any one
game or creative project. It adopts the **Project-System** framework as a vendored consumer: the
contract + engines live in `.project-system/`; the one project-specific file is
`project-system.config.json`.

It is the *factory's process layer*, **not an asset store**. The assets themselves live in the shared,
game-independent library at `~/Master-Managed/Assets/`, reached through `external-locations/` symlinks —
see [decision 0001](_project/decisions/0001-reference-the-shared-asset-library-via-external-locations.md).
Asset-Studio never duplicates that library or its id registry.

## Map

| Path | What |
|---|---|
| `.project-system/` | Vendored framework (schema · lib · tools). Never edit — update = re-copy from Project-System. |
| `project-system.config.json` | The only project-specific file. Declares the kinds, statuses, tags, and render metadata. |
| `_project/` | The planning surface — the source of truth. |
| `_project/workflows/` | The production processes (swimlanes): `image-generation`, `audio-production`, `3d-asset`. |
| `_project/mediums/` | The `medium` capability catalog (image · audio · 3d) — what the studio can produce, and how. |
| `_project/pipeline/` | Production *instances* (batches/commissions) that follow a workflow. |
| `external-locations/` | Symlinks to the shared `Assets/` library + the `canonical/` kit & skills. Tracked links, untracked payload. |
| `previews/dashboards/` | The emitted contracts — the planning graph (`asset-studio-graph.json` + `asset-studio-hub.json`) and the Asset Explorer's `asset-registry.json`. JSON only — the rendered surface is the Command Center app. |
| `apps/command-center/` | The live Vite/React Command Center — renders the contracts + the **Asset Explorer**, on the Trembus Component Library (`@trembus/ui · viz · game-viz`). A separate dependency island consuming published npm packages; the vendored framework stays zero-dep. |
| `tools/` | Project-owned build tools (distinct from the vendored `.project-system/tools/`). `build-asset-registry.mjs` scans the shared library → emits the Explorer's `asset-registry.json`. |

## Conventions

- **Kinds:** the canonical six (decision · report · pipeline · roadmap · session · workflow) **plus**
  `medium` (the per-asset-type capability catalog; status `experimental → supported → deprecated`).
- **Scaffold, don't hand-write.** Create entities with `node .project-system/tools/new-entity.mjs <kind>
  "<title>"` (or `/new <kind>`); a PreToolUse guard blocks invalid `_project/` writes made via the
  Write/Edit tools (Bash-mediated writes bypass it — run `validate.mjs` after any).
- **Workflow vs pipeline:** a `workflow` is a reusable template (swimlane); a `pipeline` is one stateful
  production batch that follows it. Enforced strictly — `swimlaneEnforcement: error`.
- **Tags:** `mediumType` · `tool` · `pattern` (symlink = Pattern A; upload = Pattern B).
- **Tooling:** Blender MCP (`blender-mcp-craft`), ElevenLabs (audio), Figma/OpenAI (image), Roblox
  Studio MCP (3D import). Dashboards: `render-hub.mjs` emits the JSON contract → the Command Center renders it.
- **Render the dashboard:** `node .project-system/tools/render-hub.mjs` after `_project/` edits (emits
  JSON only). The **dev** server hot-reloads it automatically; to refresh the **committed static site**
  also run `pnpm --dir apps/command-center build` → `previews/app/`. See [[dashboard-regen-is-two-steps]].
- **Roadmap = one initiative.** One `roadmap` per milestone-sized initiative; author its plan as a
  `## Phases` fenced-JSON block (not just prose `## Plan`) so the Command Center renders its Timeline.
  "The Roadmap" (the milestone-progress ribbon) is the curated `render.ribbon` list in the config —
  see [decision 0003](_project/decisions/0003-roadmap-equals-one-initiative-the-ribbon-is-the-project-mile.md).
- **Internal links are folder-qualified:** frontmatter `links[].target` must be `<folder>/<stem>`
  (e.g. `roadmap/migrate-asset-explorer-into-the-command-center`) to form a real graph edge; a bare
  stem resolves as an off-graph external ref.
- **Two emitted contracts, two build steps.** The **planning** contract (`asset-studio-graph.json` +
  `hub.json`) comes from `render-hub.mjs` after `_project/` edits. The **Asset Explorer** reads a separate
  `asset-registry.json` from `node tools/build-asset-registry.mjs` (a zero-dep scan of
  `external-locations/assets` — preserves file metadata, derives `medium`/`mediumType`). Re-run whichever
  matches what changed. See [[asset-registry-pipeline]].
- **The Command Center consumes Trembus from npm.** `@trembus/ui · viz · game-viz` are built and published
  from a *sibling* repo (`~/Master-Managed/Repositories/Trembus-Component-Library`), not here. New/changed
  components → build + publish there (own session; `pnpm publish` needs the owner's npm token), then bump the
  `apps/command-center` deps. See [[command-center-consumes-tcl]].

## Status

Migrating the Asset Explorer into the Command Center
([[migrate-asset-explorer-into-the-command-center]]) — Phases 0–4 done + **CF-1 preview parity landed**
(2026-07-01): the `asset-registry.json` scanner, the `medium`/`mediumType` taxonomy, the React Explorer
view, its adoption of the Trembus `MediaFrame`, surfaced live as a self-contained SPA (`previews/app/`,
`vite build`, `base: './'`), and now **real previews** — the builder bakes 144px thumbnails (`sips` →
committed `previews/thumbs/`) + a served `/_assets` `src`; a Vite dev middleware and a committed
`previews/_assets` symlink serve `/_assets` + `/thumbs` identically on `:5175` dev and `:4317` static, so
`MediaFrame` shows image thumbs (tile) + full image + a glb/gltf turntable and `AudioWaveform` plays audio
in the inspector; the inspector also does reveal-in-Finder (dev `POST /api/reveal`, Assets-root guarded,
copy-abs fallback on static) + copy-path, and copy-id on the CSV-joined records (2/769 since the join-key
fix — ADRs 0004–0006). **P5 (retire the Soul-Steel `asset-explorer.html`) is now unblocked** — awaiting owner
confirmation for the cross-repo deprecation (the banner goes in its *generator*).
**2026-07-01 deep review + remediation landed** ([[2026-07-01-deep-review-of-the-project-space-and-remediation]]):
static `:4317` server loopback-bound; builder hardened (100%-bake-failure aborts, `--no-thumbs` reuses the
committed bake, orphan thumbs pruned, CSV-join `"Collection: "` prefix fixed, CRLF-safe CSV, scan-error
warnings); reveal endpoint hardened (Origin check, chunk-safe UTF-8, per-request root); `registry.ts`
degrades instead of crashing on registry shape drift; docs/corpus/memories de-drifted. **Open (owner
calls):** fetch-vs-inline for the contracts (would dissolve the stale-bundle class — wants an ADR); the
CF-1 + review artifacts are still uncommitted — commit atomically (registry + thumbs + `_assets` symlink +
bundle together). Corpus: 22 entities (6 decision · 1 roadmap · 1 report · 7 session · 3 workflow ·
3 medium · 1 pipeline), validates 0/0/0. Command Center on `@trembus/ui 0.4.0` + `game-viz 0.2.0`.
**Deferred:** a portable (non-`sips`) thumbnail baker for non-macOS + baked 3D/audio posters (the 77
non-glb/gltf 3D exts glyph). `proseStatusEnforcement` still `warn`
— ratchet to `error` once the corpus settles.
