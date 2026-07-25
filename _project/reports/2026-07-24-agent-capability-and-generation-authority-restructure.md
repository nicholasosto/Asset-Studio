---
title: "Agent capability and generation authority restructure"
status: draft
updated: 2026-07-24
links:
  - { rel: references, target: mediums/image }
  - { rel: references, target: workflows/image-generation }
  - { rel: references, target: workflows/roblox-textured-ui-ux }
  - { rel: references, target: pipeline/ancient-tech-ui-theme }
---

# Agent capability and generation authority restructure

> **Status:** draft (2026-07-24) — implementation and validation are complete except for the
> user-owned Codex hook-trust gate.

## Outcome

**What was implemented**

- `agent-assets/capabilities.yaml` now records capability ownership, precedence, versions, canonical
  sources, and Claude/Codex installs. `tools/check-agent-capabilities.mjs` checks sources, symlinks,
  generated plugin parity, plugin metadata, the active generation contract, and retired Figma
  routes.
- `agent-assets/inventory-2026-07-24.md` preserves the requested locations-and-last-updated scan
  across instructions, first-party skills, vendor adapters, runtime config, and memory without
  confusing that dated evidence with routing authority.
- `agent-assets/plugins/asset-production/` is the shared first-party source for `trembus-image`,
  `asset-studio-batch`, and `textured-ui-asset-production`; both runtimes consume the same skill
  directories through derived symlinks.
- `generation/contracts/`, `generation/ACTIVE.md`, and `generation/runs/` replace the rolling batch
  file and ignored scratch lane as historical authority. `generation/BATCH.md` remains a checked
  compatibility surface, and the current Roguex-33 portrait contract preserves its legacy staging
  destination without rewriting an active contract.
- Twenty durable Markdown, JSON, Python, and shell records were recovered byte-for-byte from
  ignored `output/imagegen/` runs. `_project/pipeline/ancient-tech-ui-theme.md` now records the
  previously missing UI-theme production instance and its explicit owner/publish gates.
- `roblox-dev` asset-conventions 0.5.0 was distributed in plugin 0.7.0 and reconciled across the
  Claude source symlink, Claude install registry, Codex generated cache, and the Asset-Studio
  capability registry.
- Roblox-UI-Studio now has one canonical project-local skill shared by its Claude/Codex workspace
  adapters; Asset-Studio records it as an explicit workspace handoff instead of pretending it is
  globally discoverable. Trembus Component Library installers expose their consumer and template
  skills to both runtimes with non-symlink collision guards.
- The superseded Codex `figma@openai-curated` plugin, duplicate direct Figma MCP registration, and
  standalone local Figma skills were retired; rollback copies live outside skill discovery under
  `~/.codex/archives/skills-legacy-2026-07-24/`. The current vendor-managed remote Figma capability
  remains the adapter.
- `AGENTS.md`, `CLAUDE.md`, session hooks, the image/UI workflow records, the Command Center guide,
  and `external-locations/references/source-locations.md` now point at the same authority model and
  current shared-library zones.
- An ad-hoc memory correction supersedes the older `BATCH.md`-as-authority routing claim without
  editing generated memory indexes directly.

**What didn't**

- Historical binary scratch work under `output/imagegen/` was intentionally preserved; only
  durable records were promoted.
- No `_BLK → _FNL`, upload, registry, package publish, Studio save, place publish, Git push, or
  unrelated user-work commit was implied or performed.
- Codex must still present and receive the user's hook-trust approval for the changed/new hook
  definitions on the next task; the hook files are implemented and smoke-tested, but old persisted
  hashes were not bypassed or forged.
- The local `asset-production` bundle is deliberately not marketplace-ready. The official Codex
  evaluator reports the three absent public policy URLs plus eight advisory budget, version-
  metadata, helper-test, and complexity warnings; no fake website, privacy, or terms URLs were
  added merely to silence it.

## Surprises

- **Install state was not authority.** Claude's roblox-dev path already resolved to current source
  while its registry still said 0.6.0, and Codex reported plugin 0.7.0 while its cached skill was
  stale until a supported reinstall. Source, distribution, registry, cache, and discovery are
  distinct gates.
- **Ignored did not mean disposable.** The large image lanes mixed replaceable rasters with small
  briefs, manifests, builders, and validators. Recovering only the durable layer retained
  provenance without turning Asset-Studio into an asset store.
- **Generic UI guidance needed an explicit floor.** Figma design truth, the textured-UI domain
  contract, Roblox runtime proof, and the Trembus design system now precede generic frontend
  aesthetics instead of competing as peers.

## Decisions made

- **D1: one first-party source, derived runtime installs.** Asset-Studio owns the new image/UI
  skills; Claude and Codex receive symlinks or generated plugin distributions and never become
  editing authorities.
- **D2: immutable generation contracts.** Prompt history is append-only under
  `generation/contracts/`; `ACTIVE.md` selects one contract and `BATCH.md` is mechanically checked
  compatibility.
- **D3: authority follows the production gate.** `trembus-image` owns raster craft,
  `asset-studio-batch` owns candidate handoff, `asset-conventions` owns library naming/status, and
  the consuming UI/runtime project owns implementation evidence.
- **D4: preserve reversible cleanup.** Legacy skill directories and pre-change global
  configuration have dated rollback copies rather than being irreversibly deleted.

## Carry-forward

- `[CF-1]` Package and publish `asset-production` through a shared marketplace only if direct
  symlink discovery becomes insufficient. Before that owner gate, provide real public website,
  privacy-policy, and terms-of-service URLs and require the official plugin evaluator to pass.
- `[CF-2]` Mint a new Roguex portrait contract revision if its candidate destination should move
  from legacy `generation/staging/` to `generation/work/<batch-id>/candidates/`; never mutate the
  archived active contract merely to normalize its path.
- `[CF-3]` Review and commit the Asset-Studio, Roblox-UI-Studio, and Trembus Component Library
  changes in their owning repositories without folding in unrelated dirty work.
- `[CF-4]` Accept the changed Asset-Studio Codex hooks when Codex presents its hook-trust prompt;
  security trust remains a user-owned gate.
- `[CF-5]` Upgrade the transparent-image validator to inspect pixel alpha rather than only the
  presence of an alpha channel; until then, visually or pixel-validate transparency before
  acceptance.

## Verification evidence

| Gate | Method | Evidence |
|---|---|---|
| Capability parity | `node tools/check-agent-capabilities.mjs` | 0 errors, 0 warnings |
| Local plugin distribution boundary | official `plugin-eval analyze` | 3 expected missing public-policy URL errors + 8 advisory warnings; registry says `marketplaceReady: false` |
| Project graph | Project-System validator | 44 entities, 0 errors, 0 warnings |
| Generation provenance | byte comparison + JSON/AST/shell checks | 20/20 records identical; 7 JSON, 5 Python, 2 shell records valid |
| Roblox-dev distribution | source tests + distribution checker/tests | 7/7 source tests; 0 distribution failures; 52/52 distribution tests |
| Roblox UI skill mirror | source/symlink comparison + project validation | canonical file equality; 30 files, 0 errors, 0 warnings |
| Trembus skill installers | `bash -n`, isolated installs, collision test | Claude/Codex links resolve to canonical source; refusal guard passed |
| Codex Project-System hook | nested-cwd synthetic hook payloads | vendored-core patch denied; nested SessionStart resolved and validated the workspace root |
| Static Command Center | typecheck + Vite production build | refreshed planning contracts and `previews/app/` |
