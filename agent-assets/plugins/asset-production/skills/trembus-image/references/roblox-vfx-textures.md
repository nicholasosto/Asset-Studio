# Roblox VFX Texture Notes

Use this reference for Roblox `ParticleEmitter` and `Beam` texture requests.

## ParticleEmitter textures

- `ParticleEmitter.Texture` uses an uploaded image asset, typically best as transparent PNG.
- For animated particles, Roblox supports flipbooks through `FlipbookLayout`.
- Supported built-in layouts are `2x2`, `4x4`, `8x8`, plus `Custom`.
- Include transparent spacing between frames to reduce filtering bleed.
- Keep frame silhouettes readable at small sizes.
- Flipbooks can be memory-heavy on lower-end devices, so do not assume huge sheets are always best.

## Beam textures

- `Beam.Texture` is an uploaded image asset used as a strip along the beam.
- Think of it as a horizontal strip that repeats or scrolls, not a full framed image.
- `TextureMode`, `TextureLength`, and `TextureSpeed` determine how the strip repeats and scrolls in Roblox.
- Design the strip to loop cleanly on the left and right edges if it will repeat or scroll.
- Use alpha to shape the top and bottom edge of the beam.

## Trembus generation defaults

Particle flipbook defaults:
- transparent PNG
- square sheet by default
- frame-safe spacing
- no decorative outer border
- readable frame progression
- sidecar metadata can include recommended `ParticleEmitter` property values

Beam strip defaults:
- transparent PNG
- wide horizontal strip by default
- repeat-safe horizontal flow
- alpha-shaped beam profile
- no one-off centered icon unless explicitly requested
- sidecar metadata can include recommended `Beam` property values

## Sidecar recommendations

When saving Trembus VFX assets, use:

```bash
python3 scripts/write_asset_metadata.py <path> --preset particle-flipbook-texture --style <style> --sidecar both
python3 scripts/write_asset_metadata.py <path> --preset beam-strip-texture --style <style> --sidecar both
```

With `--sidecar auto`, Trembus will write both JSON and Markdown sidecars automatically for these two presets.
