---
title: "Bring the Asset Explorer to preview parity (CF-1)"
status: completed
updated: 2026-07-01
links:
  - { rel: references, target: roadmap/migrate-asset-explorer-into-the-command-center }
---

# Bring the Asset Explorer to preview parity (CF-1)

> **Status:** completed (2026-07-01)

## Goal

Close carry-forward **CF-1** — the Phase-5 blocker on [[migrate-asset-explorer-into-the-command-center]]:
make the migrated Explorer render the real previews + affordances the to-be-retired Soul-Steel
`asset-explorer.html` (roadmap p5) has — image thumbnails + full image, audio playback, 3D preview, open-in-folder,
and copy-asset-id — verified live on both the dev server and the static site.

## Success Criteria

- Real image thumbnails in tiles; full-size image + audio player + glb/gltf turntable in the inspector.
- Open-in-folder (reveal in Finder) with a graceful copy-absolute-path fallback; copy asset id/path.
- Works identically on dev (`:5175`) and the static `:4317` site; **0 console errors**.
- Contract + SPA rebuilt (two-step); ADRs recorded; roadmap Phase 5 unblocked.

## Source References

- Roadmap: [[migrate-asset-explorer-into-the-command-center]] (Phase 5 / CF-1)
- Original to match (read-only): `Roblox-Development/Soul-Steel-Official/tools/build-asset-explorer.mjs`
- App: `apps/command-center/src/AssetExplorer.tsx`, `src/registry.ts`, `vite.config.ts`; tool:
  `tools/build-asset-registry.mjs`; [[asset-registry-pipeline]] · [[command-center-consumes-tcl]]

## Decisions

- **Serve via two absolute prefixes `/_assets` + `/thumbs`** — dev middleware + committed
  `previews/_assets` symlink; identical on both mounts ([[0004-serve-the-shared-asset-library-to-the-command-center-spa]]).
- **Bake owned 144px thumbnails with `sips`** into a committed `previews/thumbs/`, fail-soft +
  **always-rebake** (deliberately non-incremental — the name hashes the *path*, so an mtime skip would keep
  stale thumbs; per the ADR), `--no-thumbs` escape ([[0005-bake-asset-studio-owned-image-thumbnails-in-the-registry-bui]]).
- **Reveal via a dev-only `POST /api/reveal`** (Assets-root realpath-guarded `open -R`) with copy-abs
  fallback on static; copy `p` / `rbxassetid://reg.id` ([[0006-reveal-in-finder-and-copy-asset-id-from-the-explorer]]).
- **No TCL change needed.** `MediaFrame` already picks the surface from `src`/`poster`; the app just wires
  them. **AudioWaveform is used directly** in the inspector (the `MediaFrame` audio surface is a `compact`
  no-transport placeholder) — waking the "dormant" player noted in the brief.
- **Approach designed by a 4-agent verification workflow** (each empirically tested its riskiest claim —
  python symlink-serving, `sips`, `open -R`, the containment guard) → one synthesized plan.

## Outputs

- `tools/build-asset-registry.mjs` — `buildThumbs()` (362 made / 0 failed, ~9.3 MB), `ensureAssetsLink()`,
  a served `src` per real medium, `assetsRootAbs`, `--no-thumbs`; `--print-json` kept side-effect-free.
- `previews/_assets` (committed symlink → library) + `previews/thumbs/` (362 committed PNGs).
- `apps/command-center/vite.config.ts` — `liveAssets()` plugin: `/_assets`, `/thumbs`, `POST /api/reveal`.
- `apps/command-center/src/registry.ts` — `assetUrl`/`thumbUrl`/`assetsRootAbs`/`absPathOf` + `src` type.
- `apps/command-center/src/AssetExplorer.tsx` — `toFrameData(r,{full})` (tile=thumb, inspector=full/audio/3D),
  `AudioWaveform` player, inspector reveal/copy action row (replacing the disabled ghost button),
  `copyText`/`revealOrCopy` helpers; orphan `.cc-explorer__disabledwrap` CSS removed.
- ADRs [[0004-serve-the-shared-asset-library-to-the-command-center-spa]],
  [[0005-bake-asset-studio-owned-image-thumbnails-in-the-registry-bui]],
  [[0006-reveal-in-finder-and-copy-asset-id-from-the-explorer]]; roadmap Phase 5 unblocked.
- **Verified live** — dev (`:5175`): image tiles load `/thumbs/` only (no full-image storm), full image
  (`naturalWidth 1536`), glTF turntable (`Arc_Turret_V1`, model loaded), audio plays (waveform decoded,
  0:32/2:14), reveal → "Shown in Finder ✓", traversal guard 403 (literal + `%2e%2e`). Static (python,
  committed symlink + thumbs, no middleware): thumbs + full media + turntable render, `/api/reveal` → 501 →
  copy fallback. **0 console errors, 0 failed requests** on both.

## Blockers

- **Copy-to-clipboard is unverifiable in the headless preview** (clipboard permission-sandboxed;
  `readText` → `NotAllowedError`). Code is standard + ported from the working original + shares the helper
  with the verified reveal-fallback; real users on localhost (a secure context) get a working copy.
- **`reg`/"Copy id" was data-gated AND key-bugged.** The master asset-id CSV keys on Roblox-catalog upload
  names (8/193 populated). *Corrected 2026-07-01 (deep review):* 2 of those rows DO match local files — a
  `"Collection: "` display prefix in the join key hid them (0/769). `joinRegistry` now strips it → 2/769
  `reg`, and "Copy id" surfaces for those records. Primary copyable id is `p`.

## Next Action

Execute roadmap **Phase 5** (retire the Soul-Steel source) — **pending explicit owner confirmation** for the
cross-repo write: add a deprecation banner + cross-link to `Roblox-Development/Soul-Steel-Official/tools/build-asset-explorer.mjs`
(the HTML is generated, so the banner lives in the generator, not the output).

## Handoff Notes

- Two-step regen holds: `node tools/build-asset-registry.mjs` (JSON + thumbs + symlink), then
  `pnpm --dir apps/command-center build` (SPA → `previews/app/`). See [[dashboard-regen-is-two-steps]].
- `previews/thumbs/` (362 PNGs) and the `previews/_assets` symlink are **committed** — a clean checkout
  serves media on the static site without first running the scanner (target is machine-scoped by
  [[0001-reference-the-shared-asset-library-via-external-locations]]).
- 3D turntable only lights up for **glb/gltf** (2 records); the other 77 3D exts (rbxm/fbx/blend/obj/ma)
  correctly glyph — model-viewer can't load them. A future 3D poster-bake would improve those tiles.
- No `@trembus/*` changes were needed or made; the sibling repo is untouched.
