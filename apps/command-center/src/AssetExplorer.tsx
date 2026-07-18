// The Asset Explorer — the bespoke panel over the asset library registry (./registry), routed from
// App like the Roadmap/Decisions/Workflows panels. It adds presentation only: a summary header read
// O(1) from `counts`, a filter bar, a responsive card grid, and a Dialog inspector. Every asset
// datum comes from the emitted registry JSON via ./registry — the panel names no field the scan
// doesn't carry, and never re-reads the JSON.
//
// Four stacked regions inside the standard scrollable .cc-panel:
//   1. SUMMARY HEADER — Stat tiles (drill-in to a medium) + a stacked Meter + a DonutChart, all
//      off `counts` so the header never iterates the 769 records.
//   2. FILTER BAR — search + medium/mediumType/status/ext Selects + a "show source" Switch, plus a
//      removable-chip strip reflecting the active filters.
//   3. RESULTS GRID — a count line + a CSS grid of asset cards (optionally grouped by mediumType).
//   4. INSPECTOR — a Dialog modal (command Toolbar in the footer) + the move-confirm dialog.
// Per-asset ACTIONS (copy id/path · reveal · view online · move to _resort/_archive) live in
// ./assetActions — one vocabulary shared by the inspector Toolbar and the tile ⋯ kebab Menu.
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  AudioWaveform,
  Badge,
  Box,
  Button,
  Callout,
  DataStatusBar,
  Dialog,
  DonutChart,
  EmptyState,
  FolderTree,
  IconButton,
  Inline,
  Input,
  Menu,
  Meter,
  Select,
  Stat,
  Switch,
  Table,
  Toolbar,
  Tooltip,
  VirtualAssetGrid,
} from '@trembus/ui';
import type { DataFilter } from '@trembus/ui';
import { ExternalLinkIcon, FolderOpenIcon } from '@trembus/icons';
import { ArchiveIcon, CopyIcon, KebabIcon, ResortIcon } from './glyphs';
import {
  MOVE_DISABLED_HINT,
  actionEnabled,
  assetIdOf,
  buildMoveConfirm,
  canMove,
  moveAsset,
  moveEnabled,
  needsMoveConfirm,
  runAction,
} from './assetActions';
import type { MoveDest } from './assetActions';
import {
  MEDIUM_OF_TYPE,
  MEDIUM_STYLE,
  MEDIUM_TYPES,
  absPathOf,
  assetTree,
  counts,
  humanBytes,
  mediumKey,
  records,
  robloxRegistry,
  robloxUploadState,
  spineToNodes,
  statusTone,
  statusVocab,
  summary,
  tallyByDir,
  thumbUrl,
  underFolder,
} from './registry';
import type { AssetRecord, Medium, MediumType, RobloxUploadState } from './registry';
import { MediaFrame } from '@trembus/game-viz';
import type { MediaFrameData } from '@trembus/game-viz';

// The three medium keys, in axis order — the order Stat tiles + Meter segments + Donut slices share.
const MEDIUM_ORDER: Medium[] = ['image', '3d', 'audio'];

// Section order for VirtualAssetGrid's mediumType grouping (medium ▸ its types), source bucket last.
const GROUP_ORDER: string[] = [...MEDIUM_ORDER.flatMap((m) => MEDIUM_TYPES[m]), '(source)'];

// A record is source (non-asset) when it has no medium — the null bucket, hidden by default.
const isSource = (r: AssetRecord): boolean => r.medium === null;

// Registry record → MediaFrame data. The frame-medium is chosen from MEDIA AVAILABILITY, not a
// static map: a record with no usable URL maps to 'doc' (a static ext-aware glyph) rather than
// image/audio/model with no src — which MediaFrame renders as a permanent Skeleton (implying
// "loading"). Verified MediaFrame surface precedence (@trembus/game-viz): image uses src (else
// poster); audio needs src (mounts a player, no fetch/decode until play); a glb/gltf src → the 3D
// turntable. The `full` flag splits tile from inspector, matching the original's economy:
//   TILE (full:false)      — images show the baked THUMBNAIL; audio/3D show a glyph.
//   INSPECTOR (full:true)  — images show the FULL-SIZE asset; audio plays; glb/gltf turn the
//                            turntable on; every other 3D ext shows a glyph.
const toFrameData = (r: AssetRecord, { full }: { full: boolean }): MediaFrameData => {
  const ext = r.ext.toLowerCase();
  const base = {
    ext: r.ext,
    alt: r.base,
    tone: MEDIUM_STYLE[mediumKey(r)].tone,
    mediumType: r.mediumType ?? undefined,
  };
  const thumb = thumbUrl(r.thumb); // /thumbs/<name> | undefined

  if (r.medium === 'image') {
    const url = full ? r.src ?? thumb : thumb; // tile=thumb, inspector=full-size (src wins over poster)
    return url ? { ...base, medium: 'image', src: url } : { ...base, medium: 'doc' };
  }
  if (r.medium === 'audio') {
    // Playback lives in the inspector (as in the original drawer); tiles stay light.
    return full && r.src ? { ...base, medium: 'audio', src: r.src } : { ...base, medium: 'doc' };
  }
  if (r.medium === '3d') {
    // MediaFrame can only load glb/gltf, and only in the inspector; the other 77 3D exts glyph.
    const turntable = full && !!r.src && (ext === 'glb' || ext === 'gltf');
    return turntable ? { ...base, medium: 'model', src: r.src, poster: thumb } : { ...base, medium: 'doc' };
  }
  return { ...base, medium: 'doc' }; // source / null → ext glyph
};

interface Filters {
  showSource: boolean;
  medium: '' | Medium;
  mediumType: '' | MediumType;
  status: string; // '' | BLK | ALPHA | BETA | FNL | none
  roblox: '' | RobloxUploadState;
  ext: string;
  q: string;
  selectedPath: string; // '' = whole library; else a folder path prefix from the FolderTree
}
const EMPTY: Filters = {
  showSource: false,
  medium: '',
  mediumType: '',
  status: '',
  roblox: '',
  ext: '',
  q: '',
  selectedPath: '',
};

export function AssetExplorer() {
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [sel, setSel] = useState<AssetRecord | undefined>(undefined);

  // Transient feedback for TILE-level actions (the ⋯ kebab) — rendered in the count line. Copy
  // confirmations self-clear fast; a move-in-flight notice (ends with '…') outlives the ~seconds
  // registry rebuild that reloads the page, but still caps out so a failed rebuild can't pin a
  // stale "rebuilding…" forever.
  const [gridFlash, setGridFlash] = useState<string | null>(null);
  useEffect(() => {
    if (!gridFlash) return;
    const t = window.setTimeout(() => setGridFlash(null), gridFlash.endsWith('…') ? 30000 : 1600);
    return () => window.clearTimeout(t);
  }, [gridFlash]);

  // The move flow (ADR 0011): archive always confirms; _resort confirms only when the record
  // carries the Roblox ledger join (warn-don't-write). Explorer-level state because both the tile
  // kebab and the inspector Toolbar route through the same confirm dialog.
  const [confirmMove, setConfirmMove] = useState<{ record: AssetRecord; dest: MoveDest } | null>(null);
  const performMove = async (record: AssetRecord, dest: MoveDest) => {
    setConfirmMove(null);
    setSel(undefined); // the record's p/src/thumb are dead the moment the rename lands
    const res = await moveAsset(record.p, dest);
    if (res.ok) setGridFlash(`Moved to ${res.to} — rebuilding registry…`);
    else if (res.unavailable) setGridFlash('Move needs the dev server');
    else setGridFlash(`Move failed — ${res.error ?? 'unknown error'}`);
  };
  const requestMove = (record: AssetRecord, dest: MoveDest) => {
    if (needsMoveConfirm(record, dest)) setConfirmMove({ record, dest });
    else void performMove(record, dest);
  };

  const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setFilters((f) => ({ ...f, [key]: value }));

  // Selecting a medium repopulates the mediumType options and clears an now-incompatible type.
  const setMedium = (m: '' | Medium) =>
    setFilters((f) => ({
      ...f,
      medium: m,
      mediumType: f.mediumType && m && MEDIUM_OF_TYPE[f.mediumType] !== m ? '' : f.mediumType,
    }));

  // Choosing a mediumType from the donut also aligns the medium (the parent axis).
  const setMediumType = (mt: '' | MediumType) =>
    setFilters((f) => ({ ...f, mediumType: mt, medium: mt ? MEDIUM_OF_TYPE[mt] : f.medium }));

  // ── The single derived pass over records[], keyed on the whole filter state. Builds the visible
  //    list, the ext-Select options (count-labeled, over the source-gated set), the mediumType
  //    group buckets, AND the tree's filtered tallies — never re-filtering per card. ──
  const { visible, extOptions, sourceOnlyHidden, treeCounts } = useMemo(() => {
    const { showSource, medium, mediumType, status, roblox, ext, q, selectedPath } = filters;
    const needle = q.trim().toLowerCase();

    // Ext options come from the source-gated set (before the other facets narrow it), count-labeled.
    const extTally = new Map<string, number>();
    for (const r of records) {
      if (!showSource && isSource(r)) continue;
      extTally.set(r.ext, (extTally.get(r.ext) ?? 0) + 1);
    }
    const extOptions = [...extTally.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([e, n]) => ({ ext: e, label: `${e} (${n})` }));

    // Every facet EXCEPT the folder selection — the tree derives from this set, so selecting a
    // folder never zeroes its siblings' counts (the tree is the "where" axis; it must not be
    // narrowed by itself).
    const facetMatch = (r: AssetRecord): boolean =>
      (showSource || r.medium !== null) &&
      (!medium || r.medium === medium) &&
      (!mediumType || r.mediumType === mediumType) &&
      (!status || r.status === (status === 'none' ? null : status)) &&
      (!roblox || (r.medium !== null && robloxUploadState(r) === roblox)) &&
      (!ext || r.ext === ext) &&
      (!needle || `${r.stem} ${r.p}`.toLowerCase().includes(needle));

    const matches = (r: AssetRecord): boolean => facetMatch(r) && underFolder(r, selectedPath);

    const visible = records.filter(matches);

    // Filter↔tree interplay: with any non-path facet active, re-tally the tree from the
    // facet-matched set (folders with zero matches get hidden by spineToNodes); otherwise null
    // keeps the stable full spine. `showSource` counts as a facet: the spine totals include
    // source files, so a facet+source-off combination must recount to exclude them.
    const hasNonPathFacet =
      Boolean(medium || mediumType || status || roblox || ext || needle) || showSource;
    const treeCounts = hasNonPathFacet ? tallyByDir(records.filter(facetMatch)) : null;

    // Would turning on "show source" reveal matches? True when the current (non-source-gated)
    // filters hit source records that are hidden only by the OFF toggle — powers the empty-state
    // hint. Must apply the SAME facets as matches(): a medium/mediumType filter can never match
    // a source record (both are null on source), so the hint would otherwise promise a reveal
    // the toggle can't deliver.
    let sourceOnlyHidden = false;
    if (!showSource && visible.length === 0 && !medium && !mediumType && !roblox) {
      sourceOnlyHidden = records.some(
        (r) =>
          isSource(r) &&
          (!status || r.status === (status === 'none' ? null : status)) &&
          (!ext || r.ext === ext) &&
          underFolder(r, selectedPath) &&
          (!needle || `${r.stem} ${r.p}`.toLowerCase().includes(needle)),
      );
    }

    return { visible, extOptions, sourceOnlyHidden, treeCounts };
  }, [filters]);

  // The side-nav data: the full spine, or the filter-recounted derivation. Node ids are identical
  // across both, so FolderTree's uncontrolled expansion state survives every swap.
  const treeData = useMemo(
    () => (treeCounts ? spineToNodes(treeCounts, filters.selectedPath) : assetTree),
    [treeCounts, filters.selectedPath],
  );

  // A facet change can remove the selected tile from the result set. Clear that stale selection
  // so VirtualAssetGrid's live status never announces a hidden record as still selected.
  useEffect(() => {
    if (sel && !visible.some((record) => record.p === sel.p)) setSel(undefined);
  }, [sel, visible]);

  const anyFilter =
    filters.medium ||
    filters.mediumType ||
    filters.status ||
    filters.roblox ||
    filters.ext ||
    filters.q.trim() ||
    filters.selectedPath;
  const hasFilter = Boolean(anyFilter);

  // Group the grid by mediumType only when no specific type is selected (the primary medium ▸
  // mediumType axis); a chosen type renders a flat grid. VirtualAssetGrid owns the windowing, the
  // sticky counted subheads, and the section order (GROUP_ORDER) — no manual bucketing/capping.
  const grouped = !filters.mediumType;

  // The active-filter chips (DataStatusBar `filters` — removable via onRemoveFilter).
  const chips: DataFilter[] = [];
  if (filters.selectedPath) chips.push({ id: 'path', label: 'Folder', value: filters.selectedPath, tone: 'accent' });
  if (filters.medium) chips.push({ id: 'medium', label: 'Medium', value: MEDIUM_STYLE[filters.medium].label, tone: 'accent' });
  if (filters.mediumType) chips.push({ id: 'mediumType', label: 'Type', value: filters.mediumType });
  if (filters.status) chips.push({ id: 'status', label: 'Status', value: filters.status });
  if (filters.roblox) {
    const labels: Record<RobloxUploadState, string> = {
      uploaded: 'Uploaded',
      needsReview: 'Needs review',
      unregistered: 'Not registered',
    };
    chips.push({ id: 'roblox', label: 'Roblox', value: labels[filters.roblox], tone: 'accent' });
  }
  if (filters.ext) chips.push({ id: 'ext', label: 'Ext', value: filters.ext.toUpperCase() });
  if (filters.q.trim()) chips.push({ id: 'q', label: 'Search', value: filters.q.trim() });

  const removeChip = (id: string) => {
    if (id === 'medium') setMedium('');
    else if (id === 'mediumType') set('mediumType', '');
    else if (id === 'path') set('selectedPath', '');
    else set(id as keyof Filters, '' as never);
  };
  // Clear everything except the source toggle (the only default-on gate).
  const clearAll = () => setFilters((f) => ({ ...EMPTY, showSource: f.showSource }));

  const mediumTypeOptions: MediumType[] = filters.medium
    ? MEDIUM_TYPES[filters.medium]
    : MEDIUM_ORDER.flatMap((m) => MEDIUM_TYPES[m]);

  return (
    <div className="cc-explorer">
      {/* 1 — SUMMARY HEADER */}
      <section className="cc-section">
        <h3 className="cc-section-title">Library</h3>
        {/* Two-column band: stats + medium meter on the left, the type donut on the right —
            keeps the whole summary to one donut's height instead of stacking full-width rows. */}
        <div className="cc-explorer__summary">
          <div className="cc-explorer__summary-main">
            <div className="cc-explorer__stats">
              <Stat
                label="Total assets"
                value={summary.real}
                tone="neutral"
                onSelect={() => setMedium('')}
              />
              <Stat
                label="Images"
                value={summary.image}
                tone={MEDIUM_STYLE.image.tone}
                onSelect={() => setMedium('image')}
              />
              <Stat
                label="3D"
                value={summary.threeD}
                tone={MEDIUM_STYLE['3d'].tone}
                onSelect={() => setMedium('3d')}
              />
              <Stat
                label="Audio"
                value={summary.audio}
                tone={MEDIUM_STYLE.audio.tone}
                onSelect={() => setMedium('audio')}
              />
            </div>
            <Meter
              variant="stacked"
              max={summary.real}
              segments={[
                { value: summary.image, tone: 'info', label: 'image' },
                { value: summary.threeD, tone: 'accent', label: '3d' },
                { value: summary.audio, tone: 'success', label: 'audio' },
              ]}
              label="Assets by medium"
            />
          </div>
          <div className="cc-explorer__donut">
            <DonutChart
              size={150}
              selectedId={filters.mediumType || undefined}
              onSelect={(id) =>
                setMediumType(id === filters.mediumType ? '' : (id as MediumType))
              }
              data={{
                view: 'donut',
                title: 'By type',
                centerValue: String(summary.real),
                centerLabel: 'assets',
                segments: Object.entries(counts.byMediumType)
                  .filter(([k]) => k !== '(source)' && k in MEDIUM_OF_TYPE)
                  .map(([k, v]) => ({
                    id: k,
                    label: k,
                    value: v,
                    tone: MEDIUM_STYLE[MEDIUM_OF_TYPE[k]].tone,
                  })),
              }}
            />
          </div>
        </div>
      </section>

      {/* 2 — FILTER BAR */}
      <section className="cc-section">
        <Box className="cc-explorer__toolbar" material="glass" p={3}>
          <Inline wrap gap={2} align="end">
            <Input
              type="search"
              label="Search"
              placeholder="name or path…"
              value={filters.q}
              onChange={(e) => set('q', e.currentTarget.value)}
              startSlot={<span aria-hidden>⌕</span>}
              endSlot={
                filters.q ? (
                  <IconButton aria-label="Clear search" size="sm" variant="ghost" onPress={() => set('q', '')}>
                    ✕
                  </IconButton>
                ) : undefined
              }
              containerClassName="cc-explorer__search"
            />
            <Select
              label="Medium"
              placeholder="All mediums"
              value={filters.medium}
              onChange={(e) => setMedium(e.currentTarget.value as '' | Medium)}
            >
              <option value="">All mediums</option>
              {MEDIUM_ORDER.map((m) => (
                <option key={m} value={m}>
                  {MEDIUM_STYLE[m].label}
                </option>
              ))}
            </Select>
            <Select
              label="Type"
              placeholder="All types"
              value={filters.mediumType}
              onChange={(e) => setMediumType(e.currentTarget.value as '' | MediumType)}
            >
              <option value="">All types</option>
              {mediumTypeOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
            <Select
              label="Status"
              placeholder="Any status"
              value={filters.status}
              onChange={(e) => set('status', e.currentTarget.value)}
            >
              <option value="">Any status</option>
              {statusVocab.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
              <option value="none">none</option>
            </Select>
            <Select
              label="File type"
              placeholder="Any type"
              value={filters.ext}
              onChange={(e) => set('ext', e.currentTarget.value)}
            >
              <option value="">Any type</option>
              {extOptions.map((o) => (
                <option key={o.ext} value={o.ext}>
                  {o.label}
                </option>
              ))}
            </Select>
            <Select
              label="Roblox"
              placeholder="Any upload state"
              value={filters.roblox}
              onChange={(e) => set('roblox', e.currentTarget.value as '' | RobloxUploadState)}
            >
              <option value="">Any upload state</option>
              <option value="uploaded">Uploaded ({robloxRegistry.byState.uploaded})</option>
              <option value="needsReview">Needs review ({robloxRegistry.byState.needsReview})</option>
              <option value="unregistered">Not registered ({robloxRegistry.byState.unregistered})</option>
            </Select>
            <Switch
              label="Show source files"
              checked={filters.showSource}
              onChange={(e) => set('showSource', e.currentTarget.checked)}
            />
          </Inline>
        </Box>
        {chips.length > 0 && (
          <div className="cc-explorer__activechips">
            <DataStatusBar
              dense
              status="live"
              statusLabel="Filtered"
              aria-label="Active filters"
              filters={chips}
              onRemoveFilter={(id) => removeChip(id)}
              metrics={[{ id: 'shown', label: 'shown', value: visible.length }]}
            />
            <Button size="sm" variant="ghost" onPress={clearAll}>
              Clear all
            </Button>
          </div>
        )}
        <p className="cc-explorer__count">
          {filters.showSource
            ? `${summary.total} files (incl. ${summary.source} source) · ${visible.length} shown`
            : `${summary.real} assets · ${visible.length} shown`}
          {gridFlash && (
            <span className="cc-explorer__flash" role="status">
              {gridFlash}
            </span>
          )}
        </p>
        {robloxRegistry.issues.length > 0 && (
          <div className="cc-explorer__robloxstatus">
            <DataStatusBar
              dense
              status="partial"
              title="Roblox upload registry"
              statusLabel="Needs review"
              aria-label="Roblox upload registry diagnostics"
              metrics={[
                { id: 'drift', label: 'checksum drift', value: robloxRegistry.checksumMismatch },
                { id: 'orphaned', label: 'orphaned', value: robloxRegistry.orphaned },
                { id: 'legacy', label: 'legacy conflicts', value: robloxRegistry.legacyIdConflicts },
              ]}
            />
          </div>
        )}
      </section>

      {/* 3 — RESULTS: the folder tree (left) beside the virtualized asset grid (right). The grid is
          height-bounded so it windows + scrolls internally while the summary/filter/tree stay fixed. */}
      <div className="cc-explorer__body">
        <aside className="cc-explorer__tree" aria-label="Library folder navigation">
          <FolderTree
            data={treeData}
            label="Library folders"
            defaultExpandedIds={assetTree.flatMap((n) => (n.id ? [n.id] : []))}
            selectedId={filters.selectedPath}
            onSelect={(id) => set('selectedPath', id)}
            filter
          />
        </aside>
        <div className="cc-explorer__main">
          <VirtualAssetGrid
            items={visible}
            getKey={(r) => r.p}
            getLabel={(r) => r.stem}
            renderTile={(r, { selected }) => (
              <AssetTile record={r} selected={selected} flash={setGridFlash} requestMove={requestMove} />
            )}
            groupBy={grouped ? (r) => r.mediumType ?? '(source)' : undefined}
            groupOrder={grouped ? GROUP_ORDER : undefined}
            selectedId={sel?.p ?? ''}
            onSelect={(_id, r) => setSel(r)}
            minTileWidth={160}
            gap={12}
            tileHeight={210}
            label="Assets"
            emptyState={
              <EmptyState
                title="No assets match"
                description={
                  sourceOnlyHidden
                    ? 'The only matches are source files — turn on “Show source files” to see them.'
                    : 'No assets match the current filters.'
                }
                pendingSource={sourceOnlyHidden ? 'registry.source' : undefined}
                action={
                  hasFilter ? (
                    <Button size="sm" variant="outline" onPress={clearAll}>
                      Clear filters
                    </Button>
                  ) : undefined
                }
              />
            }
          />
        </div>
      </div>

      {/* 4 — INSPECTOR + the move-confirm dialog (a SIBLING, not a child: the tile kebab opens it
          with no inspector mounted, and stacking two Dialogs needs the inspector's dismissal gated
          while the confirm is up). */}
      <Inspector
        record={sel}
        onClose={() => setSel(undefined)}
        onFilterToType={setMediumType}
        requestMove={requestMove}
        confirmOpen={Boolean(confirmMove)}
      />
      {confirmMove && (
        <MoveConfirmDialog
          record={confirmMove.record}
          dest={confirmMove.dest}
          onCancel={() => setConfirmMove(null)}
          onConfirm={() => void performMove(confirmMove.record, confirmMove.dest)}
        />
      )}
    </div>
  );
}

// A single asset tile — presentational EXCEPT the ⋯ kebab, a pointer-only quick-action shortcut.
// VirtualAssetGrid owns the option box, click, keyboard, focus ring, and selected tint; tiles are
// role="option", so a nested focusable control would break both ARIA and the single-tab-stop
// model. The kebab therefore lives inside an aria-hidden wrapper with tabIndex={-1} (unreachable
// via Tab; the ACCESSIBLE path to every action is the inspector's command Toolbar, one Enter
// away), and the wrapper stops click/keydown/pointerdown propagation — the portaled Menu bubbles
// its events through the React tree back into the tile, which would otherwise select it and cover
// the menu with the inspector. On close, focus hops back to the enclosing option so arrow-key
// navigation resumes. Roblox upload state is a corner dot over the media (full badges live in the
// inspector). Keep the MediaFrame NON-interactive.
function AssetTile({
  record,
  selected,
  flash,
  requestMove,
}: {
  record: AssetRecord;
  selected: boolean;
  flash: (msg: string) => void;
  requestMove: (r: AssetRecord, dest: MoveDest) => void;
}) {
  const key = mediumKey(record);
  const style = MEDIUM_STYLE[key];
  const typeLabel = record.mediumType ?? '(source)';
  const showStatus = record.status !== null;
  const uploadState = robloxUploadState(record);
  const [kebabOpen, setKebabOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);
  return (
    <div className="cc-explorer__card" data-medium={key} data-selected={selected || undefined}>
      <div className="cc-explorer__cardmedia">
        <MediaFrame data={toFrameData(record, { full: false })} />
      </div>
      {uploadState !== 'unregistered' && (
        <span
          className="cc-explorer__uploaddot"
          data-state={uploadState}
          title={uploadState === 'uploaded' ? 'Roblox uploaded' : 'Roblox needs review'}
        />
      )}
      <span
        ref={wrapRef}
        className="cc-explorer__kebabwrap"
        aria-hidden="true"
        data-open={kebabOpen || undefined}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <Menu
          open={kebabOpen}
          onOpenChange={(o) => {
            setKebabOpen(o);
            // Menu restores focus to its (aria-hidden) trigger; hop it onto the option div so
            // the grid's arrow-key navigation resumes from this tile. A 0ms timeout (not rAF —
            // frame callbacks can stall in occluded/embedded views) lets Menu's own restore land
            // first, then overrides it.
            if (!o)
              window.setTimeout(
                () => (wrapRef.current?.closest('[role="option"]') as HTMLElement | null)?.focus(),
                0,
              );
          }}
        >
          <Menu.Trigger>
            <button type="button" tabIndex={-1} className="cc-explorer__kebab" aria-label="Asset actions">
              <KebabIcon />
            </button>
          </Menu.Trigger>
          <Menu.Content align="end">
            <Menu.Label>{record.stem}</Menu.Label>
            <Menu.Item
              disabled={!actionEnabled('copy-id', record)}
              onSelect={() => void runAction('copy-id', record, flash)}
            >
              <CopyIcon /> Copy asset id
            </Menu.Item>
            <Menu.Item onSelect={() => void runAction('copy-path', record, flash)}>
              <CopyIcon /> Copy path
            </Menu.Item>
            <Menu.Item onSelect={() => void runAction('reveal', record, flash)}>
              <FolderOpenIcon /> Reveal in Finder
            </Menu.Item>
            <Menu.Item
              disabled={!actionEnabled('view-online', record)}
              onSelect={() => void runAction('view-online', record, flash)}
            >
              <ExternalLinkIcon /> View online
            </Menu.Item>
            <Menu.Separator />
            <Menu.Item
              disabled={!moveEnabled(record, 'resort')}
              title={canMove ? undefined : MOVE_DISABLED_HINT}
              onSelect={() => requestMove(record, 'resort')}
            >
              <ResortIcon /> Move to _resort
            </Menu.Item>
            <Menu.Item
              disabled={!moveEnabled(record, 'archive')}
              title={canMove ? undefined : MOVE_DISABLED_HINT}
              onSelect={() => requestMove(record, 'archive')}
            >
              <ArchiveIcon /> Move to _archive…
            </Menu.Item>
          </Menu.Content>
        </Menu>
      </span>
      <div className="cc-explorer__cardbody">
        <Tooltip content={record.stem}>
          <span className="cc-explorer__name">{record.stem}</span>
        </Tooltip>
        <Inline wrap gap={1} align="baseline">
          <Badge tone={style.tone} variant="soft" size="sm">
            {typeLabel}
          </Badge>
          {showStatus && (
            <Badge tone={statusTone(record.status)} variant="soft" size="sm" dot>
              {record.status}
            </Badge>
          )}
          <span className="cc-explorer__tilemeta">
            {record.ext.toUpperCase()} · {humanBytes(record.size)}
          </span>
        </Inline>
      </div>
    </div>
  );
}

// One inspector row — skipped entirely when the value is null/undefined, so the deferred-dimension
// records never show empty rows.
function Row({ label, value }: { label: string; value: ReactNode }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <Table.Row>
      <Table.HeaderCell>{label}</Table.HeaderCell>
      <Table.Cell>{value}</Table.Cell>
    </Table.Row>
  );
}

// One essentials fact — a label-over-value cell in the inspector's at-a-glance grid. Like Row,
// it skips absent values so a sparse record shows only the facts it actually carries.
function Fact({ label, value }: { label: string; value: ReactNode }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

// The Dialog inspector — the full metadata dump for the selected record, with the COMMAND BAR in
// the footer: a roving-focus Toolbar (one Tab stop; ←/→ roves) of primary actions + a ⋯ overflow
// Menu for the rarer verbs and the moves. Dialog dismissal is GATED while the overflow menu or
// the move-confirm dialog is up: both portal outside the dialog card, so an ungated inspector
// would close on their Escape/outside-click before the action lands.
function Inspector({
  record,
  onClose,
  onFilterToType,
  requestMove,
  confirmOpen,
}: {
  record: AssetRecord | undefined;
  onClose: () => void;
  onFilterToType: (mt: '' | MediumType) => void;
  requestMove: (r: AssetRecord, dest: MoveDest) => void;
  confirmOpen: boolean;
}) {
  // Transient confirmation label for the reveal/copy actions (self-clears). Hooks stay above the
  // early return — this component is always mounted (record may be undefined).
  const [flash, setFlash] = useState<string | null>(null);
  useEffect(() => {
    if (!flash) return;
    const t = window.setTimeout(() => setFlash(null), 1600);
    return () => window.clearTimeout(t);
  }, [flash]);
  const [menuOpen, setMenuOpen] = useState(false);
  if (!record) return null;
  const key = mediumKey(record);
  const style = MEDIUM_STYLE[key];
  const abs = absPathOf(record);
  const roblox = record.roblox;
  const uploadState = robloxUploadState(record);
  const idInfo = assetIdOf(record);
  const dims = record.dims ?? (record.w && record.h ? `${record.w}×${record.h}` : null);
  return (
    <Dialog
      open={Boolean(record)}
      onClose={onClose}
      size="md"
      title={record.stem}
      description={record.p}
      closeOnEsc={!menuOpen && !confirmOpen}
      closeOnOverlayClick={!menuOpen && !confirmOpen}
      className="cc-explorer__dialogglass"
      footer={
        <div className="cc-explorer__footerbar">
          <Toolbar aria-label="Asset actions" className="cc-explorer__cmdbar">
            <Toolbar.Group aria-label="Copy">
              <Toolbar.Button
                disabled={!idInfo}
                title={idInfo ? `Copy ${idInfo.id}` : 'No known asset id for this record'}
                onClick={() => void runAction('copy-id', record, setFlash)}
              >
                <CopyIcon /> Copy id
              </Toolbar.Button>
              <Toolbar.Button
                title="Copy the library-relative path"
                onClick={() => void runAction('copy-path', record, setFlash)}
              >
                <CopyIcon /> Path
              </Toolbar.Button>
            </Toolbar.Group>
            <Toolbar.Separator />
            <Toolbar.Group aria-label="Locate">
              <Toolbar.Button
                title={`Reveal in Finder — falls back to copying ${abs}`}
                onClick={() => void runAction('reveal', record, setFlash)}
              >
                <FolderOpenIcon /> Reveal
              </Toolbar.Button>
              <Toolbar.Button
                disabled={!actionEnabled('view-online', record)}
                title={
                  actionEnabled('view-online', record)
                    ? 'Open the public Roblox asset page'
                    : 'Needs a checksum-verified Roblox upload'
                }
                onClick={() => void runAction('view-online', record, setFlash)}
              >
                <ExternalLinkIcon /> View online
              </Toolbar.Button>
            </Toolbar.Group>
            <Toolbar.Separator />
            <Menu
              open={menuOpen}
              onOpenChange={(o) => {
                // Closing must be DEFERRED one task: the menu's own Escape/outside-press fires
                // mid-dispatch, and flipping menuOpen synchronously re-attaches the Dialog's
                // document-level dismiss listeners in time to catch the SAME event — one Escape
                // would close both the menu and the inspector.
                if (o) setMenuOpen(true);
                else window.setTimeout(() => setMenuOpen(false), 0);
              }}
            >
              <Menu.Trigger>
                <Toolbar.Button aria-label="More actions" title="More actions">
                  <KebabIcon />
                </Toolbar.Button>
              </Menu.Trigger>
              <Menu.Content align="end" side="top">
                <Menu.Label>{record.stem}</Menu.Label>
                <Menu.Item
                  disabled={!actionEnabled('copy-uri', record)}
                  onSelect={() => void runAction('copy-uri', record, setFlash)}
                >
                  <CopyIcon /> Copy Roblox URI
                </Menu.Item>
                <Menu.Item
                  disabled={!actionEnabled('copy-reg-id', record)}
                  onSelect={() => void runAction('copy-reg-id', record, setFlash)}
                >
                  <CopyIcon /> Copy name-matched ID
                </Menu.Item>
                <Menu.Item
                  disabled={!actionEnabled('view-dashboard', record)}
                  onSelect={() => void runAction('view-dashboard', record, setFlash)}
                >
                  <ExternalLinkIcon /> Open in Creator Dashboard
                </Menu.Item>
                <Menu.Separator />
                <Menu.Item
                  disabled={!moveEnabled(record, 'resort')}
                  title={canMove ? undefined : MOVE_DISABLED_HINT}
                  onSelect={() => requestMove(record, 'resort')}
                >
                  <ResortIcon /> Move to _resort
                </Menu.Item>
                <Menu.Item
                  disabled={!moveEnabled(record, 'archive')}
                  title={canMove ? undefined : MOVE_DISABLED_HINT}
                  onSelect={() => requestMove(record, 'archive')}
                >
                  <ArchiveIcon /> Move to _archive…
                </Menu.Item>
              </Menu.Content>
            </Menu>
            {record.mediumType && (
              <Toolbar.Button
                tone="accent"
                className="cc-explorer__filtertype"
                onClick={() => {
                  onFilterToType(record.mediumType as MediumType);
                  onClose();
                }}
              >
                Filter to this type
              </Toolbar.Button>
            )}
          </Toolbar>
          {flash && (
            <span className="cc-explorer__flash" role="status">
              {flash}
            </span>
          )}
        </div>
      }
    >
      <div className="cc-explorer__inspector">
        {record.medium === 'audio' && record.src ? (
          // The full AudioWaveform player (play/pause + scrubber + real decoded waveform) — the
          // MediaFrame audio surface is only a `compact` no-transport thumbnail. Peaks decode via
          // the Web Audio API on open (one asset at a time; never autoplays). See registry `src`.
          <AudioWaveform
            src={record.src}
            label={record.base}
            tone={MEDIUM_STYLE.audio.tone}
            autoLoadPeaks
            className="cc-explorer__audio"
          />
        ) : (
          <MediaFrame data={toFrameData(record, { full: true })} ratio="16 / 9" />
        )}
        <Inline wrap gap={1} className="cc-explorer__inspectorbadges">
          <Badge tone={style.tone} variant="soft" size="sm">
            {record.medium ?? 'source'}
          </Badge>
          {record.mediumType && record.mediumType !== record.medium && (
            <Badge tone={style.tone} variant="soft" size="sm">
              {record.mediumType}
            </Badge>
          )}
          {record.status && (
            <Badge tone={statusTone(record.status)} variant="soft" size="sm" dot>
              {record.status}
            </Badge>
          )}
          {uploadState === 'uploaded' && (
            <Badge tone="success" variant="outline" size="sm" dot>
              Roblox uploaded
            </Badge>
          )}
          {uploadState === 'needsReview' && (
            <Badge tone="warning" variant="outline" size="sm" dot>
              Roblox needs review
            </Badge>
          )}
        </Inline>
        {/* Essentials — the at-a-glance facts lead; the exhaustive field dump is tucked into the
            collapsed <details> below so the modal opens compact (progressive disclosure). */}
        <dl className="cc-explorer__facts">
          <Fact label="Ext" value={record.ext.toUpperCase()} />
          <Fact label="Size" value={humanBytes(record.size)} />
          <Fact label="Dimensions" value={dims} />
          <Fact label="Modified" value={record.mtime} />
          <Fact label="Area" value={record.area} />
          <Fact label="Domain" value={record.domain} />
        </dl>
        <section className="cc-explorer__roblox" data-state={uploadState} aria-label="Roblox upload metadata">
          <div className="cc-explorer__robloxhead">
            <div>
              <span className="cc-explorer__robloxeyebrow">Roblox upload</span>
              <strong>{roblox ? roblox.active.assetId : 'No exact-path registration'}</strong>
            </div>
            <Badge
              tone={uploadState === 'uploaded' ? 'success' : uploadState === 'needsReview' ? 'warning' : 'neutral'}
              variant="soft"
              size="sm"
              dot
            >
              {uploadState === 'uploaded' ? 'Uploaded' : uploadState === 'needsReview' ? 'Needs review' : 'Not registered'}
            </Badge>
          </div>
          {roblox ? (
            <>
              {roblox.checksum === 'mismatch' && (
                <p className="cc-explorer__robloxwarning">
                  Local bytes no longer match the verified upload. Roblox URI and store actions are withheld until review.
                </p>
              )}
              {roblox.legacyIdConflict && (
                <p className="cc-explorer__robloxwarning">
                  The legacy name match points to {roblox.legacyIdConflict}; the exact-path mapping remains authoritative.
                </p>
              )}
              <dl className="cc-explorer__robloxfacts">
                <Fact label="URI" value={<code className="cc-explorer__mono">{roblox.active.assetUri}</code>} />
                <Fact label="Inventory folder" value={roblox.active.inventoryPath} />
                <Fact
                  label="Creator"
                  value={`${roblox.active.creator.name} · ${roblox.active.creator.type} ${roblox.active.creator.id}`}
                />
                <Fact label="Asset type" value={roblox.active.assetType} />
                <Fact label="Checksum" value={roblox.checksum} />
                <Fact label="Upload history" value={`${roblox.uploadCount} entr${roblox.uploadCount === 1 ? 'y' : 'ies'}`} />
                <Fact label="Verified" value={roblox.active.verifiedAt} />
                <Fact label="Method" value={roblox.active.verificationMethod} />
              </dl>
              <p className="cc-explorer__robloxurl">
                {roblox.active.creatorStoreUrl
                  ? 'Verified public Creator Store listing available.'
                  : 'No public Creator Store listing.'}
              </p>
            </>
          ) : (
            <p className="cc-explorer__robloxurl">
              No canonical Roblox upload is registered for this exact library path.
            </p>
          )}
        </section>
        <details className="cc-explorer__morefields">
          <summary>All fields</summary>
          <Table density="compact" className="cc-explorer__inspectortable">
            <Table.Body>
              <Row label="Path" value={<code className="cc-explorer__mono">{record.p}</code>} />
            <Row label="Area" value={record.area} />
            <Row label="Directory" value={<code className="cc-explorer__mono">{record.dir}</code>} />
            <Row label="File" value={record.base} />
            <Row label="Stem" value={record.stem} />
            <Row label="Ext" value={record.ext.toUpperCase()} />
            <Row label="Kind" value={record.kind} />
            <Row label="Size" value={`${humanBytes(record.size)} (${record.size.toLocaleString()} B)`} />
            <Row label="Modified" value={record.mtime} />
            <Row label="Domain" value={record.domain} />
            <Row label="Medium" value={record.medium} />
            <Row label="Media type" value={record.mediumType} />
            <Row label="Status" value={record.status} />
            <Row label="Conformance" value={record.conformance} />
            <Row label="Issue" value={record.issue} />
            <Row label="Instance" value={record.instance} />
            <Row label="Spec" value={record.spec} />
            <Row label="Dimensions" value={record.dims ?? (record.w && record.h ? `${record.w}×${record.h}` : null)} />
            <Row label="Resolution" value={record.res} />
            <Row label="Spec issue" value={record.specIssue} />
            {record.reg && (
              <>
                <Row label="Catalog ID — name matched" value={record.reg.id} />
                <Row label="Catalog status — name matched" value={record.reg.status} />
                <Row label="Catalog kind — name matched" value={record.reg.kind} />
              </>
            )}
            {roblox && (
              <>
                <Row label="Roblox local URI" value={<code className="cc-explorer__mono">{roblox.localUri}</code>} />
                <Row label="Roblox source SHA-256" value={<code className="cc-explorer__mono">{roblox.sourceSha256}</code>} />
                <Row label="Roblox recorded" value={roblox.recordedAt} />
                <Row label="Roblox Creator Store URL" value={roblox.active.creatorStoreUrl ?? 'No public listing'} />
              </>
            )}
            {record.tgl && (
              <>
                <Row label="TGL category" value={record.tgl.cat} />
                <Row label="TGL sub" value={record.tgl.sub} />
                <Row label="TGL name" value={record.tgl.name} />
                <Row label="TGL status" value={record.tgl.status} />
                <Row label="TGL grade" value={record.tgl.grade} />
              </>
            )}
              <Row label="Thumbnail" value={record.thumb} />
            </Table.Body>
          </Table>
        </details>
      </div>
    </Dialog>
  );
}

// The move-confirm dialog — renders the buildMoveConfirm fact sheet verbatim. The warning Callout
// is the ADR 0011 warn-don't-write contract: moving a Roblox-joined file orphans its ledger
// mapping, and the ledger is never rewritten from here.
function MoveConfirmDialog({
  record,
  dest,
  onCancel,
  onConfirm,
}: {
  record: AssetRecord;
  dest: MoveDest;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const facts = buildMoveConfirm(record, dest);
  return (
    <Dialog
      open
      onClose={onCancel}
      size="sm"
      title={facts.title}
      description={facts.from}
      footer={
        <Inline gap={2} justify="end">
          <Button variant="ghost" size="sm" onPress={onCancel}>
            Cancel
          </Button>
          <Button variant="solid" tone="warning" size="sm" onPress={onConfirm}>
            {facts.confirmLabel}
          </Button>
        </Inline>
      }
    >
      <div className="cc-explorer__moveconfirm">
        {facts.robloxWarning && (
          <Callout tone="warning" title="Registered Roblox upload">
            {facts.robloxWarning}
          </Callout>
        )}
        <p>
          Moves to <code className="cc-explorer__mono">{facts.to}</code>. {facts.destNote}
        </p>
        <p className="cc-explorer__movenote">{facts.rebuildNote}</p>
      </div>
    </Dialog>
  );
}
