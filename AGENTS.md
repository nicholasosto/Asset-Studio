# Asset-Studio — Workspace

## Mission and boundaries

Asset-Studio is the game-agnostic planning and process layer for image, audio, 3D, lore-linked,
and composite asset production. It is not an asset store.

- Planning truth: `_project/`
- Shared asset payloads: `~/Master-Managed/Assets/`
- Agent capability truth: `agent-assets/`
- Engine and Roblox semantics: the owning knowledge graph or runtime project
- Consumer implementation: the owning package, application, or Studio place

Never treat local candidates, memory, plugin caches, dashboard JSON, an Asset Manager row, a local
Studio URI, or an imported file as registry, promotion, upload, publish, or shipping proof.

## Authority order

1. Explicit owner decision and approved project brief
2. Accepted `_project/decisions/`
3. `_project/mediums/`, `_project/workflows/`, and the active `_project/pipeline/`
4. The canonical Asset-Studio-owned or external skill source for its delegated domain
5. `agent-assets/capabilities.yaml` for ownership routing, versions, and install observations
6. Runtime installs and caches, which are derived only
7. Claude/Codex memory, which is evidence and routing context only

The registry selects the owner; it does not overrule that owner's substantive source. If a
registered version, path, or summary disagrees with its canonical skill, repair the registry or
derived install. For other conflicts, verify the higher authority and repair or supersede the lower
one.

For missing, conflicting, stale or unverifiable asset workflow guidance, follow
`~/Master-Managed/Assets/_catalog/workflow-gap.md`. Preserve the selected production
contract's exact work slots; the library inbox is a fallback for unbound drops.
Continue independently authorized work and pause only the affected unsupported step.

## Map

| Path | Purpose |
|---|---|
| `.project-system/` | Vendored Project-System framework. Never edit in place. |
| `project-system.config.json` | Project-specific kinds, statuses, tags, and render configuration. |
| `_project/` | Source-of-truth decisions, workflows, media capabilities, pipelines, roadmaps, sessions, and reports. |
| `agent-assets/` | Versioned Claude/Codex capability registry and first-party plugin sources. |
| `generation/` | Immutable image contracts plus ignored reference/work areas. |
| `templates/` | Authored structural masters only; generated exemplars live in the shared Assets library. |
| `external-locations/` | Tracked links and source maps for external authorities. |
| `apps/command-center/` | Vite/React planning and Asset Explorer consumer. |
| `previews/dashboards/` | Generated planning and asset-registry contracts. Never hand-edit. |
| `tools/` | Project-owned validation, registry, and capability checks. |

## Capability routing

Read `agent-assets/capabilities.yaml` when image/UI work crosses tools or runtimes.

- Image execution: vendor ImageGen adapter
- Raster craft and metadata: `trembus-image`
- Immutable batch handoff: `asset-studio-batch`
- Textured Roblox UI art: `textured-ui-asset-production`
- Asset paths, naming, status, registration, and promotion: `roblox-dev:asset-conventions`
- Web UI components and themes: `trembus-consumer` and `trembus-template`
- Roblox UI prototypes and Studio QA: hand off into the sibling Roblox-UI-Studio workspace, then
  load its project-local `roblox-ui-studio` skill
- Figma: one active vendor integration per runtime; exact design sources outrank generic styling
- Creative Production: explicit ideation/board work only; it never overrides Asset-Studio paths or
  review ownership
- Generic frontend aesthetics: `frontend-design`, at the lowest UI precedence

Generic vendor defaults never override an active project contract.

## Project-System conventions

- Kinds: decision, report, pipeline, roadmap, session, workflow, and medium.
- Scaffold entities with
  `node .project-system/tools/new-entity.mjs <kind> "<title>"`; do not hand-write new `_project/`
  entities.
- A workflow is reusable process; a pipeline is one stateful production instance.
- Internal `links[].target` values are folder-qualified, such as
  `workflows/image-generation` or `pipeline/roguex-33-character`.
- One roadmap equals one milestone-sized initiative. Its timeline uses a fenced `## Phases` JSON
  block.
- Run validation after every `_project/` change:
  `node .project-system/tools/validate.mjs --root . --config ./project-system.config.json`.

## Image generation

The canonical handoff is defined in `generation/README.md` and the `asset-studio-batch` skill.

When the operator says `Run generation batch <id>`:

1. Read `generation/ACTIVE.md`.
2. Resolve its immutable `generation/contracts/<batch-id>.md`.
3. Require the requested ID, active pointer, and contract ID to match exactly.
4. Generate only the requested candidates into the immutable contract's bound output path. New
   contracts default to `generation/work/<batch-id>/candidates/`; preserved compatibility
   contracts may still bind `generation/staging/`.
5. Stop at `batch staged`.

The generation pass does not review, rank, transform, file, register, promote, upload, publish, or
edit pipeline state. Those are later gates owned by the reviewer, pipeline, asset conventions, and
owner.

`generation/BATCH.md` is a compatibility surface, not historical truth. New revisions mint a new
immutable contract ID.

Substantial interactive generation must use the same contract/work structure. Do not create a
second production lane under `output/imagegen/`.

## Asset and promotion boundaries

- Asset-Studio stores contracts, process, deterministic tools, manifests, and run evidence—not
  production payloads.
- Reviewed image payloads route through `roblox-dev:asset-conventions`. Unattended
  shared-library drops without an approved bound work path use `_inbox/<medium>/`;
  preserve exact candidate/work slots selected by a production contract.
- New shared UI/texture assets default to `_BLK`.
- `_FNL`, upload, registry entry, package publish, and consumer shipping are separate gates.
- Authored structural templates live under `templates/`; generated exemplars live under
  `~/Master-Managed/Assets/templates/`.

## Generated contracts and app builds

- Planning graph:
  `node .project-system/tools/render-hub.mjs`
- Planning drift:
  `node .project-system/tools/render-hub.mjs --root . --check`
- Asset registry:
  `node tools/build-asset-registry.mjs`
- Agent capability parity:
  `node tools/check-agent-capabilities.mjs`
- Static Command Center:
  `pnpm --dir apps/command-center build`

The Command Center consumes published `@trembus/*` packages from the sibling
Trembus-Component-Library repository. Do not edit dependency code through a cache or
`external-locations/` link.

## Working hygiene

- Preserve unrelated dirty work in every connected repository.
- Use caches and runtime installs as diagnostics, never sources.
- Keep generated candidates, refs, intermediate rasters and QA images outside Git
  according to their owning contracts. Ignored or untracked status does not authorize
  deletion; preserve candidate originals, provenance and referenced evidence.
- Promote durable rules, manifests, builders, and validators into tracked authority before relying
  on them.
- During skill-heavy work, a quick daily `node tools/check-agent-capabilities.mjs` review is useful
  for catching stale defaults, metadata drift, broken links, and missing validation. It is advisory,
  not a blocking ritual.
