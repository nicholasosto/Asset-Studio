---
title: "Two-path asset delivery: npm lane and the Trembus-Game-Library Package"
status: proposed
updated: 2026-07-22
links:
  - { rel: references, target: decisions/0002-adopt-medium-and-mediumtype-as-the-asset-explorer-taxonomy }
  - { rel: references, target: decisions/0008-restructure-the-shared-assets-library-into-staging-library-r }
---

# Two-path asset delivery: npm lane and the Trembus-Game-Library Package

> **Status:** proposed (2026-07-22) — drafted for owner ratification; nothing below is applied to
> the Studio side yet.

## Context

The same asset corpus now ships to Roblox along **two parallel delivery paths**:

- **npm lane (code-first):** `@trembus/*` packages in `roblox-packages-mono` — git history,
  semver, review, Rojo sync into places.
- **Package lane (Studio-first):** `Workspace.Trembus-Game-Library` in the Soul Steel place
  (PlaceId 102596975485791) — a Folder under a `PackageLink`, **8,790 descendants** at the
  2026-07-22 census: Rigs 3,562 · 00-Subpackages 3,131 (three nested Packages: texture lab,
  UI lab, Beamaract VFX generator) · Environment 846 · Props 794 · Effects 281 ·
  Accessories 133 · Animations 35.

The owner's working intent is to rely on **Roblox Package versioning instead of git** as the
history story for the Package side. That intent is unratified — and the census shows the Package
already disagrees with the conventions layer both paths are supposed to share
(asset-conventions schema 1.5.0, grammar `[CAT]_[SUB]_[Name]_[Status]`, **domain is the folder,
never a name prefix**):

- **14 of 16 rigs are off-grammar** — domain-as-prefix names (`Robot_*`, `Void_*`, `Spirit_*`,
  `Blood_*`, `Decay_*`) in a flat `Rigs` folder with no domain subfolders, one prefix that is
  not a domain at all (`Anime_`), and no status tokens anywhere (full table in the appendix).
- **Hygiene drift no git-side probe can see:** an empty no-hyphen `TrembusGameLibrary` husk
  sitting beside the real Package, and the `Animations/Mechinisms` typo.

None of this was catchable by the planning layer's existing tooling, because the Package's
contents never land in any repo the tooling reads. That is the forcing fact: **whatever the
history story is, today there is none** — drift accrues invisibly between Package publishes.

## Decision

Three calls, proposed together:

1. **Scope — the editor decides the lane.** Anything fundamentally a script or system
   (ModuleScripts, controllers, build logic) belongs to the **npm lane**: it needs diffs, review,
   blame, semver. Instance-first content (rigs, props, environment, accessories, animations,
   effect rigs) belongs to the **Package lane**: Studio is its natural editor and Package
   publishes are its natural distribution. The seam case — code living *inside* the Package,
   e.g. the Beamaract generator's ~9.4 KB entry module — may keep living there, but its source
   must also have a git home; Package versioning alone is never an acceptable history for code.

2. **History — Package versioning is distribution, not history.** It is accepted for what it
   actually provides: cloud snapshots per publish, revert, propagation to consuming places. It is
   rejected as the *sole* history story: no diffs, no blame, no review gate, no offline copy,
   opaque binary snapshots, account-scoped access. Verdict: **supplement, don't replace.** The
   Package stays the live working copy and distribution vehicle; git stays the history-of-record
   via the manifest lane below.

3. **Drift detection — a manifest snapshot, not full syncback.** One `execute_luau` structural
   summarizer computes a manifest in-Studio (name/class/child/descendant tree plus a
   grammar-conformance report against the taxonomy enums) and the result is committed to the
   planning repo as a dashboard contract under `previews/dashboards/`. Run it before each Package
   publish and on demand. Diffing the manifest in git *is* the history; violations surface as
   report entities. Full Rojo syncback of the library (the proven roblox-labs pattern) is
   **deliberately not adopted** at 8,790 descendants until the manifest lane proves insufficient.

## Consequences

- The owner keeps the Studio-native visual workflow; publishes become meaningful, *inspectable*
  checkpoints rather than the only checkpoints.
- Structural accountability (diff/blame/review of the tree and naming) arrives at roughly
  manifest cost — a fraction of syncback — and full-fidelity history remains available as an
  upgrade path rather than a prerequisite.
- The rig conformance table (appendix) becomes the first remediation pass executed *under* this
  decision: pre-computed, one `ChangeHistoryService` recording, one owner call still open
  (whether any rig is `_FNL` rather than `_BLK`). `Anime_Female` is resolved (2026-07-22): it is
  a **test dummy** — domain-neutral tooling, so it files under `shared/`. A dedicated `other`
  domain stays unminted unless genuinely unclassifiable assets accumulate, and then only via the
  asset-conventions registration chain (schema bump + changelog), never ad hoc.
- No manifest tooling lands until this decision is ratified (one-concern gate discipline).
- What gets harder: two lanes plus a manifest is more moving parts than "just trust Package
  versions" — the cost of making drift visible is owning the probe that sees it.

## Options considered

- **Package versioning as the whole history story** (the unratified intent) — rejected: it cannot
  answer *what changed, when, by whom, was it reviewed*; the 14/16 rig drift accrued invisibly
  under exactly this regime.
- **Full Rojo syncback of the library** — rejected for now: proven in the labs lane, but heavy
  for 8,790 descendants, and the question that actually needs answering (structural drift) is
  answered by the manifest at ~1% of the cost. Re-open trigger below.
- **Single path — fold content into the npm lane** — rejected: forces Instance-first content
  through code tooling; Studio-first editing is the point of having the Package at all.
- **Do nothing (parallel paths, no contract)** — rejected: the paths already disagree; the
  evidence shows silence is not neutrality, it is accrual.

## Evidence appendix — rig conformance census (2026-07-22)

Live-verified in Edit mode; preserved here because the session brief that carried it is
disposable. Target = domain subfolder under `Rigs`, then rename. 2 of 16 conformant.
**Executed 2026-07-22** in a single MCP execution (its undo wrapper supplied the recording; an
explicit `TryBeginRecording` was declined as one was already active): 16/16 moved and renamed,
`Mechanisms` typo fixed, zero strays left under `Rigs`. Lands in the next parent publish (→ v16).

| # | Current | → Folder | → Name | SUB confidence |
|---:|---|---|---|---|
| 1 | `RIG_MCH_DroneBot_BLK` | `robotic/` | *(conformant)* | — |
| 2 | `RIG_MCH_TankBot_BLK` | `robotic/` | *(conformant)* | — |
| 3 | `Anime_Female` | `shared/` (test dummy) | `RIG_HUM_AnimeFemale_BLK` | high |
| 4 | `Blood_Toad` | `blood/` | `RIG_HUM_BloodToad_BLK` | probed R15 |
| 5 | `Decay_Zombie` | `decay/` | `RIG_HUM_Zombie_BLK` | high |
| 6 | `Decay_Zombie_Hipster` | `decay/` | `RIG_HUM_ZombieHipster_BLK` | high |
| 7 | `Robot_Evil_Hal` | `robotic/` | `RIG_MCH_EvilHal_BLK` | probed — MCH by nature |
| 8 | `Robot_Freddy_Faz` | `robotic/` | `RIG_MCH_FreddyFaz_BLK` | high |
| 9 | `Robot_Monkey_Mecha` | `robotic/` | `RIG_MCH_MonkeyMecha_BLK` | high |
| 10 | `Robot_Steambot` | `robotic/` | `RIG_MCH_Steambot_BLK` | high |
| 11 | `Robot_Worker` | `robotic/` | `RIG_MCH_WorkerBot_BLK` | high |
| 12 | `Spirit_Dragon_Boy` | `spirit/` | `RIG_HUM_DragonBoy_BLK` | probed R15 |
| 13 | `Spirit_Dragon_Girl` | `spirit/` | `RIG_HUM_DragonGirl_BLK` | probed R15 |
| 14 | `Spirit_Elemental` | `spirit/` | `RIG_HUM_Elemental_BLK` | probed R15 |
| 15 | `Void_Master` | `fateless/` | `RIG_HUM_VoidMaster_BLK` | high |
| 16 | `Void_Wendigo` | `fateless/` | `RIG_HUM_Wendigo_BLK` | probed R15 |

Probed 2026-07-22, post-republish (library v15, sub-packages v3 · v3 · v5, 9,020 descendants):
all six uncertain rigs are standard 15-joint R15 bipeds, so the three `CRE` guesses were wrong —
`BloodToad`, `Elemental`, and `Wendigo` are `HUM`. `EvilHal` stays `MCH`: the SUB classes by
nature (mechanical), matching its five high-confidence robot siblings — topology cannot
distinguish a robot from a human and does not need to. **No rig in the library is `CRE`.**
All statuses assume `_BLK` until the owner says otherwise. Hygiene: the empty
`TrembusGameLibrary` husk is already gone (owner, 2026-07-22); still riding the future rename
recording: `Animations/Mechinisms` → `Mechanisms` and per-lab spatial bays.

## Cites

- Session brief census, live-verified 2026-07-22 (place/package identity, child table, rig table)
  — the brief is disposable; every load-bearing fact is preserved above.
- `~/Master-Managed/Repositories/Vault-Repositories/roblox-dev/skills/asset-conventions/` —
  `SKILL.md`, `references/02-filename-grammar.md`, `templates/taxonomy.yaml` (schema 1.5.0).
- Sibling planning space precedent: Roblox-Development-Studio decisions
  `0007-dual-lane-ts-luau` (lanes gated by one-concern proof) and `0008` (labs Rojo-syncback
  lane) — the manifest lane deliberately sits *below* 0008's fidelity on the cost curve.

## Re-open if

- The manifest misses a class of drift that turns out to matter (property-level changes, script
  bodies inside the Package) → graduate the library, or the affected subtree, to scoped Rojo
  syncback.
- The Package gains multiple concurrent editors → the review gate has to move Studio-side, and
  publish discipline needs its own decision.
- The npm lane starts carrying Instance content wholesale (or the Package starts carrying
  systems) → the scope rule in call 1 needs redrawing, not bending.
