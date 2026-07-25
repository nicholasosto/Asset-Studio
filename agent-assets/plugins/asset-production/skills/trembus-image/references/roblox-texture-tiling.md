# Roblox Texture Tiling Notes

Use this reference when the request is for a repeatable texture on Roblox parts.

## Platform behavior

- Use a `Texture` for tiling on a part face. A `Texture` repeats horizontally and vertically across the surface.
- Do not treat a repeatable tiled surface as a `Decal` request. A `Decal` stretches to fit the face instead of tiling.
- On `Texture`, tiling scale is controlled by `StudsPerTileU` and `StudsPerTileV`.
- On `Texture`, tile position can be adjusted with `OffsetStudsU` and `OffsetStudsV`.

## Import specs

Roblox supports separately uploaded textures as:
- `.png`
- `.jpg`
- `.tga`
- `.bmp`

Resolution support goes up to `4096x4096`.

General Roblox guidance:
- around `256x256` for smaller `5x5` stud objects
- around `512x512` for medium `10x10` stud objects
- around `1024x1024` for larger `20x20` stud objects

## Generation guidance

These are Trembus generation defaults derived from the platform behavior above:
- Prefer a square output unless the user explicitly needs a different ratio
- Design the image to wrap cleanly on all four edges
- Avoid perspective views, scene framing, or one-off centered subjects
- Avoid baked cast shadows or strong directional lighting that will reveal seams
- Keep the whole frame occupied by the material or pattern sample
- Use variation that survives repetition without obvious grid seams

## Prompt implications

For a Roblox tileable surface request, describe it as:
- a seamless texture
- intended for a Roblox `Texture`, not a `Decal`
- square PNG by default
- flat material sample
- repeatable on all edges
