# Generation contract — `soul-steel-blood-sigils-transparent-v1`

> Immutable contract authored 2026-07-29 for three transparent Blood-domain sigil candidates.
> Compatibility copy: `generation/BATCH.md`. Operator trigger:
> **"Run generation batch soul-steel-blood-sigils-transparent-v1"**.

- **Batch id:** `soul-steel-blood-sigils-transparent-v1`
- **Pipeline:** `_project/pipeline/soul-steel-domain-sigil-exploration.md` (step `blood-alpha`, run-2)
- **Use case:** `background-extraction`
- **Asset preset:** `icon`
- **Asset type:** Soul Steel Blood-domain transparent raster sigils
- **Status boundary:** Source-art candidates derived from the owner-liked exploration sheet. They
  are not yet official domain marks, shared-library assets, registered assets, `_FNL`, uploaded,
  published, or Lore Brain canon.
- **Source sheet:**
  `generation/refs/soul-steel-blood-sigils-transparent-v1/source-domain-sigil-sheet.png`
- **Per-candidate references:**
  `generation/refs/soul-steel-blood-sigils-transparent-v1/source-blood-core.png`,
  `generation/refs/soul-steel-blood-sigils-transparent-v1/source-blood-crest.png`, and
  `generation/refs/soul-steel-blood-sigils-transparent-v1/source-blood-combat.png`
- **Candidates:** 3 candidates, one each in variants `core`, `crest`, and `combat`
- **Requested generation size:** 1024×1024 PNG with native alpha
- **Outputs:**
  - `generation/work/soul-steel-blood-sigils-transparent-v1/candidates/soul-steel-blood-sigils-transparent-v1_vcorec1.png`
  - `generation/work/soul-steel-blood-sigils-transparent-v1/candidates/soul-steel-blood-sigils-transparent-v1_vcrestc1.png`
  - `generation/work/soul-steel-blood-sigils-transparent-v1/candidates/soul-steel-blood-sigils-transparent-v1_vcombatc1.png`

## Blood-domain source lock

Blood treats life force as raw material and operates as a closed metabolic loop of drain,
corruption, empowerment, and regeneration. Its visual palette is dark red (`#8B0000`), warm,
organic, pressurized, and tactile. These sigils express that identity through blackened forged
iron, arterial crimson channels, thorn tips, branching vein lines, a controlled blood-seed/drop,
and circular recurrence.

The selected source constructions are:

1. **Core sigil** — large thorned circular seal with four cardinal red gems, nested arterial
   loops, branching inner veins, and a controlled blood-seed/drop.
2. **Crest sigil** — compact vertical shield/reliquary with pointed crown and base, branching
   inner veins, and the same controlled blood-seed/drop.
3. **Combat sigil** — compact four-point radial badge with circular thorn frame, branching inner
   veins, and the same controlled blood-seed/drop.

## Shared output lock

For every candidate:

- faithfully preserve the selected source mark's outer silhouette, cardinal geometry, inner
  blood-seed/drop, thorn language, material proportions, palette, and lighting hierarchy
- reconstruct the mark cleanly at high resolution rather than enlarging the dark panel pixels
- isolate exactly one centered sigil in a square 1:1 frame with generous even padding
- deliver a PNG with real transparency outside the sigil; the canvas must have an alpha channel
- remove the dark-gray sheet panel, paper, border, neighboring icons, labels, floor plane,
  rectangle, halo plate, and cast shadow
- retain restrained internal glow only inside the metal object; do not create an opaque aura
- keep crisp antialiased edges suitable for UI downscaling and readable at 64 pixels
- render no text, letters, numbers, watermark, or signature

## Variant prompts

### `core`

Use `source-blood-core.png` as the exact subject reference. Create the large thorned circular Blood
seal by itself. Preserve its four cardinal diamond points, layered blackened-iron rings, branching
crimson vein network, nested arterial teardrop loop, central dark-red blood seed, and restrained
ember-red gem glow. Maintain the source's balanced symmetry and premium forged depth.

### `crest`

Use `source-blood-crest.png` as the exact subject reference. Create the compact vertical
shield/reliquary Blood crest by itself. Preserve its pointed top and bottom, side shoulders,
blackened-iron shield frame, branching crimson veins, inner teardrop loop, central blood seed, and
small red cardinal gems. Keep its silhouette taller than wide without stretching it.

### `combat`

Use `source-blood-combat.png` as the exact subject reference. Create the compact four-point radial
Blood combat mark by itself. Preserve its long north/south diamonds, shorter east/west points,
circular thorn frame, branching crimson veins, inner teardrop loop, central blood seed, and
restrained red gem glow. Maintain a sharp radial silhouette without turning it into a starburst.

## Style and craft

Premium cyber-gothic game UI icon, heroic-ornate but silhouette-first: blackened forged iron,
subtle hammered wear, warm oxidized bronze edges, deep arterial crimson enamel and inner glow,
clean controlled bevels, realistic material separation, and consistent soft frontal studio
lighting. Match the exploration sheet closely; do not modernize or simplify the selected designs
beyond the cleanup required for transparent standalone use.

## Negatives — append to every generation request

no opaque background · no checkerboard pattern · no white background · no black square · no dark
panel · no paper field · no frame around the canvas · no floor plane · no cast shadow outside the
object · no neighboring icons · no title · no label · no text · no letters · no numbers · no
character · no face · no skull · no weapon · no crown · no bat wings · no generic blood drop alone
· no six-point occult star · no religious symbol · no biohazard symbol · no flat corporate logo ·
no glossy mobile-app button · no red smoke · no splattered blood · no external aura · no excessive
bloom · no cropped points · no off-center placement · no watermark · no signature

## Stop boundary

Write the three candidates to their exact bound output paths, then report **"batch staged"** with
candidate count 3. Do not review, rank, select, rename, transform, apply final-asset metadata, file
to the shared Assets library, register, promote, upload, publish, edit Lore Brain, or alter the
pipeline outcome during the generation pass.
