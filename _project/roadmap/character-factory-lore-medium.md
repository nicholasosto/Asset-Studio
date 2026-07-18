---
title: "Character factory + lore medium"
status: active
updated: 2026-07-18
links:
  - { rel: references, target: workflows/character-creation }
  - { rel: references, target: pipeline/roguex-33-character }
  - { rel: references, target: mediums/lore }
  - { rel: references, target: decisions/0001-reference-the-shared-asset-library-via-external-locations }
---

# Character factory + lore medium

> **Status:** active (2026-07-11)

## Context

Two characters — Penitent Knight and Raspmutant — already ran a full character asset set by hand,
out of the lore-brain and into its `Media/visual/`, with no shared process. The studio needs that to
be **repeatable**: a lore-locked persona taken from brain engram to a roster-consistent asset set the
same way every time.

Standing that up is one initiative with two new pieces that only make sense together:

1. A cross-medium **`character-creation` workflow** — the six-stage visual ladder (lore-lock →
   concept → portrait → model sheet → detail passes → poses), an optional audio identity, and a 3D
   handoff, each visual stage one [[image-generation]] run with a `templates/character/` SVG as its
   composition reference.
2. **Lore as a first-class upstream medium** — the narrative capability every downstream medium
   projects from. By reference only: the lore-brain graph is to lore what the shared library is to
   files ([[0001-reference-the-shared-asset-library-via-external-locations]], second application).

[[roguex-33-character]] — the brain's most fully-realized persona yet with *zero* visuals (full canon,
two finished theme mixes) — is the pilot that proves both before they harden.

## Phases

The structured plan the Command Center renders as a Timeline. p0–p2 landed 2026-07-04; the pilot (p3)
is in flight, and graduation of both the workflow and the lore medium (p4–p5) waits on what it
surfaces.

```json
[
  { "id": "p0", "label": "Distill the visual ladder", "status": "done", "detail": "The six-stage ladder (lore-lock → concept → portrait → model sheet → detail passes → poses) extracted from the two characters who ran it ad hoc (Penitent Knight, Raspmutant) into the character-creation composite workflow — each visual stage one image-generation run with a stage template as composition ref, plus an optional audio-identity lane and a 3D handoff. Landed 2026-07-04; the workflow stays status:draft pending the pilot." },
  { "id": "p1", "label": "Lore as the fourth medium", "status": "done", "detail": "mediums/lore.md declared — the upstream, by-reference medium (engrams · briefs · shippable text); the lore-brain graph is its library, decision-0001's treaty in its second application. Feeds the character ladder at the lore-lock gate. Status experimental." },
  { "id": "p2", "label": "Stage templates", "status": "done", "detail": "templates/character/ SVGs (concept · portrait · turnaround · detail-callouts · pose-sheet) seeded from the Penitent Knight sheets + Raspmutant turnaround; each template is its stage's definition-of-done. png/ twins for attaching as composition refs." },
  { "id": "p3", "label": "Pilot — roguex-33", "status": "active", "detail": "Exercise the whole ladder on the brain's most lopsided asset gap via the roguex-33-character pipeline. Audio identity retro-credited done; lore-lock landed 2026-07-06 (a Visual Identity section canonized on the engram); concept done 2026-07-18 — two sheets filed from the salvaged 07-04 batches (counter-lean stall scene + clean silhouette), the wry-smirk face canon carried into portrait as its hard constraint; portrait stage active, batch awaiting the Codex trigger. Proves the tracking model (retro-credit, optional lanes) + the templates before the workflow graduates." },
  { "id": "p4", "label": "Set-review + graduate the workflow", "status": "planned", "detail": "Pass the pilot's set-review gate (roster consistency — reads as the same being across every deliverable), lock the conventions the pilot surfaces, and promote character-creation from draft → active. Seed the roguex-33 3D handoff (turnaround + detail sheets as the model spec)." },
  { "id": "p5", "label": "Ratchet lore experimental → supported", "status": "planned", "detail": "Once lore has been exercised across enough personas/realities to trust the quality bar (continuity pass · tone-match · honest canon_status · lore-lock discipline), promote mediums/lore.md from experimental → supported." }
]
```

## Open questions

- **Minimum viable character** — does every persona run all six visual stages, or is there a lighter
  subset for minor roster members? The `audio-identity` lane is already modeled optional; are
  `details` / `poses` similarly skippable without breaking the 3D handoff?
- **Set-review rigor** — roster consistency is judged by eye against the templates + the engram. Is
  the "reads as the same being" call enough, or does the gate need a written checklist to be
  repeatable across characters and operators?
- **Lore graduation bar** — how many exercised personas/realities is "enough" to promote the lore
  medium from `experimental` to `supported`? Roguex-33 is one; what's the count that earns the ratchet?
</content>
</invoke>
