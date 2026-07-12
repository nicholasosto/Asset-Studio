# Generation batch — ACTIVE

> One rolling file. This batch is owned by the `roblox-textured-ui-reference-kit` composite run.
> Codex generates into staging, then the composite's run lead performs the declared technical
> review and `_BLK` filing. The standing operator-trigger stop rule in `AGENTS.md` still applies
> when the operator explicitly says `Run generation batch <id>`; this approved composite run is
> proceeding under its pipeline acceptance boundary instead.

- **Batch id:** `roblox-textured-ui-reference-kit`
- **Pipeline:** `_project/pipeline/roblox-textured-ui-reference-kit.md` (step `generate-art`)
- **Visual direction:** game-agnostic brushed graphite · cool cyan · restrained industrial UI
- **Composition reference:** none — exact geometry is encoded textually per asset
- **Candidates:** 1 per variant → 3 images total; rerun only a failed variant
- **Requested generation size:** 1024×1024 opaque PNG
- **Built-in generator output:** 1254×1254 opaque PNG (recorded deviation; runtime derivative unchanged)
- **Runtime derivative:** 256×256 opaque PNG after review
- **Output:** `generation/staging/roblox-textured-ui-reference-kit_v<variant>c1.png`

## Shared rules

Front-on orthographic 2D game UI asset, production-ready texture sheet, square canvas, no words or
letters, no logos, no watermark, no scene, no mockup device, no perspective, no dramatic lighting,
no bloom, no drop shadow outside the canvas. Palette is charcoal graphite, gunmetal, soft cool-gray,
and one restrained cyan accent (#55DDE0). Material detail must survive downscaling to 256×256.

## Variants

### `panel` — 9-slice frame

> Use case: stylized-concept. Asset type: Roblox 9-slice UI panel texture. A perfectly front-on
> square graphite panel with an ornate-but-restrained industrial border. The outer border occupies
> exactly the outer 12.5% of every side; all four corners are identical and rotationally coherent;
> top/bottom edges repeat only horizontally; left/right edges repeat only vertically. Keep the
> center 75% flat, uniform, quiet, and free of focal detail so it can stretch. Brushed graphite,
> subtle bevels, tiny cyan hairline insets, crisp corners. All seams crossing the future slice lines
> must be straight and continuous. No transparency required.

### `tile` — seamless textured fill

> Use case: stylized-concept. Asset type: seamless tileable game UI background. A subtle brushed
> graphite micro-grid with very low-contrast horizontal and vertical machining marks and sparse
> dim cyan pinpoints. Truly seamless on all four edges: left matches right and top matches bottom.
> Uniform density, no center focal point, no large symbol, no lighting gradient, no border. Designed
> to repeat behind readable interface content at 64–256 pixel tile sizes.

### `atlas` — 2×2 control-state atlas

> Use case: stylized-concept. Asset type: Roblox ImageRect 2×2 UI state atlas. Divide the square
> canvas into four exact equal quadrants with no gutter and no separator line. Every quadrant shows
> the same centered abstract hex-compass control glyph at identical scale and alignment with 20%
> safe padding. State order: top-left idle (soft gray/cyan), top-right hover (brighter cyan rim),
> bottom-left pressed (visibly inset/darker), bottom-right disabled (desaturated low contrast).
> Each cell has the same flat graphite background and contains no letters, numerals, labels, arrows,
> or text. Quadrant boundaries must remain clean when cropped independently.

## Negatives — append to every run

no text · no letters · no numerals · no logo · no watermark · no device mockup · no perspective ·
no isometric angle · no photographic scene · no characters · no magenta · no saturated neon ·
no harsh bloom · no blur · no one-pixel detail · no detail crossing required crop/slice boundaries

## After generation

Stage the three candidates under the exact names above. The composite run lead then checks geometry,
downscaled legibility, seams, slice safety, and atlas crops. Only reviewed derivatives leave staging;
they remain `_BLK` until the owner accepts the real Studio proof.
