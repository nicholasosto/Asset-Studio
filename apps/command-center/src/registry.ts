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
export interface RobloxAssetRef {
  schemaVersion: 1;
  recordedAt: string;
  localUri: string;
  sourceSha256: string;
  checksum: 'match' | 'mismatch';
  uploadCount: number;
  active: {
    assetId: string;
    assetUri: string;
    assetType: string;
    creator: { id: string; name: string; type: string };
    inventoryPath: string;
    creatorStoreUrl: string | null;
    status: 'active';
    verifiedAt: string;
    verificationMethod: string;
  };
  /** Present when the legacy fuzzy-name CSV points at a different numeric ID. */
  legacyIdConflict?: string;
}
export type RobloxUploadState = 'uploaded' | 'needsReview' | 'unregistered';
export interface RobloxRegistrySummary {
  schemaVersion: 1;
  /** Canonical JSONL rows, including rows that no longer join to a scanned file. */
  total: number;
  joined: number;
  orphaned: number;
  checksumMismatch: number;
  legacyIdConflicts: number;
  /** Mutually exclusive states over real assets only (`medium !== null`). */
  byState: Record<RobloxUploadState, number>;
  issues: Array<{
    kind: 'orphan' | 'checksum-mismatch' | 'legacy-id-conflict';
    localPath: string;
    message: string;
  }>;
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
  /** Exact local_path join from the canonical Roblox upload JSONL ledger. */
  roblox?: RobloxAssetRef;
  /** Legacy master CSV match by normalized display name; never authoritative. */
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
  robloxRegistry: RobloxRegistrySummary;
  counts: RegistryCounts;
  records: AssetRecord[];
}

// Cast-only typing: nothing validates the emitted JSON against this mirror, so every
// module-scope dereference below is ??-guarded — a parseable-but-drifted registry must
// degrade to an empty Explorer, never crash the whole app before React mounts.
const file = assetRegistry as unknown as Partial<RegistryFile>;

const EMPTY_COUNTS: RegistryCounts = { total: 0, byMedium: {}, byMediumType: {}, byStatus: {}, byKind: {}, unknown: 0 };
const EMPTY_ROBLOX_REGISTRY: RobloxRegistrySummary = {
  schemaVersion: 1,
  total: 0,
  joined: 0,
  orphaned: 0,
  checksumMismatch: 0,
  legacyIdConflicts: 0,
  byState: { uploaded: 0, needsReview: 0, unregistered: 0 },
  issues: [],
};

// ── Typed exports ──
export const records: AssetRecord[] = Array.isArray(file.records) ? file.records : [];
export const counts: RegistryCounts = file.counts ?? EMPTY_COUNTS;
export const robloxRegistry: RobloxRegistrySummary = file.robloxRegistry ?? EMPTY_ROBLOX_REGISTRY;
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

/** Canonical Roblox-upload state for the Explorer's facet and badges. */
export const robloxUploadState = (r: AssetRecord): RobloxUploadState => {
  if (!r.roblox) return 'unregistered';
  return r.roblox.checksum === 'match' ? 'uploaded' : 'needsReview';
};

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
// so a tree selection needs no lookup. The label carries a subtree asset count.
//
// Two-stage build: an immutable SPINE walked once from ALL records (the library's real shape,
// independent of any filter), then spineToNodes() maps it to FolderNode[] — either with the full
// spine totals (counts=null) or re-labeled/pruned from a filtered tally (the Explorer's
// filter↔tree interplay). Node ids are identical across both derivations, so FolderTree's
// uncontrolled expansion state survives every filter change.
interface FolderSpine {
  path: string; // full prefix from the roots, e.g. "audio/voice"
  seg: string; // this folder's own segment name
  total: number; // records at this folder or any descendant (unfiltered)
  children: FolderSpine[];
}

const folderSpine: FolderSpine[] = (() => {
  interface Acc {
    path: string;
    seg: string;
    total: number;
    children: Map<string, Acc>;
  }
  const root: Acc = { path: '', seg: '', total: 0, children: new Map() };
  for (const r of records) {
    // Walk the DIRECTORY segments (not the filename): a folders-only spine. Root-level files
    // (dir === '') contribute no folder node — they only show when nothing is selected.
    const segs = r.dir ? r.dir.split('/') : [];
    let node = root;
    let prefix = '';
    for (const seg of segs) {
      prefix = prefix ? `${prefix}/${seg}` : seg;
      let child = node.children.get(seg);
      if (!child) {
        child = { path: prefix, seg, total: 0, children: new Map() };
        node.children.set(seg, child);
      }
      child.total += 1; // every ancestor folder counts this record → subtree totals
      node = child;
    }
  }
  const freeze = (acc: Acc): FolderSpine[] =>
    [...acc.children.values()]
      .sort((a, b) => a.seg.localeCompare(b.seg))
      .map((c) => ({ path: c.path, seg: c.seg, total: c.total, children: freeze(c) }));
  return freeze(root);
})();

// Depth-0 zone identities — glyph NAMES from the registry bundled inside @trembus/ui (an unknown
// name renders nothing, worse than the folder default — so only names that exist are mapped;
// audio and _resort deliberately keep the stock folder glyph).
const ZONE_ICON: Record<string, string> = {
  ui: 'component',
  textures: 'layers',
  models: 'box',
  'concept-art': 'image',
  source: 'wrench',
  runtime: 'server',
  _inbox: 'queue',
  templates: 'file',
};

/** Per-folder subtree tallies over an arbitrary record subset — feeds spineToNodes(counts). */
export function tallyByDir(recs: AssetRecord[]): Map<string, number> {
  const tally = new Map<string, number>();
  for (const r of recs) {
    if (!r.dir) continue;
    let prefix = '';
    for (const seg of r.dir.split('/')) {
      prefix = prefix ? `${prefix}/${seg}` : seg;
      tally.set(prefix, (tally.get(prefix) ?? 0) + 1);
    }
  }
  return tally;
}

/**
 * The spine as FolderNode[]. With `counts` (a filtered tallyByDir), labels carry the FILTERED
 * subtree counts and zero-match folders are hidden — except `keepPath` and its ancestors, which
 * stay visible at (0) so the active tree selection remains deselectable.
 */
export function spineToNodes(counts: Map<string, number> | null, keepPath: string): FolderNode[] {
  const onSelectedTrail = (path: string): boolean =>
    keepPath === path || keepPath.startsWith(`${path}/`);
  const walk = (nodes: FolderSpine[], depth: number): FolderNode[] =>
    nodes.flatMap((n) => {
      const count = counts ? counts.get(n.path) ?? 0 : n.total;
      if (counts && count === 0 && !onSelectedTrail(n.path)) return [];
      const children = walk(n.children, depth + 1);
      // Childless nodes (real leaves, or interiors pruned empty by the filter) name the folder
      // glyph explicitly — FolderTree's inference would otherwise give them a FILE glyph.
      const icon = (depth === 0 ? ZONE_ICON[n.seg] : undefined) ?? (children.length === 0 ? 'folder' : undefined);
      return [
        {
          id: n.path,
          label: `${n.seg} (${count})`,
          icon,
          children: children.length ? children : undefined,
        },
      ];
    });
  return walk(folderSpine, 0);
}

/** The full library folder forest (built once) — the side-nav's unfiltered data source. */
export const assetTree: FolderNode[] = spineToNodes(null, '');

/** True when record `r` lives under `folder` (or `folder` is empty = the whole library). */
export const underFolder = (r: AssetRecord, folder: string): boolean =>
  !folder || r.dir === folder || r.dir.startsWith(`${folder}/`);
