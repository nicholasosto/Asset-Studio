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
| `previews/dashboards/` | The emitted contract (`asset-studio-graph.json` + `asset-studio-hub.json`) + the rendered hub HTML. |

## Conventions

- **Kinds:** the canonical six (decision · report · pipeline · roadmap · session · workflow) **plus**
  `medium` (the per-asset-type capability catalog; status `experimental → supported → deprecated`).
- **Scaffold, don't hand-write.** Create entities with `node .project-system/tools/new-entity.mjs <kind>
  "<title>"` (or `/new <kind>`); a PreToolUse guard blocks invalid `_project/` writes.
- **Workflow vs pipeline:** a `workflow` is a reusable template (swimlane); a `pipeline` is one stateful
  production batch that follows it. Enforced strictly — `swimlaneEnforcement: error`.
- **Tags:** `mediumType` · `tool` · `pattern` (symlink = Pattern A; upload = Pattern B).
- **Tooling:** Blender MCP (`blender-mcp-craft`), ElevenLabs (audio), Figma/OpenAI (image), Roblox
  Studio MCP (3D import). Dashboards render via `render-hub.mjs` → the Command Center / visual-grammar kit.
- **Render the dashboard:** `node .project-system/tools/render-hub.mjs` after `_project/` edits.

## Status

First cut (2026-06-30): config + 3 seed workflows + 3 mediums + 1 example pipeline + the foundational
decision; validates 0/0/0; registered as a real consumer in Project-System's drift check (PASS on
structural · behavioral · hooks). `proseStatusEnforcement` starts at `warn` — ratchet to `error` once
the corpus settles.
