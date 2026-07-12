---
description: End-of-session reconciliation — sync the Command Center with _project/, then capture high-value concepts
argument-hint: "[optional notes on what to prioritize capturing]"
allowed-tools: Bash(node tools/check-dashboard-drift.mjs:*), Bash(node .project-system/tools/render-hub.mjs:*), Bash(node .project-system/tools/validate.mjs:*), Bash(pnpm --dir apps/command-center build:*), Bash(git status:*), Bash(git diff:*), Bash(git add:*)
---
Run the end-of-session reconciliation for **Asset-Studio**. Two halves, in order — do **not** skip half 2, it is the reason this ritual exists. (This does not quit the session; it's the wrap-up you run before you do.)

Extra priorities for the capture step, if any: **$ARGUMENTS**

## 1 · Detect drift (mechanical)
Run `node tools/check-dashboard-drift.mjs` and read the signals. If it prints "no drift", jump to step 3.

## 2 · Reconcile the Command Center (mechanical)
Resolve the signals **in order A → C → B** (fixing A/C is what dirties B, so commit last, once, covering everything):

- **Signal A — source edited, contracts not regenerated:** run `node .project-system/tools/render-hub.mjs` (emits the graph + hub JSON only). Sanity-check with `node .project-system/tools/validate.mjs --summary` if the corpus changed.
- **Signal C — static bundle behind the contract:** run `pnpm --dir apps/command-center build` to refresh `previews/app/`. (Skip if only the dev server matters this session — say so.)
- **Signal B — regenerated but uncommitted:** do **not** auto-commit. Show `git status` + `git diff --stat -- previews/`, then **propose** a commit with a message summarizing what changed and **wait for the user's explicit yes**. The commit is the human's call.

Re-run `node tools/check-dashboard-drift.mjs` to confirm the mechanical drift is cleared (only the awaiting-approval commit may remain).

## 3 · Capture high-value concepts (judgment — never skip)
Review **this session** for what would otherwise be re-derived next time: decisions made, non-obvious constraints discovered, corrections or preferences the user voiced, new patterns, live phase-state changes. Fold in any **$ARGUMENTS** priorities.

- **Durable cross-session knowledge** → write or update a file-memory (`memory/<slug>.md` + a one-line `MEMORY.md` pointer) per the memory conventions: one fact per file, correct `type`, absolute dates, link related notes with `[[…]]`. Update the existing file if one already covers it; don't duplicate.
- **Lore / vault-worthy concepts** → invoke the `artificial-brain:maintenance:brain-synthesize` skill (end-of-session synthesis: review conversation, capture concepts, update activations). Only when something genuinely rises to that bar — it's heavier than a memory note.
- **Milestone / initiative status shifted** → update the **Status** section of `CLAUDE.md`.

Don't capture what the repo already records (code structure, git history, existing entities). If nothing clears the bar, say so plainly — do not invent concepts to look thorough.

## 4 · Report
Close with a tight summary: what was reconciled (commands run), what was captured (memories/engrams written or updated, CLAUDE.md touched), and anything left for the user — most importantly any commit awaiting approval.
