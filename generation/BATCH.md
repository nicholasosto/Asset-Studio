# Generation batch — ACTIVE

> One rolling file. Previous batch (`roblox-textured-ui-reference-kit`) completed its generation
> pass 2026-07-12 and its candidates are staged/filed; that run's remaining work is Studio-side
> and needs no further generation. This batch belongs to the `roguex-33-character` pipeline,
> portrait stage (run-3). Standard operator trigger: **"Run generation batch roguex-33-portrait"**.

- **Batch id:** `roguex-33-portrait`
- **Pipeline:** `_project/pipeline/roguex-33-character.md` (step `portrait`, run-3)
- **Visual direction:** Soul Steel cyber-gothic — gunmetal chrome machine-merchant, warm amber
  accents, Grid District Bazaar at night
- **Composition reference:** `templates/character/png/portrait.png` — 2:3 vertical · bust from
  mid-chest up · ¾ view · eye-line in the upper third · subject centered with safe margins ·
  atmospheric background allowed. The magenta guide lines must never appear in the output.
- **Identity anchors:** `generation/refs/roguex-33-identity-concept-v1.png` (stall scene) +
  `roguex-33-identity-concept-v2.png` (clean silhouette) — the filed concept sheets. If the tool
  can't take image inputs, encode their locked traits textually: gunmetal humanoid chassis of
  mismatched salvage panels, long open stall-coat with trader's-canvas collar, brass-fitted
  amber vocoder grille, flip-down loupe apparatus at the **left** eye, reinforced perch plate on
  the **left** shoulder.
- **Candidates:** 2 per variant → 6 images total; rerun only a failed variant
- **Requested generation size:** 1024×1536 PNG (2:3, matches the concept batches)
- **Output:** `generation/staging/roguex-33-portrait_v<variant>c<n>.png`

## Shared rules — the face canon is the hard constraint

Character bust portrait of Roguex-33, a machine merchant. **The head is a sleek, person-shaped
metal skull with expressive articulated brow plates — NOT a bare human skull, NOT a boxy
industrial helmet.** The mouth is an ornate multi-slit vocoder grille, brass-fitted, **curved in
a permanent asymmetric wry smirk — sly and knowing, never a wide grin, never bared teeth, never
menacing.** The grille glows and flickers faint warm amber, mid-patter. Mischief, never menace.

A flip-down jeweler's loupe (aftermarket authenticator optic) sits over the **left eye**. Small
polished copper pins glint along the coat's inner collar — incidental, uncounted, not a focal
point. Palette: gunmetal chrome base, warm amber neon accents, one muted deep-red allowed in
background signage only. **Never gold trim** — gold is another faction's mark. Materials read as
mismatched production runs: brushed chrome, brass fittings clustered around the vocoder,
trader's canvas at the collar. Background: Grid District Bazaar at night — warm amber neon bokeh
against a colder fluorescent key light; the warm-vs-cold contrast is the thesis.

## Variants

### `smirk` — the resting merchant

> The definitive face study. Patter paused, grille in its resting wry-smirk curve with a soft
> amber idle flicker, brow plates relaxed and confident, eyes level with the viewer — the look
> of a shopkeeper who already knows what you came for. Both tells quiet: loupe flipped up,
> hands out of frame.

### `patter` — mid-sale

> Grille lit brighter mid-sentence, amber flicker strong, head tilted a few degrees, brow plates
> raised and animated. One chrome hand enters the lower frame edge in a deal-making gesture,
> palm up. The energy of *"Well, well. A new face in the Grid District."*

### `loupe` — the authenticator

> The loupe flipped **down** over the left eye, catching amber light; head angled slightly as he
> appraises the viewer like merchandise. Grille at a low knowing flicker, brow plate over the
> loupe cocked. The Grid's authenticator at work: *"Real Gem or a Shard?"*

## Negatives — append to every run

no gold trim · no skull face · no exposed bone · no boxy industrial helmet · no jack-o'-lantern
grin · no wide grin · no bared teeth · no menacing snarl · no human skin or flesh · no full body ·
no legs · no weapon · no text · no letters · no logo · no watermark · no magenta guide lines ·
no saturated magenta or pink · no harsh bloom · no motion blur

## After generation

Stage the six candidates under the exact names above and report **"batch staged"** — no review,
ranking, or filing (that's the Claude side: template overlay per `templates/character/README.md`,
face-canon checklist from the engram § Visual Identity, winner → lore-brain
`Media/visual/Roguex-33_portrait-v1.png` + engram `sensory_assets` + pipeline run log).
