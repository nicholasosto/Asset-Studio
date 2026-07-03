#!/usr/bin/env node
// migrate-assets-library.mjs — manifest-driven restructure of ~/Master-Managed/Assets
// per ADR 0008 (staging / master-library / runtime / machinery zones).
//
// The library is NOT a git repository, so the manifest is the undo map. Workflow:
//
//   node tools/migrate-assets-library.mjs --plan          # scan → __migration-manifest.csv + summary
//   (owner reviews the CSV — rows may be hand-edited or deleted; it is executed verbatim)
//   node tools/migrate-assets-library.mjs --execute --confirm
//   node tools/migrate-assets-library.mjs --rollback --confirm   # reverse, reading the relocated manifest
//
// --execute applies exactly the CSV: per-file rename() only (never directory moves), parents
// created on demand, `delete` rows unlinked (regenerable ephemera only — caches; rollback
// cannot restore these, by design), emptied dirs pruned bottom-up (.DS_Store deleted on the
// way), and the manifest itself relocated last to _catalog/migration-<id>.csv beside a JSON
// execution log.
// Flags: --root <path> (default ~/Master-Managed/Assets), --force (proceed past missing
// sources on execute/rollback — skips them; dest conflicts always abort).

import { readdirSync, statSync, existsSync, mkdirSync, renameSync, rmdirSync, unlinkSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname, basename, posix } from "node:path";
import { homedir } from "node:os";

const MIGRATION_ID = "2026-07-03"; // ADR 0008 decision date — stable across sessions
const MANIFEST_NAME = "__migration-manifest.csv";
const FINAL_MANIFEST = `_catalog/migration-${MIGRATION_ID}.csv`;
const FINAL_LOG = `_catalog/migration-${MIGRATION_ID}.log.json`;

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const opt = (f, d) => { const i = args.indexOf(f); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const ROOT = opt("--root", process.env.ASSETS_ROOT || join(homedir(), "Master-Managed", "Assets"));
const MODE = has("--execute") ? "execute" : has("--rollback") ? "rollback" : "plan";

// ── mapping rules (ordered, first match wins) ──────────────────────────────
// Each rule: (rel) -> {dest, note} | null (no match). dest === rel means stay
// (stays are only emitted as rows when they carry a review note).

const AUDIO_RENAMES = {
  "bg-music": "music",
  "ui-fx": "ui",
  "voice-dialog": "voice",
  "ability-combat-fx": "sfx/combat",
  "world-fx": "sfx/world",
  "environment": "ambient",
  "generic": "sfx",
};
const UI_PROJECT_SETS = new Set(["abilities", "bestiary", "factions", "portraits"]);
const INBOX_MODALITY = (name) => {
  const ext = posix.extname(name).toLowerCase();
  if ([".png", ".jpg", ".jpeg", ".webp", ".gif", ".pxd"].includes(ext)) return "images";
  if ([".rbxm", ".fbx", ".obj", ".gltf", ".glb", ".blend", ".blend1", ".zip", ".ma"].includes(ext)) return "models";
  if ([".mp3", ".wav", ".flac", ".ogg"].includes(ext)) return "audio";
  return "other";
};

// name..ext → name.ext (ElevenLabs drops); applied to every destination basename
const fixDoubleDot = (name) => name.replace(/\.+(?=\.[A-Za-z0-9]+$)/, "");
const kebab = (name) => {
  const ext = posix.extname(name);
  const stem = name.slice(0, name.length - ext.length);
  return stem.trim().toLowerCase().replace(/[\s_]+/g, "-").replace(/-+/g, "-") + ext.toLowerCase();
};

function mapPath(rel) {
  const segs = rel.split("/");
  const [s0, s1] = segs;
  const rest = (n) => segs.slice(n).join("/");

  // root registry/ledger files → _catalog/ (strip the __ float-to-top prefix)
  if (segs.length === 1 && s0.startsWith("__")) {
    return { dest: `_catalog/${s0.replace(/^__+/, "")}`, note: "root ledger gathered into _catalog (tools that read it get path patches)" };
  }
  if (s0 === "_archive") return { dest: rel, note: "" };

  if (s0 === "ai-output") {
    if (s1 === ".codex" || s1 === ".control-center") {
      return { dest: `_archive/${MIGRATION_ID}-migration/${rel}`, note: "stale tool droppings (control-center moved out of the tree 2026-04-16)" };
    }
    return { dest: `_inbox/${rest(1)}`, note: "" };
  }
  if (s0 === "pre-stamp") {
    return { dest: `_inbox/${INBOX_MODALITY(basename(rel))}/${rest(1)}`, note: "untriaged staging content" };
  }
  if (s0 === "scripts" && (s1 === ".cache" || s1 === "__pycache__")) {
    return { dest: "", note: "regenerable ephemera — cache is past its 30-day TTL and CACHE_DIR derives from the script location, so the validator repopulates at _tools/.cache/" };
  }
  if (s0 === "scripts") return { dest: `_tools/${rest(1)}`, note: "" };

  if (s0 === "audio" && s1 in AUDIO_RENAMES) return { dest: `audio/${AUDIO_RENAMES[s1]}/${rest(2)}`, note: "" };
  if (s0 === "audio") return { dest: rel, note: "" };

  if (s0 === "ui" && s1 === "slice-frames") return { dest: `ui/frames/${rest(2)}`, note: "" };
  if (s0 === "ui" && UI_PROJECT_SETS.has(s1)) {
    return { dest: `ui/soul-steel/${s1}/${rest(2)}`, note: "project-named content under an explicit project folder (ADR 0008 rule 2)" };
  }
  if (s0 === "ui") return { dest: rel, note: "" };

  if (s0 === "textures") return { dest: rel, note: "" };
  if (s0 === "concept-art") {
    const flag = !posix.extname(basename(rel)) ? "ANOMALY: extensionless file — add an extension or archive"
      : basename(rel) === "index.html.png" ? "ANOMALY: double-extension name — consider renaming" : "";
    return { dest: rel, note: flag };
  }

  if (s0 === "3D-asset-art") {
    if (rel === "3D-asset-art/README.md") return { dest: "models/README.md", note: "rewrite internal path refs (library→runtime, validator now in _tools)" };
    if (s1 === "tools") return { dest: `_tools/${rest(2)}`, note: "update its hardcoded 3D-asset-art root to models/" };
    if (s1 === "templates") return { dest: `models/templates/${rest(2)}`, note: "" };
    if (s1 === ".codex") return { dest: `models/.codex/${rest(2)}`, note: "update project_root/package_path inside loop.yaml + ~/.codex/config.toml:212 trust entry" };
    if (segs.length === 2 && s1.startsWith("futuristic-business-fill-bars-concept")) {
      return { dest: `ui/design/concepts/${s1}`, note: "UI design concept parked at the 3D-asset-art root" };
    }
    if (segs.length === 2) return { dest: `_inbox/images/${s1}`, note: "loose support art with no package — adopt into models/<collection>/<slug>/ or discard" };
    if (s1 === "CAD-Design") return { dest: `models/cad-design/${rest(2)}`, note: "kebab-case folder normalization" };
    return { dest: `models/${rest(1)}`, note: "" };
  }

  if (s0 === "gitf-exports") {
    const name = basename(rel);
    if (name.startsWith("Arc_Turret")) return { dest: `models/tower-defense-towers/arc-turret/exports/${name}`, note: "export reunited with its package (gitf-exports was a gltf typo dir)" };
    return { dest: `_inbox/models/${name}`, note: "orphan export — triage" };
  }

  if (s0 === "source") {
    if (s1 === "blender" && segs[2] === "exports") {
      return { dest: `_inbox/models/blender-exports/${rest(3)}`, note: "scratch/test exports (scale/decimate tests, Untitled) — triage; exports are not source" };
    }
    if (s1 === "meshy-exports") {
      const name = basename(rel);
      if (segs.length === 3 && /\.blend1?$/.test(name)) return { dest: `source/blender/${name}`, note: "working file relocated out of meshy-exports" };
      return { dest: `_inbox/models/meshy/${rest(2)}`, note: "raw AI-generation drop — triage" };
    }
    if (s1 === "pixelmator") {
      const name = basename(rel);
      if (/[\s]/.test(name)) return { dest: `${dirname(rel)}/${kebab(name)}`, note: "kebab-case rename (spaces in filename)" };
      return { dest: rel, note: "" };
    }
    return { dest: rel, note: "" }; // blender/{saves,soul-steel,stylized-human,loose}, terrain
  }

  if (s0 === "library") {
    const note = rel === "library/README.md"
      ? "rewrite: TGL contract text survives; fix the dead ~/Trembus-Technologies/tools/tgl-import.sh pointer"
      : "";
    return { dest: `runtime/roblox/soul-steel/${rest(1)}`, note };
  }

  return { dest: rel, note: "UNMAPPED — review" };
}

// ── scan / csv helpers ─────────────────────────────────────────────────────
function walk(dir, rel = "", out = []) {
  for (const e of readdirSync(join(ROOT, rel), { withFileTypes: true })) {
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.name === ".DS_Store") continue;
    if (r === MANIFEST_NAME || r === FINAL_MANIFEST || r === FINAL_LOG) continue;
    if (e.isDirectory() && !e.isSymbolicLink()) walk(dir, r, out);
    else out.push(r);
  }
  return out;
}
const csvEsc = (s) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
function csvParse(text) {
  const rows = []; let row = [], field = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; } else field += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(field); field = ""; if (row.some((f) => f !== "")) rows.push(row); row = []; }
    else field += c;
  }
  if (field !== "" || row.length) { row.push(field); if (row.some((f) => f !== "")) rows.push(row); }
  return rows;
}

// ── plan ───────────────────────────────────────────────────────────────────
function plan() {
  const files = walk(ROOT).sort();
  const rows = []; // [action, old, new, note]
  const destMap = new Map();
  let stays = 0, unmapped = 0;

  for (const rel of files) {
    const { dest: rawDest, note } = mapPath(rel);
    if (rawDest === "") { rows.push(["delete", rel, "", note]); continue; }
    const dest = rawDest === rel ? rel : posix.join(dirname(rawDest) === "." ? "" : dirname(rawDest), fixDoubleDot(basename(rawDest)));
    if (dest === rel) {
      stays++;
      if (note) { rows.push([note.startsWith("UNMAPPED") ? "review" : "flag", rel, rel, note]); if (note.startsWith("UNMAPPED")) unmapped++; }
      continue;
    }
    const action = dirname(dest) === dirname(rel) ? "rename"
      : basename(dest) !== basename(rel) ? "move+rename"
      : dest.startsWith("_archive/") ? "archive" : "move";
    rows.push([action, rel, dest, note]);
    if (!destMap.has(dest)) destMap.set(dest, []);
    destMap.get(dest).push(rel);
  }

  // collisions: two sources → one dest, or dest already occupied on disk
  let errors = 0;
  for (const [dest, sources] of destMap) {
    if (sources.length > 1) { rows.push(["ERROR", sources.join(" | "), dest, "COLLISION: multiple sources map to one destination"]); errors++; }
    else if (existsSync(join(ROOT, dest))) { rows.push(["ERROR", sources[0], dest, "COLLISION: destination already exists on disk"]); errors++; }
  }

  rows.push(["move", MANIFEST_NAME, FINAL_MANIFEST, "the manifest archives itself into _catalog on execute (applied last)"]);
  const csv = ["action,old_path,new_path,note", ...rows.map((r) => r.map(csvEsc).join(","))].join("\n") + "\n";
  writeFileSync(join(ROOT, MANIFEST_NAME), csv);

  const byAction = {}; for (const [a] of rows) byAction[a] = (byAction[a] ?? 0) + 1;
  const byZone = {};
  for (const [a, , d] of rows) { if (a === "flag" || a === "ERROR" || a === "delete") continue; const z = d.split("/")[0]; byZone[z] = (byZone[z] ?? 0) + 1; }
  console.log(`plan: scanned ${files.length} files under ${ROOT}`);
  console.log(`  manifest rows: ${rows.length}  (${Object.entries(byAction).map(([k, v]) => `${k}: ${v}`).join(" · ")})`);
  console.log(`  staying put:   ${stays} files (only flagged ones appear as rows)`);
  console.log(`  dest zones:    ${Object.entries(byZone).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}: ${v}`).join(" · ")}`);
  console.log(`  unmapped: ${unmapped} · collisions: ${errors}`);
  console.log(`  wrote ${join(ROOT, MANIFEST_NAME)}`);
  if (errors || unmapped) { console.error("  ✗ resolve ERROR/review rows before --execute"); process.exitCode = 1; }
}

// ── execute / rollback ─────────────────────────────────────────────────────
function loadManifest(path) {
  const rows = csvParse(readFileSync(path, "utf8"));
  const [header, ...data] = rows;
  if (header.join(",") !== "action,old_path,new_path,note") throw new Error(`unexpected manifest header in ${path}`);
  return data.map(([action, oldP, newP, note]) => ({ action, oldP, newP, note: note ?? "" }));
}

function pruneEmptyDirs() {
  let pruned = 0;
  const sweep = (rel) => {
    for (const e of readdirSync(join(ROOT, rel || "."), { withFileTypes: true })) {
      if (!e.isDirectory() || e.isSymbolicLink()) continue;
      sweep(rel ? `${rel}/${e.name}` : e.name);
    }
    if (!rel) return;
    const entries = readdirSync(join(ROOT, rel));
    if (entries.length === 1 && entries[0] === ".DS_Store") unlinkSync(join(ROOT, rel, ".DS_Store"));
    if (readdirSync(join(ROOT, rel)).length === 0) { rmdirSync(join(ROOT, rel)); pruned++; }
  };
  sweep("");
  return pruned;
}

function apply(mode) {
  if (!has("--confirm")) { console.error(`${mode} requires --confirm (review ${MANIFEST_NAME} first)`); process.exit(1); }
  const manifestPath = mode === "execute" ? join(ROOT, MANIFEST_NAME) : join(ROOT, opt("--manifest", FINAL_MANIFEST));
  const rowsAll = loadManifest(manifestPath);
  const bad = rowsAll.filter((r) => r.action === "ERROR" || r.action === "review");
  if (bad.length) { console.error(`✗ manifest still has ${bad.length} ERROR/review rows — resolve or delete them first`); process.exit(1); }

  const deletes = rowsAll.filter((r) => r.action === "delete");
  let rows = rowsAll.filter((r) => r.action !== "flag" && r.action !== "delete" && r.oldP !== r.newP)
    .map((r) => (mode === "rollback" ? { ...r, oldP: r.newP, newP: r.oldP } : r));
  // manifest self-row goes last on execute, first on rollback (it must exist before reversal… it IS the file being read; move it last there too)
  rows = [...rows.filter((r) => r.oldP !== MANIFEST_NAME && r.newP !== MANIFEST_NAME),
          ...rows.filter((r) => r.oldP === MANIFEST_NAME || r.newP === MANIFEST_NAME)];

  const missing = rows.filter((r) => !existsSync(join(ROOT, r.oldP)));
  const conflicts = rows.filter((r) => existsSync(join(ROOT, r.newP)));
  if (conflicts.length) { console.error(`✗ ${conflicts.length} destinations already exist — aborting:`); conflicts.slice(0, 10).forEach((r) => console.error(`   ${r.newP}`)); process.exit(1); }
  if (missing.length && !has("--force")) { console.error(`✗ ${missing.length} sources missing (use --force to skip them):`); missing.slice(0, 10).forEach((r) => console.error(`   ${r.oldP}`)); process.exit(1); }

  let moved = 0, deleted = 0;
  for (const r of rows) {
    if (!existsSync(join(ROOT, r.oldP))) continue;
    mkdirSync(dirname(join(ROOT, r.newP)), { recursive: true });
    renameSync(join(ROOT, r.oldP), join(ROOT, r.newP));
    moved++;
  }
  if (mode === "execute") {
    for (const r of deletes) { const p = join(ROOT, r.oldP); if (existsSync(p)) { unlinkSync(p); deleted++; } }
  } else if (deletes.length) {
    console.log(`  note: ${deletes.length} delete rows are regenerable ephemera — not restorable, skipped`);
  }
  const pruned = pruneEmptyDirs();
  const log = { migrationId: MIGRATION_ID, mode, executedAt: new Date().toISOString(), moved, deleted, skippedMissing: missing.length, prunedDirs: pruned };
  mkdirSync(join(ROOT, "_catalog"), { recursive: true });
  writeFileSync(join(ROOT, mode === "execute" ? FINAL_LOG : `_catalog/migration-${MIGRATION_ID}.rollback.log.json`), JSON.stringify(log, null, 2) + "\n");
  console.log(`${mode}: moved ${moved} files · deleted ${deleted} ephemera · skipped ${missing.length} missing · pruned ${pruned} empty dirs`);
  console.log(`  next: rebuild the registry (node tools/build-asset-registry.mjs) and walk the ADR 0008 surface checklist`);
}

if (MODE === "plan") plan();
else apply(MODE);
