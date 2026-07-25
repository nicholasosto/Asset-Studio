---
name: trembus-image
version: 0.1.0
description: "Consistent raster image generation and macOS asset tagging for icons, ability icons, UI icons, menu icons, badges, map markers, status icons, seamless tileable part textures, particle flipbook textures, beam strip textures, item card art, portrait busts, journal illustrations, banners, transparent overlays, square PNG assets, and raster cutouts. Use when an agent should apply stable output defaults such as transparent background, square composition when appropriate, PNG delivery, Finder comments, xattr metadata, and house-style or named-style presets with native image generation, including Roblox-like but mature stylization via the `robloxify` style pack and Roblox-ready textures for `Texture`, `ParticleEmitter`, and `Beam`. Use especially for explicit $trembus-image requests or when tagging saved Trembus raster assets on macOS. Do not use for true SVG/vector output or for matching an existing SVG or icon library."
---

# Trembus Image

Generate raster assets with stable Trembus defaults, especially icon-like assets that should land as transparent square PNGs. Use the built-in `image_gen` tool for generation and editing in this workflow.

> **Skill version: 0.1.0.** This skill owns raster craft, presets, prompt construction,
> image-level validation, and optional macOS metadata. It does not own a project's output
> directory, filename grammar, maturity status, registration, or promotion gate.

## Nested batch mode

When `asset-studio-batch` invokes this skill for raster craft, the immutable batch contract remains
the authority. Use the relevant preset and prompt guidance through generation, write each candidate
to the contract's exact bound path/name, and return control to the batch workflow. Do not select a
final, transform a candidate, apply final-asset metadata, run final-asset validation, file into the
shared library, register, or promote. In nested batch mode, stop before workflow steps 7–9 below.

## Runtime execution

- In Codex, use the built-in `image_gen` tool for pixel generation and editing.
- In Asset-Studio Claude sessions, use this skill to author or review raster constraints, then hand
  generation to `asset-studio-batch` in Codex. Claude is the planner/reviewer for this workspace and
  must not claim a generated candidate.
- In another runtime, use an explicitly available image-generation tool only when the workspace
  authorizes it. If none exists, return the prepared prompt/contract and name the handoff instead
  of simulating output.

## Workflow
1. Route the request first.
   - If the user explicitly wants SVG/vector output, or wants to match an existing SVG/icon system, stop using this skill and recommend a future vector path such as `trembus-svg`.
   - If the user wants to tag or normalize metadata on an existing Trembus raster asset, skip generation and go straight to the metadata step.
   - If the user wants a raster deliverable, continue.
2. Choose the asset preset.
   - If the request sounds like an icon, ability icon, UI icon, overlay icon, transparent cutout, or square PNG asset, use the `icon` preset from `references/presets.yaml`.
   - If the request clearly maps to a specialized preset such as `menu-icon`, `badge-emblem`, `map-marker`, `tab-icon`, `status-effect-icon`, `tileable-part-texture`, `particle-flipbook-texture`, `beam-strip-texture`, `item-card-art`, `portrait-bust`, `journal-illustration`, `banner-key-art`, or `transparent-cutout`, use that preset instead of the generic `icon` preset.
   - Otherwise use `raster-default`.
3. Resolve style in this order.
   - Explicit user style text
   - Named style preset from `references/presets.yaml`
   - `default-house`
4. Ask a question only on blockers.
   - Missing subject
   - Conflicting constraints such as a transparent icon plus a detailed scenic background
   - Explicit vector output
   - Do not ask only because style is missing.
5. Build the prompt around the chosen preset.
   - State the raster deliverable, subject, intended use, style, composition, background behavior, text policy, and avoid items.
   - For the `icon` preset, always say transparent background, centered silhouette, generous padding, square frame, PNG final, and no text unless requested.
   - For `tileable-part-texture`, read `references/roblox-texture-tiling.md` and frame it as a Roblox `Texture` request, not a `Decal` request.
   - For `tileable-part-texture`, always say seamless on all four edges, flat material sample, square PNG by default, and no single framed focal object unless requested.
   - For `particle-flipbook-texture` and `beam-strip-texture`, read `references/roblox-vfx-textures.md`.
   - For `particle-flipbook-texture`, always say transparent PNG, explicit flipbook grid, consistent frame spacing, and no outer decorative frame.
   - For `beam-strip-texture`, always say transparent PNG, horizontally oriented strip, repeat-safe or scroll-safe left/right edges, and no centered emblem that breaks looping.
   - Treat "vector-like" only as a visual style for a PNG deliverable.
6. Generate or edit through the runtime branch above.
   - If the user wants to edit a local file, inspect it first with `view_image` so the target image is visible in the conversation.
   - Use one targeted revision at a time if the first result misses transparency, silhouette clarity, or square framing.
   - Do not silently accept drift from the preset.
7. Save the selected final deliberately.
   - Project-bound routing and filenames are owned by the active project, not by this skill.
   - Before moving or copying a project-bound asset, read the current workspace instructions and invoke `roblox-dev:asset-conventions` when the target is the Trembus shared Assets library or a Roblox consumer.
   - The current shared-library root is `~/Master-Managed/Assets/`. Reviewed human-directed work routes to its production zone; only unattended or genuinely unclassified tool drops use `_inbox/<modality>/`.
   - New shared UI and texture assets default to `_BLK`; `_FNL` requires an explicit owner declaration that the asset is upload-ready. Exact target slots and prefix vocabularies belong to `asset-conventions`, not this skill.
   - In Asset-Studio, `asset-studio-batch` and the active immutable contract own candidate and work paths. Never substitute this skill's standalone fallback for that contract.
   - Do not use this skill's preset/style/subject fallback grammar for project-bound assets when a project convention exists.
   - If the request is preview-only, the generated file can remain in the default generated-images area.
   - If there is no project convention to follow and the user still wants a saved standalone Trembus asset, use the standalone fallback in the Filenames section.
8. Apply macOS metadata to saved project assets.
   - Read `references/metadata.md` for the minimal xattr and Finder comment standard.
   - For project-bound outputs on macOS, run `python3 scripts/write_asset_metadata.py <path> --preset <preset> --style <resolved-style-or-style-text>` after saving the final file.
   - Let the helper derive `transparent` and `aspect` from the chosen preset unless the actual saved asset intentionally differs from the preset default.
   - Pass `--transparent` or `--aspect` only when the request or saved output overrides the normal preset contract.
   - Use named style preset slugs when they exist.
   - If no named or freeform style applies, omit `--style` so the metadata helper uses `general`.
   - If the style is freeform user text instead of a named pack, the helper normalizes it into a stable kebab-case `custom-...` slug for metadata consistency.
   - For `particle-flipbook-texture` and `beam-strip-texture`, let the helper write VFX sidecars with `--sidecar auto` or `--sidecar both`.
   - The VFX sidecars should capture Trembus starting configuration values and Roblox usage notes in `.trembus.json` and `.trembus.md`.
   - Skip metadata only for throwaway previews or when the user explicitly does not want Finder/xattr tagging.
9. Validate project-bound icon outputs.
   - Run `python3 scripts/validate_icon_asset.py <path>` after saving the final file locally.
   - If the check fails, iterate with a corrective pass instead of hand-waving it away.

## Presets
Read `references/presets.yaml` when choosing asset or style defaults.

Asset presets:
- `icon`: default for icon-like requests
- `menu-icon`
- `badge-emblem`
- `map-marker`
- `tab-icon`
- `status-effect-icon`
- `tileable-part-texture`
- `particle-flipbook-texture`
- `beam-strip-texture`
- `item-card-art`
- `portrait-bust`
- `journal-illustration`
- `banner-key-art`
- `transparent-cutout`
- `raster-default`: fallback for other raster assets

Style presets:
- `default-house`
- `flat-glyph`
- `painted-fantasy`
- `clean-ui`
- `clean-sci-fi`
- `cozy-flat`
- `heroic-ornate`
- `parchment-adventure`
- `neon-arcade`
- `tactical-mono`
- `robloxify`

Style resolution order:
- Explicit user style text
- Named style preset
- `default-house`

## Prompt Template
Use concise lines like these and omit any line that is not needed:

```text
Use case: raster icon
Asset type: ability icon
Primary request: <what to depict>
Style/medium: <explicit style text or resolved style preset>
Composition/framing: centered single subject, generous padding, clear silhouette in a square frame
Background: transparent
Output: PNG with alpha, square raster deliverable
Text: none unless explicitly requested
Constraints: <must keep or must avoid>
Avoid: <negative constraints>
```

For non-icon requests, adapt the same structure to the chosen asset preset rather than forcing icon framing.

For seamless Roblox part textures, prefer:

```text
Use case: tileable-part-texture
Asset type: Roblox part texture
Primary request: <material or pattern to repeat>
Style/medium: <resolved style or material direction>
Composition/framing: flat orthographic texture sample, no scene framing, square by default
Background: fully filled texture sample
Output: seamless square PNG intended for a Roblox Texture, not a Decal
Constraints: seamless on all four edges, no baked directional lighting, repeat-safe variation
Avoid: centered emblem, perspective view, frame border, visible seam
```

For Roblox VFX textures, prefer:

```text
Use case: particle-flipbook-texture
Asset type: Roblox ParticleEmitter flipbook
Primary request: <effect to animate>
Style/medium: <resolved style or effect direction>
Composition/framing: square transparent flipbook sheet with a clear frame grid
Output: transparent PNG for ParticleEmitter flipbook use
Constraints: readable frame progression, consistent spacing, no decorative outer border
Avoid: uneven frame sizing, frame bleed, opaque background, sheet framing art
```

```text
Use case: beam-strip-texture
Asset type: Roblox Beam texture
Primary request: <beam pattern or energy style>
Style/medium: <resolved style or effect direction>
Composition/framing: wide horizontal transparent strip
Output: transparent PNG for Beam use
Constraints: repeat-safe or scroll-safe left/right edges, alpha-shaped top/bottom profile, no perspective
Avoid: centered emblem, opaque background, vertical composition, broken looping
```

## Validation
The validator uses macOS `sips` only and checks:
- format is `png`
- width equals height
- alpha channel exists

It does not crop, resize, or rewrite files.

## Metadata
Use the minimal macOS metadata standard in `references/metadata.md`.

Required custom xattrs for saved project assets:
- `com.trembus.asset-preset`
- `com.trembus.style-pack`
- `com.trembus.transparent`
- `com.trembus.aspect-ratio`

Finder comment format:
- `trembus; preset=<preset>; style=<style>; transparent=<yes|no>; aspect=<aspect>`

Keep the metadata compact and standardized. Do not write long prompt text into Finder comments.
Always write metadata through `scripts/write_asset_metadata.py` instead of hand-writing xattrs so metadata values stay canonical.
For `particle-flipbook-texture` and `beam-strip-texture`, prefer sidecar metadata with recommended Roblox configuration values and usage notes.

## Filenames
Project-bound filenames are not defined by this skill. Always prefer the active workspace convention, and read any repo-local asset naming rules before saving.

For `~/Master-Managed/Assets/`, invoke `roblox-dev:asset-conventions` and follow its current
zone, prefix, status, registration, and promotion rules. This skill intentionally carries no
duplicate destination table.

Standalone fallback only:
- If no project convention exists and the user still wants a saved standalone Trembus asset, derive the basename with `scripts/derive_asset_filename.py`.
- Fallback contract: `<preset>-<style>-<subject>.<ext>`
- Sidecars must keep the same basename as the saved image, whatever convention produced that basename.

## Examples
- `$trembus-image create an icon for this ability`
- `$trembus-image create an icon for this ability in a painted fantasy style`
- `$trembus-image create and save a menu icon for settings in clean-sci-fi with metadata`
- `$trembus-image apply Trembus metadata to this saved menu icon`
- `$trembus-image create a menu icon for settings in clean-sci-fi`
- `$trembus-image create a portrait-bust in robloxify that feels mature, not childish`
- `$trembus-image create a seamless tileable part texture for a Roblox Texture`
- `$trembus-image create a particle flipbook texture for a Roblox ParticleEmitter`
- `$trembus-image create a beam strip texture for a Roblox Beam`
- `$trembus-image save this beam strip texture with Trembus sidecar metadata`
- `$trembus-image save this particle texture into the current asset repo with metadata`
- `$trembus-image create a badge-emblem for mastery in heroic-ornate`
- `$trembus-image create a journal illustration for an explorer's map in parchment-adventure`
- `$trembus-image make a transparent overlay cutout of this object`
- If the user says `make this as an SVG`, stop and recommend the future vector skill instead.
