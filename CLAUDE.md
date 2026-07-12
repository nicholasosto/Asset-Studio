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
| `_project/workflows/` | The production processes (swimlanes): `image-generation`, `audio-production`, `3d-asset`, `character-creation` (cross-medium composite). |
| `_project/mediums/` | The `medium` capability catalog (image · audio · 3d · **lore**) — what the studio can produce, and how. Lore is the *upstream* medium: by-reference only, the lore-brain graph is its library. |
| `templates/character/` | Stage layout templates (SVG) for the character-creation workflow — process artifacts, seeded from the Penitent Knight sheets. `png/` twins for attaching as composition refs. |
| `generation/` | The image-gen handoff to Codex: `BATCH.md` (one rolling batch contract, rewritten per batch) + `staging/`·`refs/` (untracked). Claude writes the batch + reviews/files; the operator runs "Run generation batch `<id>`" in the Codex app; Codex generates into `staging/`. Contract details in `AGENTS.md` § Generation batches. |
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

The Asset Explorer → Command Center migration is **complete** ([[migrate-asset-explorer-into-the-command-center]],
2026-07-11); the **current initiative is the character factory** ([[character-factory-lore-medium]] — see the
2026-07-04 entry). Phases 0–4 + **CF-1 preview parity** (2026-07-01) shipped: the `asset-registry.json` scanner, the `medium`/`mediumType` taxonomy, the React Explorer
view, its adoption of the Trembus `MediaFrame`, surfaced live as a self-contained SPA (`previews/app/`,
`vite build`, `base: './'`), and now **real previews** — the builder bakes 320px thumbnails (`sips` →
**local, untracked** `previews/thumbs/`; ADR 0007) + a served `/_assets` `src`; a Vite dev middleware and a committed
`previews/_assets` symlink serve `/_assets` + `/thumbs` identically on `:5175` dev and `:4317` static, so
`MediaFrame` shows image thumbs (tile) + full image + a glb/gltf turntable and `AudioWaveform` plays audio
in the inspector; the inspector also does reveal-in-Finder (dev `POST /api/reveal`, Assets-root guarded,
copy-abs fallback on static) + copy-path, and copy-id on the CSV-joined records (2/769 since the join-key
fix — ADRs 0004–0006). **P5 (retire the Soul-Steel `asset-explorer.html`) is archived** (2026-07-11) — the migrated
Explorer fully replaces it; deprecating the *source generator* is a cross-repo change deliberately not pursued from here.
**2026-07-01 deep review + remediation landed** ([[2026-07-01-deep-review-of-the-project-space-and-remediation]]):
static `:4317` server loopback-bound; builder hardened (100%-bake-failure aborts, `--no-thumbs` reuses the
existing bake, orphan thumbs pruned, CSV-join `"Collection: "` prefix fixed, CRLF-safe CSV, scan-error
warnings); reveal endpoint hardened (Origin check, chunk-safe UTF-8, per-request root); `registry.ts`
degrades instead of crashing on registry shape drift; docs/corpus/memories de-drifted. (CF-1 + the review
artifacts were committed in `2455abe`.)
**2026-07-02 Explorer polish + thumbs de-publication:** the Explorer de-bloated — a two-column summary
band (stats + meter beside the type donut), flush square `MediaFrame` tiles with `object-fit: contain`
(whole asset, never cropped/upscaled), one compact body line (footer dropped), grid minmax `15rem → 10rem`
(~5–6/row, page height halved); and, per owner call, **`previews/thumbs/` is untracked + gitignored**
([[0007-keep-explorer-previews-dev-local-stop-committing-the-thumbna]] — no published Explorer view
needed; the bake stays, now 320px; a fresh clone's static Explorer glyphs until the builder runs).
**2026-07-03 Assets-library restructure EXECUTED** ([[0008-restructure-the-shared-assets-library-into-staging-library-r]]):
the zoned architecture is live — `_inbox/_catalog/_tools/_archive` machinery + medium zones + `source/` +
`runtime/roblox/soul-steel/` (absorbed the TGL `library/`; filename contract untouched). Manifest run:
282 moved · 182 regenerable-cache deletes · 125 empty dirs pruned · 0 missing; undo map =
`Assets/_catalog/migration-2026-07-03.csv` (`tools/migrate-assets-library.mjs --rollback --confirm`).
Builder patched (area rules → `runtime`/`_inbox`, machinery zones skipped, CSV join → `_catalog/`):
576 records / 500 real mediums, **medium tallies identical pre/post**, 362 thumbs rebaked; Explorer
verified live. Surface checklist walked: asset-conventions skill chain (source → assets-repo → Claude +
Codex installs), CLAUDE/AGENTS in Soul-Steel · Blender-Dev · Trembus-Tech, cross-project memories,
4 vault notes, Codex trust entry, and live game-repo paths (`build-battle-room.lua`, conventions docs,
`COMPATIBILITY.md`). Live game code has no literal `rbxasset://trembus/` URIs — nothing broke at
runtime; historical records keep old paths by design.
**2026-07-04 character factory + lore medium:** the `character-creation` workflow landed — a
cross-medium composite (six-stage visual ladder `lore-lock → concept → portrait → modelsheet →
details → poses`, optional audio identity, 3d handoff; each visual stage runs `image-generation`
with a `templates/character/` SVG as composition ref, conventions seeded from the Penitent Knight
sheets), piloted by the `roguex-33-character` pipeline (audio retro-credited done — two Ghost in
the Grid mixes; `lore-lock` done 2026-07-06, concept stage active — live phase state in
[[character-factory-lore-medium]]). And **lore is the fourth medium** (`mediums/lore.md`,
`mediumType: lore`, `experimental`): the *upstream* medium — engrams · briefs · shippable text —
**by reference only**; the lore-brain graph is to lore what the shared library is to files
(decision-0001 treaty, second application). Lore content itself never lives here.
**2026-07-11 workflow composition grammar** ([[0009-workflows-compose-by-call-and-handoff]]): workflows
compose by two verbs — **call** (inline; the sub-run is `stepOutcomes` on the composite's pipeline) and
**handoff** (a terminal step seeds a new pipeline) — and **composites stay depth-1** (bigger scale =
handoffs, e.g. a roster workflow spawning one character pipeline per member). Call-sites carry step
`refs` (rel `references`; a workflow-kind target *is* the composition edge — no new rel while the schema
is vendored); calls are parameterized (template · filename grammar · target slot), so a composite
overriding a leaf's placement (character sheets → lore-brain `Media/visual/`) is stated, not silent.
**`lore-creation` landed as the fourth leaf** (brief → recall/continuity → author → canon review →
reciprocal link → lore-lock gate; by-reference into the lore-brain), closing the 4×4 medium↔leaf pairing
— every leaf now `references` its medium. Leaves de-drifted: `image-generation` absorbed the Codex batch
contract (write `BATCH.md` → operator runs in Codex → `staging/` → Claude reviews/files); both 2D leaves
place "per the brief's target slot" (dead `ai-output/` paths gone — audio stages `_inbox/audio/`);
validators → `_tools/`. Statuses: image-generation · audio-production · character-creation → `active`.
Command Center follow-ups deliberately deferred: call-site glyphs on step tiles, a WorkflowConsole
call-stack breadcrumb, a TCL subprocess marker (sibling-repo session), upstream `runs`/`seeds` rels.
**2026-07-11 Explorer folder-nav + virtualized grid** ([[2026-07-11-add-a-foldertree-side-nav-and-virtualassetgrid-to-the-asset-]]):
the Asset Explorer gained a **`FolderTree` folder-path side-nav** — `registry.ts` `buildAssetTree(records)`
derives a folders-only `FolderNode[]` forest from record `dir`/`p` (node id = full path prefix, subtree
counts in labels) + an `underFolder(r,folder)` predicate folded into `matches()` as a `selectedPath` facet
(composes with the medium/type/status/ext filters; removable "Folder" chip). The hand-rolled card grid +
`INITIAL_CAP` slice was **swapped for `VirtualAssetGrid<AssetRecord>`** (windowed, `groupBy` mediumType +
`groupOrder` sections, `onSelect`→inspector, `renderTile` injecting the existing `MediaFrame`+badges tile;
`AssetTile` now presentational). Layout became an **app-shell**: full-width summary + filter chrome over a
height-bounded `.cc-explorer__body` (tree aside + internally-scrolling grid) — the `<60rem` breakpoint needs
`.cc-explorer__main` at a *definite* height or VAG stops windowing. **No `@trembus/ui` bump** (both shipped
in `0.4.0`; `FolderTree` was already used by the Field Guide), no cross-repo TCL work, no `asset-registry`
change. Verified live + `tsc`/`vite build` clean. Open refinement: pin the summary/filter chrome (currently
normal-flow); tune the `100vh - 22rem` offset.
**2026-07-12 Workflows→Processes side-nav** (FolderTree, third usage): the Workflows tab's pill picker was
**replaced by a `FolderTree`** and the tab **renamed "Processes"** (display label only — `deriveNav`'s
value/panel stay `workflows`, so `#workflows` deep-links · `tabForKind` · step-ref nav are untouched).
`WORKFLOW_TREE`/`resolveTreeSel` in `workflows.ts` build a **three-group forest** — `group:scheduled` ·
`group:core` · `group:specialized` — grouped by a *derived* rule (workflow nodes emit no category field and
render-hub is vendored): **Specialized = composite** (has callee-workflow refs; = Character creation),
**Scheduled** = a `SCHEDULED_IDS` set (empty today, ready for cadence flows), else **Core**. Group folders are
`isGroupId('group:…')` → the console ignores selecting them (expansion only); under each, workflow roots hold
callee links (ADR-0009 call edges, deduped) + pipeline leaves (`root/pipeline:<id>`; selecting one opens the
console *and* preselects that pipeline's latest run via a mount-only `initialRunId` prop, App keying the console
by tree selection). **Header refactor:** the run-history toggle was lifted out of `WorkflowConsole` into a
full-width `.cc-wf-shell__header` (process title + exported `SwitchPill`) so the tree top-aligns with the
swimlane; the Swimlane's own header (`code`/`title`/`caption`) is hidden via
`.cc-workflow .tcl-swimlane__header{display:none}`. Partially delivers the deferred "surface composition in the
Command Center" follow-up. No `@trembus/*` bump, no contract/`_project/` change; verified live + `tsc`/`vite build`
clean. Deferred still: step-tile call glyphs · a call-stack breadcrumb.
**Open (owner calls):** fetch-vs-inline for the contracts (would dissolve the stale-bundle class — wants
an ADR). Corpus: 32 entities (9 decision · 2 roadmap · 1 report · 9 session · 5 workflow · 4 medium ·
2 pipeline), validates 0/0/0. Command Center on `@trembus/ui 0.4.0` + `game-viz 0.2.0`.
**Deferred:** a portable (non-`sips`) thumbnail baker for non-macOS + baked 3D/audio posters (the 77
non-glb/gltf 3D exts glyph). `proseStatusEnforcement` still `warn`
— ratchet to `error` once the corpus settles.
