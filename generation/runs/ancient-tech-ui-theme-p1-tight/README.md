# Ancient-Tech UI Theme — P1 Tight-Slice Repair

Status: **local `_BLK` corrective pass with P2 layout polish**. The original Studio gallery is
repaired and Play-verified. The prior states and the live A/B/C comparison remain recoverable.
Nothing was uploaded, registered, released, saved, or published.

## Root cause

The visible disjointing came from two independent faults.

### 1. Body and signal recipes had diverged

Several live specimens used different values or assets between their aligned layers:

- `StateIDLE` had different `SliceCenter` values and different `SliceScale` values.
- `StateSELECTED` used an uploaded experiment in place of the local body/signal pair.
- `Palette3` mixed an uploaded body with the local signal layer.
- `CompactSystemPanel` used different body and signal slice rectangles.

That guarantees visible separation because the two supposedly aligned images are stretched by
different transforms.

### 2. Transparent raster inset compounded runtime padding

The P0 PNGs also carried empty outer canvas:

| Recipe | P0 body margin, L/T/R/B | P1 body margin |
|---|---:|---:|
| Monument | 8 / 14 / 8 / 15 px | at most 2 px |
| Compact | 5 / 14 / 5 / 15 px | at most 2 px |
| Control | 42 / 18 / 43 / 18 px | at most 2 px |
| Title rail | 70 / 5 / 71 / 5 px | at most 2 px |

For controls, the nearly 85 pixels of combined horizontal dead space was especially damaging. The
effective gap became:

```text
transparent PNG margin
+ fixed 9-slice region
+ procedural backing inset
+ component content padding
= floating bands, exposed backing, and apparent overlap
```

## Correction

- Cropped each body/signal pair with one shared union crop.
- Kept every pair on the same pixel canvas.
- Recalculated `SliceCenter` against the cropped source dimensions.
- Enforced the same image family, `SliceCenter`, and `SliceScale` on both layers.
- Reduced procedural backing inset so it is the single structural inset.
- Preserved semantic content padding separately.
- Added eight new `_BLK` assets rather than overwriting P0.

Exact crop boxes, source sizes, slice recipes, content insets, and local URIs are in
[`theme-manifest.json`](theme-manifest.json).

## Local assets

```text
/Users/nicholasosto/Master-Managed/Assets/ui/frames/
  panel-ancient-tech-monument-tight-body_BLK.png
  panel-ancient-tech-monument-tight-signal_BLK.png
  panel-ancient-tech-compact-tight-body_BLK.png
  panel-ancient-tech-compact-tight-signal_BLK.png
  panel-ancient-tech-control-tight-body_BLK.png
  panel-ancient-tech-control-tight-signal_BLK.png
  titlebar-ancient-tech-rail-tight-body_BLK.png
  titlebar-ancient-tech-rail-tight-signal_BLK.png
```

They resolve through `rbxasset://trembus/ui/frames/...` and carry Trembus Finder/xattr metadata.

## Reproducible raster work

- Builder: [`build_tight_assets.py`](build_tight_assets.py)
- Validator: [`validate_tight_assets.py`](validate_tight_assets.py)
- Multi-size slice review:
  [`qa/ancient-tech-ui-tight-slice-sheet.jpg`](qa/ancient-tech-ui-tight-slice-sheet.jpg)
- Ready-to-copy layout: [`library/`](library/)

Validation result:

```text
PASS: 8 tight ancient-tech UI frame layers validated
```

## P2 layout polish

The follow-up pass changes layout only; it does not revise or replace the tight PNGs:

- Header title and subtitle are siblings of the ornamental rail, with a 16 px measured gap from
  the rail container and 12 px remaining before the next section.
- Palette cards clip a 2 px vertical overscan on both body and signal layers, consuming the PNG
  safety inset without exposing a top seam.
- The selected ability socket uses an 8 px inset highlight (68 x 68 inside the 84 x 84 layout
  cell), aligned to the visible compact-frame artwork.
- The pre-existing monument body-copy line wraps inside its existing 492 x 44 text box instead of
  clipping at the right edge.

## Studio state

Repaired gallery:

```text
StarterGui.AncientTechUIThemeLab
BuildStatus = Ready
PlayQAStatus = PASS-P2-layout
```

Disabled comparison:

```text
StarterGui.AncientTechUISliceRepairLab
```

Pre-repair snapshot:

```text
ReplicatedStorage.AncientTechUIRepairBackups.AncientTechUIThemeLab_PreTightRepair_20260724
```

Pre-layout-polish snapshot:

```text
ReplicatedStorage.AncientTechUIRepairBackups.AncientTechUIThemeLab_PreLayoutPolish_20260724
```

Runtime evidence:

```text
23 body/signal pairs repaired
46 image layers updated
47 / 47 total image instances loaded
0 body/signal slice mismatches
37 visible live-text labels
0 live-text overflow instances
3 / 3 requested layout corrections verified
0 console errors observed
```

Studio was returned to Edit mode. No explicit save or publish operation was invoked.

## Remaining design note

The tight 9-slice recipes are now coherent at the tested sizes. For extremely wide rails, the best
next refinement is a five-piece horizontal composition:

```text
left cap + stretch segment + fixed center ornament + stretch segment + right cap
```

That would keep the central mechanical keystone perfectly fixed instead of allowing it to stretch
inside a conventional 9-slice center band.
