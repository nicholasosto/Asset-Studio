# Ancient-Tech UI Component Concept Family

Status: `_BLK` visual-development reference. These sheets define a coherent component language; they
are not yet transparent, sliced, packed, uploaded, registered, or tested in Roblox Studio.

## Locked design language

- Obsidian ceramic carries the visual mass.
- A thin cool-iridium lip separates controls from the dark body.
- Black recessed gaskets create depth without relying on glow.
- Cyan is a state signal, not a base material: reserve it for focus, selection, progress, and power.
- Mechanical-iris segmentation, nested rails, and monumental corner blocks connect the UI to the
  portal and architectural trim family.
- Text, values, icons, runes, and localization remain live Roblox UI elements.

## Sheet roles

| Sheet | Role | Best production use |
|---|---|---|
| `ancient-tech-ui-foundation-components-01_BLK.png` | Frames, rails, buttons, tabs, corners, toggle | First 9-slice and control-state kit |
| `ancient-tech-ui-hud-components-01_BLK.png` | Unit status, meters, ability slots, targeting, objectives | HUD sprite atlases and composable meters |
| `ancient-tech-ui-terminal-components-01_BLK.png` | Modal, list, map, radial menu, tooltip, prompts | Terminal and navigation component library |

## Roblox translation

1. Redraw or carefully extract each chosen component onto transparency; do not ship the concept
   sheet's presentation background or shadows.
2. Build rectangular frames with wide content-safe centers and explicit 9-slice borders. Test narrow,
   square, and ultrawide instances before locking offsets.
3. Keep state geometry consistent. Prefer an emissive-edge change plus a small value shift over a
   complete material swap.
4. Pack fixed-size controls and HUD ornaments into purpose-specific atlases; keep large scalable panels
   as separate frame assets.
5. Add text, icons, numerical values, tooltips, and accessibility focus indicators in Studio so they
   remain legible, localizable, and responsive.

## Recommended first production slice

Start with the foundation sheet: one large panel, one compact panel, one divider/title rail, and one
button family with idle, hover, pressed, selected, and disabled states. That small kit will establish
the 9-slice offsets, scale rules, contrast floor, and cyan intensity before the more specialized HUD
and terminal pieces are authored.
