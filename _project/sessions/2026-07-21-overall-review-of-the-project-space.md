---
title: "Overall review of the project space"
status: active
updated: 2026-07-21
tags: { last-active: 2026-07-21T15:23, kos: "decisions, explorer, memory" }
---

# Overall review of the project space

> **Status:** active (2026-07-21)

## Goal

A whole-of-space health review of Asset-Studio: corpus/validation state, dashboard-contract drift,
uncommitted repo state, and the open production threads (character factory + the five pipelines) —
surfacing what is stale, drifted, or dangling and recommending what to reconcile. Read-only
assessment by default; no production or `_project/` mutation beyond this engram unless approved.

## Success Criteria

- Corpus health, contract drift, and uncommitted repo state each assessed with a concrete
  disposition (reconcile now / leave / defer).
- The engram gap (session engrams stop 2026-07-11; the CLAUDE.md status log runs to 2026-07-20)
  named, with a recommendation.
- Open production threads (roguex-33 portrait batch; the two `build`-status reference/prop
  pipelines) triaged live-vs-stale.
- A prioritized findings list delivered.

## Source References

- `CLAUDE.md` — the status log (authoritative; runs to 2026-07-20)
- `previews/dashboards/*.json` — the emitted contracts (drift-flagged this wake)
- `_project/roadmap/character-factory-lore-medium.md` — the active initiative
- `_project/pipeline/*.md` — the five production instances

## Decisions

- Reconcile approach: regenerate contracts (done — 40 entities/59 edges/0 err), fold in any corpus-agent
  `_project/` fixes, rebuild the static bundle once, then a single reconciliation commit. Contracts are
  **inlined at build** (`contract.ts`/`registry.ts` `import` the JSON) → the committed bundle must be
  rebuilt after any contract change or it ships stale.
- The uncommitted backlog is the `/start`·`/reflect`·`/end` command trio + its supporting config
  (`scaffoldSections`, `last-active`/`kos` tag types) + an Explorer `asset-registry` refresh + a (stale,
  39-entity) static bundle — all authored but never committed since ≤2026-07-11.

## First-Principles Candidates

- Inline-imported contracts couple every dashboard change to a bundle rebuild → the recurring "stale
  bundle" class; runtime-fetch would dissolve it. → candidate home: decision (the already-flagged open ADR)
- Engram discipline lapsed 2026-07-12→07-20 (≈8 logged work items, 0 session engrams) while the CLAUDE.md
  status log kept going — the status log absorbed what engrams should have carried. → candidate home:
  feedback / memory

## Outputs

- Drift reconcile: regenerated planning contracts (`graph.json` + `hub.json` → 40 entities / 60 edges /
  0 err) after the corpus fixes below.
- Corpus deep-dive (background agent) → 7 reconcile-now fixes applied (validate 40/0/0):
  - Fixed **5 broken `decision/`→`decisions/`** frontmatter links (ADR 0008→0001/0002, 0007→0005,
    sessions 07-03→0008 & 07-11→0002) — were silent dangling edges, not validation errors.
  - Re-pathed `mediums/3d.md` to the ADR-0008 zones (`models/<collection>/<slug>/` +
    `runtime/roblox/soul-steel/<cat>/<domain>/`; added the 0008 link; `updated`→2026-07-21).
  - Added an "amended by 0007" banner to ADR 0005 (thumbs now gitignored / 320px, not committed / 144px).
- Reconcile landed: deleted `background-music-audio` (hollow scaffold) + `example-prop-batch` (disposable
  example); CLAUDE.md surfaced the textured-UI island (ADRs 0010/0011 + `roblox-textured-ui-ux` workflow +
  reference-kit pipeline) and corrected the corpus count 39→38; regenerated contracts (38 entities / 58
  edges / 0 err), refreshed the Explorer `asset-registry`, rebuilt the static bundle (verified it embeds
  38 entities, drops `example-prop-batch`, includes this session); one reconciliation commit on `main`.

## Owner calls (surfaced by the deep-dive, awaiting decision)

- `CLAUDE.md` status log omits the entire **textured-UI island** (ADRs 0010/0011, the
  `roblox-textured-ui-ux` workflow, its reference-kit pipeline, `example-prop-batch`,
  `background-music-audio`).
- `workflows/background-music-audio.md` — unfilled scaffold (placeholder Purpose + template JSON).
- `pipeline/example-prop-batch.md` — self-flagged disposable example, pre-0008 paths, unreferenced.
- `pipeline/roblox-textured-ui-reference-kit.md` — real but blocked 9 days on a missing Studio symlink
  (interactive `sudo` relink; can't run here).
- `mediums/image.md` — template registry omits the `Assets/templates/building-reference/` zone (defer).

## Blockers

- none for this session. (External + unrelated: the `roblox-textured-ui-reference-kit` pilot stays
  blocked on the missing Studio `content/trembus` symlink — needs an owner-run interactive `sudo` relink.)

## Next Action

Session stays open for any further review. Reconcile is committed; optional owner follow-ups: run the
reference-kit Studio relink, and add the `mediums/image` building-reference registry row.

## Handoff Notes

- Reference-kit relink (quit Studio first): `Trembus-Technologies/tools/rbx-asset-sync.sh link`, then
  rerun only the rendered-asset checks + capture the owner-acceptance screenshots.
- Deferred (owner call): `mediums/image` § Template registry omits `Assets/templates/building-reference/`.
- Standing structural: contracts are **inlined at build** → any `_project/` or registry change needs a
  bundle rebuild (`pnpm --dir apps/command-center build`) or the committed static site ships stale; the
  open fetch-vs-inline ADR would dissolve this class.
- Character factory: on-track — `roguex-33-portrait` batch written, awaiting the operator's Codex trigger.
