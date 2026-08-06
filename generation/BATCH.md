# Generation batch — ACTIVE

> Compatibility copy for
> [`generation/contracts/soul-steel-blood-sigils-transparent-v2.md`](contracts/soul-steel-blood-sigils-transparent-v2.md),
> selected by [`generation/ACTIVE.md`](ACTIVE.md). Operator trigger:
> **"Run generation batch soul-steel-blood-sigils-transparent-v2"**.

- **Batch id:** `soul-steel-blood-sigils-transparent-v2`
- **Supersedes for delivery:** `soul-steel-blood-sigils-transparent-v1` (retained as failed run
  evidence; its outputs have `hasAlpha: no`)
- **Pipeline:** `_project/pipeline/soul-steel-domain-sigil-exploration.md` (step `blood-alpha`, run-3)
- **Use case:** `background-extraction`
- **Asset preset:** `icon`
- **Execution lock:** OpenAI Image API edit with `gpt-image-1.5`,
  `background=transparent`, `output_format=png`, `size=1024x1024`, `quality=high`, and
  `input_fidelity=high`
- **Asset type:** Soul Steel Blood-domain transparent raster sigils
- **Status boundary:** Source-art candidates derived from the owner-liked exploration sheet. They
  are not yet official marks, shared-library assets, registered, `_FNL`, uploaded, published, or
  Lore Brain canon.
- **Source sheet:**
  `generation/refs/soul-steel-blood-sigils-transparent-v1/source-domain-sigil-sheet.png`
- **Per-candidate references:**
  `generation/refs/soul-steel-blood-sigils-transparent-v1/source-blood-core.png`,
  `generation/refs/soul-steel-blood-sigils-transparent-v1/source-blood-crest.png`, and
  `generation/refs/soul-steel-blood-sigils-transparent-v1/source-blood-combat.png`
- **Candidates:** 3 candidates, one each in variants `core`, `crest`, and `combat`
- **Outputs:**
  - `generation/work/soul-steel-blood-sigils-transparent-v2/candidates/soul-steel-blood-sigils-transparent-v2_vcorec1.png`
  - `generation/work/soul-steel-blood-sigils-transparent-v2/candidates/soul-steel-blood-sigils-transparent-v2_vcrestc1.png`
  - `generation/work/soul-steel-blood-sigils-transparent-v2/candidates/soul-steel-blood-sigils-transparent-v2_vcombatc1.png`

## Source lock

Blood treats life force as raw material and operates as a closed metabolic loop of drain,
corruption, empowerment, and regeneration. Preserve the selected sheet designs' blackened forged
iron, dark-red arterial channels, thorn language, branching veins, controlled blood-seed/drop,
warm organic pressure, cardinal geometry, and restrained ember-red gem glow.

1. **Core:** thorned circular seal; four cardinal diamond points; layered rings; branching vein
   network; nested circulation loop; central blood seed.
2. **Crest:** tall shield/reliquary; pointed top and bottom; two side shoulders; branching veins;
   nested circulation loop; central blood seed.
3. **Combat:** circular thorn badge; long north/south diamonds; shorter east/west diamonds;
   branching veins; nested circulation loop; central blood seed.

## Required edit invariants

For each source crop, change only the presentation required to produce a standalone asset:

- preserve the selected mark's silhouette, cardinal geometry, proportions, inner blood-seed,
  thorn placement, material hierarchy, palette, and lighting closely
- reconstruct cleanly at high resolution, centered in a square 1024×1024 frame with generous
  even padding and every outer point visible
- make every pixel outside the physical sigil transparent with real alpha; the four corner pixels
  must have alpha 0
- remove the source panel, paper, neighboring marks, labels, rectangle, floor plane, and external
  cast shadow
- retain restrained crimson illumination only inside the sigil; do not create an opaque halo
- no text, letters, numbers, watermark, or signature

## Per-candidate prompts

### `core`

Faithfully reconstruct only the large central Blood core seal from `source-blood-core.png`.
Preserve the four cardinal red-gem diamonds, circular thorned iron frame, layered rings, branching
crimson vein network, nested arterial teardrop loop, and central dark-red blood seed.

### `crest`

Faithfully reconstruct only the compact vertical Blood crest from `source-blood-crest.png`.
Preserve its taller-than-wide shield/reliquary silhouette, pointed crown and base, two side
shoulders, small red gems, branching crimson veins, inner teardrop loop, and central blood seed.

### `combat`

Faithfully reconstruct only the compact radial Blood mark from `source-blood-combat.png`. Preserve
the circular thorn frame, long north/south diamonds, shorter east/west diamonds, four red gems,
branching crimson veins, inner teardrop loop, and central blood seed. Do not turn it into a
many-point starburst.

## Style

Premium cyber-gothic game UI icon, heroic-ornate but silhouette-first: blackened forged iron,
subtle hammered wear, warm oxidized bronze edges, deep arterial crimson enamel and contained
inner glow, crisp antialiased cutout edges, controlled bevels, and consistent soft frontal studio
lighting. Match the source sheet closely; this is cleanup and alpha isolation, not redesign.

## Negatives — append to every edit

no opaque background · no checkerboard pixels · no white background · no black square · no dark
panel · no paper field · no canvas frame · no floor plane · no cast shadow outside the object · no
neighboring icons · no title · no label · no text · no characters · no skull · no weapon · no
crown · no bat wings · no generic blood drop alone · no six-point occult star · no religious
symbol · no biohazard symbol · no flat corporate logo · no glossy mobile-app button · no red smoke
· no splattered blood · no external aura · no excessive bloom · no cropped points · no off-center
placement · no watermark · no signature

## Validation gate

After the generator stops, the reviewer must verify each file is PNG, exactly 1024×1024, reports
an alpha channel, and has transparent corner pixels. Failed outputs remain run evidence and do not
count as delivered candidates.

## Stop boundary

Write the three candidates to their exact bound output paths, then report **"batch staged"** with
candidate count 3. Do not review, rank, select, rename, transform, apply final-asset metadata, file
to the shared Assets library, register, promote, upload, publish, edit Lore Brain, or alter the
pipeline outcome during the generation pass.
