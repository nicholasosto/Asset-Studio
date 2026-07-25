# Ancient Alien Vertical Service Trim 01

Status: `_BLK` visual blueprint  
Resolution: `1024 × 1024`  
Primary repeat axis: **Y**  
Atlas axis: **X selects a lane; the complete sheet is not intended to repeat on X**

This sheet is the vertical counterpart to Ancient Alien Architecture Trim Sheet 01. It
preserves the same material hierarchy:

- **Obsidian Anchor** — load-bearing mineral/ceramic structure
- **Iridium Petal** — protected contact edges and polished wear surfaces
- **Cyan conduit** — sparse power/data path
- **Black gasket** — pressure, movement, and material separation

## Lane contract

All boundaries land on multiples of 16. Keep at least 8px of inset from a lane boundary
when assigning UVs so filtering and lower mips do not sample a neighboring material.

| Lane | X range | Width | Role | Recommended use |
|---|---:|---:|---|---|
| 01 | 0–208 | 208px | Heavy Obsidian structural rib | Columns, buttresses, portal jambs, wall ribs |
| 02 | 208–320 | 112px | Protected Iridium edge rail | Door edges, machine contact faces, shaft rails |
| 03 | 320–432 | 112px | Recessed service channel | Utility trunks, maintenance channels, cable covers |
| 04 | 432–592 | 160px | Panel terminator / corner seam | Wall junctions, panel endings, inside/outside corner grammar |
| 05 | 592–704 | 112px | Cyan power/data spine | Powered jambs, access-state indicators, machinery interfaces |
| 06 | 704–816 | 112px | Pressure gasket / expansion joint | Moving seams, pressure doors, floor-to-wall movement joints |
| 07 | 816–1024 | 208px | Neutral Obsidian attachment jamb | Portals, elevators, equipment sockets, general vertical finish |

## UV behavior

- Repeat V continuously for tall structures.
- Select one lane in U; do not tile the full 0–1 U range across a surface.
- Prefer a lane-safe inset of 8–12px.
- For mirrored jamb pairs, mirror geometry or UVs rather than placing a unique landmark in
  the shared sheet.
- Keep damage, repair patches, diagnostic symbols, and faction markings on separate decals
  or overlays.

## PBR handoff

This image is a visual design blueprint, not an upload-ready `SurfaceAppearance` set.

- **Color:** neutralize generated relief lighting and preserve physical reflectance.
- **Normal:** OpenGL tangent space; flat is `(127, 127, 255)`.
- **Roughness:** derive cavity dirt, convex edge wear, broad variation, and fine grain from
  authored surface data rather than using lane constants.
- **Metalness:** remain binary; Obsidian and gasket are dielectric, Iridium is metallic.
- **Emissive:** use a grayscale mask for lane 05; carry cyan through `EmissiveTint`.
- **All maps:** match the Y repeat and the lane boundaries in this contract.

## Generation constraints

- Flat orthographic atlas; no room, wall, or perspective presentation.
- No text, logos, symbols, narrative damage, or one-off diagnostic landmarks.
- Restrained cyan and restrained metal brightness.
- Material family matches the horizontal BETA sheet and portal frame/iris study.

