# Environment and prop templates

Domain-neutral composition guides for prop-family exploration and encounter-environment design.
They are authored process artifacts: versioned SVG masters live here, and `png/` contains the
raster twins used as image-generation composition references.

| Template | Purpose | Dynamic bindings |
|---|---|---|
| `prop-family.svg` | One anchor prop, six related family roles, a shared scale lineup, and material/value swatches | subject family · palette · materials · shape language · motif · wear/age · interaction state · VFX behavior |
| `encounter-environment.svg` | Gameplay keyframe, top-down blockout, elevation, set-dressing clusters, and lighting/state keys for one encounter space | location/encounter · palette/value · materials/motifs · weather/VFX · story/damage state |

## Operating contract

1. Bind domain, faction, biome, character, mob, or prop-specific art direction in the brief. The
   masters deliberately contain no themed palette, iconography, architecture, or material language.
2. Attach the matching `png/` twin as the composition reference. If the image tool cannot accept an
   input image, restate every panel and binding constraint in the prompt.
3. The magenta lines are placement and review guides only. They never appear in generated output.
4. Review against structure before style: consistent scale and family resemblance on the prop sheet;
   agreement between keyframe, plan, and elevation on the encounter sheet.
5. The generated result is an exemplar or production brief artifact, not a replacement for these
   structural masters. File generated themed sheets according to their owning workflow and target slot.

Suggested filename grammar for generated outputs:

- `<Collection>_prop-family-v<N>.png`
- `<Location-or-Mob>_encounter-environment-v<N>.png`
