# Trembus Image Metadata Standard

Use this standard for saved project-bound raster assets on macOS. Keep it intentionally small so it stays consistent.

## Filename ownership

Saved project-bound Trembus assets use the active project's asset conventions. This metadata standard does not define project filenames.

For `~/Master-Managed/Assets/`, invoke `roblox-dev:asset-conventions`. It owns the current
production zones, UI prefix vocabularies, `_inbox/` fallback, `_BLK` default, `_FNL` promotion
gate, and any registration work. Do not copy those tables into this metadata reference.

Standalone fallback only:
- If no project convention exists and the user still wants a saved standalone Trembus asset, derive the basename through `scripts/derive_asset_filename.py`.
- Fallback contract: `<preset>-<style>-<subject>.<ext>`
- Sidecars keep the same basename as the image, whatever convention produced that basename.

## Sidecar metadata

For VFX-oriented assets, Trembus can also write sidecar files next to the image:
- `<asset-name>.trembus.json`
- `<asset-name>.trembus.md`

These are most useful for:
- `particle-flipbook-texture`
- `beam-strip-texture`

The sidecars can include recommended Roblox configuration values and usage notes in addition to the normal xattrs and Finder comment.

## Custom xattrs

Write exactly these keys:
- `com.trembus.asset-preset`
- `com.trembus.style-pack`
- `com.trembus.transparent`
- `com.trembus.aspect-ratio`

Value guidance:
- `asset-preset`: preset slug such as `menu-icon`, `badge-emblem`, `transparent-cutout`
- `style-pack`: resolved style slug such as `general`, `clean-sci-fi`, `default-house`, `painted-fantasy`, `robloxify`
- `transparent`: `true` or `false`
- `aspect-ratio`: `square`, `portrait`, `wide`, or `custom`

## Naming conventions

Write metadata values as lowercase kebab-case slugs.

Rules:
- Presets must use the canonical Trembus preset slug such as `menu-icon` or `portrait-bust`
- Named style packs must use the canonical style slug such as `clean-sci-fi` or `heroic-ornate`
- Freeform style text should be normalized into a stable `custom-...` kebab-case slug
- Metadata helper also uses `general` when no named or freeform style text is present
- Write metadata through `scripts/write_asset_metadata.py` instead of hand-writing xattrs so metadata stays consistent
- Let `write_asset_metadata.py` write VFX sidecars so the JSON and Markdown schemas stay consistent

## Finder comment

Write a short, standardized comment:

```text
trembus; preset=<preset>; style=<style>; transparent=<yes|no>; aspect=<aspect>
```

Examples:
- `trembus; preset=menu-icon; style=clean-sci-fi; transparent=yes; aspect=square`
- `trembus; preset=portrait-bust; style=cozy-flat; transparent=no; aspect=portrait`

Rules:
- Keep the field order fixed: `preset`, `style`, `transparent`, `aspect`
- Use `yes` or `no` in Finder comments, not `true` or `false`
- Do not store prompts, personal notes, or long descriptions in Finder comments
- Skip metadata for preview-only outputs unless the user asks for it

## Default mappings

The helper derives these defaults automatically when the user does not explicitly override them:
- `icon`, `menu-icon`, `badge-emblem`, `map-marker`, `tab-icon`, `status-effect-icon`: `transparent=true`, `aspect-ratio=square`
- `tileable-part-texture`: `transparent=false`, `aspect-ratio=square`
- `particle-flipbook-texture`: `transparent=true`, `aspect-ratio=square`
- `beam-strip-texture`: `transparent=true`, `aspect-ratio=wide`
- `transparent-cutout`: `transparent=true`, `aspect-ratio=custom` unless framing is clearly square
- `portrait-bust`: `transparent=false`, `aspect-ratio=portrait`
- `item-card-art`: `transparent=false`, `aspect-ratio=portrait` unless the user requested square
- `journal-illustration`: `transparent=false`, `aspect-ratio=custom`
- `banner-key-art`: `transparent=false`, `aspect-ratio=wide`
- `raster-default`: infer from the explicit request

Use overrides only when the saved asset intentionally differs from the preset default. Examples:
- a square `item-card-art`
- a transparent `portrait-bust`
- a non-transparent `menu-icon` created for a fixed backing plate

## VFX sidecar behavior

The metadata helper supports:
- `--sidecar auto`
- `--sidecar none`
- `--sidecar json`
- `--sidecar md`
- `--sidecar both`

Rules:
- `auto` writes both JSON and Markdown sidecars for `particle-flipbook-texture` and `beam-strip-texture`
- `auto` writes no sidecar for other preset types
- use `both` if you want explicit JSON plus human-readable Markdown

The sidecar JSON includes:
- normalized Trembus metadata
- the Roblox target class
- the relevant texture property
- Trembus starting configuration values
- usage notes

The sidecar Markdown includes the same information in a readable checklist format.
