#!/usr/bin/env node
// ============================================================================
// build-decision-briefs.mjs — Asset-Studio decision ADR-body emitter (v1)
// ============================================================================
//
// ZERO-DEPENDENCY Node ESM scanner (node built-ins only: fs, path, url).
//
// WHY THIS EXISTS. The Command Center's Decision drawer wants to render the ADR
// itself (Context · Decision · Consequences · …), not just the one-line excerpt
// the planning contract carries. Two constraints rule out the obvious routes:
//   · the contract emitter (.project-system/tools/render-hub.mjs) is VENDORED —
//     never edited here (update = re-copy from Project-System); and
//   · _project/ is deliberately OFF the HTTP surface (the static site roots at
//     previews/), so the app can't fetch _project/decisions/*.md at runtime.
// So this PROJECT-OWNED tool (the same pattern as build-asset-registry.mjs)
// captures each decision's markdown BODY into an emitted, committed, imported
// artifact:
//   _project/decisions/*.md  →  previews/dashboards/decision-briefs.json
// The app imports that JSON (inlined at build, like the graph/hub contracts) and
// parses each body into Brief sections CLIENT-SIDE via @trembus/ui `fromMarkdown`
// (which is why this emitter stays zero-dep — it never needs the UI package).
//
// SHAPE. `bodies` is keyed by the decision id == the file stem (the same id the
// planning contract's nodes[] use), so the drawer looks a body up by record id.
// Frontmatter is stripped; the H1 + `> Status` lead is left as-is (the drawer
// supplies its own title/status header and consumes only `fromMarkdown().sections`,
// so `fromMarkdown` folding the lead into title/summary is harmless).
//
// Deterministic + idempotent: no randomness, no wall-clock. Re-run after editing
// any _project/decisions/*.md (a future render-all step can chain it).
//
// Usage:
//   node tools/build-decision-briefs.mjs               # write decision-briefs.json
//   node tools/build-decision-briefs.mjs --print-json  # dump payload to stdout (no disk write)
// ============================================================================
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DECISIONS_DIR = join(ROOT, '_project', 'decisions');
const OUT = join(ROOT, 'previews', 'dashboards', 'decision-briefs.json');
const args = new Set(process.argv.slice(2));

// Drop a leading `---\n…\n---` YAML frontmatter block, then any leading blank lines.
function stripFrontmatter(md) {
  const m = md.match(/^---\n[\s\S]*?\n---\n?/);
  return (m ? md.slice(m[0].length) : md).replace(/^\s+/, '');
}

// ADR prose is dense with `[[folder/stem]]` wikilinks. They aren't navigable in the drawer, so the
// raw `[[kebab-slug]]` brackets just read as noise — flatten each to a prettified label (last path
// segment, `[[a|b]]` alias honored, leading serial/date dropped, de-kebabbed). Mirrors the app's
// prettify() so a cross-linked decision reads the same here as in its own title.
function deWikilink(md) {
  return md.replace(/\[\[([^\]]+)\]\]/g, (_, target) => {
    const [ref, alias] = String(target).split('|');
    if (alias) return alias.trim();
    const stem = ref.split('/').pop() ?? ref;
    const words = stem.replace(/^\d{4}(-\d{2}-\d{2})?-/, '').replace(/-/g, ' ').trim();
    return words ? words.charAt(0).toUpperCase() + words.slice(1) : ref;
  });
}

const files = readdirSync(DECISIONS_DIR)
  .filter((f) => f.endsWith('.md'))
  .sort();

const bodies = {};
for (const f of files) {
  const id = f.replace(/\.md$/, ''); // == the planning-contract node id
  const body = deWikilink(stripFrontmatter(readFileSync(join(DECISIONS_DIR, f), 'utf8'))).trimEnd();
  if (body) bodies[id] = body;
}

const payload = {
  generatedBy: 'build-decision-briefs.mjs',
  kind: 'decision',
  count: Object.keys(bodies).length,
  bodies,
};

if (args.has('--print-json')) {
  console.log(JSON.stringify(payload, null, 2));
} else {
  writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n');
  console.log(`decision-briefs: ${payload.count} decision bodies → ${OUT}`);
}
