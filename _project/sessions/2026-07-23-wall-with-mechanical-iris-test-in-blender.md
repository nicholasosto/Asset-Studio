---
title: "Wall with mechanical iris test in Blender"
status: active
updated: 2026-07-23
tags: { last-active: 2026-07-23T13:02, kos: "blender, roblox-brain, memory, assets-library, explorer" }
---

# Wall with mechanical iris test in Blender

> **Status:** active (2026-07-23)

## Goal

Build a test asset in Blender: a wall section with a working mechanical iris (aperture-style
portal that opens/closes) — exercising the new lookdev lab on its first real review piece.

## Success Criteria

- A wall mesh with a mechanical iris whose blades actually articulate (posable or keyframed
  open ↔ closed), modeled at 1 BU = 1 stud.
- Reviewed in `Assets/_tools/blender/lookdev.blend` — linked into the `review` slot, checked
  against the StylizedHuman reference for scale (opening in the 7×3-class range).
- A recorded verdict on the asset's next step: keep as lab test geometry vs promote toward the
  library / Roblox path (glb export, MeshPart).

## Source References

- `Assets/_tools/blender/lookdev.blend` — the lab this exercises ([[lookdev-lab]] memory: rigs,
  worlds, link-into-`review` flow, headless recipe)
- Open thread: the 2026-07-22 Codex artboards (architectural openings · **portal mechanisms** ·
  portal material study) — unreviewed; likely design source for an iris portal
- `mediums/3d.md` § Scale & lookdev — two-lab convention (Blender = authoring truth)

## Decisions

- **Ø5 bore, not Ø7 walk-through** — the pocket-depth reality check: an iris whose blades fully
  retract needs a housing ≈ 2× bore diameter; Ø7 → Ø14 housing > the 12-stud wall module. Test
  gate reads vault-porthole; door use = bury the assembly ~2.5 studs (scar-sanctioned
  reposition pattern) or move to a 14+ module.
- **Camera-leaf blade geometry** — 10 leaves, each an arc band centered on its *own pivot*
  (ρ 0.8→4.8, window [-24°, +18°], solver-tuned), 40° unison swing, z-staggered 0.018 like a
  real shutter stack. Open clearance Ø3.6. Roblox-brain constraints honored: one object per
  blade, origin at hinge pivot, shared mesh (216 tris), all-quad bands, true stud size.
- **Placement** — `Assets/source/blender/wall-iris/WallIris.blend` (StylizedHuman precedent:
  kebab folder, PascalCase file, linkable `wall-iris` collection). Linked into lookdev.blend's
  `review` slot and saved there — the lab's first real review subject.
- **Verdict (SC-3)** — stays lab test geometry; promotion path documented above, not pursued.
- **Trim sheet filed, no category improvised** — Codex's vertical trim sheet →
  `textures/tileable/robotic/ancient-tech-vert-trim-01_BLK.png` (registered zone, slug carries
  the trim semantics; 1254 master in `_archive/2026-07-23/` per the kit's resize-provenance
  pattern; registry + static bundle rebuilt). Sidecar documents the 7-strip U-map and the
  **MeshPart + SurfaceAppearance-only** consumption gate (inverse of the kit tiles). A
  dedicated trim preset/category registration = owner call if trims multiply.
- **Material pass = the trim-sheet pilot, executed** — wall faces wallpaper-planar at 6-stud
  sheet scale (conduit strips glow up the wall via a B−R blue-dominance emission mask);
  housing lathe bands strip-assigned (annuli → panel A radial — the castellated gear-tooth
  read; drum → panel B; bore lips → clamp; slot → plate); blades deliberately stay clean
  graphite for mechanism legibility. Closes the standing "ancient-tech trim-sheet pilot"
  owner call (sheet + doorway-class test mesh, both delivered).
- **Wall mapping v2 (owner review catch)** — the field's full-sheet U-wallpaper was the trim
  anti-pattern (strip sequence visibly repeating). Recomposed with per-region assignment:
  plate pilasters at ±edges (1:1 across), conduit power-run along the floor (rotated UVs),
  clamp lintel, field = panel-A **radial collar** (v = angle×6) echoing the housing
  castellation. Strip windows re-measured by column-luminance analysis (conduit line at
  u 0.664); sidecar table corrected. Housing/blades mapping unchanged.
- **Blade touch-up (3 iterations) — "glow = locked"** — body to brushed steel (0.32 base,
  metallic 0.75, rough 0.33; the 0.9-metallic gunmetal attempt sank into the dim rig);
  emissive cyan on a thin 2.4° band along each leaf's *leading* edge (`mat_iris-blade-edge`,
  strength 6, in-place datablock rebuild — objects/keyframes untouched). Closed = angular
  glowing pinwheel (sealed + energized); open = clean de-energized steel. Failed variants:
  side-quad-only glow (edge-on ⇒ invisible straight-on), outer-arc rim glow (z-stack clips
  it into an asymmetric fan when closed). Dial available: re-add soft outer-arc glow if the
  open state should also read energized.
- **Leaf distinction pass (owner ask)** — thickness 0.12→0.18, z-stagger 0.018→0.045
  (stack ±0.29); housing slot mouth widened 0.16→0.34 to fit, housing rebuilt in place
  (lathe + bosses + trim UVs regenerated; lip `t` formulas updated). Open state now reads
  as a stepped spiral funnel of individually visible plates; the wrap-seam canyon (9×0.045
  step between leaf 10 and leaf 1) stays as the stack's physical signature. Blade objects
  restaggered via location.y only — rotation keyframes untouched.

## First-Principles Candidates

- Iris leaves must be arc bands centered on their own pivot — rotation then slides the blade
  along itself, giving slot containment for free; fat sector blades are geometrically hopeless
  → memory (blender craft)
- Full-retract iris ⇒ housing ≈ 2× bore (why every Stargate has a massive surround) — the
  module-size budget must include the mechanism pocket, not just the opening → memory
- Numeric param-solver inside the bpy build script (grid-search the mechanism, assert coverage
  + containment, then build the winner) worked first-try — candidate bpy craft pattern →
  routine (/create-learn promotion)
- A trim sheet's sidecar should carry its strip map (U ranges + across-widths) — that table IS
  the sheet's API for every future UV consumer, same role the scale line plays for tileables
  → decision / mediums-image card (formalize if trims multiply)
- A trim sheet never tiles in U — a horizontally repeating strip sequence is the wallpaper
  anti-pattern; the mechanic is per-region strip assignment (pilasters · runs · lintels ·
  radial collars for annular fields), rotating UVs to run strips in any direction → memory
  (blender craft; also written into the sheet's sidecar rules)
- Emissive accents must live on view-facing geometry — glow on edge-on side quads renders as
  a zero-width line from the hero angle; and on stacked movers (iris leaves) the z-stack
  clips face glow into asymmetric patterns, so put glow where the *exposed* boundary is per
  state (the leading-edge seam) → memory (blender craft)
- When the owner has the file open in a GUI Blender, apply changes THROUGH the live MCP
  session (edit bpy.data in place + save) instead of headless-behind-its-back — the
  revert/recover round-trip loses races (a stale autosave recovery + save clobbered the
  distinction pass at 12:58; live re-apply at 13:02 resolved it, .blend1 kept the evidence)
  → memory (blender craft / workflow)

## Outputs

- <artifact produced>

## Blockers

- <blocker, or “none”>

## Next Action

<the single next concrete action>

## Handoff Notes

<what the next session needs to know>
