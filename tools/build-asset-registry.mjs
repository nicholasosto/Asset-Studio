#!/usr/bin/env node
// ============================================================================
// build-asset-registry.mjs — Asset-Studio Asset Explorer registry builder (v1)
// ============================================================================
//
// ZERO-DEPENDENCY Node ESM scanner (node built-ins only: fs, path, crypto, url).
//
// Walks the shared asset library through the read-only symlink at
//   external-locations/assets  ->  ~/Master-Managed/Assets/
// (per decision 0001 — NEVER write into it, never duplicate it), computes
// per-file metadata FAITHFULLY ported from the Soul-Steel reference scanner
//   Roblox-Development/Soul-Steel-Official/tools/build-asset-explorer.mjs
// then ADDS a deterministic medium/mediumType taxonomy on top and emits
//   previews/dashboards/asset-registry.json
// (a top-level summary object + the records array).
//
// What is FAITHFULLY PORTED from the reference (unchanged semantics):
//   walk · parseTgl · statusSuffix · inferDomain · KIND_BY_EXT · the scan()
//   field set (p/area/dir/base/stem/ext/kind/size/mtime/mtimeMs/domain/tgl/
//   status/conformance/issue) · inferInstance · classifySpec/resBucket ·
//   the CSV registry parse + join (parseCsvLine/loadRegistry/joinRegistry;
//   the join key now also strips a "Collection: " display prefix — see there) ·
//   the thumb NAMING (thumbName — sha1 of the library-relative PATH, not content).
//
// What is NEW here:
//   deriveMedium(rec)      -> 'image' | 'audio' | '3d' | null
//   deriveMediumType(rec)  -> mediumType string | null   (see rules below)
//   KIND_BY_EXT extended:  .ma -> model, .flac -> audio  (census: 1 each)
//
// What is NOW DONE (was deferred in v1) — the served-media layer for the app:
//   image thumbnail generation via macOS sips → previews/thumbs/ (rec.thumb, bare name);
//     the bake is a LOCAL cache — previews/thumbs/ is gitignored, never committed (the
//     Explorer has no published-view requirement; previews only need to work where a bake ran)
//   a served /_assets/<p> `src` baked onto every real record (image/audio/3d)
//   an `assetsRootAbs` payload field + the self-healed previews/_assets symlink
//
// Still DEFERRED (kept as pure helpers / absent fields):
//   image dimension measurement (w/h/dims/res stay ABSENT; spec => 'n/a')
//   a portable (non-sips) thumbnail baker for non-macOS contributors
//
// FIELD-PRESENCE CONTRACT (preserved from reference): w, h, dims, res,
// specIssue, reg, thumb, src are OPTIONAL — they are absent (not null) when N/A.
// medium is null (explicit) for non-asset kinds; mediumType is null iff
// medium is null; mediumType 'unknown' is only a defensive terminal.
//
// Deterministic + idempotent in every DERIVED field: no randomness, no wall-clock.
// The built/builtMs summary stamp is the one exception — every rebuild diffs the
// JSON by those two lines. Thumbs are ALWAYS rebaked (no skip/kept path — ADR 0005);
// sips output is byte-stable on a given macOS, so unchanged sources produce no
// thumb churn, and orphaned thumbs (renamed/deleted sources) are pruned each bake.
//
// Usage:
//   node tools/build-asset-registry.mjs               # write asset-registry.json (+ bake thumbs)
//   node tools/build-asset-registry.mjs --no-thumbs   # skip sips; REUSES already-baked thumbs (non-macOS safe)
//   node tools/build-asset-registry.mjs --print-json  # dump metadata payload to stdout (no disk writes)
// ============================================================================

import {
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// ── paths ───────────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, ".."); // tool lives in tools/, root is one up
const ASSETS_ROOT = join(PROJECT_ROOT, "external-locations", "assets");
const DASHBOARD_DIR = join(PROJECT_ROOT, "previews", "dashboards");
const OUT = join(DASHBOARD_DIR, "asset-registry.json");
const REGISTRY_CSV = join(ASSETS_ROOT, "_catalog", "master-asset-ids-validated.csv");
const THUMBS_DIR = join(PROJECT_ROOT, "previews", "thumbs");   // Asset-Studio-OWNED thumb cache — LOCAL/untracked (gitignored; no published Explorer view)
const ASSETS_LINK = join(PROJECT_ROOT, "previews", "_assets"); // committed symlink → shared library realpath (served as /_assets)

// ── constants ─────────────────────────────────────────────────────────────
const SKIP_DIRS = new Set(["_archive", "_catalog", "_tools", ".codex", "__pycache__", ".git", "node_modules"]);
const SKIP_FILES = new Set([".DS_Store"]);
const SKIP_EXTS = new Set([".pyc", ".blend1"]);
// registry / sidecar reports living in ASSETS_ROOT root — never index ourselves
const SKIP_SIDECAR_RE = /^__master-asset-ids|^__animation-/;

const TGL_CATS = new Set(["PRP", "RIG", "EFX", "ENV", "LAY", "ACC", "ANI"]);
const TGL_STATUSES = new Set(["BLK", "ALPHA", "BETA", "FNL"]);
const TGL_DOMAINS = new Set(["shared", "blood", "decay", "spirit", "robotic", "fateless", "hub"]);

// KIND_BY_EXT — ported from reference, EXTENDED with .ma -> model, .flac -> audio.
const KIND_BY_EXT = {
  ".rbxm": "model", ".fbx": "model", ".obj": "model", ".gltf": "model", ".glb": "model", ".blend": "model", ".ma": "model",
  ".png": "image", ".jpg": "image", ".jpeg": "image", ".webp": "image",
  ".mp3": "audio", ".wav": "audio", ".ogg": "audio", ".flac": "audio",
  ".csv": "data", ".json": "data", ".toml": "data", ".yaml": "data", ".yml": "data",
  ".md": "doc", ".txt": "doc",
  ".py": "script", ".mjs": "script", ".sh": "script",
  ".pxd": "source", ".zip": "source",
};

// Precompiled token regexes (compiled once) for the derivation rules.
const RE_PBR = /(_|-|\.|^)(alb|albedo|nrm|nor|normal|rgh|rough|roughness|mtl|met|metal|metalness|spec|ao|orm)(_|-|\.|$)/;
const RE_TEXTURE_PATH = /\b(pbr|surface[-_]?appearance|material[s]?|texture[-_]?maps?|tileable|decal|skybox|cubemap)\b/;
const RE_UI_PATH = /(^|\/)ui(\/|$)|\b(hud|button|btn|frame|panel|badge|cursor|icon[s]?|slice[-_]?frame|sprite)\b/;
const RE_RIG_TOKEN = /\b(rig|skeleton|armature|skinned)\b/;
const RE_ANIM_TOKEN = /\b(anim|animation)\b/;
const RE_VOICE_TOKEN = /\b(voice|dialog|dialogue|-vo|_vo|tts|line|taunt|catchphrase|phase-\d)\b/;
// music stem tokens: theme|lobby|jingle|stinger|soundtrack|score, prefix td-, or contains battle
const RE_MUSIC_TOKEN = /\b(theme|lobby|jingle|stinger|soundtrack|score)\b|^td-|battle/;

const args = new Set(process.argv.slice(2));
const PRINT_JSON = args.has("--print-json");
const WANT_THUMBS = !args.has("--no-thumbs");

// readdir/stat failures during the scan — surfaced at the end, so a permission-broken
// or half-mounted subtree can't silently vanish from the committed registry.
let scanErrors = 0;

// Per-segment percent-encoding for the served /_assets/<p> URL baked into each record
// (spaces/parens are common in real asset paths). Mirrors the app's registry.ts encoder so
// both ends agree on the scheme. See decision serve-the-shared-asset-library-to-the-spa.
const encPath = (p) => p.split("/").map(encodeURIComponent).join("/");
const assetUrl = (p) => `/_assets/${encPath(p)}`;

// ── scan: walk ──────────────────────────────────────────────────────────
// Recursive readdir; prune SKIP_DIRS whole-subtree; drop .DS_Store / .tmp* /
// SKIP_EXTS / registry sidecars. Only regular files pushed. Errors swallowed.
function walk(dir, relBase = "") {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    scanErrors++;
    return out;
  }
  for (const entry of entries) {
    const name = entry.name;
    if (name.startsWith(".tmp")) continue;
    const relPath = relBase ? `${relBase}/${name}` : name;
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(name)) continue;
      out.push(...walk(join(dir, name), relPath));
    } else if (entry.isFile()) {
      if (SKIP_FILES.has(name)) continue;
      if (SKIP_EXTS.has(extname(name).toLowerCase())) continue;
      // registry / sidecar reports live at ASSETS_ROOT root — skip so we
      // never index ourselves (relPath has no slash for root-level files).
      if (!relBase && SKIP_SIDECAR_RE.test(name)) continue;
      out.push(relPath);
    }
  }
  return out;
}

// ── scan: TGL grammar (verbatim port) ─────────────────────────────────────
// Parse a filename stem against TGL grammar. Returns { cat, sub, name, status, grade }
// grade: "full" = CAT_SUB_Name_STATUS · "partial" = recognizable but malformed · null = not TGL-shaped
function parseTgl(stem) {
  const full = stem.match(/^(PRP|RIG|EFX|ENV|LAY|ACC|ANI)_([A-Z0-9]{2,4})_(.+)_(BLK|ALPHA|BETA|FNL)$/);
  if (full && !TGL_STATUSES.has(full[2])) {
    return { cat: full[1], sub: full[2], name: full[3], status: full[4], grade: "full" };
  }
  const noSub = stem.match(/^(PRP|RIG|EFX|ENV|LAY|ACC|ANI)_(.+)_(BLK|ALPHA|BETA|FNL)$/);
  if (noSub) {
    return { cat: noSub[1], sub: null, name: noSub[2], status: noSub[3], grade: "partial", issue: "missing SUB segment" };
  }
  const catOnly = stem.match(/^(PRP|RIG|EFX|ENV|LAY|ACC|ANI)_(.+)$/);
  if (catOnly) {
    return { cat: catOnly[1], sub: null, name: catOnly[2], status: null, grade: "partial", issue: "missing Status suffix" };
  }
  return null;
}

function statusSuffix(stem) {
  const m = stem.match(/_(BLK|ALPHA|BETA|FNL)$/);
  return m ? m[1] : null;
}

function inferDomain(relPath) {
  for (const seg of relPath.split("/")) {
    const lower = seg.toLowerCase();
    if (TGL_DOMAINS.has(lower)) return lower;
  }
  return null;
}

// ── roblox instance classification (verbatim port) ────────────────────────
// Maps each asset to the Roblox instance most likely to consume it, using
// TGL CAT + folder + filename hints. Heuristic — unchanged from reference.
function inferInstance(rec) {
  if (rec.kind === "audio") return "Sound";
  if (rec.kind === "model") return "MeshPart";
  if (rec.kind !== "image") return null;
  const p = rec.p.toLowerCase();
  const s = rec.stem.toLowerCase();
  const cat = rec.tgl?.cat;
  // PBR material maps (albedo / normal / roughness / metalness / ao)
  if (/(_|-|\b)(alb|albedo|nrm|nor|normal|rgh|rough|roughness|mtl|met|metal|metalness|spec|ao|orm)(_|-|\.|$)/.test(s)
    || /\b(pbr|surface[-_]?appearance|material[s]?|texture[-_]?maps?)\b/.test(p))
    return "SurfaceAppearance";
  // skybox cube faces
  if (/\b(sky|skybox|cubemap)\b/.test(p) || /_(ft|bk|lf|rt|up|dn)$/.test(s))
    return "Sky";
  // store-page imagery (publishing — not an in-engine texture)
  if (/\b(thumbnail|store[-_]?image|game[-_]?tile|capsule|splash)\b/.test(p))
    return "Store icon/thumb";
  // particles / flipbooks
  if (cat === "EFX" || /\b(particle[s]?|vfx|spark[s]?|smoke|flame|ember|flipbook|dust)\b/.test(p))
    return "ParticleEmitter";
  // beams / trails
  if (/\b(beam|trail|ribbon|slash|streak|laser)\b/.test(p))
    return "Beam/Trail";
  // UI imagery
  if (rec.area === "ui" || /(^|\/)ui(\/|$)|\b(hud|button|btn|frame|panel|badge|cursor|icon[s]?)\b/.test(p))
    return "ImageLabel/Button";
  // surface decals / tiled textures
  if (/\b(decal|texture|tile|wall|floor|ground|brick|fabric)\b/.test(p))
    return "Decal/Texture";
  return "Image (other)";
}

// ── spec-fit (verbatim port) ──────────────────────────────────────────────
// With image dimensions DEFERRED in v1, the !rec.w guard yields 'n/a' for all
// images — the contract is preserved, values fill in once a later pass measures.
function resBucket(w, h) {
  const m = Math.max(w, h);
  if (m <= 256) return "≤256";
  if (m <= 512) return "512";
  if (m <= 1024) return "1024";
  if (m <= 2048) return "2048";
  return "4K+";
}

function classifySpec(rec) {
  if (rec.kind !== "image" || !rec.w) return { spec: "n/a", issue: null };
  const m = Math.max(rec.w, rec.h);
  const square = rec.w === rec.h;
  if (m > 4096) return { spec: "oversize", issue: "exceeds 4096 upload cap (" + rec.dims + ")" };
  if (rec.size > 20 * 1048576) return { spec: "over-budget", issue: "file over 20 MB" };
  if (rec.instance === "SurfaceAppearance" && m > 1024) return { spec: "over-budget", issue: "PBR map over 1024 (" + rec.dims + ")" };
  if (rec.instance === "Sky" && !square) return { spec: "check-ratio", issue: "skybox face not square (" + rec.dims + ")" };
  return { spec: "ok", issue: null };
}

// ── NEW: medium / mediumType derivation ───────────────────────────────────
// Deterministic, total, precedence top-to-bottom / first-match-wins. Pure
// functions of fields already set by scan (kind, ext, area, segs, tgl, p, stem).

// deriveMedium — purely a function of kind.
// 'image' | 'audio' | '3d' | null (null = the hidden Source & Docs bucket).
function deriveMedium(rec) {
  if (rec.kind === "image") return "image";
  if (rec.kind === "audio") return "audio";
  if (rec.kind === "model") return "3d";
  return null; // data | doc | source | script | other
}

// deriveMediumType — mediumType string, or null iff deriveMedium is null.
// Never drops a record: an asset that matches no rule returns the defensive
// 'unknown' (expected count 0 on today's corpus).
function deriveMediumType(rec) {
  const medium = deriveMedium(rec);
  if (medium === null) return null;

  const segs = rec.segs || rec.p.split("/");
  const seg1 = segs[0]?.toLowerCase();
  const seg2 = segs[1]?.toLowerCase();
  const cat = rec.tgl?.cat;
  const s = rec.stem.toLowerCase();
  const p = rec.p.toLowerCase();

  // ── MEDIUM === '3d' (kind model) — lean on TGL category prefix first ──
  if (medium === "3d") {
    if (cat === "RIG") return "3d-rig";                               // 3a
    if (cat === "ANI") return "animation";                           // 3b
    if (cat === "PRP" || cat === "ENV" || cat === "ACC" || cat === "LAY") return "3d-model"; // 3c
    if (cat === "EFX") return "3d-model";                            // 3d (mesh tagged EFX)
    // No TGL prefix — folder + filename fallback:
    if (rec.area === "runtime" && segs[3]?.toLowerCase() === "rigs") return "3d-rig";  // 3e (runtime/<platform>/<project>/<cat>)
    if (rec.area === "runtime" && segs[3]?.toLowerCase() === "layouts") return "3d-model"; // 3f
    if (RE_RIG_TOKEN.test(p) || RE_RIG_TOKEN.test(s)) return "3d-rig"; // 3g
    if (RE_ANIM_TOKEN.test(p) || RE_ANIM_TOKEN.test(s)) return "animation"; // 3h
    return "3d-model";                                                // 3i safe default
  }

  // ── MEDIUM === 'image' (kind image) — folder area strongest, then tokens ──
  if (medium === "image") {
    if (rec.area === "textures") return "texture";                   // iA
    if (cat === "EFX") return "texture";                             // iB effect texture/flipbook
    if (RE_PBR.test(s)) return "texture";                            // iC PBR channel token
    if (RE_TEXTURE_PATH.test(p)) return "texture";                  // iD PBR/material path tokens
    if (rec.area === "ui" || seg1 === "ui" || /(^|\/)ui(\/|$)/.test(p)) return "ui"; // iE
    if (RE_UI_PATH.test(p)) return "ui";                            // iF UI tokens
    return "image";                                                  // iG generic image (total)
  }

  // ── MEDIUM === 'audio' (kind audio) — folder PRIMARY, tokens SECONDARY ──
  if (medium === "audio") {
    // VOICE (highest — folder is the only reliable voice signal)
    if (seg1 === "audio" && seg2 === "voice") return "audio-voice";                            // vA
    if (seg1 === "_inbox" && seg2 === "audio" && (segs[2]?.toLowerCase() === "tts" || segs[2]?.toLowerCase() === "voice-previews"))
      return "audio-voice";                                                                     // vB
    if (RE_VOICE_TOKEN.test(p)) return "audio-voice";                                          // vC token backup
    // MUSIC
    if (seg1 === "audio" && seg2 === "music") return "audio-music";                             // mA
    if (RE_MUSIC_TOKEN.test(s)) return "audio-music";                                          // mB music tokens
    // SFX (fallback catch-all — audio is NEVER 'unknown')
    if (seg1 === "audio" && ["sfx", "ui", "ambient"].includes(seg2))
      return "audio-sfx";                                                                        // sA
    if (seg1 === "_inbox" && seg2 === "audio" && segs[2]?.toLowerCase() === "sfx") return "audio-sfx"; // sB
    return "audio-sfx";                                                                          // sC guaranteed fallback
  }

  // Defensive terminal: a future asset ext with no matching branch above.
  return "unknown";
}

// ── scan ────────────────────────────────────────────────────────────────
function scan() {
  const relPaths = walk(ASSETS_ROOT);
  const records = [];
  for (const relPath of relPaths) {
    const abs = join(ASSETS_ROOT, relPath);
    let st;
    try {
      st = statSync(abs);
    } catch {
      scanErrors++;
      continue;
    }
    const extDotted = extname(relPath).toLowerCase(); // ".png" — dotted, for KIND_BY_EXT
    const ext = extDotted.replace(".", "");           // "png"  — dot-stripped, for the record
    const base = relPath.split("/").pop();
    const stem = base.slice(0, base.length - extDotted.length);
    const segs = relPath.split("/");
    const area = segs.length > 1 ? segs[0] : "(root)";
    const inRuntime = area === "runtime"; // runtime/<platform>/<project>/<cat>/… (was library/<cat>/…)
    const tgl = parseTgl(stem);
    const kind = KIND_BY_EXT[extDotted] || "other";   // lookup uses the DOTTED ext

    // Conformance is only *expected* of files in runtime/, and only for
    // asset payloads (models/images/audio) — docs and data are exempt.
    let conformance = "n/a";
    if (inRuntime && ["model", "image", "audio"].includes(kind)) {
      // runtime …/ui/screens uses bare Name_STATUS by convention — status stamp only
      if (segs[3] === "ui") {
        conformance = statusSuffix(stem) ? "ok" : "stray";
      } else if (tgl?.grade === "full") {
        conformance = "ok";
      } else {
        conformance = "stray";
      }
    }

    records.push({
      p: relPath,
      area,
      dir: segs.slice(0, -1).join("/"),
      base,
      stem,
      ext,
      kind,
      size: st.size,
      mtime: st.mtime.toISOString().slice(0, 10),
      mtimeMs: st.mtime.getTime(),
      domain: inferDomain(relPath), // tag only — never a grouping axis (decision 0002)
      tgl,
      status: tgl?.status || statusSuffix(stem),
      conformance,
      issue: conformance === "stray" ? (tgl?.issue || "not TGL-shaped") : null,
      segs, // transient — used by derive(), stripped before emit
    });
  }
  records.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return records;
}

// ── derive (NEW pass — replaces the reference 'enrich' for v1) ─────────────
// Order: instance first (independent, but must precede classifySpec), then
// medium/mediumType, then classifySpec. Image dims deferred -> spec 'n/a'.
function derive(records) {
  let unknown = 0;
  for (const rec of records) {
    rec.instance = inferInstance(rec);
    rec.medium = deriveMedium(rec);
    rec.mediumType = deriveMediumType(rec);
    if (rec.mediumType === "unknown") unknown++;
    // measureDims / sips NOT called in v1 — w/h/dims/res stay ABSENT.
    const sf = classifySpec(rec);
    rec.spec = sf.spec;
    if (sf.issue) rec.specIssue = sf.issue;
  }
  return { unknown };
}

// ── registry (verbatim port) ──────────────────────────────────────────────
function parseCsvLine(line) {
  const cells = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else cur += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") { cells.push(cur); cur = ""; }
    else cur += ch;
  }
  cells.push(cur);
  return cells;
}

function loadRegistry() {
  if (!existsSync(REGISTRY_CSV)) return { rows: [], counts: {} };
  // The master CSV is CRLF-terminated — split on \r?\n so the last column of every
  // row (and the last header key) doesn't keep a glued trailing "\r".
  const lines = readFileSync(REGISTRY_CSV, "utf8").trim().split(/\r?\n/);
  const header = parseCsvLine(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    return Object.fromEntries(header.map((key, i) => [key, cells[i] ?? ""]));
  });
  const counts = {};
  for (const row of rows) counts[row.status] = (counts[row.status] || 0) + 1;
  return { rows, counts };
}

function joinRegistry(records, registry) {
  const byName = new Map();
  for (const row of registry.rows) {
    if (!row.name) continue;
    // CSV names may carry a "Collection: name" display prefix (e.g. "Steel City UI:
    // panel-ornate-gold") — strip it (and any path prefix) before keying, so display
    // names can join against bare local stems.
    const key = row.name.split("/").pop().split(":").pop().toLowerCase().replace(/[\s_-]/g, "");
    if (!byName.has(key)) byName.set(key, row); // first-writer-wins
  }
  let matched = 0;
  for (const rec of records) {
    const bare = rec.stem.replace(/_(BLK|ALPHA|BETA|FNL)$/, "");
    const key = bare.toLowerCase().replace(/[\s_-]/g, "");
    const hit = byName.get(key);
    if (hit) {
      rec.reg = { id: hit.id, status: hit.status, kind: hit.actual_kind || hit.reported_kind };
      matched++;
    }
  }
  return matched;
}

// ── thumbnails (Asset-Studio-owned bake — sips → previews/thumbs/) ─────────
// PATH-hash naming: '<sha1(p)[:12]>.png' (BARE — the app resolves it to the
// /thumbs/<name> URL at render time). FAIL-SOFT: on any sips error we delete
// rec.thumb so the field stays ABSENT (the field-presence contract) and the tile
// placeholders. The framework-core zero-dep rule binds .project-system/, not this
// project-owned tool, so shelling out to sips is allowed. macOS-only; non-mac
// contributors run --no-thumbs. See decision
// bake-owned-image-thumbnails-in-the-registry-builder.
function thumbName(relPath) {
  return createHash("sha1").update(relPath).digest("hex").slice(0, 12) + ".png";
}

function buildThumbs(records) {
  mkdirSync(THUMBS_DIR, { recursive: true });
  let made = 0, failed = 0;
  for (const rec of records) {
    if (rec.medium !== "image") continue; // derive() has already set rec.medium
    const name = thumbName(rec.p);
    const out = join(THUMBS_DIR, name);
    rec.thumb = name; // BARE filename; app resolves → /thumbs/<name>
    // ALWAYS rebake — no mtime skip. The thumb name hashes the PATH (not content), so an mtime-based
    // skip would keep a STALE thumbnail after a same-path content swap that preserved mtime (cp -p,
    // rsync -a, restore, git checkout of an older-authored asset) while rec.src streams the new bytes.
    // `sips -Z … -s format png` is byte-deterministic (verified: repeat bakes are sha-identical), so
    // re-baking unchanged images rewrites identical files — correctness with no cost but ~seconds of
    // CPU (use --no-thumbs to skip entirely).
    // 320px: the Explorer tiles render ~150–190 CSS px wide, so 320 stays crisp at 2× DPR. The bake
    // is a LOCAL cache (previews/thumbs/ is gitignored — no published Explorer view), so resolution
    // costs local disk only, not repo weight.
    try {
      execFileSync("sips", ["-Z", "320", "-s", "format", "png", join(ASSETS_ROOT, rec.p), "--out", out], { stdio: "ignore" });
      made++;
    } catch {
      failed++;
      delete rec.thumb; // absent → placeholder plate
    }
  }
  // Prune orphans: the name hashes the PATH, so a rename/delete in the library strands
  // its old PNG forever — nothing else ever reclaims it. Expected = every image record's
  // name (bake-failed ones INCLUDED, so a transient sips error never deletes a prior
  // good thumb; the record just doesn't reference it this round).
  const expected = new Set(records.filter((r) => r.medium === "image").map((r) => thumbName(r.p)));
  let pruned = 0;
  for (const name of readdirSync(THUMBS_DIR)) {
    if (name.endsWith(".png") && !expected.has(name)) {
      rmSync(join(THUMBS_DIR, name), { force: true });
      pruned++;
    }
  }
  return { made, failed, pruned };
}

// Idempotent self-heal of the previews/_assets symlink → the shared library realpath.
// The link is also committed (per the .project-system convention of tracking the link, not
// the payload); this repairs a missing/dangling/wrong one so a fresh scan (and the static
// :4317 site, which serves /_assets THROUGH this link) works with no manual setup. Detect via
// lstat (NOT existsSync, which follows the link and reports a DANGLING link as absent → the
// naive create then throws EEXIST and silently leaves the bad link). Returns true if it wrote.
function ensureAssetsLink() {
  const want = realpathSync(ASSETS_ROOT); // the target the link must resolve to
  let link;
  try {
    link = lstatSync(ASSETS_LINK); // stat the link itself, don't follow it
  } catch {
    try { symlinkSync(want, ASSETS_LINK); return true; } // absent → create
    catch (e) { console.warn(`  warn: previews/_assets not created — ${e.message}`); return false; }
  }
  let target = null;
  if (link.isSymbolicLink()) { try { target = realpathSync(ASSETS_LINK); } catch { /* dangling */ } }
  if (target === want) return false; // already correct — nothing to do
  // Dangling, wrong target, or a non-symlink file: replace it (rmSync without recursive won't
  // clobber a real directory — it throws, we warn, we never delete a populated dir).
  try {
    rmSync(ASSETS_LINK, { force: true });
    symlinkSync(want, ASSETS_LINK);
    return true;
  } catch (e) {
    console.warn(`  warn: previews/_assets not repaired (was ${target ?? "dangling/non-link"}) — ${e.message}`);
    return false;
  }
}

// ── small helper ──────────────────────────────────────────────────────────
function tally(records, keyFn) {
  const out = {};
  for (const r of records) {
    const k = keyFn(r);
    out[k] = (out[k] || 0) + 1;
  }
  return out;
}

// ── main ──────────────────────────────────────────────────────────────────
function main() {
  if (!existsSync(ASSETS_ROOT)) {
    console.error(`assets root not found: ${ASSETS_ROOT}`);
    process.exit(1);
  }

  const records = scan();
  const registry = loadRegistry();
  const regMatched = joinRegistry(records, registry);
  const { unknown } = derive(records);

  // Bake the served-media side effects BEFORE building the payload so `thumb`/`src`
  // flow into the JSON — but SKIP them under --print-json so that stays a pure,
  // side-effect-free metadata dump (no symlink, no PNGs, no src/thumb fields).
  let thumbStats = { made: 0, failed: 0, pruned: 0, reused: 0 };
  if (!PRINT_JSON) {
    ensureAssetsLink();
    if (WANT_THUMBS) {
      thumbStats = { ...thumbStats, ...buildThumbs(records) }; // sets rec.thumb on image records
      // A 100% bake failure means sips is missing/broken (non-macOS) — writing this
      // registry would silently strip every thumb reference from the committed JSON.
      // Abort loudly instead of shipping a placeholder regression with exit 0.
      if (thumbStats.failed > 0 && thumbStats.made === 0) {
        console.error(`asset-registry: ALL ${thumbStats.failed} thumbnail bakes failed — is \`sips\` available on this machine?`);
        console.error("  nothing written. Re-run with --no-thumbs to reuse the already-baked previews/thumbs/.");
        process.exit(1);
      }
    } else {
      // --no-thumbs: skip the bake, but REUSE any thumb already baked for the same path,
      // so a non-macOS (or fast) run never strips the existing local bake out of the registry.
      for (const rec of records) {
        if (rec.medium !== "image") continue;
        const name = thumbName(rec.p);
        if (existsSync(join(THUMBS_DIR, name))) {
          rec.thumb = name;
          thumbStats.reused++;
        }
      }
    }
    for (const rec of records) if (rec.medium) rec.src = assetUrl(rec.p); // served full-asset URL (real mediums only)
  }

  const now = new Date();
  const payload = {
    built: now.toISOString().slice(0, 16).replace("T", " "),
    builtMs: now.getTime(),
    assetsRootHint: "external-locations/assets",
    assetsRootAbs: realpathSync(ASSETS_ROOT), // absolute library root — the copy-abs / reveal-fallback path
    taxonomy: { version: 1, axis: "medium/mediumType", statusVocab: ["BLK", "ALPHA", "BETA", "FNL"] },
    // counts keys come verbatim from the CSV status column — spread FIRST so a status
    // value literally named "total" can never clobber the row count.
    registry: { ...registry.counts, total: registry.rows.length },
    counts: {
      total: records.length,
      byMedium: tally(records, (r) => r.medium ?? "(source)"),
      byMediumType: tally(records, (r) => r.mediumType ?? "(source)"),
      byStatus: tally(records, (r) => r.status ?? "(none)"),
      byKind: tally(records, (r) => r.kind),
      unknown: records.filter((r) => r.mediumType === "unknown").length,
    },
    // strip the transient `segs` field; guarantee mtimeMs is present & last.
    records: records.map(({ mtimeMs, segs, ...r }) => ({ ...r, mtimeMs })),
  };

  if (PRINT_JSON) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  mkdirSync(DASHBOARD_DIR, { recursive: true });
  writeFileSync(OUT, JSON.stringify(payload, null, 2));

  // DONE: image thumbnails baked via macOS sips → previews/thumbs/ (rec.thumb), each real
  //   record given a served /_assets/<p> `src`, and the previews/_assets symlink self-healed.
  //   See the ADRs serve-the-shared-asset-library-to-the-spa +
  //   bake-owned-image-thumbnails-in-the-registry-builder.
  // TODO: measure image dims (w/h/dims/res) so classifySpec yields real verdicts (portable, no sips).
  // TODO: a portable thumbnail baker (sharp/ImageMagick) for non-macOS contributors (today: --no-thumbs).

  const strays = records.filter((r) => r.conformance === "stray").length;
  console.log(`asset-registry: ${records.length} files scanned`);
  console.log(`  medium:      ${JSON.stringify(payload.counts.byMedium)}`);
  console.log(`  mediumType:  ${JSON.stringify(payload.counts.byMediumType)}`);
  console.log(`  unknown mediumType: ${unknown}`);
  console.log(`  tgl strays (runtime payloads): ${strays}`);
  console.log(`  registry: ${registry.rows.length} rows, ${regMatched} matched to local files`);
  if (WANT_THUMBS) console.log(`  thumbs: ${thumbStats.made} baked, ${thumbStats.failed} failed, ${thumbStats.pruned} orphans pruned`);
  else console.log(`  thumbs: bake skipped (--no-thumbs); ${thumbStats.reused} already-baked thumbs reused`);
  if (scanErrors) console.warn(`  WARN: ${scanErrors} unreadable entries skipped during the scan — the registry may be missing records`);
  console.log(`  wrote ${OUT}`);
}

main();
