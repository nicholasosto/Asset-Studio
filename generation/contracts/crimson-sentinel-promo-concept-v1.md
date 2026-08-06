# Generation contract — `crimson-sentinel-promo-concept-v1`

> Immutable contract authored 2026-07-29 for the Crimson Sentinel character-standardization
> pass. Compatibility copy: `generation/BATCH.md`. Operator trigger:
> **"Run generation batch crimson-sentinel-promo-concept-v1"**.

- **Batch id:** `crimson-sentinel-promo-concept-v1`
- **Pipeline:** `_project/pipeline/crimson-sentinel-character.md` (step `concept`, run-1)
- **Use case:** `stylized-concept`
- **Asset preset:** `raster-default`
- **Asset type:** Soul Steel character promotional concept sheet
- **Visual direction:** Roster-standardized promotional character art derived from the shared
  grammar in the Gary Gears and Raspmutant concept promotions: a clean 2:3 hero sheet, dominant
  full-body three-quarter character, bold upper-left display title, one subtitle and one quote,
  restrained paper-like field, crisp silhouette, saturated materials, and a polished
  stylized-render finish.
- **Composition reference:**
  `generation/refs/crimson-sentinel-promo-concept-v1/composition-concept-template.png` — 2:3
  vertical, full body, silhouette-first, shared ground line, safe margins. The magenta guides are
  layout-only and must not appear in the output.
- **Identity reference:**
  `generation/refs/crimson-sentinel-promo-concept-v1/identity-crimson-sentinel-portrait.png` —
  preserve the severe angular closed helm, narrow crimson eye slit, corroded black-steel plate,
  crimson-black mantle, and engraved Crimson Order marks.
- **Style references:**
  `generation/refs/crimson-sentinel-promo-concept-v1/style-gary-gears-promo.png` and
  `generation/refs/crimson-sentinel-promo-concept-v1/style-raspmutant-promo.png` — use their
  shared promotional-sheet grammar and vivid stylized material treatment, not their subject
  matter, emblems, clothing, palette, or exact typography.
- **Candidates:** 1 candidate in variant `roster`
- **Requested generation size:** 1024×1536 PNG (2:3)
- **Output:**
  `generation/work/crimson-sentinel-promo-concept-v1/candidates/crimson-sentinel-promo-concept-v1_vrosterc1.png`

## Locked canon and physical design

The Crimson Sentinel is Captain Aldric Thorne, a reanimated captain of the Crimson Order's Outer
Watch and the Blood Marsh's primary boss. He is **duty without consciousness**: a knight whose
purpose survived the man. Show one towering figure, roughly twice a normal player's height, with
massive but modelable game-ready proportions. His stance is statue-still and mechanically exact,
not feral.

Preserve the identity of the existing portrait while expanding it to full body:

- severe angular fully closed great helm; no visible face, skin, skull, or teeth
- narrow crimson eye slit, faint but unmistakable
- corroded layered blackened plate permanently stained dark crimson
- tattered crimson-black mantle that supports the silhouette without hiding the armor
- engraved Crimson Order marks inherited from the portrait
- thick crystallized-blood chains at wrists and ankles, partially shattered and suspended with
  glasslike crimson fragments
- a monumental battered greatsword fused into the right gauntlet by blood magic, point resting on
  the ground as if the Sentinel has just awakened from a centuries-long vigil
- blood energy visible only at the eyes, armor joints, sword-gauntlet fusion, and broken chain
  edges; restrained glow, no neon wash

The signature visual beat is **the guardian becoming a door**: the Sentinel fills the passage,
square and immovable, while one broken chain and the fused sword create the only diagonal motion.

## Promotional composition and exact copy

Use a clean warm-gray / aged-parchment studio field with a faint desaturated blood-red wash and
subtle worn print texture. Keep it much brighter and more readable than the old portrait. Place the
full-body Sentinel from center-right through the lower frame, in a low three-quarter hero view,
feet and sword grounded, silhouette fully visible. Reserve the upper-left and mid-left for the
promotional copy.

Render only this exact display copy:

- Title: **CRIMSON SENTINEL**
- Subtitle: **THE LAST WATCH**
- Quote: **"IT WAS A KNIGHT ONCE. NOW IT IS A DOOR."**
- Optional small seal, only if legible: **CAPTAIN ALDRIC THORNE · OUTER WATCH**

Typography should feel hand-illustrated and character-specific within the same roster family as
the references: tall distressed crimson block lettering with a dark iron outline, dynamic but
readable. Add one restrained Crimson Order seal or angular blood-chain motif behind the title.
Do not add a dense stat panel; the character and quote are the promotion.

## Style and lighting

High-end stylized game-character promotion: dimensional 3D-like render with a controlled painterly
finish, slightly exaggerated heroic proportions, crisp edges around the silhouette, convincing
corroded iron and blood-crystal materials, and print-poster integration. Use a warm neutral key
light, cool charcoal fill, and a restrained deep-crimson rim from the broken chains. The subject
must be clearly readable at thumbnail scale. Cyber-gothic, solemn, ritualized, and tragic; not
generic grimdark.

## Negatives — append to the generation request

no photoreal live-action person · no generic Dark Souls imitation · no human face · no exposed
skin · no exposed skull · no teeth · no horns · no demonic spikes · no shield · no extra weapons ·
no extra limbs · no sci-fi gun · no bright gold trim · no clean pristine armor · no heroic smile ·
no crouching beast pose · no cropped feet · no cropped sword · no busy scenic battlefield · no
black unreadable background · no excessive bloom · no saturated neon red wash · no illegible
gibberish beyond the exact requested copy · no modern logo · no trademark · no watermark · no
signature · no template border · no magenta guide lines

## Stop boundary

Write the single candidate to the exact bound output path, then report **"batch staged"**. Do not
review, rank, select, rename, transform, file to the lore-brain, edit the engram, register, promote,
upload, publish, or alter the pipeline outcome during the generation pass.
