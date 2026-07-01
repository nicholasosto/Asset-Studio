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
//   the CSV registry parse + join (parseCsvLine/loadRegistry/joinRegistry) ·
//   the content-hash thumb NAMING (thumbName).
//
// What is NEW here:
//   deriveMedium(rec)      -> 'image' | 'audio' | '3d' | null
//   deriveMediumType(rec)  -> mediumType string | null   (see rules below)
//   KIND_BY_EXT extended:  .ma -> model, .flac -> audio  (census: 1 each)
//
// What is DEFERRED to a later pass (kept as pure helpers / absent fields):
//   image thumbnail generation (no sips/sharp) — thumb field stays ABSENT
//   image dimension measurement (w/h/dims/res stay ABSENT; spec => 'n/a')
//   the previews/_assets symlink + static HTML render.
//
// FIELD-PRESENCE CONTRACT (preserved from reference): w, h, dims, res,
// specIssue, reg, thumb are OPTIONAL — they are absent (not null) when N/A.
// medium is null (explicit) for non-asset kinds; mediumType is null iff
// medium is null; mediumType 'unknown' is only a defensive terminal.
//
// Fully deterministic + idempotent: no randomness, no wall-clock in any
// derivation — the only clock read is the built/builtMs summary stamp.
//
// Usage:
//   node tools/build-asset-registry.mjs               # write asset-registry.json
//   node tools/build-asset-registry.mjs --print-json  # dump payload to stdout
// ============================================================================

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
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
const REGISTRY_CSV = join(ASSETS_ROOT, "__master-asset-ids-validated.csv");

// ── constants ─────────────────────────────────────────────────────────────
const SKIP_DIRS = new Set(["_archive", "__pycache__", ".git", "node_modules"]);
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

// ── scan: walk ──────────────────────────────────────────────────────────
// Recursive readdir; prune SKIP_DIRS whole-subtree; drop .DS_Store / .tmp* /
// SKIP_EXTS / registry sidecars. Only regular files pushed. Errors swallowed.
function walk(dir, relBase = "") {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
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
    if (rec.area === "library" && seg2 === "rigs") return "3d-rig";  // 3e
    if (rec.area === "library" && seg2 === "layouts") return "3d-model"; // 3f
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
    if (seg1 === "audio" && seg2 === "voice-dialog") return "audio-voice";                     // vA
    if (seg1 === "ai-output" && (segs[2]?.toLowerCase() === "tts" || segs[2]?.toLowerCase() === "voice-previews"))
      return "audio-voice";                                                                     // vB
    if (RE_VOICE_TOKEN.test(p)) return "audio-voice";                                          // vC token backup
    // MUSIC
    if (seg1 === "audio" && seg2 === "bg-music") return "audio-music";                          // mA
    if (RE_MUSIC_TOKEN.test(s)) return "audio-music";                                          // mB music tokens
    // SFX (fallback catch-all — audio is NEVER 'unknown')
    if (seg1 === "audio" && ["ability-combat-fx", "ui-fx", "world-fx", "environment", "generic"].includes(seg2))
      return "audio-sfx";                                                                        // sA
    if (seg1 === "ai-output" && segs[2]?.toLowerCase() === "sfx") return "audio-sfx";           // sB
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
      continue;
    }
    const extDotted = extname(relPath).toLowerCase(); // ".png" — dotted, for KIND_BY_EXT
    const ext = extDotted.replace(".", "");           // "png"  — dot-stripped, for the record
    const base = relPath.split("/").pop();
    const stem = base.slice(0, base.length - extDotted.length);
    const segs = relPath.split("/");
    const area = segs.length > 1 ? segs[0] : "(root)";
    const inLibrary = area === "library";
    const tgl = parseTgl(stem);
    const kind = KIND_BY_EXT[extDotted] || "other";   // lookup uses the DOTTED ext

    // Conformance is only *expected* of files in library/, and only for
    // asset payloads (models/images/audio) — docs and data are exempt.
    let conformance = "n/a";
    if (inLibrary && ["model", "image", "audio"].includes(kind)) {
      // library/ui/screens uses bare Name_STATUS by convention — status stamp only
      if (segs[1] === "ui") {
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
  const lines = readFileSync(REGISTRY_CSV, "utf8").trim().split("\n");
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
    const key = row.name.split("/").pop().toLowerCase().replace(/[\s_-]/g, "");
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

// ── thumbnails (naming helper only — GENERATION DEFERRED in v1) ────────────
// Reserved content-hash naming contract: 'asset-explorer-thumbs/<sha1(p)[:12]>.png'.
// Kept as a pure helper; NOT invoked in v1 (no sips/sharp, rec.thumb absent).
// A later enrichment pass will generate PNGs and, only on success, set rec.thumb.
// eslint-disable-next-line no-unused-vars
function thumbName(relPath) {
  return createHash("sha1").update(relPath).digest("hex").slice(0, 12) + ".png";
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

  const now = new Date();
  const payload = {
    built: now.toISOString().slice(0, 16).replace("T", " "),
    builtMs: now.getTime(),
    assetsRootHint: "external-locations/assets",
    taxonomy: { version: 1, axis: "medium/mediumType", statusVocab: ["BLK", "ALPHA", "BETA", "FNL"] },
    registry: { total: registry.rows.length, ...registry.counts },
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

  // TODO(v2, own PR): generate thumbnails via a portable tool (sharp/ImageMagick,
  //   not macOS sips) keyed by thumbName(rec.p); stamp rec.thumb only on success.
  // TODO(v2): measure image dims (w/h/dims/res) so classifySpec yields real verdicts.
  // TODO(v2): ensure the previews/_assets symlink + render the static HTML explorer.
  //   See the reference tool build-asset-explorer.mjs for the deferred pieces.

  const strays = records.filter((r) => r.conformance === "stray").length;
  console.log(`asset-registry: ${records.length} files scanned`);
  console.log(`  medium:      ${JSON.stringify(payload.counts.byMedium)}`);
  console.log(`  mediumType:  ${JSON.stringify(payload.counts.byMediumType)}`);
  console.log(`  unknown mediumType: ${unknown}`);
  console.log(`  tgl strays (library payloads): ${strays}`);
  console.log(`  registry: ${registry.rows.length} rows, ${regMatched} matched to local files`);
  console.log(`  wrote ${OUT}`);
}

main();
