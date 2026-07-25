# Image and UI agent-asset inventory — 2026-07-24

This is the dated evidence table from the Claude/Codex system scan. It records what was observed,
where it lives, and the last filesystem or install-registry update date available during the scan.
It is not the routing authority: use `capabilities.yaml` for ownership and precedence.

Dates on caches and runtime installs mean “this local copy changed,” not necessarily “the upstream
capability released.” Runtime caches remain derived.

## Instructions and control surfaces

| Item | Runtime | Location | Observed state | Last updated |
|---|---|---|---|---|
| Asset-Studio shared contract | Claude + Codex | `/Users/nicholasosto/Master-Managed/Project-Spaces/Asset-Studio/AGENTS.md` | Canonical workspace boundaries, precedence, generation, and promotion rules | 2026-07-24 |
| Claude adapter | Claude | `/Users/nicholasosto/Master-Managed/Project-Spaces/Asset-Studio/CLAUDE.md` | Thin planner/reviewer adapter; defers shared rules to `AGENTS.md` | 2026-07-24 |
| Capability registry | Claude + Codex | `/Users/nicholasosto/Master-Managed/Project-Spaces/Asset-Studio/agent-assets/capabilities.yaml` | Canonical owner/version/install/precedence registry | 2026-07-24 |
| Generation authority | Claude + Codex | `/Users/nicholasosto/Master-Managed/Project-Spaces/Asset-Studio/generation/README.md` | Immutable contracts + active pointer + compatibility copy + tracked run evidence | 2026-07-24 |
| Codex hook adapter | Codex | `/Users/nicholasosto/Master-Managed/Project-Spaces/Asset-Studio/.codex/hooks.json` and `.codex/hooks/project-system.mjs` | Implemented and smoke-tested; changed hook identities still require user trust | 2026-07-24 |
| Claude hooks and `/end` | Claude | `/Users/nicholasosto/Master-Managed/Project-Spaces/Asset-Studio/.claude/settings.json` and `.claude/commands/end.md` | SessionStart checks + visible end-of-session capability audit | 2026-07-24 |
| External source map | Claude + Codex | `/Users/nicholasosto/Master-Managed/Project-Spaces/Asset-Studio/external-locations/references/source-locations.md` | Current `_inbox/_catalog/_tools/source/runtime` library layout | 2026-07-24 |
| Home advisory | Codex | `/Users/nicholasosto/.codex/AGENTS.md` | Daily active-skill review is advisory, not blocking | 2026-04-22 |
| Global Claude plugin switches | Claude | `/Users/nicholasosto/.claude/settings.json` | Enables `frontend-design` and `roblox-dev` among other plugins | 2026-07-01 |
| Codex runtime config | Codex | `/Users/nicholasosto/.codex/config.toml` | Legacy local Figma plugin/direct MCP removed; current plugin state remains runtime-managed | 2026-07-24 |
| Claude install registry | Claude | `/Users/nicholasosto/.claude/plugins/installed_plugins.json` | roblox-dev registry reconciled to plugin 0.7.0 | 2026-07-24 |

## First-party and project-owned skills

| Capability | Version | Canonical location | Runtime exposure | Last updated |
|---|---:|---|---|---|
| `asset-production` bundle | 0.1.0 | `/Users/nicholasosto/Master-Managed/Project-Spaces/Asset-Studio/agent-assets/plugins/asset-production/` | Local canonical source; not marketplace-ready until real public policy URLs exist | 2026-07-24 |
| `trembus-image` | 0.1.0 | `/Users/nicholasosto/Master-Managed/Project-Spaces/Asset-Studio/agent-assets/plugins/asset-production/skills/trembus-image/` | Global Claude + Codex symlinks; Claude plans/hands off, Codex executes pixels | 2026-07-24 |
| `asset-studio-batch` | 0.1.0 | `/Users/nicholasosto/Master-Managed/Project-Spaces/Asset-Studio/agent-assets/plugins/asset-production/skills/asset-studio-batch/` | Global Claude + Codex symlinks; immutable candidate-only handoff | 2026-07-24 |
| `textured-ui-asset-production` | 0.1.0 | `/Users/nicholasosto/Master-Managed/Project-Spaces/Asset-Studio/agent-assets/plugins/asset-production/skills/textured-ui-asset-production/` | Global Claude + Codex symlinks; art contract and acceptance routing | 2026-07-24 |
| `roblox-dev:asset-conventions` | skill 0.5.0; plugin 0.7.0 | `/Users/nicholasosto/Master-Managed/Repositories/Vault-Repositories/roblox-dev/skills/asset-conventions/` | Claude source symlink + Codex generated cache, both parity-checked | 2026-07-24 |
| `roblox-ui-studio` | unversioned | `/Users/nicholasosto/Master-Managed/Project-Spaces/Roblox-Development/Roblox-UI-Studio/.agents/skills/roblox-ui-studio/` | Project-local Claude/Codex handoff; not globally discoverable from Asset-Studio | 2026-07-18 |
| `trembus-consumer` | unversioned | `/Users/nicholasosto/Master-Managed/Repositories/Trembus-Component-Library/skills/trembus-consumer/` | Global Claude + Codex symlinks | 2026-07-24 |
| `trembus-template` | unversioned | `/Users/nicholasosto/Master-Managed/Repositories/Trembus-Component-Library/templates/skill/trembus-template/` | Global Claude + Codex symlinks | 2026-07-24 |

## Vendor plugins and adapters

| Capability | Runtime / version | Location | Reconciled role | Last updated |
|---|---|---|---|---|
| ImageGen | Codex; unversioned standalone skill | `/Users/nicholasosto/.codex/skills/imagegen/SKILL.md` | Pixel execution only; project contract owns paths and stop boundary | 2026-05-06 |
| Figma remote | Codex; `figma@openai-curated-remote` 2.0.16 | `/Users/nicholasosto/.codex/plugins/cache/openai-curated-remote/figma/2.0.16/` | Current Figma adapter and design-source authority | 2026-07-18 |
| Figma legacy local | Codex; retired | `/Users/nicholasosto/.codex/archives/skills-legacy-2026-07-24/` | Removed from plugin config and skill discovery; rollback only | 2026-07-24 |
| Claude.ai Figma connector | Claude; vendor-managed | `/Users/nicholasosto/.claude.json` + `/Users/nicholasosto/.claude/mcp-needs-auth-cache.json` | Historical connection/auth evidence only; current Asset-Studio availability is unverified | 2026-07-24 scan |
| Creative Production | Codex; 0.1.25 | `/Users/nicholasosto/.codex/plugins/cache/openai-curated-remote/creative-production/0.1.25/` | Explicit ideation/creative-board work; never overrides batch paths | 2026-07-18 |
| `frontend-design` | Codex local + Claude `unknown` | Codex: `/Users/nicholasosto/.codex/plugins/cache/claude-plugins-official/frontend-design/local/`; Claude: `/Users/nicholasosto/.claude/plugins/cache/claude-plugins-official/frontend-design/unknown/` | Generic aesthetic guidance at lowest UI precedence | Codex 2026-07-24; Claude registry 2026-07-22 |
| Game Studio | Codex; 0.1.2 | `/Users/nicholasosto/.codex/.tmp/plugins/plugins/game-studio/` | Browser-game UI/sprite workflows only; not Roblox UI authority | 2026-07-10 |

## Memory and historical context

| Memory surface | Runtime | Location | Authority treatment | Last updated |
|---|---|---|---|---|
| Asset-Studio project memory index | Claude | `/Users/nicholasosto/.claude/projects/-Users-nicholasosto-Master-Managed-Project-Spaces-Asset-Studio/memory/MEMORY.md` | Evidence/routing only; contains historical status and lifecycle notes that must be checked against the repo | 2026-07-24 |
| Roblox UI / trim / library memories | Claude | Same directory: `roblox-ui-studio.md`, `trim-sheet-craft.md`, `assets-library-redesign.md` | Useful craft/history; never promotion or current-runtime proof | 2026-07-24 / 2026-07-23 / 2026-07-03 |
| Codex memory registry | Codex | `/Users/nicholasosto/.codex/memories/MEMORY.md` | Evidence/routing only; older batch-authority claim superseded | 2026-07-24 |
| Generation-authority correction | Codex | `/Users/nicholasosto/.codex/memories/extensions/ad_hoc/notes/20260724T133149Z-asset-studio-generation-authority.md` | Queued correction: immutable contract + ACTIVE are authority; BATCH is compatibility | 2026-07-24 |
| Hook-lifecycle correction | Codex | `/Users/nicholasosto/.codex/memories/extensions/ad_hoc/notes/20260724T134024Z-asset-studio-hook-lifecycle.md` | Queued correction: visible `/end` audit replaces dead SessionEnd assumptions | 2026-07-24 |

## Reconciliation summary

- Canonical first-party editing happens in Asset-Studio, roblox-dev, Roblox-UI-Studio, or the
  Trembus Component Library—not in runtime caches.
- Claude and Codex share Asset-Studio's three production skills from one source.
- Figma, ImageGen, Creative Production, frontend-design, and Game Studio remain vendor adapters
  with narrow precedence; none owns project output paths or promotion state.
- Memory is retained as evidence and routing context only. Current tracked project files win.
- Run `node tools/check-agent-capabilities.mjs` for live parity; refresh this dated inventory only
  when a new system scan is performed.
