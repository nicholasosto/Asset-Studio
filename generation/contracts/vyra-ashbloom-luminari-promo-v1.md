# Generation contract — `vyra-ashbloom-luminari-promo-v1`

> Immutable contract authored 2026-07-29 for a speculative Vyra Ashbloom × Luminari
> cross-design. Compatibility copy: `generation/BATCH.md`. Operator trigger:
> **"Run generation batch vyra-ashbloom-luminari-promo-v1"**.

- **Batch id:** `vyra-ashbloom-luminari-promo-v1`
- **Pipeline:** `_project/pipeline/vyra-ashbloom-character.md` (step `concept`, run-1)
- **Use case:** `stylized-concept`
- **Asset preset:** `raster-default`
- **Asset type:** Soul Steel character promotional concept sheet
- **Status boundary:** Visual exploration only. Both the Vyra Ashbloom persona and Luminari
  species engrams are speculative, and neither engram currently establishes Vyra as Luminari.
- **Visual direction:** Apply the roster-standardized promotional grammar established by the
  Crimson Sentinel and Penitent Knight candidates: a clean 2:3 full-body character sheet,
  dominant center-right figure, bold upper-left display title, restrained supporting copy, bright
  worn-paper field, crisp silhouette, and a polished stylized-render finish.
- **Composition reference:**
  `generation/refs/vyra-ashbloom-luminari-promo-v1/composition-concept-template.png` — 2:3
  vertical, full body, silhouette-first, shared ground line, and safe margins. The magenta guides
  are layout-only and must not appear in the output.
- **Luminari identity references:**
  `generation/refs/vyra-ashbloom-luminari-promo-v1/identity-luminari-concept-board.png` and
  `generation/refs/vyra-ashbloom-luminari-promo-v1/race-customizer-user-reference.png` — preserve
  the established silver living-lattice body, internally lit crystal growths, elongated
  proportions, expressive energy tendrils, luminous eyes, and scholar-seer clothing language.
  The user's source labels the customizer species “Lumineth”; Lore Brain's speculative species
  engram and concept board use “Luminari.” This contract follows the Lore Brain name without
  claiming that the terminology conflict has been canonically resolved.
- **Promotional style references:**
  `generation/refs/vyra-ashbloom-luminari-promo-v1/style-crimson-sentinel-promo.png` and
  `generation/refs/vyra-ashbloom-luminari-promo-v1/style-penitent-knight-promo.png` — match the
  crop, typography hierarchy, bright paper field, dimensional game-render polish, and
  roster-family presentation. Do not inherit either character's armor, weapon, pose, palette, or
  faction motifs.
- **Candidates:** 1 candidate in variant `roster`
- **Requested generation size:** 1024×1536 PNG (2:3)
- **Output:**
  `generation/work/vyra-ashbloom-luminari-promo-v1/candidates/vyra-ashbloom-luminari-promo-v1_vrosterc1.png`

## Locked source cues

Vyra is a compassionate but unsettling Spirit mystic who perceives physical and spectral reality
as overlapping layers. She sees ghost-echoes of what existed before the Sundering, pauses to
listen to unseen voices, and was raised among the boundary gardens of Loomveil. Her only explicit
personal physical cue is that her eyes shift between deep violet and pale silver depending on
which layer holds her focus.

The speculative Luminari design supplies the body for this exploration:

- adult feminine Luminari with a tall, narrow torso, elongated limbs and hands, and a serene,
  controlled bearing
- pale brushed-silver living-lattice skin with subtle cellular seams, never chrome armor and
  never ordinary human flesh
- translucent internally lit crystal anatomy and a fine, branching Violet Light crown
- flowing expressive energy tendrils rooted at the skull and upper spine, readable as sensory
  anatomy rather than human hair
- eyes caught mid-focus transition, with violet light passing into pale silver across both eyes;
  avoid fixed heterochromia because the source describes a shift rather than two permanent colors
- layered ash-gray, pearl, charcoal, and desaturated-violet seer robes over restrained fitted
  silver lattice panels; matte cloth, fine boundary-garden branch embroidery, and no factional
  gold trim
- no weapon; one long hand raised toward a translucent ghost-echo while the other hangs open and
  calm

The signature visual beat is **one person standing in two versions of the same place**. Offset a
single pale-silver spectral echo of Vyra and a few ruined garden/spire fragments behind her
physical form, as though an earlier reality is visible through cracked frost-glass. Keep the echo
secondary: her body, face, tendril crown, and shifting eyes must remain immediately readable.

## Promotional composition and exact copy

Use a bright pearl-gray / worn parchment studio field with a cool violet wash, subtle print
texture, fine refractive geometry, and restrained frost-on-glass branching. Keep the scene
legible and spacious rather than turning it into a dark sci-fi UI. Place the full-body Vyra from
center-right through the lower frame in a graceful three-quarter stance with both feet visible.
Reserve the upper-left and mid-left for copy.

Render only this exact display copy:

- Title: **VYRA ASHBLOOM**
- Subtitle: **VEIL-TOUCHED SEER**
- Tagline: **SHE WALKS WHERE TWO WORLDS OVERLAP**

Typography should remain in the same roster family while becoming character-specific: tall
distressed charcoal lettering with a pale-silver face, restrained ultraviolet edge, and thin
refractive-line ornament. The tagline is promotional copy, not canon dialogue. Do not add a stat
panel, species dossier, faction seal, quotation marks, or additional slogans.

## Style and lighting

High-end stylized game-character promotion: dimensional 3D-like render with a controlled painterly
finish, slightly exaggerated elegant proportions, crisp silhouette edges, convincing satin-metal
skin, matte layered textiles, translucent crystal, and tasteful print-poster integration. Use a
soft warm-neutral key, cool pearl fill, ultraviolet rim light from the tendrils, and a pale-silver
spectral backlight. Cyber-gothic, quiet, compassionate, uncanny, and readable at thumbnail scale.
The character should feel like a seer whose serenity is practiced because emotion travels through
her visible anatomy.

## Negatives — append to the generation request

no ordinary human woman · no human skin · no human hair · no permanent one-violet-one-silver
heterochromia · no generic elf ears · no fairy wings · no angel wings · no halo · no flower crown
· no literal ash flowers · no antlers · no demon horns · no tentacle monster · no exposed brain ·
no bald plain human head · no broad muscular physique · no child · no elderly figure · no heavy
combat armor · no weapon · no staff · no book · no bright gold trim · no Spirit Conclave insignia
· no overt cyberpunk bodysuit · no hard plastic robot plating · no saturated neon-purple wash · no
black unreadable background · no busy battlefield · no dense UI dashboard · no multiple full
characters · no cropped feet · no excessive bloom · no illegible gibberish beyond the exact
requested copy · no modern logo · no trademark · no watermark · no signature · no template border
· no magenta guide lines

## Stop boundary

Write the single candidate to the exact bound output path, then report **"batch staged"**. Do not
review, rank, select, rename, transform, file to Lore Brain, edit either engram, register, promote,
upload, publish, or alter the pipeline outcome during the generation pass.
