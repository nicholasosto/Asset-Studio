---
title: "Character creation"
status: active
updated: 2026-07-11
links:
  - { rel: references, target: workflows/lore-creation }
  - { rel: references, target: workflows/image-generation }
  - { rel: references, target: workflows/audio-production }
  - { rel: references, target: workflows/3d-asset }
---

# Character creation

> **Status:** active (2026-07-11)

## Purpose

A lore-locked character taken from brain engram to a complete, roster-consistent asset set: the
six-stage visual ladder (lore-lock → concept → portrait → model sheet → detail passes → poses), an
optional audio identity, and a 3D handoff. This is a **composite** workflow per
[[0009-workflows-compose-by-call-and-handoff]] — `lore-lock` *calls* [[lore-creation]]'s terminal
gate; each visual stage is one *call* of [[image-generation]] with a stage template bound as the
composition reference (and lore-brain `Media/visual/` bound as the target slot); the audio stage
*calls* [[audio-production]]; `handoff-3d` *seeds* a [[3d-asset]] pipeline.

The ladder was distilled from the two characters who already ran it ad hoc (Penitent Knight,
Raspmutant, lore-brain `Media/visual/`). One `pipeline` instance per character tracks which
pieces exist and which are still owed.

## Stage ladder

| # | Stage (step id) | Deliverable | Template |
|---|---|---|---|
| 0 | `lore-lock` | engram carries visual tells (palette · silhouette · materials · one signature detail) | — checklist gate |
| 1 | `concept` | `<Name>_concept-v1.png` — full-body silhouette + read | `templates/character/concept.svg` |
| 2 | `portrait` | `<Name>_portrait-v1.png` — bust ¾, identity | `templates/character/portrait.svg` |
| 3 | `modelsheet` | `<Name>_modelsheet-front-v1.png` + `_side-back-v1` | `templates/character/turnaround.svg` |
| 4 | `details` | `<Name>_<item>-detail-v1.png` — props · materials | `templates/character/detail-callouts.svg` |
| 5 | `poses` | `<Name>_3d-poses-v1.png` / `_gameplay-*-v1` | `templates/character/pose-sheet.svg` |
| 6 | `audio-identity` *(optional)* | theme song · voice sample | — |
| 7 | `handoff-3d` | 3d-asset pipeline seeded; sheets are the model spec | — |

**Filename grammar:** `<Name>_<stage>-v<N>.png`, filed to lore-brain `Media/visual/`, referenced
back on the persona engram (`sensory_assets`).

## Templates

Stage templates live in `templates/character/` (this repo — process artifacts, not library
assets). Conventions extracted from the Penitent Knight sheets and the Raspmutant turnaround:
portrait/concept may use in-world atmosphere; every reference sheet uses the neutral studio-gray
background, same-scale views on a shared ground line; detail sheets use hero panels + close-up
column + material swatch row. Attach the stage template to each generation run as the
composition reference and treat it as the stage's definition-of-done.

Domain-skinned exemplar alternates for the modelsheet stage — five themed turnarounds (blood ·
decay · fateless · robot · spirit; no `shared` variant yet) — live in the library
`Assets/templates/turnaround-themes/` per ADR 0010; bind one in the brief when a domain-flavored
sheet serves the character better than the neutral master. The full index is
[[mediums/image]] § Template registry.

## Workflow

```json
{
  "caption": "A lore-locked character: six-stage visual ladder + optional audio identity + 3D handoff, one pipeline per character.",
  "lanes": [
    { "id": "lore", "label": "Lore (brain)", "kind": "human" },
    { "id": "gen", "label": "Generate", "kind": "ai" },
    { "id": "review", "label": "Review", "kind": "human" },
    { "id": "media", "label": "Media (file + link)", "kind": "system" },
    { "id": "handoff", "label": "Handoff", "kind": "tool" }
  ],
  "steps": [
    { "id": "lore-lock", "lane": "lore", "label": "Lore lock", "detail": "palette · silhouette · signature tells", "note": "The lore-brain engram is the source of truth. Before any art: confirm it carries visual tells (palette, silhouette, materials, one signature detail). If it doesn't, run lore-creation to add them there first — briefs quote the engram, never invent.", "status": "pending", "refs": [{ "rel": "references", "target": "workflows/lore-creation" }], "to": ["concept"] },
    { "id": "concept", "lane": "gen", "label": "Concept (_concept-v1)", "detail": "silhouette + read · T: concept", "note": "One image-generation run with templates/character/concept.svg as composition ref. Goal: the character reads at a glance — silhouette, palette, attitude.", "status": "pending", "refs": [{ "rel": "references", "target": "workflows/image-generation" }], "to": ["portrait"] },
    { "id": "portrait", "lane": "gen", "label": "Portrait (_portrait-v1)", "detail": "bust ¾ · T: portrait", "note": "One image-generation run, templates/character/portrait.svg as composition ref. 2:3 bust, eye-line on the upper-third guide. The only stage where an in-world atmospheric background is expected.", "status": "pending", "refs": [{ "rel": "references", "target": "workflows/image-generation" }], "to": ["modelsheet"] },
    { "id": "modelsheet", "lane": "gen", "label": "Model sheet (front · side-back)", "detail": "turnaround · T: turnaround", "note": "One image-generation run, templates/character/turnaround.svg as composition ref. Neutral studio-gray, relaxed A-pose, same scale across views, shared ground line. This pair is the primary 3D spec.", "status": "pending", "refs": [{ "rel": "references", "target": "workflows/image-generation" }], "to": ["details"] },
    { "id": "details", "lane": "gen", "label": "Detail passes (props · materials)", "detail": "T: detail-callouts", "note": "One image-generation run per signature item, templates/character/detail-callouts.svg as composition ref: hero panels + close-up column + material swatch row (the Penitent Knight helm-sheet layout).", "status": "pending", "refs": [{ "rel": "references", "target": "workflows/image-generation" }], "to": ["poses"] },
    { "id": "poses", "lane": "gen", "label": "Pose sheet (action + personality)", "detail": "T: pose-sheet", "note": "One image-generation run, templates/character/pose-sheet.svg as composition ref. Action and personality poses on neutral background — silhouette-check every cell.", "status": "pending", "refs": [{ "rel": "references", "target": "workflows/image-generation" }], "to": ["set-review"] },
    { "id": "set-review", "lane": "review", "label": "Set review — roster consistency", "note": "Gate: the set coheres with the templates AND the roster — crops match, palette matches the engram, and it reads as the same being in every deliverable.", "status": "pending", "to": ["file-media"] },
    { "id": "file-media", "lane": "media", "label": "File to lore-brain Media/visual", "detail": "<Name>_<stage>-v<N>.png + engram sensory_assets", "note": "File under the grammar, then link the set back on the persona engram so the brain knows its own face.", "status": "pending", "to": ["audio-identity", "handoff-3d"] },
    { "id": "audio-identity", "lane": "gen", "label": "Audio identity (optional)", "detail": "theme · voice — audio-production", "note": "Theme song / voice sample via the audio-production workflow. Optional lane — skip without blocking the 3D handoff.", "status": "pending", "refs": [{ "rel": "references", "target": "workflows/audio-production" }], "to": [] },
    { "id": "handoff-3d", "lane": "handoff", "label": "3D handoff → 3d-asset", "detail": "sheets are the model spec", "note": "Seed a 3d-asset run: the turnaround pair + detail sheets are the modeling spec; poses inform rig checks.", "status": "pending", "refs": [{ "rel": "references", "target": "workflows/3d-asset" }], "to": [] }
  ]
}
```
