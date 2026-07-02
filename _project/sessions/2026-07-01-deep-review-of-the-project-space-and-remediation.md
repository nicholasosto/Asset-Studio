---
title: "Deep review of the project space and remediation"
status: completed
updated: 2026-07-01
links:
  - { rel: references, target: roadmap/migrate-asset-explorer-into-the-command-center }
  - { rel: references, target: decisions/0004-serve-the-shared-asset-library-to-the-command-center-spa }
  - { rel: references, target: decisions/0005-bake-asset-studio-owned-image-thumbnails-in-the-registry-bui }
  - { rel: references, target: decisions/0006-reveal-in-finder-and-copy-asset-id-from-the-explorer }
---

# Deep review of the project space and remediation

> **Status:** completed (2026-07-01)

## Goal

An independent deep assessment of the whole space — architecture, data flow, and cross-document
consistency (CLAUDE.md · memories · ADRs · corpus · code) — explicitly NOT taking the ADRs as
gospel, then remediation of everything safe to fix.

## Success Criteria

- Every subsystem read by fresh eyes; every finding adversarially verified against the worktree.
- Confirmed conflicts between instruction surfaces enumerated with citations.
- Safe fixes applied; contracts regenerated; app rebuilt; verified live with 0 console errors.

## Source References

- Review harness: 5 subsystem mappers → 4 critics (conflicts · architecture · fragility · code) →
  1 adversarial verifier per finding → completeness critic. 65 findings survived, 0 refuted.
- Full findings report delivered in-chat (asset-studio-deep-review-2026-07-01.md).

## Decisions

- **Bind the static server to loopback.** ADR 0004's "over localhost" premise was false for
  `python3 -m http.server` (binds all interfaces, auto-lists the library through `_assets`);
  `previews-static` now passes `--bind 127.0.0.1`. ADR 0004 amended.
- **The builder must not silently strip thumbs.** 100% bake failure (no `sips`) now aborts with
  exit 1 before writing; `--no-thumbs` now REUSES already-baked thumbs instead of dropping every
  `thumb` field; orphaned thumbs (renamed/deleted sources) are pruned each bake.
- **The CSV join had a real bug, not just a data gap.** CSV names carry a `"Collection: "` display
  prefix the key kept — 2 ok-status rows matched local files all along. `joinRegistry` strips it;
  `reg` is now 2/769 and "Copy id" surfaces. ADR 0006 + the CF-1 session corrected.
- **Registry consumption must degrade, not crash.** `registry.ts` module-load dereferences are now
  `??`-guarded (shape drift blanks the Explorer, not the whole app); `RegTgl.sub` corrected to
  `string | null` (3 emitted records carry null today).
- **Reveal endpoint hardened.** Origin allow-list (CSRF via no-preflight simple request), chunk-safe
  UTF-8 body decode, per-request root re-realpath (stale-fallback 403s fixed).
- **Docs follow reality.** CLAUDE.md (no "rendered hub HTML"; guard is Write/Edit-only), README
  (build → `previews/app/` not `dist/`; game-viz; Explorer tab), roadmap Open questions resolved
  in place, "retired Soul-Steel" → retirement-pending (p5) across ADRs 0004–0006, CF-1 session's
  "incremental" bake claim corrected to always-rebake, `mediums/audio` tag brought in-vocabulary
  (`audio-sfx`), the phantom `--cc-medium` tile tint actually wired (CSS `data-medium` rules).

## Outputs

- `tools/build-asset-registry.mjs` — bake-failure guard, `--no-thumbs` reuse, orphan prune,
  colon-prefix join fix, CRLF-safe CSV parse, scan-error counter, summary-spread fix, honest header.
- `apps/command-center/` — vite.config.ts reveal hardening + fork-residue comments removed;
  registry.ts guards/types; AssetExplorer.tsx (empty-state hint honors all facets; group subheads
  count the full visible set with per-group render caps; results line no longer mixes files/assets);
  workflows.ts upstream-ADR comment collision fixed; app.css medium tints landed; README corrected.
- `.claude/launch.json` (`--bind 127.0.0.1`) + `.claude/settings.json` (allowlist the two
  project-owned build commands).
- Both contracts regenerated; SPA rebuilt; `previews/index.html` stats refreshed; verified live.

## Blockers

- none

## Next Action

Owner decisions on the two findings deliberately NOT auto-fixed: (1) runtime-fetch vs static-import
of the contracts (fetch would dissolve the stale-bundle/triple-commit class — needs an ADR);
(2) the CF-1 artifacts are documented as committed but still untracked — commit atomically.

## Handoff Notes

- The review's remaining known-but-accepted items: `builtMs` stamp diffs every rebuild (by design,
  now documented in the builder header); record order ties on mtime fall back to readdir order
  (APFS-stable, may permute on non-name-ordered filesystems); 4 of 9 vendored framework tools are
  broken-in-context (partial vendoring — `check-zero-deps` / `check-consumer-drift` ENOENT; fix
  belongs upstream in Project-System, not here); `vite preview` serves no media (documented in
  README — use `previews-static`).
- ADR 0003's `decided-in` convention is followed by only 1 of 6 decisions — left as an owner
  call (backfilling edges vs relaxing the convention).
