---
title: "Deep scan to remove dead or unused code"
status: active
updated: 2026-08-06
tags: { last-active: 2026-08-06T16:31, kos: "explorer, decisions" }
---

# Deep scan to remove dead or unused code

> **Status:** active (2026-08-06)

## Goal

Deep-scan the executable surface of this project space — `tools/`, `apps/command-center/src/`,
`previews/app/`, `.project-system/tools/`, and the scripts each of them is wired to — for code
that nothing reaches: unreferenced modules, unexported helpers with no callers, dead branches,
orphaned scripts, and stale build output. Remove what is provably unreachable; record what looks
dead but is load-bearing.

## Success Criteria

- A reachability map from each declared entry point (package.json scripts, CLAUDE.md/AGENTS.md
  validation commands, hooks, generator invocations) to the modules it actually reaches.
- A classified findings list: provably dead · reachable-only-by-humans (CLI/one-shot) · looks
  dead but is load-bearing, with the evidence for each classification.
- Deletions applied only to the provably-dead set, with the three validation commands
  (`validate.mjs`, `render-hub.mjs --check`, `check-agent-capabilities.mjs`) green afterward.
- The Command Center app still builds, and the tools' test suite (`tools/tests`) still passes.

## Source References

- `CLAUDE.md` / `AGENTS.md` — declared validation + generator commands
- `tools/` — registry, brief, capability, and drift generators plus `tools/lib`, `tools/tests`
- `apps/command-center/` — `package.json` scripts, `src/`, `scripts/`, committed `dist/`
- `previews/app/`, `previews/dashboards/` — emitted vs. authored preview surface
- `.claude/settings*.json` — hook-invoked scripts (an entry point grep alone will miss)

## Decisions

- **The retired view's builder goes with the view.** `buildGraphContract` + `BuildResult`
  (`contract.ts`, 46 lines) served the Graph/Lineage panel retired earlier; `App.tsx`'s comment
  said it "stays", but the stated reason ("the Decision Surface revives the latter") applies only
  to `@trembus/viz`, not to the builder. Removed, and the comment corrected to match reality.
  Cascade was zero — `egoGraph()` independently keeps every viz type alive.
- **Duplicated helpers die on the consumer side, not the producer side.** `assetUrl`/`encPath` in
  `registry.ts` duplicated `build-asset-registry.mjs`'s own `assetUrl`; the app reads the baked
  `rec.src`, so the app-side copy had no caller. Same shape for `TGL_CATS`, a Set duplicating the
  category vocabulary `parseTgl` inlines in its three regexes. In both cases the *producer* is the
  single source of truth and the consumer-side copy was the vestige.
- **A "verbatim port" is not evidence of reachability.** `resBucket` was carried into
  `build-asset-registry.mjs` under a header claiming `classifySpec/resBucket` were ported together
  — but `classifySpec` compares the long edge inline and never bucketed, so the deferred
  image-dimension pass would not have revived it either. Removed; the header now says so.
- **One-shot scripts are kept, not deleted.** `migrate-assets-library.mjs` holds ADR 0008's
  `--rollback` (the shared library is not a git repo — the manifest is the only undo map);
  `file-ancient-tech-surface-kit.sh` is registered as a `validator` in `asset-specs.json`;
  `patch-ancient-tech-sidecars.mjs` is cited by its pipeline entity. Reachable-by-human ≠ dead.
- **Over-exported ≠ dead.** ~40 exported TS types and a handful of functions (`copyText`,
  `viewOnlineUrl`, `taxonomy`, `domains`, `ROBLOX_UPLOAD_SCHEMA_VERSION`) have no cross-file
  consumer but are used inside their own module. Narrowing them is churn, not removal — left alone.
- **Ran the first bridge review** ([reports/2026-08-06-bridge-review-1626](../reports/2026-08-06-bridge-review-1626.md),
  window 2026-07-21T16:30..2026-07-26T07:02, 5 engrams). Headline: **this project had no memory
  directory at all**, so ~15 candidates naming `memory` as their home across five sessions were
  stranded. Created the layer and drained five. Follow-through split cleanly along whether the
  destination existed — the roblox-brain vault landed 1/1, `memory` and `decision` landed 0/19.
- **Closed out the dangling 2026-07-26 lore session as `completed`** (approved this session). The
  close-out re-measured the vault rather than assuming: `era:` moved 5 → 14 notes, but *entirely*
  via nine new Concepts authored 08:30–08:48 that day — none of the pre-existing 137 soul-steel
  notes was backfilled. Recorded there as a sharpening of that session's own law: an audit primes
  what gets written next, but priming does not reach backwards. Its Next Action stays open.

## First-Principles Candidates

- A comment asserting that dead code "stays" is not a decision unless it states a reason that
  survives re-reading. Here the parenthetical bundled two subjects and only justified one; the
  unjustified half sat unreachable for weeks → memory (review craft)
- `noUnusedLocals` + `noUnusedParameters` make the *local* surface self-cleaning, which is exactly
  why the dead code that survives is all **exported** — an export is how you silence the compiler
  without deleting anything. Hunt exports, not locals, in a strict-TS codebase → memory (audit craft)
- The same-name-different-module collision defeats naive cross-file dead-code detection: an unused
  `assetUrl` in the app was masked by a live `assetUrl` in the builder. Scope the reachability
  question per module, never per identifier across a repo → memory (tooling craft)
- An emitter with no hook, no doc-declared command, and no test can silently stale its output.
  `build-decision-briefs.mjs` is the only producer of `decision-briefs.json`, which the Decisions
  panel imports — and nothing runs it. Same law as the 2026-07-25 metadata finding, third instance:
  *the artifact nothing validates drifts* → decision (add it to the drift check or the doc command list)

## Outputs

- **Removed (provably dead):** `buildGraphContract` + `BuildResult` (`apps/command-center/src/contract.ts`);
  `assetUrl` + `encPath` (`apps/command-center/src/registry.ts`); `TGL_CATS` and `resBucket`
  (`tools/build-asset-registry.mjs`); the orphaned 2.0 MB `apps/command-center/dist/` tree left
  from before `outDir` was redirected to `previews/app/` (gitignored — local only).
  Net: 76 deletions / 12 insertions across 4 source files, plus a rebuilt static bundle.
- **Verified green after removal:** `tsc --noEmit` clean · `verify-contract` ok (45 nodes, 71/71
  edges resolve) · `roblox-upload-registry` tests 17/17 · `vite build` ok · `validate.mjs` 52 files
  0 errors · registry builder `--print-json` dry-run ok · Command Center rendered at :5175 with
  zero console errors (Overview, Decisions constellation, Explorer at 495 assets with thumbs).
- **Measured clean (no findings):** all 136 `.cc-*` CSS classes are used; all four emitted
  `previews/dashboards/*.json` have a consumer; `previews/app/` is the live build target.

## Blockers

- None.

## Next Action

Decide whether `tools/build-decision-briefs.mjs` gets an enforcement loop — either a
`check-dashboard-drift.mjs` arm covering `decision-briefs.json` or a line in CLAUDE.md's
validation block — since it is today the one emitter with no hook, no declared command, and no test.

## Handoff Notes

- **Scan method, for repeating it:** entry points are the SessionStart hooks (`validate.mjs`,
  `check-dashboard-drift.mjs`, `check-agent-capabilities.mjs`), the PreToolUse `guard.mjs`, the
  CLAUDE.md validation block, `apps/command-center/package.json` scripts, and `.claude/launch.json`.
  Everything else must be reached from one of those or justified as human-invoked.
- **`.project-system/tools/` is out of scope.** `init-config`, `compare-config`, `check-zero-deps`,
  `check-consumer-drift`, and `guide-anatomy` are unused *by this project* but are vendored
  upstream framework code — deleting them breaks the vendored contract, not dead code.
- **Test-runner gotcha:** `node --test tools/tests/` (directory form) fails on this Node version
  with a bogus `tools/tests:1:1` failure. `node --test tools/tests/roblox-upload-registry.test.mjs`
  passes 17/17. Use the file form.
- **Pre-existing, not caused here:** `render-hub --check` reports graph.json + hub.json DRIFT (was
  already drifting at session start; /end reconciles), and `check-agent-capabilities` reports one
  error — a missing figma codex plugin cache path, unrelated to code.
- The dangling 2026-07-26 lore session is still `active` and was offered for close-out, not applied.
