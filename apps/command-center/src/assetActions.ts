// The Asset Explorer's action vocabulary — ONE home for every per-asset verb, consumed by both
// the inspector's command Toolbar and the tile ⋯ kebab Menu so the two surfaces can never drift.
// Pure browser module (no React): clipboard, the dev-only reveal/move endpoints, and the URL/id
// derivations. Move semantics are ADR 0011: the endpoint owns the destination paths; the client
// only ever names a record's own library-relative `p`.
import type { AssetRecord } from './registry';
import { absPathOf, robloxUploadState } from './registry';

// ── Clipboard + reveal ────────────────────────────────────────────────────────────────
// Clipboard write with a hidden-textarea + execCommand fallback so copy also works in a
// non-secure-context webview (mirrors the reference tool's copyText).
export async function copyText(text: string): Promise<boolean> {
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
export async function revealOrCopy(p: string, abs: string): Promise<'revealed' | 'copied'> {
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

// ── Asset ids ─────────────────────────────────────────────────────────────────────────
// Two id systems exist: the checksum-verified exact-path Roblox join (authoritative) and the
// legacy fuzzy name-matched CSV id. Never silently substitute the fuzzier id for a drifted
// verified one — surface the drift in the flash copy instead.
export interface AssetIdInfo {
  id: string;
  source: 'roblox' | 'csv';
  checksum?: 'match' | 'mismatch';
}
export function assetIdOf(r: AssetRecord): AssetIdInfo | null {
  if (r.roblox) return { id: r.roblox.active.assetId, source: 'roblox', checksum: r.roblox.checksum };
  if (r.reg?.id) return { id: r.reg.id, source: 'csv' };
  return null;
}

// ── View online ───────────────────────────────────────────────────────────────────────
// creatorStoreUrl is null on every current ledger row, so the public URL is constructed from the
// verified assetId. Both links stay checksum-gated (same withholding rule as Copy Roblox URI).
export function viewOnlineUrl(r: AssetRecord): string | null {
  if (!r.roblox || robloxUploadState(r) !== 'uploaded') return null;
  return r.roblox.active.creatorStoreUrl ?? `https://create.roblox.com/store/asset/${r.roblox.active.assetId}`;
}
/** The creator-side asset page — resolves even for uploads never listed on the store. */
export function creatorDashboardUrl(r: AssetRecord): string | null {
  if (!r.roblox || robloxUploadState(r) !== 'uploaded') return null;
  return `https://create.roblox.com/dashboard/creations/store/${r.roblox.active.assetId}/configure`;
}

// ── Move (dev only) ───────────────────────────────────────────────────────────────────
// POST /api/move exists iff the Vite dev server is running (the liveAssets plugin is
// apply:'serve'), so the gate is a build-time constant — unlike reveal there is no honest
// static-site fallback, so the controls render disabled rather than probing.
export const canMove: boolean = import.meta.env.DEV;
export const MOVE_DISABLED_HINT = 'Dev server only — run the app via pnpm dev';

export type MoveDest = 'resort' | 'archive';

export function moveEnabled(r: AssetRecord, dest: MoveDest): boolean {
  return canMove && !r.p.startsWith(dest === 'resort' ? '_resort/' : '_archive/');
}

export interface MoveResult {
  ok: boolean;
  /** Server-computed destination (library-relative) — for the confirmation flash. */
  to?: string;
  error?: string;
  /** Network error / non-JSON — the endpoint is absent (static site) or the server died. */
  unavailable?: boolean;
}

export async function moveAsset(p: string, dest: MoveDest): Promise<MoveResult> {
  try {
    const res = await fetch('/api/move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: p, dest }),
    });
    const j = (await res.json().catch(() => ({}))) as { ok?: boolean; to?: string; error?: string };
    if (res.ok && j.ok) return { ok: true, to: j.to };
    return { ok: false, error: j.error ?? `HTTP ${res.status}` };
  } catch {
    return { ok: false, unavailable: true };
  }
}

// The confirm-dialog fact sheet — pure data; the dialog renders it verbatim. The `to` path is a
// display-only client mirror of the server's rule (the server stays authoritative; a midnight
// date drift is cosmetic).
export interface MoveConfirmFacts {
  title: string;
  from: string;
  to: string;
  /** Present when the record carries the Roblox ledger join — the warn-don't-write warning. */
  robloxWarning: string | null;
  destNote: string;
  rebuildNote: string;
  confirmLabel: string;
}
export function buildMoveConfirm(r: AssetRecord, dest: MoveDest): MoveConfirmFacts {
  const date = new Date().toISOString().slice(0, 10);
  return {
    title: dest === 'resort' ? 'Move to _resort?' : 'Move to _archive?',
    from: r.p,
    to: dest === 'resort' ? `_resort/${r.base}` : `_archive/${date}-explorer/${r.base}`,
    robloxWarning: r.roblox
      ? `This file is joined to the Roblox upload ledger (asset ${r.roblox.active.assetId}). ` +
        `Moving it will NOT update the ledger — the mapping orphans until _catalog/` +
        `roblox-upload-registry.jsonl's local_path is hand-edited, and after the rebuild this ` +
        `record will show as unregistered.`
      : null,
    destNote:
      dest === 'archive'
        ? 'Archived files leave the Explorer entirely on the next rebuild (the zone is skip-listed).'
        : 'The file stays visible in the Explorer, under _resort/.',
    rebuildNote: 'The registry rebuild takes a few seconds and reloads this page.',
    confirmLabel: dest === 'resort' ? 'Move to _resort' : 'Move to _archive',
  };
}

/** Archive always confirms; _resort confirms only when the Roblox ledger join is at stake. */
export function needsMoveConfirm(r: AssetRecord, dest: MoveDest): boolean {
  return dest === 'archive' || Boolean(r.roblox);
}

// ── The shared action runner ──────────────────────────────────────────────────────────
// Every non-move verb, keyed so the Toolbar and the kebab render from one table. Moves are NOT
// ActionIds — they thread through the explorer-level confirm flow (needsMoveConfirm → moveAsset).
export type ActionId =
  | 'copy-id'
  | 'copy-path'
  | 'copy-uri'
  | 'copy-reg-id'
  | 'reveal'
  | 'view-online'
  | 'view-dashboard';

export function actionEnabled(id: ActionId, r: AssetRecord): boolean {
  switch (id) {
    case 'copy-id':
      return assetIdOf(r) !== null;
    case 'copy-uri':
      return r.roblox?.checksum === 'match';
    case 'copy-reg-id':
      return Boolean(r.reg?.id);
    case 'view-online':
      return viewOnlineUrl(r) !== null;
    case 'view-dashboard':
      return creatorDashboardUrl(r) !== null;
    default:
      return true;
  }
}

export async function runAction(id: ActionId, r: AssetRecord, flash: (msg: string) => void): Promise<void> {
  switch (id) {
    case 'copy-id': {
      const info = assetIdOf(r);
      if (!info) return;
      const ok = await copyText(info.id);
      flash(
        !ok
          ? 'Copy failed'
          : info.source === 'csv'
            ? 'Name-matched id copied ✓'
            : info.checksum === 'match'
              ? 'Verified asset id copied ✓'
              : 'Asset id copied — bytes drifted since upload',
      );
      return;
    }
    case 'copy-path':
      flash((await copyText(r.p)) ? 'Path copied ✓' : 'Copy failed');
      return;
    case 'copy-uri':
      if (r.roblox) flash((await copyText(r.roblox.active.assetUri)) ? 'Roblox URI copied ✓' : 'Copy failed');
      return;
    case 'copy-reg-id':
      if (r.reg?.id) flash((await copyText(r.reg.id)) ? 'Name-matched ID copied ✓' : 'Copy failed');
      return;
    case 'reveal': {
      const how = await revealOrCopy(r.p, absPathOf(r));
      flash(how === 'revealed' ? 'Shown in Finder ✓' : 'No helper — path copied');
      return;
    }
    case 'view-online': {
      const url = viewOnlineUrl(r);
      if (url) window.open(url, '_blank', 'noopener');
      return;
    }
    case 'view-dashboard': {
      const url = creatorDashboardUrl(r);
      if (url) window.open(url, '_blank', 'noopener');
      return;
    }
  }
}
