# Ancient-Tech UI Theme — P0 Implementation Slice

Status: **local `_BLK` proof slice**. The visuals, package architecture, and Studio specimen are
implemented and validated. Nothing in this slice was uploaded, registered, released, saved, or
published.

## Delivered

- Five logical visual primitives represented by nine PNGs:
  - monument panel: neutral body + white tintable signal
  - compact panel/slot: neutral body + white tintable signal
  - control/meter housing: neutral body + white tintable signal
  - title rail: neutral body + white tintable signal
  - quiet seamless obsidian background tile
- A typed theme/provider and image-backed primitive layer on the isolated package branch
  `codex/ancient-tech-ui-theme`.
- Theme conversions for `WindowPanel`, `AbilitySlot`, and `ResourceBar`.
- An owned Studio specimen at `StarterGui.AncientTechUIThemeLab`.

The body/signal split is the central design rule. Structural pixels remain obsidian and iridium;
the aligned white signal layer receives `ImageColor3` at runtime. Cyan, amber, focus, faction, and
accessibility palettes therefore reuse the same geometry instead of multiplying source images.

## Asset paths

The validated local assets are staged in the shared library:

```text
/Users/nicholasosto/Master-Managed/Assets/ui/frames/
  panel-ancient-tech-monument-body_BLK.png
  panel-ancient-tech-monument-signal_BLK.png
  panel-ancient-tech-compact-body_BLK.png
  panel-ancient-tech-compact-signal_BLK.png
  panel-ancient-tech-control-body_BLK.png
  panel-ancient-tech-control-signal_BLK.png
  titlebar-ancient-tech-rail-body_BLK.png
  titlebar-ancient-tech-rail-signal_BLK.png

/Users/nicholasosto/Master-Managed/Assets/ui/backgrounds/
  tile-ancient-tech-obsidian_BLK.png
```

Studio resolves them through `rbxasset://trembus/ui/...`. Exact slice centers, slice scales,
content insets, minimum reviewed sizes, palettes, and local URIs are in
[`theme-manifest.json`](theme-manifest.json).

## Reproducible raster work

- Sources: [`sources/`](sources/)
- Deterministic extraction: [`build_p0_assets.py`](build_p0_assets.py)
- Fail-fast checks: [`validate_p0_assets.py`](validate_p0_assets.py)
- Ready-to-copy library layout: [`library/`](library/)
- Body/signal palette review:
  [`qa/ancient-tech-ui-p0-extraction-sheet.jpg`](qa/ancient-tech-ui-p0-extraction-sheet.jpg)
- Multi-size 9-slice review:
  [`qa/ancient-tech-ui-p0-slice-sheet.jpg`](qa/ancient-tech-ui-p0-slice-sheet.jpg)
- Tile repeat review:
  [`qa/obsidian-tile-3x3-repeat.jpg`](qa/obsidian-tile-3x3-repeat.jpg)

Validation result:

```text
PASS: 9 ancient-tech UI raster assets validated
```

Finder comments and Trembus xattrs were applied with `raster-default` for the eight transparent
frame layers and `tileable-part-texture` for the opaque obsidian tile.

## Package slice

Isolated worktree:

```text
/private/tmp/ancient-tech-ui-theme.KSpBAi
```

Branch:

```text
codex/ancient-tech-ui-theme
```

New package surfaces:

- `UiTheme`, `UiThemeProvider`, `useUiTheme`
- `ThemedSurface`
- `ThemedPressable`
- `ThemedRail`

The Tactical Futurism appearance remains the image-free default, so current consumers retain their
existing visuals. Consumer games inject body/signal recipes; the package contains no game-owned
asset IDs.

Validation:

```text
pnpm --filter @trembus/rbx-ui build
Scan complete. profile=core, files=29, errors=0, warnings=0
git diff --check
```

The package has no `lint`, `typecheck`, `test`, or `smoke` scripts, so the generic package quality
runner cannot execute those absent gates. The actual roblox-ts build and the package compatibility
scan passed.

## Studio specimen

Current active Studio place:

```text
Soul Steel
PlaceId 102596975485791
```

Owned root:

```text
StarterGui.AncientTechUIThemeLab
```

The gallery demonstrates:

- monument, compact, control, title-rail, and tile recipes
- cyan, amber, and high-contrast palette substitution
- idle, hover, pressed, selected, locked, disabled, and focus treatments
- compact ability sockets and live-fill resource rails

Edit and disposable Play QA both passed. Runtime evidence:

```text
47 / 47 image instances loaded
9 unique local content paths
37 visible live-text labels
0 console errors observed during the specimen check
```

Studio was returned to Edit mode. No explicit save or publish operation was invoked.

## Cleanup and promotion boundary

- Remove the Studio proof by deleting only `StarterGui.AncientTechUIThemeLab`.
- Remove the local bundle by deleting only the nine named `_BLK` files above.
- Do not upload `_BLK` files.
- Do not substitute uploads, Asset Manager rows, or local `rbxasset://trembus` resolution for registry
  or release evidence.
- The next owner gate is visual approval. After approval, create reviewed production names/IDs,
  replace local URIs in a game-owned theme catalog, run registry promotion, and validate the
  uploaded assets in a separate Studio pass.
