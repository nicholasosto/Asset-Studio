// The asset library registry — the second emitted artifact the Command Center consumes, alongside
// the entity contract in ./contract. This module is the ONLY reader of asset-registry.json; the
// Asset Explorer panel derives its whole view from the typed exports here (never re-reads the JSON).
//
// The registry is a flat scan of the shared, game-independent Assets/ library: 769 file records,
// pre-aggregated into `counts`. medium===null records (269) are non-asset "source" files — hidden
// by default in the Explorer. Per-medium colors + placeholder glyphs are derived here so the panel
// and its CSS share one vocabulary.
import assetRegistry from '../../../previews/dashboards/asset-registry.json';

// ── The emitted record shape (mirror of build-registry's output) ──
// The core fields are always present; the OPTIONAL block (w/h/dims/res/specIssue/reg/thumb) is
// absent when N/A — the deferred-dimension records simply omit them, so the inspector skips those
// rows rather than showing empties.
export interface RegTgl {
  cat: string;
  sub: string;
  name: string;
  status: string | null;
  grade: string;
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
  /** Domain tag — only ~60 records carry it. */
  domain: string | null;
  tgl: RegTgl | null;
  /** Roblox grade vocab; null for the 136 real assets without a graded status. */
  status: RobloxStatus | null;
  conformance: string;
  issue: string | null;
  instance: string | null;
  spec: string;
  /** Primary axis; null for the 269 "source" (non-asset) files, hidden by default. */
  medium: Medium | null;
  mediumType: MediumType | null;
  // ── OPTIONAL — present only when the scan resolved them ──
  w?: number;
  h?: number;
  dims?: string;
  res?: string;
  specIssue?: string | null;
  reg?: RegRef;
  thumb?: string;
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
  taxonomy: { version: number; axis: string; statusVocab: RobloxStatus[] };
  registry: { total: number; [k: string]: number };
  counts: RegistryCounts;
  records: AssetRecord[];
}

const file = assetRegistry as unknown as RegistryFile;

// ── Typed exports ──
export const records: AssetRecord[] = file.records;
export const counts: RegistryCounts = file.counts;
export const taxonomy = file.taxonomy;
/** The Roblox grade vocab, in order (BLK → FNL) — the status Select's real options. */
export const statusVocab: RobloxStatus[] = file.taxonomy.statusVocab;
export const built: string = file.built;

// The four summary tallies the header reads O(1) from `counts` (never iterating the 769 records).
// `real` excludes the medium===null source bucket — the default, non-empty view.
export const summary = {
  real: (counts.byMedium.image ?? 0) + (counts.byMedium['3d'] ?? 0) + (counts.byMedium.audio ?? 0),
  image: counts.byMedium.image ?? 0,
  threeD: counts.byMedium['3d'] ?? 0,
  audio: counts.byMedium.audio ?? 0,
  source: counts.byMedium['(source)'] ?? 0,
  total: counts.total,
};

// ── Presentation vocabulary (shared with the CSS) ──
// Per-medium accent hex + Trembus tone + a unicode placeholder glyph (no icon dependency — the
// thumbnails are deferred). `source` is the muted pseudo-medium for the null bucket.
export type MediumKey = Medium | 'source';
export interface MediumStyle {
  label: string;
  /** Trembus Badge/Stat tone. */
  tone: 'info' | 'accent' | 'success' | 'neutral';
  /** Accent hex — mirrored in app.css via the --cc-medium-* fallbacks. */
  hex: string;
  /** Placeholder frame glyph, chosen by medium. */
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
