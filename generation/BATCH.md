# Generation batch — ACTIVE

> One rolling file. Claude rewrites it per batch; Codex executes it verbatim. Standing rules live
> in `AGENTS.md` § Generation batches. If the operator's requested batch id doesn't match the id
> below, **stop and report the mismatch**.

- **Batch id:** `roguex-33-concept-r2`
- **Rerun of:** `roguex-33-concept` (r1 candidates remain in staging under their own names — do
  not delete them)
- **Character · stage:** Roguex-33 · Stage 1 — Concept (`Roguex-33_concept-v1`)
- **Pipeline:** `_project/pipeline/roguex-33-character.md` (step `concept`)
- **Lore source of truth:** lore-brain `Concepts/Roguex-33.md` § Visual Identity — this file
  quotes it; on any conflict, the engram wins.
- **Composition template:** `templates/character/png/concept.png` — attach if the tool accepts
  image inputs; otherwise encode textually (2:3, full body, ground line + small contact shadow,
  safe margins). Magenta guides must never appear in output.
- **Style anchor:** none — this *is* the anchor stage.
- **Candidates:** 2 per variant → 6 images total.
- **Output:** `generation/staging/roguex-33-concept-r2_v<variant>c<n>.png`

## What changed from r1 (owner review, 2026-07-04)

1. **THE FACE — the headline fix.** r1 heads were clunky/boxy or menacing (skull-grin,
   jack-o'-lantern, knight-visor). Respec: **humanoid face** — sleek person-shaped skull,
   defined brow line with expressive brow plates, fully mechanical but *charming*. The brass
   multi-slit vocoder grille sits where a mouth would, curved in a permanent **wry smirk** and
   glowing soft warm amber. Expression register: **mischievous, roguish, Han-Solo swagger —
   never menacing.** The threat is stillness, not the face.
2. **Perch plate:** low-profile worn plate, flush to the shoulder armor — **not a raised
   tray/pedestal/dish.**
3. **Chrome polish:** customer-facing surfaces (chest, forearms, face) are *polished reflective
   chrome* — showroom front, scuffed gunmetal everywhere the customers don't see.
4. **Chassis language:** logistics, not combat — cargo hardpoints, strap anchors, load-rated
   joints; a body built to move inventory.

## Base prompt

> Full-body character concept art, 2:3 portrait format, single figure, painterly cyber-gothic
> finish — ritual weight on secular machinery. Subject: a charming rebuilt merchant robot in a
> neon-noir market world. Lean, asymmetric logistics chassis — cargo hardpoints, strap anchors,
> load-rated joints, a body built to move inventory, not to fight; no two armor panels from the
> same production run; polished reflective chrome on the customer-facing surfaces (chest,
> forearms, face), scuffed gunmetal where customers don't look. He wears a long open trader's
> coat of waxed canvas over the chrome. **Head: humanoid proportions — a sleek, person-shaped
> mechanical skull with a defined brow line and expressive brow plates; a brass-fitted multi-slit
> vocoder grille curved in a permanent wry smirk where a mouth would be, glowing soft warm amber;
> the expression is mischievous, roguish, sly — a chrome Han Solo mid-sales-pitch, never
> menacing.** A flip-down jeweler's loupe sits over the left eye. A low-profile worn perch plate
> lies flush on one shoulder. Relaxed counter-lean, deal-making confidence, open mid-patter
> hands; nothing weapon-shaped anywhere on him. Lighting: warm amber neon rim light against a
> cold blue-white fluorescent key; background kept quiet in value. Feet planted on a ground line
> with a small contact shadow; figure fills the frame with safe margins.

## Variants

- **V1 — clean plate:** base as written; dark neutral backdrop, nothing but the
  amber-vs-fluorescent lighting split. (Anchor candidate.)
- **V2 — coat + awning cape:** base coat, plus a short stall-awning half-cape layered over the
  shoulders (canopy silhouette at the top, long coat lines below — no fringe).
- **V3 — stall counter-lean:** at his open-air market stall, leaning on the counter on one arm,
  curated cover-inventory blurred behind him; neon-market bokeh, kept quiet in value.

## Negatives — append to every run

no gold trim or gold accents anywhere · not a mass-produced or standardized robot design · no
visible weapons · no human skin (fully mechanical) · **no skull-face, no jack-o'-lantern grin,
no knight visor, no boxy industrial head, no menacing expression** · no raised tray or pedestal
on the shoulder · no magenta/pink guide lines in the output · background never competes with the
silhouette

## After generation

Stop. Report "batch staged" to the operator. Do not review, rank, rename, or file anything —
review and filing happen on the Claude side.
