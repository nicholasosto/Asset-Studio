import { execFile, spawn } from 'node:child_process';
import { createReadStream, existsSync, mkdirSync, realpathSync, renameSync, statSync } from 'node:fs';
import type { ServerResponse } from 'node:http';
import { basename, dirname, extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../..'); // the Asset-Studio repo root (holds previews/ and _project/)

// The shared library REALPATH (through external-locations/assets) + the baked-thumb cache — the two
// trees the dev live-assets middleware streams from. Resolved once; falls back to the un-real path if
// the symlink is missing so config load never throws.
const ASSETS_ROOT_REAL = (() => {
  try { return realpathSync(resolve(REPO_ROOT, 'external-locations/assets')); }
  catch { return resolve(REPO_ROOT, 'external-locations/assets'); }
})();
const THUMBS_DIR = resolve(REPO_ROOT, 'previews/thumbs');

// Content-Type by extension for the streamed assets (images · audio · glTF + its .bin/textures).
const MIME: Record<string, string> = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', svg: 'image/svg+xml',
  mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', flac: 'audio/flac', m4a: 'audio/mp4',
  gltf: 'model/gltf+json', glb: 'model/gltf-binary', bin: 'application/octet-stream',
  json: 'application/json', txt: 'text/plain',
};

// Honor a harness-assigned port (PORT env, set when launch.json runs with autoPort) so the
// server never collides with another chat's instance; fall back to 5175 for manual runs.
const PORT = Number(process.env.PORT) || 5175;

// ── P4 · Live reload (dev only) ───────────────────────────────────────────────────────
// The app imports the emitted contract JSON statically (src/contract.ts), so Vite's dev
// server already reloads the page whenever previews/dashboards/*.json changes. The missing
// half is regenerating that JSON from its `_project/` markdown source. This plugin watches
// `_project/**.md` and re-runs the zero-dep render-hub generator (as a subprocess, so the
// framework-core seam stays intact — exactly a human `node tools/render-hub.mjs`) on each
// edit; Vite then sees the rewritten JSON and repaints. `apply: 'serve'` scopes it to
// `vite dev` only, so `vite build` / `vite preview` keep reading the committed JSON — the
// committed contract stays the source the static build reads (roadmap command-center P4).
function liveContract(): Plugin {
  // Watch `_project/`, the project config, and the vendored base schema — the hub chrome
  // derives from all three — and regenerate the contract on any edit.
  const WATCH_PATHS = [
    resolve(REPO_ROOT, '_project'),
    resolve(REPO_ROOT, 'project-system.config.json'),
    resolve(REPO_ROOT, '.project-system/schema'),
  ];
  // Asset-Studio is a single consumer; regenerate its contract straight from the vendored
  // zero-dep render-hub (no render-all multiplexer). The spawn sets cwd = REPO_ROOT, so
  // render-hub finds project-system.config.json + _project/ and writes
  // previews/dashboards/asset-studio-*.json — exactly a human `node .project-system/tools/render-hub.mjs`.
  const GENERATOR = resolve(REPO_ROOT, '.project-system/tools/render-hub.mjs');
  return {
    name: 'project-system:live-contract',
    apply: 'serve',
    configureServer(server) {
      const log = (msg: string) => server.config.logger.info(`[live-contract] ${msg}`, { timestamp: true });
      let debounce: ReturnType<typeof setTimeout> | null = null;
      let running = false; // a generator subprocess is in flight
      let pending = false; // an edit arrived mid-run; coalesce into one re-run after it
      // chokidar replays an `add` for every existing file when we start watching a populated
      // tree; swallow that initial burst so merely starting the dev server doesn't regenerate.
      let warm = false;
      setTimeout(() => { warm = true; }, 400);

      const regenerate = () => {
        if (running) { pending = true; return; }
        running = true;
        let stderr = '';
        const child = spawn(process.execPath, [GENERATOR], { cwd: REPO_ROOT });
        child.stderr?.on('data', (d) => { stderr += d; });
        child.on('error', (e) => { running = false; log(`could not run render-hub — ${e.message}`); });
        child.on('close', (code) => {
          running = false;
          if (code === 0) log('contract regenerated from _project/ → reloading');
          else log(`render-hub exited ${code}${stderr ? `\n${stderr.trim()}` : ''}`);
          if (pending) { pending = false; regenerate(); }
        });
      };

      const onChange = (file: string) => {
        // Triggers: any `_project/` markdown (the dogfood's or a consumer's under examples/), any
        // project-system.config.json (kinds/enums/sections — the Field Guide + hub derive from it),
        // or any schema/*.json (the base contract the guide's concept nodes derive from).
        const isProjectMd = file.endsWith('.md') && file.includes('/_project/');
        const isConfig = file.endsWith('project-system.config.json');
        const isSchema = file.endsWith('.json') && file.includes('/schema/');
        if (!warm || !(isProjectMd || isConfig || isSchema)) return;
        if (debounce) clearTimeout(debounce);
        debounce = setTimeout(regenerate, 120);
      };

      for (const path of WATCH_PATHS) server.watcher.add(path);
      for (const ev of ['add', 'change', 'unlink'] as const) server.watcher.on(ev, onChange);
      log('watching _project/ + project-system.config.json + .project-system/schema/ — edits regenerate the contract');
    },
  };
}

// ── Served media + reveal (dev only) ──────────────────────────────────────────────────
// The Asset Explorer needs the shared library + baked thumbnails as HTTP URLs, and a
// reveal-in-Finder affordance. This dev-only plugin (apply:'serve') mirrors the static
// :4317 site with ZERO app-side branching: it intercepts the SAME two absolute prefixes the
// static python server maps from previews/ — GET /_assets/<encoded p> (the shared library,
// streamed from its realpath) and GET /thumbs/<name> (previews/thumbs) — plus POST /api/reveal
// which `open -R`s the asset, HARD allow-listed to the Assets root (realpath containment; the
// client sends only the library-relative p, so no caller can name a path outside the library).
// On the static site there is no /api/reveal route, so the client degrades to copy-abs-path.
// Streaming from the realpath sidesteps Vite's fs/symlink policy — no server.fs.allow change.
// See decisions serve-the-shared-asset-library-to-the-spa + reveal-in-finder-and-copy-asset-id-from-the-explorer.
function liveAssets(): Plugin {
  const within = (root: string, abs: string): boolean => abs === root || abs.startsWith(root + sep);

  const serveFrom = (root: string, rel: string, res: ServerResponse): void => {
    // Resolve BOTH the root and the target through realpath, then contain — so a symlink INSIDE the
    // tree can't escape it (a lexical `normalize` can't see through links; the /api/reveal guard
    // already realpaths, this makes the read path symmetric). Realpathing both consistently also
    // keeps macOS firmlinks (/Users ↔ /System/Volumes/Data) from causing false 403s.
    let rootReal: string;
    let abs: string;
    try { rootReal = realpathSync(root); } catch { res.statusCode = 404; res.end('not found'); return; }
    try { abs = realpathSync(normalize(join(root, rel))); } catch { res.statusCode = 404; res.end('not found'); return; }
    if (!within(rootReal, abs)) { res.statusCode = 403; res.end('forbidden'); return; }
    let st;
    try { st = statSync(abs); } catch { res.statusCode = 404; res.end('not found'); return; }
    if (!st.isFile()) { res.statusCode = 404; res.end('not found'); return; }
    res.setHeader('Content-Type', MIME[extname(abs).slice(1).toLowerCase()] ?? 'application/octet-stream');
    res.setHeader('Content-Length', String(st.size));
    res.setHeader('Cache-Control', 'no-cache');
    createReadStream(abs).on('error', () => { if (!res.headersSent) res.statusCode = 500; res.end(); }).pipe(res);
  };

  return {
    name: 'asset-studio:live-assets',
    apply: 'serve',
    configureServer(server) {
      const log = (msg: string) => server.config.logger.info(`[live-assets] ${msg}`, { timestamp: true });

      // Rebuild the asset registry after a successful /api/move — the same single-flight
      // subprocess shape as liveContract's render-hub runner: rapid moves coalesce into ONE
      // trailing rebuild instead of two concurrent scanners racing the thumb prune. The rewritten
      // asset-registry.json then hits the app's static import and Vite full-reloads the page.
      // Default thumbs (no --no-thumbs): a moved image needs its new path-hash bake.
      const REBUILDER = resolve(REPO_ROOT, 'tools/build-asset-registry.mjs');
      let rebuilding = false;
      let rebuildPending = false;
      const rebuildRegistry = () => {
        if (rebuilding) { rebuildPending = true; return; }
        rebuilding = true;
        let stderr = '';
        const child = spawn(process.execPath, [REBUILDER], { cwd: REPO_ROOT });
        child.stderr?.on('data', (d) => { stderr += d; });
        child.on('error', (e) => { rebuilding = false; log(`could not run build-asset-registry — ${e.message}`); });
        child.on('close', (code) => {
          rebuilding = false;
          if (code === 0) log('asset registry rebuilt after move → reloading');
          else log(`build-asset-registry exited ${code}${stderr ? `\n${stderr.trim()}` : ''}`);
          if (rebuildPending) { rebuildPending = false; rebuildRegistry(); }
        });
      };

      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? '').split('?')[0];

        if (req.method === 'GET' && url.startsWith('/_assets/')) {
          // decodeURIComponent throws URIError on malformed escapes (e.g. `/_assets/%`, `%zz`); catch
          // it → 400 so a bad URL can't surface a connect 500 with the config path in its body (and so
          // dev matches the static python server, which just 404s). App URLs are always well-formed.
          let rel: string;
          try { rel = url.slice('/_assets/'.length).split('/').map(decodeURIComponent).join('/'); }
          catch { res.statusCode = 400; res.end('bad request'); return; }
          return serveFrom(ASSETS_ROOT_REAL, rel, res);
        }
        if (req.method === 'GET' && url.startsWith('/thumbs/')) {
          let rel: string;
          try { rel = decodeURIComponent(url.slice('/thumbs/'.length)); }
          catch { res.statusCode = 400; res.end('bad request'); return; }
          return serveFrom(THUMBS_DIR, rel, res);
        }
        if (url === '/api/reveal') {
          if (req.method !== 'POST') { res.statusCode = 405; res.end('method not allowed'); return; }
          // Reveal changes desktop state and is reachable as a no-preflight "simple request" —
          // without an Origin check, any web page open in the same browser could CSRF Finder
          // windows open. Same-origin fetches carry a localhost Origin; curl/tools send none.
          const origin = req.headers.origin;
          if (origin) {
            let originHost: string | null = null;
            try { originHost = new URL(origin).hostname; } catch { /* malformed → reject */ }
            if (originHost !== 'localhost' && originHost !== '127.0.0.1') { res.statusCode = 403; res.end('forbidden'); return; }
          }
          const fail = (code: number, error: string) => { res.statusCode = code; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ ok: false, error })); };
          const chunks: Buffer[] = [];
          let received = 0;
          let aborted = false;
          req.on('data', (c: Buffer) => {
            if (aborted) return;
            chunks.push(c);
            received += c.length;
            if (received > 4096) { aborted = true; fail(413, 'too large'); req.destroy(); }
          });
          req.on('end', () => {
            if (aborted) return;
            // Decode ONCE over the concatenated buffer — per-chunk string coercion corrupts a
            // multi-byte UTF-8 character split across chunk boundaries into U+FFFD.
            const body = Buffer.concat(chunks).toString('utf8');
            let rel: string;
            try { rel = String((JSON.parse(body || '{}') as { path?: unknown }).path ?? ''); }
            catch { return fail(400, 'bad json'); }
            if (!rel || rel.includes('\0')) return fail(400, 'bad path');
            // Client sends the library-relative p; strip any link prefix / leading slashes, then
            // resolve UNDER the Assets root the server owns (least authority — no absolute caller path).
            rel = rel.replace(/^external-locations\/assets\//, '').replace(/^\/+/, '');
            // Re-resolve the root PER REQUEST (like serveFrom does): the module-load
            // ASSETS_ROOT_REAL falls back to the un-real path when the symlink is missing at
            // config load, which would 403 every reveal until a server restart.
            let assetsRoot: string;
            try { assetsRoot = realpathSync(resolve(REPO_ROOT, 'external-locations/assets')); }
            catch { return fail(404, 'assets root missing'); }
            let abs: string;
            try { abs = realpathSync(join(assetsRoot, rel)); }
            catch { return fail(404, 'not found'); }
            if (!within(assetsRoot, abs)) return fail(403, 'forbidden');
            execFile('open', ['-R', abs], { timeout: 5000 }, (err) => {
              if (err) return fail(500, 'reveal failed');
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true }));
            });
          });
          return;
        }
        // Move an asset into a triage zone (ADR 0011). Same threat model as /api/reveal but a
        // MUTATION, so every guard is kept and tightened: `dest` is a server-owned enum (never a
        // caller path — a free-form destination would be an arbitrary-write primitive over the
        // library), the destination is built from the source's basename (traversal-proof by
        // construction; containment re-checked anyway), and collisions abort with 409 exactly like
        // migrate-assets-library.mjs — no silent suffixing in a non-git tree. The Roblox upload
        // ledger is deliberately NOT rewritten (warn-don't-write): moving a joined file orphans
        // its mapping until _catalog/roblox-upload-registry.jsonl is hand-edited.
        if (url === '/api/move') {
          if (req.method !== 'POST') { res.statusCode = 405; res.end('method not allowed'); return; }
          // Origin/CSRF gate — a move is reachable as a no-preflight "simple request" and mutates
          // the shared library; only same-machine browser origins (or Origin-less tools) may call.
          const origin = req.headers.origin;
          if (origin) {
            let originHost: string | null = null;
            try { originHost = new URL(origin).hostname; } catch { /* malformed → reject */ }
            if (originHost !== 'localhost' && originHost !== '127.0.0.1') { res.statusCode = 403; res.end('forbidden'); return; }
          }
          const fail = (code: number, error: string) => { res.statusCode = code; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ ok: false, error })); };
          const chunks: Buffer[] = [];
          let received = 0;
          let aborted = false;
          req.on('data', (c: Buffer) => {
            if (aborted) return;
            chunks.push(c);
            received += c.length;
            if (received > 4096) { aborted = true; fail(413, 'too large'); req.destroy(); }
          });
          req.on('end', () => {
            if (aborted) return;
            const body = Buffer.concat(chunks).toString('utf8');
            let rel: string;
            let dest: string;
            try {
              const parsed = JSON.parse(body || '{}') as { path?: unknown; dest?: unknown };
              rel = String(parsed.path ?? '');
              dest = String(parsed.dest ?? '');
            } catch { return fail(400, 'bad json'); }
            if (!rel || rel.includes('\0')) return fail(400, 'bad path');
            if (dest !== 'resort' && dest !== 'archive') return fail(400, 'bad dest');
            rel = rel.replace(/^external-locations\/assets\//, '').replace(/^\/+/, '');
            let assetsRoot: string;
            try { assetsRoot = realpathSync(resolve(REPO_ROOT, 'external-locations/assets')); }
            catch { return fail(404, 'assets root missing'); }
            let absSrc: string;
            try { absSrc = realpathSync(join(assetsRoot, rel)); }
            catch { return fail(404, 'not found'); }
            if (!within(assetsRoot, absSrc)) return fail(403, 'forbidden');
            let srcStat;
            try { srcStat = statSync(absSrc); } catch { return fail(404, 'not found'); }
            if (!srcStat.isFile()) return fail(400, 'not a file');
            // Destination: flat _resort/ (a triage pen) or a dated _archive/ retirement folder,
            // matching the zones' existing on-disk conventions.
            const destRel = dest === 'resort'
              ? `_resort/${basename(absSrc)}`
              : `_archive/${new Date().toISOString().slice(0, 10)}-explorer/${basename(absSrc)}`;
            const absDest = join(assetsRoot, destRel);
            if (existsSync(absDest)) return fail(409, 'destination exists');
            try {
              mkdirSync(dirname(absDest), { recursive: true });
              // Re-contain the REAL destination parent — guards a hostile symlink pre-planted
              // at _resort/ or _archive/ redirecting the write outside the library.
              const parentReal = realpathSync(dirname(absDest));
              if (!within(assetsRoot, parentReal)) return fail(403, 'forbidden');
              renameSync(absSrc, absDest); // same-volume tree; EXDEV out of scope for this dev tool
            } catch { return fail(500, 'move failed'); }
            log(`moved ${rel} → ${destRel}`);
            // Respond BEFORE the rebuild: the rewritten registry JSON triggers a full page
            // reload, and answering first gives the client the whole rebuild window to show
            // "Moved — rebuilding…" and close its inspector gracefully.
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true, from: rel, to: destRel, rebuild: 'started' }));
            rebuildRegistry();
          });
          return;
        }
        next();
      });
    },
  };
}

// The Trembus packages (@trembus/ui · @trembus/viz · their transitive @trembus/tokens) are
// installed from the npm registry — no aliases needed. `dedupe` still pins a single React
// instance so a dependency can't pull a second copy (the null-dispatcher useState crash).
export default defineConfig({
  // Relative base so the built bundle serves from a subfolder (previews/app/) under the static
  // previews site — every asset/chunk URL resolves relative to index.html, mount-point-agnostic.
  base: './',
  plugins: [react(), liveContract(), liveAssets()],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  server: {
    port: PORT,
    // Allow the dev server to read the emitted contract in REPO_ROOT/previews (outside the app root).
    fs: { allow: [REPO_ROOT] },
  },
  preview: { port: PORT },
  // Build the self-contained SPA straight into the previews site (previews/app/) so a plain
  // `pnpm build` refreshes the launchable static bundle the :4317 server serves. outDir is
  // outside the app root, so emptyOutDir must be explicit.
  build: { target: 'es2022', outDir: resolve(REPO_ROOT, 'previews/app'), emptyOutDir: true },
});
