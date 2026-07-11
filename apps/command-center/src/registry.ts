// The asset library registry — the second emitted artifact the Command Center consumes, alongside
// the entity contract in ./contract. This module is the ONLY reader of asset-registry.json; the
// Asset Explorer panel derives its whole view from the typed exports here (never re-reads the JSON).
//
// The registry is a flat scan of the shared, game-independent Assets/ library: file records
// pre-aggregated into `counts`. medium===null records are non-asset "source" files — hidden
// by default in the Explorer. Per-medium presentation styles are derived here so the panel
// draws from one vocabulary.
import assetRegistry from '../../../previews/dashboards/asset-registry.json';
import type { FolderNode } from '@trembus/ui';

// ── The emitted record shape (mirror of build-registry's output) ──
// The core fields are always present; the OPTIONAL block (w/h/dims/res/specIssue/reg/thumb) is
// absent when N/A — the deferred-dimension records simply omit them, so the inspector skips those
// rows rather than showing empties.
export interface RegTgl {
  cat: string;
  /** null on grade "partial" parses (missing SUB segment). */
  sub: string | null;
  name: string;
  status: string | null;
  grade: string;
  /** Present on partial parses — what was malformed. */
  issue?: string;
}
export interface RegRef {
  id: string;
  status?: string;
  kind?: string;
}
export type Medium = 'image' | 'audio' | '3d';
export type MediumType =
  | 'image'
  | 'texture'
  | 'ui'
  | '3d-model'
  | '3d-rig'
  | 'animation'
  | 'audio-music'
  | 'audio-sfx'
  | 'audio-voice'
  | 'unknown';
export type RobloxStatus = 'BLK' | 'ALPHA' | 'BETA' | 'FNL';

export interface AssetRecord {
  /** Library-relative path (the stable, unique key). */
  p: string;
  area: string;
  dir: string;
  base: string;
  stem: string;
  ext: string;
  /** Coarse file kind from the scan (model · image · audio · data · doc · script · …). */
  kind: string;
  size: number;
  mtime: string;
  mtimeMs: number;
  /** Domain tag — only a minority of records carry it. */
  domain: string | null;
  tgl: RegTgl | null;
  /** Roblox grade vocab; null for real assets without a graded status. */
  status: RobloxStatus | null;
  conformance: string;
  issue: string | null;
  instance: string | null;
  spec: string;
  /** Primary axis; null for "source" (non-asset) files, hidden by default. */
  medium: Medium | null;
  mediumType: MediumType | null;
  // ── OPTIONAL — present only when the scan resolved them ──
  w?: number;
  h?: number;
  dims?: string;
  res?: string;
  specIssue?: string | null;
  reg?: RegRef;
  /** Bare baked-thumbnail filename (`<hash>.png`); resolve with thumbUrl(). Image records only. */
  thumb?: string;
  /** Served full-asset URL (`/_assets/<encoded p>`); baked for every real medium (not source). */
  src?: string;
}

interface RegistryCounts {
  total: number;
  byMedium: Record<string, number>;
  byMediumType: Record<string, number>;
  byStatus: Record<string, number>;
  byKind: Record<string, number>;
  unknown: number;
}
interface RegistryFile {
  built: string;
  builtMs: number;
  assetsRootHint: string;
  assetsRootAbs?: string;
  taxonomy: { version: number; axis: string; statusVocab: RobloxStatus[] };
  registry: { total: number; [k: string]: number };
  counts: RegistryCounts;
  records: AssetRecord[];
}

// Cast-only typing: nothing validates the emitted JSON against this mirror, so every
// module-scope dereference below is ??-guarded — a parseable-but-drifted registry must
// degrade to an empty Explorer, never crash the whole app before React mounts.
const file = assetRegistry as unknown as Partial<RegistryFile>;

const EMPTY_COUNTS: RegistryCounts = { total: 0, byMedium: {}, byMediumType: {}, byStatus: {}, byKind: {}, unknown: 0 };

// ── Typed exports ──
export const records: AssetRecord[] = Array.isArray(file.records) ? file.records : [];
export const counts: RegistryCounts = file.counts ?? EMPTY_COUNTS;
export const taxonomy = file.taxonomy ?? { version: 0, axis: 'medium/mediumType', statusVocab: [] as RobloxStatus[] };
/** The Roblox grade vocab, in order (BLK → FNL) — the status Select's real options. */
export const statusVocab: RobloxStatus[] = taxonomy.statusVocab ?? [];
export const built: string = file.built ?? '(unknown)';

// ── Served-media URLs (dev + static parity) ──
// Two ABSOLUTE prefixes that resolve identically whether the SPA mounts at '/' (dev, :5175)
// or '/app/' (static, :4317): the static python server (rooted at previews/) maps /_assets →
// previews/_assets (a symlink to the shared library) and /thumbs → previews/thumbs; the dev
// server's live-assets middleware intercepts the same two prefixes. Per-SEGMENT encoding keeps
// spaces/parens in real asset paths intact. See decision serve-the-shared-asset-library-to-the-spa.
const encPath = (p: string): string => p.split('/').map(encodeURIComponent).join('/');
/** Served URL for a full asset by its library-relative path. (Records also carry a baked `src`.) */
export const assetUrl = (p: string): string => `/_assets/${encPath(p)}`;
/** Served URL for a baked thumbnail, from the record's bare `thumb` filename. */
export const thumbUrl = (thumb?: string): string | undefined =>
  thumb ? `/thumbs/${encodeURIComponent(thumb)}` : undefined;

// Absolute library root (baked by the builder) — the path copied for the copy-abs / reveal
// fallback. Falls back to the ROOT-relative hint on a stale registry so the app never crashes.
export const assetsRootAbs: string = file.assetsRootAbs ?? file.assetsRootHint ?? 'external-locations/assets';
/** Absolute filesystem path of a record — used by the reveal-in-Finder fallback (copy path). */
export const absPathOf = (r: AssetRecord): string => `${assetsRootAbs}/${r.p}`;

// The four summary tallies the header reads O(1) from `counts` (never iterating records).
// `real` excludes the medium===null source bucket — the default, non-empty view.
const byMedium = counts.byMedium ?? {};
export const summary = {
  real: (byMedium.image ?? 0) + (byMedium['3d'] ?? 0) + (byMedium.audio ?? 0),
  image: byMedium.image ?? 0,
  threeD: byMedium['3d'] ?? 0,
  audio: byMedium.audio ?? 0,
  source: byMedium['(source)'] ?? 0,
  total: counts.total ?? records.length,
};

// ── Presentation vocabulary ──
// Per-medium Trembus tone (the field the Explorer actually consumes) + an accent hex and a
// unicode glyph kept as reference values. `source` is the muted pseudo-medium for the null bucket.
export type MediumKey = Medium | 'source';
export interface MediumStyle {
  label: string;
  /** Trembus Badge/Stat tone. */
  tone: 'info' | 'accent' | 'success' | 'neutral';
  /** Accent hex — mirrored by the .cc-explorer__card[data-medium] --cc-medium rules in app.css. */
  hex: string;
  /** Placeholder frame glyph, chosen by medium (MediaFrame draws its own ext glyphs). */
  glyph: string;
}
export const MEDIUM_STYLE: Record<MediumKey, MediumStyle> = {
  image: { label: 'Image', tone: 'info', hex: '#4aa8ff', glyph: '▦' },
  '3d': { label: '3D', tone: 'accent', hex: '#d4af37', glyph: '◈' },
  audio: { label: 'Audio', tone: 'success', hex: '#43aa8b', glyph: '♪' },
  source: { label: 'Source', tone: 'neutral', hex: '#6b7280', glyph: '○' },
};

/** The medium key for a record — the null bucket collapses to the `source` pseudo-medium. */
export const mediumKey = (r: AssetRecord): MediumKey => r.medium ?? 'source';

// Roblox grade → a Badge tone. This is the Explorer's OWN status map (the taxonomy grade vocab),
// distinct from the entity-status ontology in ./status. `none` is the explicit null bucket.
export type ExplorerStatusTone = 'success' | 'info' | 'warning' | 'neutral';
export const STATUS_TONE: Record<string, ExplorerStatusTone> = {
  FNL: 'success',
  BETA: 'info',
  ALPHA: 'warning',
  BLK: 'neutral',
  none: 'neutral',
};
export const statusTone = (s: string | null): ExplorerStatusTone => STATUS_TONE[s ?? 'none'] ?? 'neutral';

// The mediumType options per medium — drives the dependent mediumType Select. Order is the
// primary axis order (medium ▸ its types), matching the byMediumType split.
export const MEDIUM_TYPES: Record<Medium, MediumType[]> = {
  image: ['image', 'texture', 'ui'],
  '3d': ['3d-model', '3d-rig', 'animation'],
  audio: ['audio-music', 'audio-sfx', 'audio-voice'],
};

// Every mediumType present in the real (non-source) set, keyed to its owning medium — lets the
// Explorer resolve a mediumType back to a medium (for the "filter to this type" action) and label
// grouping subheads without re-scanning.
export const MEDIUM_OF_TYPE: Record<string, Medium> = (() => {
  const out: Record<string, Medium> = {};
  for (const [m, types] of Object.entries(MEDIUM_TYPES) as [Medium, MediumType[]][]) {
    for (const t of types) out[t] = m;
  }
  return out;
})();

/** Humanize a byte count → "1.2 MB" / "356 KB" / "812 B". */
export function humanBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let v = bytes / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v >= 10 || Number.isInteger(v) ? Math.round(v) : v.toFixed(1)} ${units[i]}`;
}

// ── Folder navigation tree (derived from record paths) ──
// The Asset Explorer's side-nav: the library's real folder hierarchy as @trembus/ui's FolderNode
// forest. Folders only — the grid is the file surface. A node's `id` IS its full path prefix (e.g.
// "runtime/roblox/soul-steel/layouts"), which is exactly what the grid filters by (see underFolder),
// so a tree selection needs no lookup. The label carries a subtree asset count. Built from ALL
// records (a stable spine, independent of the Explorer's default-off "source" gate).
interface TreeAcc {
  path: string; // full prefix from the roots, e.g. "audio/voice"
  count: number; // records at this folder or any descendant
  children: Map<string, TreeAcc>;
}

export function buildAssetTree(recs: AssetRecord[]): FolderNode[] {
  const root: TreeAcc = { path: '', count: 0, children: new Map() };
  for (const r of recs) {
    // Walk the DIRECTORY segments (not the filename): a folders-only spine. Root-level files
    // (dir === '') contribute no folder node — they only show when nothing is selected.
    const segs = r.dir ? r.dir.split('/') : [];
    let node = root;
    let prefix = '';
    for (const seg of segs) {
      prefix = prefix ? `${prefix}/${seg}` : seg;
      let child = node.children.get(seg);
      if (!child) {
        child = { path: prefix, count: 0, children: new Map() };
        node.children.set(seg, child);
      }
      child.count += 1; // every ancestor folder counts this record → subtree totals
      node = child;
    }
  }
  const toNodes = (acc: TreeAcc): FolderNode[] =>
    [...acc.children.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([seg, child]) => ({
        id: child.path,
        label: `${seg} (${child.count})`,
        children: child.children.size ? toNodes(child) : undefined,
      }));
  return toNodes(root);
}

/** The library folder forest (built once) — the Explorer side-nav's data source. */
export const assetTree: FolderNode[] = buildAssetTree(records);

/** True when record `r` lives under `folder` (or `folder` is empty = the whole library). */
export const underFolder = (r: AssetRecord, folder: string): boolean =>
  !folder || r.dir === folder || r.dir.startsWith(`${folder}/`);
