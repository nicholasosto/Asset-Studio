---
title: "Texture trim deep-dive: how trim sheets work"
status: completed
updated: 2026-07-23
tags: { last-active: 2026-07-23T11:45, kos: "memory, assets-library, blender, mediums" }
---

# Texture trim deep-dive: how trim sheets work

> **Status:** completed (2026-07-23)

## Goal

Knowledge transfer: teach the owner how texture trims (trim sheets) work in detail — the mechanic,
the sheet anatomy, the UV workflow, and where the technique sits relative to the studio's existing
tileable pipeline (ancient-tech surface kit, crown·field·plinth ladder) and Roblox's delivery
constraints (`Texture` on Parts vs `SurfaceAppearance` on MeshParts). Teaching session — no
production output expected beyond the lesson and any captured insights.

## Success Criteria

- The lesson covers: definition + why the technique exists, sheet anatomy (U-tiling strips,
  padding, PBR maps), the UV mechanic (islands slide/stretch along strips), and decision rules
  (tileable vs trim vs unique bake) — each grounded in an existing Asset-Studio artifact.
- A labeled trim-sheet anatomy diagram is rendered in-chat.
- Roblox constraints stated concretely: why plain `Texture` instances can't do trims, what the
  MeshPart + `SurfaceAppearance` path requires, and how the 1024 upload cap shapes sheet design.
- The technique is mapped onto the crown·field·plinth ladder and Testing-Lab band rule, ending in
  a concrete pilot proposal recorded as the next action (do/skip = owner call).

_(Criteria drafted by Claude — confirm or adjust.)_

## Source References

- Memory: `part-texture-testing-lab` (band rule, studs-per-tile sweep) · `trembus-game-library`
  (non-TS Package delivery path)
- `sessions/2026-07-21-overall-review-of-the-project-space` — continuity anchor
- `pipeline/ancient-tech-surface-kit` — the tileable family the lesson contrasts against
- `mediums/image` · `mediums/3d` — capability cards this technique straddles
- External: Roblox `SurfaceAppearance` docs; Blender trim-UV tooling (DreamUV / TexTools)

## Decisions

- Build the Blender lookdev scene (owner-approved): standalone `Assets/_tools/blender/lookdev.blend`
  — rig collections (cameras · reference · testgeo) + three swappable light rigs + empty `review`
  slot that *links* asset collections in (decision-0001 pattern). Working scale: 1 Blender unit =
  1 stud (no registered stud↔meter convention in `mediums/3d` — assumption named, trivially
  rescalable). Authoring lab only; the Part-Texture-Testing-Lab stays the acceptance gate.
- Reorganized `source/blender/stylized-human/StylizedHuman.blend` (owner-prompted by the
  link-the-rig request): its single default `Collection` split into `human` (22: `_Geo` +
  `Joints` armature + `Geo` empty) · `rig-helpers` (35: `_Att` + `_OuterCage` + `Cage`) ·
  `_scene-lights` (2). Organizational only, nothing deleted; rollback = its auto `.blend1` or
  the scratchpad backup. Lookdev then *links* `human` (relative path) as `ref_human-stylized`
  in place of the deleted primitive dummy — the file is Roblox's stylized-human R15 reference,
  6.43 studs (Rthro-class), confirming the 1 BU = 1 stud read.

## First-Principles Candidates

- The crown·field·plinth stacked-Part ladder is a *macro-trim* pattern — a trim sheet collapses a
  wall family to one MeshPart + one shared material, at the cost of entering the mesh path. →
  candidate home: decision (a trim-sheet pilot ADR, if the owner opts in)
- Plain `Texture`/`Decal` instances map the *whole* image per face and can never select a
  sub-rectangle, so trim sheets are structurally gated on MeshPart + `SurfaceAppearance` — the Part
  path and the mesh path are different texture grammars. → candidate home: brain capture (roblox-dev)
- Trim strips need seamlessness along U only — the ancient-tech wrap-edge delta check generalizes
  to a per-axis tool. → candidate home: none yet
- Blender's link-vs-append is decision-0001's by-reference treaty native to Blender: shared
  materials/templates (e.g. a trim-sheet material) should be *linked* libraries, never appended
  copies. → candidate home: mediums/3d convention (a "Blend-file organization" section)
- A Blender lookdev scene validates *authoring* (bakes, seams, UVs, albedo values); the in-Studio
  Part-Texture-Testing-Lab stays the *acceptance* gate — different renderers, so never approve an
  asset from a Cycles/EEVEE render alone. Two labs, one per pipeline end. → candidate home:
  mediums/3d convention + memory (extends [[part-texture-testing-lab]])
- The Blender MCP's `*_for_cli` variants fail without `BLENDER_PATH` in the MCP server's env
  (unset on this Mac); working headless path = Bash → `/Applications/Blender.app/Contents/MacOS/
  Blender --background --factory-startup` (factory-startup also avoids a port-9876 addon clash
  with the GUI instance). → candidate home: memory + blender-mcp-craft operational recipe

## Outputs

- In-chat lesson: trim-sheet mechanics, anatomy diagram (`trim_sheet_anatomy` widget), Roblox
  constraint map, tileable/trim/unique decision rules, pilot proposal.
- In-chat lesson 2 (follow-up): Blender collections — membership model, per-collection switches,
  instances + link/append, a production file layout mirroring the library's `_`-machinery zoning,
  export scoping, orphan-data gotchas.
- **Built `Assets/_tools/blender/lookdev.blend`** (headless CLI Blender 5.1.1, owner's GUI session
  untouched): 7 collections — rig_cameras 4 (3 cams + turntable) · rig_reference 6 (18% gray +
  chrome balls, 24-patch color checker, 1-stud cube, ~5-stud dummy, 40×40 ground) · rig_testgeo 4
  (beveled cube, cylinder, inside corner, doorframe) · light_neutral/dark/harsh (2/3/1, dark+harsh
  excluded by default) · review 0 (empty link slot); 29 materials, EEVEE, cam_threequarter 35 mm
  default. Proof renders verified for both light rigs; three-quarter cam re-framed after v1 crop.
- Lookdev v2: `ref_dummy-r15height` replaced by linked `ref_human-stylized` (collection instance
  of StylizedHuman's `human`; textured, feet-on-ground at (6.5, 8)); `test_doorframe` rebuilt to
  avatar scale (7×3 opening, 7.5 outer) after the linked reference exposed the 4-stud toy door —
  first concrete catch by the lab's own reference row. File 149.3 KB; both rigs re-proofed.
- Lookdev v3 (after an in-chat HDRI lesson): the cloudy-sky HDRI packed inside StylizedHuman
  (`HDR_029_Sky_Cloudy_Env.hdr`, 512×256, 333 KB) extracted byte-exact and **packed into lookdev**
  as a second World `world_sky-cloudy` (Env Texture + Mapping rotation knob, strength 1.0,
  fake-user pinned). Flat `lookdev_world` stays the saved default — worlds aren't
  collection-swappable and the dark/harsh rigs need the dim world. Proof render verified: chrome
  ball reflects the environment. File 365.3 KB, self-contained.

## Blockers

- none

## Next Action

Open `Assets/_tools/blender/lookdev.blend` and run its first real review — File → Link an asset
collection (e.g. the ship-lobby `Ship-Interior-Shell`, once it has content) into `review`. Standing
owner call carried forward: the ancient-tech trim-sheet pilot (1024² sheet + one doorway test mesh,
portal/openings artboards as design source) — or file the technique reference-only.

## Handoff Notes

- **Lookdev lab** (`Assets/_tools/blender/lookdev.blend`, 365 KB, self-contained): link asset
  collections into `review`; light rigs swap by view-layer exclude; worlds swap in the World
  dropdown (`world_sky-cloudy` = the packed HDRI option; flat stays default for the dark/harsh
  rigs). The linked human is read-only here — edit it in its source file. Full spec: the
  [[lookdev-lab]] memory. Rollbacks: each file's `.blend1`.
- **StylizedHuman.blend**: link the `human` sub-collection ONLY — `rig-helpers` renders as
  floating attachment cubes and cages.
- **Headless Blender**: MCP `*_for_cli` tools need `BLENDER_PATH` in the MCP server env (unset);
  meanwhile drive `/Applications/Blender.app/Contents/MacOS/Blender --background
  --factory-startup` directly. Promoting this into `Blender-Development/docs/recipe_*.md` is
  parked (cross-repo).
- `Assets/_tools/blender/` placement owner-blessed at close (2026-07-23).
- Natural lab extensions when production starts: batch glb exporter over an `export` parent,
  turntable spin, 2k Poly Haven sky.
