# Ancient Alien Architecture Trim Sheet 01 — revision brief 02

## Start here, do not regenerate

Work from the `_ALPHA` set in `pbr-prototype/`, described by `alpha-map-manifest.json`.

**The artwork is good and is not the problem.** The obsidian pitting, the stepped chevron
molding, the iridium blade forms, the conduit — all of it stays. A from-scratch rebuild was
tested against this sheet and lost on art quality. Round 01's failures were all in the
*material data*, not the design.

`_BLK` is the original round-01 output, kept for reference. Do not edit or delete it.
`output/imagegen/` is gitignored, so neither set is recoverable from version control.

## What round 01 got wrong, and what is already fixed

Five defects were found. Four are corrected in `_ALPHA`; do not reintroduce them.

1. **Metal rows at impossible reflectance** — base colour was 36 sRGB on rows flagged
   metalness 242–252. Base colour *is* reflectance for a metal; real metals reflect 50–98%,
   i.e. sRGB 130–240. At 36 the rows rendered as a black void at every camera angle in Studio.
   Fixed: rows 04/05/06a now at 152 / 175 / 118.
2. **Albedo below the PBR floor** — median 32 sRGB, 93% of the sheet under 50. Fixed:
   dielectric median now 49.
3. **Baked ambient occlusion in the colour map** — luminance correlated −0.47 to −0.71 against
   surface cavity, so the engine's own shading was doubling up on pre-darkened crevices.
   Regressed out; worst row is now −0.24.
4. **Material bands misaligned with the artwork** — the contract was written after the art and
   was off by 75px, 69px and 20px on rows 01–03, splitting single features across two roughness
   and metalness values. The audit now reports there was *no art transition at all* within 40px
   of the claimed y256 and y448 boundaries. Fixed: re-cut to 336 / 512 / 592 / 800 / 928 / 976.
5. **Roughness carries no information** — still open. This is your job.

## The task

**Give roughness real surface data.** It currently varies by only 9% of scale within each row —
effectively a per-row constant with a whisper of relief. A flat material value would look the
same. Production roughness carries 20–40%, from:

- cavity dirt — recesses collect dust and read rougher
- edge wear — exposed bevels and high points get rubbed smoother
- broad blotchy variation so large flat areas aren't uniform
- fine grain at texel scale

Derive the masks from the existing art rather than inventing them: an AO bake and a curvature
pass against the `_ALPHA` normal map will give you cavity and convexity directly, which is how
the comparison sheet hit 19–48%.

Secondary, lower priority: the row-01 circuit-elbow motif is a recognisable landmark that
repeats visibly at 2× tiling. The Roblox trim-sheet guidance is explicit that shared rows should
"avoid contextual details that you can only apply to a single object." Either soften it or move
it to a separate overlay.

## Constraints

- 1024×1024, square. Tiles on **X only**.
- Normal map stays OpenGL tangent space (flat = 127,127,255). Roblox supports no other format.
- Metalness stays binary — nothing in the 77–178 middle.
- Row boundaries stay on multiples of 16 so bands sit on clean texel edges down to mip 4.
- Do not touch the normal map or the row boundaries. Those are correct now.
- Whatever you change, albedo must stay free of baked shading. Dirt that changes the *colour*
  of a surface is legitimate; darkening that encodes *light* is not. The gate is
  |corr(luminance, cavity)| < 0.30.

## The gate

```bash
python3 audit-trim-sheet.py pbr-prototype/alpha-map-manifest.json
```

Eleven checks, each with a numeric threshold. `_BLK` scores 6 pass / 5 fail. `_ALPHA` scores
10 pass / 1 fail — the one failure is the roughness gate above.

**Round 02 is done when the audit is 11/11 and the artwork is visually unchanged.**

Update the manifest's `row_contract` and `known_remaining_limitations` to match whatever you
ship, and write the result as `_BETA` alongside rather than overwriting `_ALPHA`.

## Verify in Studio, not just in the maps

The Studio test is what settled round 01, and the numbers alone would not have. Apply the set
via `SurfaceAppearance` on a MeshPart, or `MaterialVariant` on a plain Part for a quick look.

Two traps that cost time the first round:

- Set the part's `Color` to **white**. The default medium-grey tint multiplies the ColorMap down
  by a third and makes every variant look darker than it is.
- New uploads stream in over a minute or two, and the surface flickers between quality levels
  while they do. Check `ContentProvider:GetAssetFetchStatus` reports `Success` before judging
  anything.

`SurfaceAppearance` does expose `EmissiveMaskContent`, `EmissiveStrength` and `EmissiveTint` —
the round-01 manifest claimed otherwise and prescribed a Neon overlay. The slot takes a
greyscale mask, so the cyan conduit belongs in `EmissiveTint`, not in the map.
