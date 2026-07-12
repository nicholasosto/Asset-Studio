#!/usr/bin/env node
// ============================================================================
// check-dashboard-drift.mjs — Command Center ⇄ _project/ drift detector (v1)
// ============================================================================
//
// PURPOSE
//   A DETECT-AND-WARN probe for the gap between the planning source of truth
//   (_project/) and the emitted Command Center contracts. It never mutates
//   anything and never fails a session — it prints what is out of sync and the
//   exact command that reconciles it, then exits 0. Wired into the SessionStart
//   + SessionEnd hooks (.claude/settings.json) and run as step 1 of /end.
//
//   Reconciliation itself — running render-hub, committing, rebuilding the
//   static bundle — stays a DELIBERATE act; this tool only makes drift visible.
//   Cf. the validate.mjs --summary SessionStart hook: advisory, exit 0, never
//   gates a session (a red tree must not stop you opening one to fix it).
//
// THREE LAYERED SIGNALS  (source → derived → committed → built)
//   A  content staleness   Delegates to `render-hub.mjs --check` — the AUTHORITY
//                          (a date-insensitive content diff; exit 0 = in sync).
//                          Fires when _project/ was edited but the graph/hub JSON
//                          was never regenerated.   fix → render-hub.mjs
//   B  uncommitted regen   `git status --porcelain` on the two contract files.
//                          Fires when the JSON was regenerated but not committed.
//                          fix → git add + commit the contracts
//   C  stale static bundle Contract JSON newer than the newest previews/app/
//                          build artifact (a heuristic mtime check — the dev
//                          server hot-reloads the JSON, the COMMITTED static
//                          site does not; the contracts are inlined at build
//                          time, so this class is real until fetch-vs-inline is
//                          settled). fix → pnpm --dir apps/command-center build
//
//   A is upstream of B is upstream of C: fixing A dirties B; committing B can
//   stale C. The report lists them in that order so the fix sequence reads top
//   to bottom.
//
// ZERO-DEPENDENCY (node built-ins only: fs, path, child_process, url).
// READ-ONLY: render-hub --check does not write; git status does not write.
//
// Usage:
//   node tools/check-dashboard-drift.mjs           # verbose report (used by /end, manual)
//   node tools/check-dashboard-drift.mjs --quiet   # silent when clean; prints only on drift (hook mode)
// ============================================================================

import { existsSync, readdirSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const GRAPH = join(ROOT, "previews/dashboards/asset-studio-graph.json");
const HUB = join(ROOT, "previews/dashboards/asset-studio-hub.json");
const APP_DIR = join(ROOT, "previews/app");
const APP_ENTRY = join(APP_DIR, "index.html");
const RENDER_HUB = join(ROOT, ".project-system/tools/render-hub.mjs");

const QUIET = process.argv.slice(2).includes("--quiet");

function newestMtimeMs(paths) {
  let newest = 0;
  for (const p of paths) if (existsSync(p)) newest = Math.max(newest, statSync(p).mtimeMs);
  return newest;
}

// --- Signal A: content staleness — delegate to the authority (render-hub --check) ---
function signalStale() {
  if (!existsSync(RENDER_HUB)) return null; // no generator here → can't judge
  const r = spawnSync(process.execPath, [RENDER_HUB, "--check", "--root", ROOT], { encoding: "utf8" });
  if (r.error) return null; // couldn't run the checker → don't cry wolf
  if (r.status === 0) return null; // "check: in sync"
  // Surface render-hub's own diagnosis (e.g. "graph.json DRIFT", "hub.json missing").
  const detail = `${r.stdout || ""}\n${r.stderr || ""}`
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("check:"))
    .map((l) => l.replace(/^check:\s*/, ""))
    .join("; ");
  return {
    label: "source edited but contracts NOT regenerated",
    detail: detail || "render-hub --check reports the graph/hub JSON is out of sync with _project/",
    fix: "node .project-system/tools/render-hub.mjs",
  };
}

// --- Signal B: regenerated but uncommitted ---
function signalUncommitted() {
  const r = spawnSync("git", ["status", "--porcelain", "--", GRAPH, HUB], { cwd: ROOT, encoding: "utf8" });
  if (r.status !== 0 || !r.stdout) return null; // not a repo / git absent / clean → skip
  const dirty = r.stdout.split("\n").filter((l) => l.trim()).length;
  if (!dirty) return null;
  return {
    label: `${dirty} contract file(s) regenerated but UNCOMMITTED`,
    detail: "the graph/hub JSON differs from HEAD — the render happened but was never persisted",
    fix: "git add previews/dashboards/asset-studio-*.json && git commit",
  };
}

// --- Signal C: committed contract newer than the built static bundle (heuristic) ---
function signalBundleStale() {
  if (!existsSync(APP_ENTRY)) return null; // no static build in this checkout → skip
  const contractNewest = newestMtimeMs([GRAPH, HUB]);
  if (!contractNewest) return null;
  // Compare against the newest build artifact (index.html + hashed asset chunks),
  // not index.html alone — a real `vite build` restamps the chunks even when the
  // entry HTML is byte-stable.
  const artifacts = [APP_ENTRY];
  const assetsDir = join(APP_DIR, "assets");
  if (existsSync(assetsDir)) for (const f of readdirSync(assetsDir)) artifacts.push(join(assetsDir, f));
  if (contractNewest <= newestMtimeMs(artifacts)) return null;
  return {
    label: "static Command Center bundle is BEHIND the contract (heuristic)",
    detail: "previews/app/ was built before the current graph/hub JSON — the dev server hot-reloads, the committed static site does not",
    fix: "pnpm --dir apps/command-center build",
  };
}

function main() {
  const signals = [signalStale(), signalUncommitted(), signalBundleStale()].filter(Boolean);

  if (!signals.length) {
    if (!QUIET) console.log("[dashboard-drift] ✓ Command Center in sync with _project/ — no drift");
    return; // advisory: always exit 0
  }

  const n = signals.length;
  console.log(`[dashboard-drift] ⚠ ${n} drift signal${n > 1 ? "s" : ""} — the Command Center is behind _project/:`);
  for (const s of signals) {
    console.log(`  • ${s.label}`);
    console.log(`      ${s.detail}`);
    console.log(`      → fix: ${s.fix}`);
  }
  console.log("  (advisory — nothing was changed; run /end to reconcile, or fix manually)");
  // Never process.exit(1): this must not gate a session (cf. validate.mjs --summary).
}

main();
