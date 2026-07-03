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
//   4. INSPECTOR — a Dialog modal holding the selected record's full metadata dump.
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  AudioWaveform,
  Badge,
  Box,
  Button,
  Card,
  DataStatusBar,
  Dialog,
  DonutChart,
  EmptyState,
  IconButton,
  Inline,
  Input,
  Meter,
  Select,
  Stack,
  Stat,
  Switch,
  Table,
  Tooltip,
} from '@trembus/ui';
import type { DataFilter } from '@trembus/ui';
import {
  MEDIUM_OF_TYPE,
  MEDIUM_STYLE,
  MEDIUM_TYPES,
  absPathOf,
  counts,
  humanBytes,
  mediumKey,
  records,
  statusTone,
  statusVocab,
  summary,
  thumbUrl,
} from './registry';
import type { AssetRecord, Medium, MediumType } from './registry';
import { MediaFrame } from '@trembus/game-viz';
import type { MediaFrameData } from '@trembus/game-viz';

// The initial cap for the unfiltered set (the 769-row worst case): render a slice, offer "show all".
// Any active filter shrinks the set below this, so the cap only bites on the wide-open view.
const INITIAL_CAP = 200;

// The four medium keys, in axis order — the order Stat tiles + Meter segments + Donut slices share.
const MEDIUM_ORDER: Medium[] = ['image', '3d', 'audio'];

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

// ── Clipboard + reveal (client) ───────────────────────────────────────────────────────
// Clipboard write with a hidden-textarea + execCommand fallback so copy also works in a
// non-secure-context webview (mirrors the reference tool's copyText).
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    /* fall through to the legacy path */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

// Reveal a library-relative path in Finder via the dev-only POST /api/reveal, degrading to
// copying the ABSOLUTE path when no helper answers (the static :4317 site, or any failure) — the
// user pastes it into Finder's Go-to-Folder (⇧⌘G). Returns which branch actually ran.
async function revealOrCopy(p: string, abs: string): Promise<'revealed' | 'copied'> {
  try {
    const res = await fetch('/api/reveal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: p }),
    });
    if (res.ok) {
      const j = (await res.json().catch(() => ({}))) as { ok?: boolean };
      if (j.ok) return 'revealed';
    }
  } catch {
    /* no helper — fall through to copy */
  }
  await copyText(abs);
  return 'copied';
}

interface Filters {
  showSource: boolean;
  medium: '' | Medium;
  mediumType: '' | MediumType;
  status: string; // '' | BLK | ALPHA | BETA | FNL | none
  ext: string;
  q: string;
}
const EMPTY: Filters = { showSource: false, medium: '', mediumType: '', status: '', ext: '', q: '' };

export function AssetExplorer() {
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [sel, setSel] = useState<AssetRecord | undefined>(undefined);
  const [showAll, setShowAll] = useState(false);

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
  //    list, the ext-Select options (count-labeled, over the source-gated set), and the mediumType
  //    group buckets — never re-filtering per card. ──
  const { visible, extOptions, sourceOnlyHidden } = useMemo(() => {
    const { showSource, medium, mediumType, status, ext, q } = filters;
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

    const matches = (r: AssetRecord): boolean =>
      (showSource || r.medium !== null) &&
      (!medium || r.medium === medium) &&
      (!mediumType || r.mediumType === mediumType) &&
      (!status || r.status === (status === 'none' ? null : status)) &&
      (!ext || r.ext === ext) &&
      (!needle || `${r.stem} ${r.p}`.toLowerCase().includes(needle));

    const visible = records.filter(matches);

    // Would turning on "show source" reveal matches? True when the current (non-source-gated)
    // filters hit source records that are hidden only by the OFF toggle — powers the empty-state
    // hint. Must apply the SAME facets as matches(): a medium/mediumType filter can never match
    // a source record (both are null on source), so the hint would otherwise promise a reveal
    // the toggle can't deliver.
    let sourceOnlyHidden = false;
    if (!showSource && visible.length === 0 && !medium && !mediumType) {
      sourceOnlyHidden = records.some(
        (r) =>
          isSource(r) &&
          (!status || r.status === (status === 'none' ? null : status)) &&
          (!ext || r.ext === ext) &&
          (!needle || `${r.stem} ${r.p}`.toLowerCase().includes(needle)),
      );
    }

    return { visible, extOptions, sourceOnlyHidden };
  }, [filters]);

  const anyFilter =
    filters.medium || filters.mediumType || filters.status || filters.ext || filters.q.trim();
  const hasFilter = Boolean(anyFilter);

  // Group the visible set by mediumType only when no specific type is selected (the primary
  // medium ▸ mediumType axis); a chosen type renders a flat grid. Filtered sets are small so the
  // cap defaults off; the wide-open set slices to INITIAL_CAP until "show all".
  const capped = hasFilter || showAll ? visible : visible.slice(0, INITIAL_CAP);
  const overflow = visible.length - capped.length;
  const grouped = !filters.mediumType;

  // Buckets are built from the FULL visible set — never the capped slice — so every subhead
  // count is the type's real total and no older mediumType vanishes from the default view.
  // The render cap is applied per group below (an even share of INITIAL_CAP).
  const groups = useMemo(() => {
    if (!grouped) return null;
    const buckets = new Map<string, AssetRecord[]>();
    for (const r of visible) {
      const key = r.mediumType ?? '(source)';
      const arr = buckets.get(key);
      if (arr) arr.push(r);
      else buckets.set(key, [r]);
    }
    // Order buckets by the axis (image types, 3d types, audio types), source last.
    const order = [...MEDIUM_ORDER.flatMap((m) => MEDIUM_TYPES[m]), '(source)'];
    return [...buckets.entries()].sort(
      (a, b) => (order.indexOf(a[0]) + 1 || 99) - (order.indexOf(b[0]) + 1 || 99),
    );
  }, [visible, grouped]);

  // Per-group slice of the render budget on the wide-open view; filters/"show all" lift it.
  const groupCapActive = grouped && !hasFilter && !showAll;
  const perGroup = groupCapActive && groups ? Math.max(12, Math.ceil(INITIAL_CAP / groups.length)) : Infinity;
  const groupsShown = groups?.map(
    ([type, rows]) => [type, rows, groupCapActive ? rows.slice(0, perGroup) : rows] as const,
  );
  const groupedOverflow =
    groupsShown ? visible.length - groupsShown.reduce((n, [, , shown]) => n + shown.length, 0) : 0;

  // The active-filter chips (DataStatusBar `filters` — removable via onRemoveFilter).
  const chips: DataFilter[] = [];
  if (filters.medium) chips.push({ id: 'medium', label: 'Medium', value: MEDIUM_STYLE[filters.medium].label, tone: 'accent' });
  if (filters.mediumType) chips.push({ id: 'mediumType', label: 'Type', value: filters.mediumType });
  if (filters.status) chips.push({ id: 'status', label: 'Status', value: filters.status });
  if (filters.ext) chips.push({ id: 'ext', label: 'Ext', value: filters.ext.toUpperCase() });
  if (filters.q.trim()) chips.push({ id: 'q', label: 'Search', value: filters.q.trim() });

  const removeChip = (id: string) => {
    if (id === 'medium') setMedium('');
    else if (id === 'mediumType') set('mediumType', '');
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
        <Box className="cc-explorer__toolbar" border radius="md" p={3}>
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
      </section>

      {/* 3 — RESULTS GRID */}
      <section className="cc-section">
        <p className="cc-explorer__count">
          {filters.showSource
            ? `${summary.total} files (incl. ${summary.source} source) · ${visible.length} shown`
            : `${summary.real} assets · ${visible.length} shown`}
        </p>
        {visible.length === 0 ? (
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
        ) : grouped && groupsShown ? (
          <>
            {groupsShown.map(([type, rows, shown]) => (
              <div key={type} className="cc-explorer__group">
                <h4 className="cc-section-title cc-explorer__grouphead">
                  {type}{' '}
                  <span className="cc-explorer__groupcount">
                    {shown.length < rows.length ? `${shown.length} of ${rows.length}` : rows.length}
                  </span>
                </h4>
                <div className="cc-explorer__grid">
                  {shown.map((r) => (
                    <AssetTile key={r.p} record={r} selected={sel?.p === r.p} onOpen={setSel} />
                  ))}
                </div>
              </div>
            ))}
            {groupedOverflow > 0 && (
              <div className="cc-explorer__more">
                <Button variant="outline" onPress={() => setShowAll(true)}>
                  Show all {visible.length}
                </Button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="cc-explorer__grid">
              {capped.map((r) => (
                <AssetTile key={r.p} record={r} selected={sel?.p === r.p} onOpen={setSel} />
              ))}
            </div>
            {overflow > 0 && (
              <div className="cc-explorer__more">
                <Button variant="outline" onPress={() => setShowAll(true)}>
                  Show all {visible.length}
                </Button>
              </div>
            )}
          </>
        )}
      </section>

      {/* 4 — INSPECTOR */}
      <Inspector record={sel} onClose={() => setSel(undefined)} onFilterToType={setMediumType} />
    </div>
  );
}

// A single asset tile — a flush square MediaFrame (baked thumbnail for images; ext glyph
// otherwise) over one compact body: the stem name, then a single wrap-line of type badge +
// status badge + a dim "EXT · size" note. Area/domain live in the inspector, not the tile.
function AssetTile({
  record,
  selected,
  onOpen,
}: {
  record: AssetRecord;
  selected: boolean;
  onOpen: (r: AssetRecord) => void;
}) {
  const key = mediumKey(record);
  const style = MEDIUM_STYLE[key];
  const typeLabel = record.mediumType ?? '(source)';
  const showStatus = record.status !== null;
  return (
    <Card
      interactive
      className="cc-explorer__card"
      data-selected={selected || undefined}
      data-medium={key}
      onClick={() => onOpen(record)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(record);
        }
      }}
    >
      <Card.Header>
        <MediaFrame data={toFrameData(record, { full: false })} />
      </Card.Header>
      <Card.Body>
        <Stack gap={1}>
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
        </Stack>
      </Card.Body>
    </Card>
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

// The Dialog inspector — the full metadata dump for the selected record. Every present field
// renders; absent fields are skipped. The medium/mediumType/status Badges lead for continuity
// with the card.
function Inspector({
  record,
  onClose,
  onFilterToType,
}: {
  record: AssetRecord | undefined;
  onClose: () => void;
  onFilterToType: (mt: '' | MediumType) => void;
}) {
  // Transient confirmation label for the reveal/copy actions (self-clears). Hooks stay above the
  // early return — this component is always mounted (record may be undefined).
  const [flash, setFlash] = useState<string | null>(null);
  useEffect(() => {
    if (!flash) return;
    const t = window.setTimeout(() => setFlash(null), 1600);
    return () => window.clearTimeout(t);
  }, [flash]);
  if (!record) return null;
  const key = mediumKey(record);
  const style = MEDIUM_STYLE[key];
  const abs = absPathOf(record);
  const regId = record.reg?.id;
  const dims = record.dims ?? (record.w && record.h ? `${record.w}×${record.h}` : null);
  return (
    <Dialog
      open={Boolean(record)}
      onClose={onClose}
      size="md"
      title={record.stem}
      description={record.p}
      footer={
        <Inline gap={2} justify="between" wrap>
          <Inline gap={2} align="center">
            <Tooltip content={`Reveal in Finder — falls back to copying ${abs}`}>
              <Button
                size="sm"
                variant="outline"
                onPress={async () => {
                  const how = await revealOrCopy(record.p, abs);
                  setFlash(how === 'revealed' ? 'Shown in Finder ✓' : 'No helper — path copied');
                }}
              >
                Reveal in Finder
              </Button>
            </Tooltip>
            <Button
              size="sm"
              variant="ghost"
              onPress={async () => setFlash((await copyText(record.p)) ? 'Path copied ✓' : 'Copy failed')}
            >
              Copy path
            </Button>
            {regId && (
              <Button
                size="sm"
                variant="ghost"
                onPress={async () =>
                  setFlash((await copyText(`rbxassetid://${regId}`)) ? 'Id copied ✓' : 'Copy failed')
                }
              >
                Copy id
              </Button>
            )}
            {flash && (
              <span className="cc-explorer__flash" role="status">
                {flash}
              </span>
            )}
          </Inline>
          {record.mediumType && (
            <Button
              variant="solid"
              tone="accent"
              size="sm"
              onPress={() => {
                onFilterToType(record.mediumType as MediumType);
                onClose();
              }}
            >
              Filter to this type
            </Button>
          )}
        </Inline>
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
                <Row label="Registry id" value={record.reg.id} />
                <Row label="Registry status" value={record.reg.status} />
                <Row label="Registry kind" value={record.reg.kind} />
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
