---
title: "Assets by medium; the Foundry decides"
status: accepted
updated: 2026-08-17
links:
  - { rel: supersedes, target: decisions/0008-restructure-the-shared-assets-library-into-staging-library-r }
  - { rel: supersedes, target: decisions/0010-templates-split-by-authorship-exemplars-get-a-library-templa }
  - { rel: references, target: decisions/0001-reference-the-shared-asset-library-via-external-locations }
  - { rel: references, target: decisions/0002-adopt-medium-and-mediumtype-as-the-asset-explorer-taxonomy }
  - { rel: references, target: decisions/0011-explorer-asset-actions-dev-only-move-endpoint-warn-don-t-wri }
  - { rel: references, target: mediums/image }
---

# Assets by medium; the Foundry decides

> **Status:** accepted (2026-08-17) — Nick's call, recorded in the Foundry as `asy-20260817-091725`.
> The disk followed the same day (`wake-20260817-1055`). This ADR records the decision on the
> Asset-Studio side; it does not make it.

## Context

Six weeks after [[0008-restructure-the-shared-assets-library-into-staging-library-r]] the shared
library had grown a second rulebook beside the first. The Foundry (`~/Master-Managed/Foundry`)
began measuring the tree in August: its drift pen judged `~/Master-Managed/Assets` and found the
July zones answering to no law it could state — `ui/ textures/ concept-art/ templates/ models/
source/` were mediums, roles and lifecycle stages interleaved again, one level down from where 0008
had untangled them. Two measurements forced the call:

- **425 live files carried a status token, 409 of them `_BLK`**, and six md5 pairs proved `_FNL`
  files byte-identical to `_BLK` files beside them. The token was not tracking anything the upload
  registry (`_catalog/roblox-upload-registry.jsonl`, keyed by path + sha) did not already know.
- Between the law landing in the Foundry and the disk following, **100 governed files pinned as
  drift** — every one by design, because the folders they sat in no longer existed in the rulebook.

The owner's rule, in his words: *by medium first, no status in a name; the Foundry decides.*

## Decision

**The Foundry decides the tree and the names** — `Foundry/Core.html` `FOLDERS_ASSETS` · `NAME_RULES`
(`kebab-media`, `tgl-asset`), measured by `Foundry/tools/scan-drift.mjs`. Asset-Studio's documents
are routing guides and pointers, not the law; the `roblox-dev:asset-conventions` skill is the
routing guide agents load first.

1. **Nine doors, by medium.** `image/ audio/ video/ 3d/ runtime/` hold the media; `_inbox/
   _catalog/ _tools/ _archive/` are the machinery. Place by kind: the first segment is the medium,
   the folders below it are role and purpose. Project is never a folder — the subject goes in the
   name (`ability-blood-pact.png`, not `soul-steel/abilities/blood-pact/icon.png`).
2. **Two laws and one no-law.** `image/ audio/ video/` answer to **kebab-media** — `{slug}.{ext}`,
   lowercase, digits, hyphens, one dot. `runtime/roblox/` answers to **tgl-asset** —
   `{CAT}_{SUB}_{Name}.rbxm`, no status tail (`PRP_FNC_SentryTurret.rbxm`). `3d/` has **no law**:
   the DCC owns the names.
3. **Status tokens are gone from every live name and replaced by nothing.** `_BLK _ALPHA _BETA
   _FNL` say how far a thing got; a name says what a thing is. What shipped is the upload
   registry's to say. There is no "default `_BLK`" and no promotion-by-rename; acceptance is a
   gate recorded in the owning pipeline, never a filename. `_archive/` is the only place a token
   still lives, because a retired drop keeps the name it arrived with.
4. **`_inbox/<medium>/` is the only landing zone for unattended tool output** — `image/ audio/
   video/ 3d/`, the same four words as the doors. Land free, leave filed. Humans route authored
   work straight to its door.
5. **A folder below `image/` layer 1 is earned by a Foundry contract.** Layer 1 is where a thing is
   consumed (`ui/ textures/ concept/ reference/ source/pixelmator/`); layer 2 exists only where a
   form or spec names it — today `ui/icon/` (`forms/ui-icon.form.json`) and `textures/tile/`
   (`build-specs/tileable-part-texture.spec.json`). Everything else sits flat with the subject in
   the name; a package (a board with its index, six skybox faces, a frame run + slice map) stays
   whole as its own folder.

The disk followed under one manifest, `Assets/_catalog/migration-2026-08-17.csv` — 634 files moved,
10 deleted, 143 empty dirs pruned, every sha256 equal after; the upload registry re-keyed by a new
`relocate` subcommand (36 of 36); Asset-Studio's own pointers re-pointed in `2a25744`. Drift went
100 → 3 and none of the 3 is assets.

## Consequences

- **Supersedes 0008 whole** — the zones (`_inbox · _catalog · _tools · _archive` + `audio
  concept-art models textures ui` + `source` + `runtime`) and its rule 1 ("filename tokens say how
  done", `_BLK → _FNL` promotion-by-rename). Its manifest-driven migration harness survives and ran
  this move; its per-project rule survives as rule 1 above, stronger (project is never a folder).
- **Supersedes the library half of 0010.** The `Assets/templates/<set>/` zone dissolved into
  `image/reference/` — flat, generator-fed exemplars with the set in the name. The authored SVG
  masters keep their home in this repo's `templates/`, and the "template registry is the
  authoritative index" claim in [[mediums/image]] is retired: that table is a bindings index for the
  workflows that cite it, and where a file lives is the Foundry's to say.
- [[0011-explorer-asset-actions-dev-only-move-endpoint-warn-don-t-wri]]'s `_resort/` triage pen
  dissolved with the zone; the Explorer's move-to-triage now targets `_inbox/<medium>/`.
- **Asset-Studio docs are routing guides, not the law.** `AGENTS.md`, the mediums, the workflows
  and the open pipelines are re-pathed to the nine doors and stop naming a status token; where a
  document delegates paths or naming, it points at the Foundry, with `roblox-dev:asset-conventions`
  as the routing guide. Dated run records keep the paths they were written under.
- What gets harder: two repos to read for one library — the Foundry holds the law, this repo the
  process. The pointer is one sentence and lives in every routing doc; the price of one rulebook is
  that it lives in one place.

## Options considered

- **Keep 0008's zones and only strip the tokens** — rejected: the token sweep of 2026-08-16 had
  already run and the tree still pinned 100 files; the drift was structural, not nominal.
- **Keep status in the name but make it honest** — rejected by measurement: 409 of 425 tokens
  said `_BLK`, and `_FNL` files were byte-identical to `_BLK` files beside them. A field nobody
  updates is not a field.
- **Asset-Studio keeps a copy of the law** — rejected: two copies of one law drifted once already
  (0008's "~30 agent surfaces"). One measured rulebook, many pointers.

## Cites

- Foundry decision `asy-20260817-091725` (Nick's call, 2026-08-17) · Foundry wake
  `wake-20260817-1055` (the disk following) · `Foundry/CLAUDE.md`, the paragraph beginning *The
  drift pen reaches the estate* — all outside this repo.
- `~/Master-Managed/Assets/README.md` — the four rules and the nine-door map, as the library states
  them.
- `Assets/_catalog/migration-2026-08-17.csv` (+ `.log.json`) — the move manifest and receipt.
- Asset-Studio commit `2a25744` — the registry builder, Explorer and `asset-specs.json` re-pointed;
  `~/Master-Managed/_catalog/relink-2026-08-17-assets.log.json` — every pointer touched that day.
- [[0008-restructure-the-shared-assets-library-into-staging-library-r]] ·
  [[0010-templates-split-by-authorship-exemplars-get-a-library-templa]] — the superseded decisions;
  their bodies stay as history.

## Re-open if

The Foundry stops measuring the tree (a law nobody measures is prose again); a second platform
under `runtime/` needs a grain `tgl-asset` cannot express; or a real wall proves a status field is
needed in the name after all — in which case it returns as a measured field, not a token.
