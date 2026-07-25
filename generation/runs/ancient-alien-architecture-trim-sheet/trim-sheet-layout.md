# Ancient Alien Architecture Trim Sheet 01

Canvas: `1024 x 1024`

Tiling axis: horizontal (`X`)

Purpose: shared UV trim vocabulary for wall modules, windows, doors, passageways, portal frames, and mechanical iris blades.

## Row allocation

| Row | Pixel range | Height | Surface treatment | Intended use |
|---|---:|---:|---|---|
| 01 | `0-255` | 256 px | Obsidian Anchor field | Wide frame faces, wall borders, structural surrounds |
| 02 | `256-447` | 192 px | Stepped obsidian cap | Portal rings, window surrounds, upper/lower architectural trim |
| 03 | `448-575` | 128 px | Recessed obsidian groove | Inset rails, shallow channels, frame separators |
| 04 | `576-799` | 224 px | Iridium Petal face | Iris blades, moving door leaves, precision mechanical panels |
| 05 | `800-927` | 128 px | Polished iridium contact rail | Blade edges, tracks, lock rails, high-contact borders |
| 06A | `928-975` | 48 px | Cyan conduit | Functional energy/status illumination |
| 06B | `976-1023` | 48 px | Light-absorbing gasket | Blade separation, deep recesses, mechanical throat trim |

## Map contract

- Color: lighting-neutral base color; no baked highlights or shadows.
- Normal: coarse mineral pits on obsidian; fine brushing and contact scoring on iridium.
- Roughness: high for Obsidian Anchor; medium for Iridium Petal; lower only on polished contact rails.
- Metalness: nonmetallic obsidian faces; metallic iridium rows and exposed structural edges.
- Emissive: black except for the Row 06A conduit pattern and sparse functional indicators.

## UV and padding rules

- Reserve at least 4 pixels of vertically dilated padding inside every row boundary before mip generation.
- Every row must join seamlessly at the left and right image edges.
- Keep unique damage, stains, symbols, and hero wear out of the shared sheet; add them through separate overlays.
- Moving iris-blade meshes remain separate for animation but share the same trim sheet and map set.
- Treat the generated PNG as a visual blueprint, not as the final PBR map set.
