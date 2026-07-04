# Character stage templates

Composition/layout guides for the **character-creation** workflow
(`_project/workflows/character-creation.md`) — one per visual stage. These are **process
artifacts** of the studio, not library assets: they never ship, never enter the shared
`Assets/` library, and never appear in the asset registry.

Conventions were extracted from the first two ad-hoc character runs (Penitent Knight sheets,
Raspmutant turnaround — lore-brain `Media/visual/`), so the existing roster already complies.

| Stage | Template | Locks in |
|---|---|---|
| 1 concept | `concept.svg` | 2:3 · full body · silhouette-first · ground line |
| 2 portrait | `portrait.svg` | 2:3 · bust ¾ · eye-line upper third · atmospheric bg allowed |
| 3 modelsheet | `turnaround.svg` | neutral gray · A-pose · same scale · shared ground + head-ruler |
| 4 details | `detail-callouts.svg` | 3:2 · hero panels + close-up column + 5 material swatches |
| 5 poses | `pose-sheet.svg` | 2×2 idle/action/signature/personality · neutral gray |

## How to use

1. **As a composition reference** — attach the stage template (rasterize if the tool wants
   PNG: `qlmanage -t -s 1600 <file>.svg` or any SVG renderer) to the image-generation run, and
   state in the prompt that the guides define crop, scale, and background — *the magenta
   guide lines themselves must not appear in the output.*
2. **As the definition-of-done** — at review, overlay the template: crops match, eye-line
   sits on the guide, views share scale and ground line. If it doesn't line up, it revises.

Filename grammar for everything the stages produce: `<Name>_<stage>-v<N>.png`, filed to
lore-brain `Media/visual/` and linked on the persona engram (`sensory_assets`).

**Why templates at all:** they're what makes a roster read as one game — every portrait the
same crop, every turnaround the same grid — and they make prompting cheaper because layout is
pre-decided.
