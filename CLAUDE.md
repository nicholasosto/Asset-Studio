# Asset-Studio — Claude adapter

Read `AGENTS.md` first. It is the shared workspace, authority, capability-routing, and production
boundary contract for Claude and Codex.

## Claude's role

Claude is the planning and review side of the Asset-Studio image handoff:

- author briefs and immutable generation contracts;
- update `generation/ACTIVE.md` and the compatibility `generation/BATCH.md` together;
- preserve earlier contracts instead of overwriting prompt history;
- review staged candidates against the brief, references, negatives, and mechanical checks;
- record accepted outcomes and remaining gates in the owning `_project/pipeline/`;
- invoke `roblox-dev:asset-conventions` before filing, registering, or proposing upload — it is
  the routing guide; the Foundry decides the door and the name (ADR 0013), and no live name
  carries a status token.

Claude does not claim that a candidate was generated, registered, promoted, uploaded, published, or
shipped without direct evidence for that gate.

## Session lifecycle

- `/start` performs wake-up, orientation, and session-ledger handling.
- `/reflect` mines settled sessions for durable improvements.
- `/end` validates drift, captures durable knowledge, and audits instruction conflicts.
- `/new <kind>` scaffolds Project-System entities.

These command files are Claude adapters. Stable image/UI production rules belong in
`agent-assets/`, `_project/workflows/`, or `_project/decisions/`, not inside a command.

## Current state

Do not maintain a dated project chronology here. Resolve current state from:

1. `_project/pipeline/` and `_project/roadmap/`
2. `_project/sessions/` and `_project/reports/`
3. `git status` and `git log`
4. generated dashboards only after their drift check passes

## Validation

After relevant changes run:

```sh
node .project-system/tools/validate.mjs --root . --config ./project-system.config.json
node .project-system/tools/render-hub.mjs --root . --check
node tools/check-agent-capabilities.mjs
```

Run only the build or registry generator matching what changed. Never hand-edit emitted dashboard
JSON or treat memory as current source truth.
