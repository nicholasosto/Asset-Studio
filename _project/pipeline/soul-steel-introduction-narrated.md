---
title: "Soul Steel introduction (narrated)"
status: ship
updated: 2026-07-12
links:
  - { rel: references, target: workflows/lore-creation }
  - { rel: references, target: workflows/audio-production }
---

# Soul Steel introduction (narrated)

> **Status:** ship (2026-07-12)

## Context

A canon-only **narrative introduction to Soul Steel** — deliverable class: *shippable text* —
an overture usable across media (trailers, session opens, in-game events), authored by
reference into the lore-brain graph and then rendered as **two full narration takes**, one per
narrator voice from [[pipeline/soul-steel-narrator-voices]] (the two-mix Ghost in the Grid
precedent: operator picks or keeps both).

Form: 420–520 words (~3–4 min at liturgical pace), single-voice-complete (one text renders
identically per narrator). Opens on/echoes Ashael's canon line **"What follows is
reconstruction, not memory"** — diegetically justifying the canon-only exclusions. One primary
tension tool: dread (the undeclared threshold). Cyber-gothic palette enforced.

**Exclusion checklist — canon-review signs every box against the final text:**

- [ ] No Void Domain (say "five fragments"; it remains speculative pending the owner's
      canonization decision)
- [ ] No seven-day "Age of Sundering" framing (speculative; conflicts with the canon
      single-moment Great Sundering)
- [ ] No Vesper the Unwritten (spoiler protection)
- [ ] No theme-song lyric quotation ("the lore is canon; the song is not")
- [ ] Dark dual-canon readings (Spirit complicity · Fateless-as-fuel · Entabular-as-administrator)
      not asserted as settled
- [ ] No Depot-Audit reserved questions pinned
- [ ] Four-theory mystery sets (Great Sundering · First Reincarnation · Fateless) presented AS
      open, or omitted — "deliberately no closure" is the canon posture
- [ ] Every proper noun traces to a canon note surfaced in the recall pass

Known continuity flag (surfaced, not resolved here): canon `The Epoch of Eternity` mentions an
"encroaching Void Domain" while the Void Domain itself is `speculative` — the intro routes
around it.

## Build plan

1. **Intro text (lore-creation)** — recall pass (shared with the narrator-voices pipeline) →
   author per the beat outline (Forging → Life unauthored → First draft and reset → the
   hope-title → the Sundering → the Domain Age → the Fateless → the turn) → canon review signs
   the exclusion checklist → reciprocal links (beat-source engrams + both narrator personas +
   hub).
2. **Narration (audio-production)** — `generate_tts` (eleven_v3) once per narrator voice_id →
   operator auditions (≤2 takes per voice before revising text/tags) → finalize + place to
   lore-brain `Media/audio/soul-steel-intro-<narrator-slug>-v1.mp3` (bound destination,
   persona-bound precedent; Media/audio carries no `_BLK` token — deviation from the leaf's
   finalize step, recorded here) → `sensory_assets` wired on the intro engram, `modalities` →
   `[text, audio]`.

## Exit criteria

- Intro engram canon-reviewed with **every exclusion checkbox signed** by the operator.
- Two narration takes filed in lore-brain `Media/audio/`; `sensory_assets` paths resolve;
  engram `modalities: [text, audio]`.

## Runs

```json
[
  {
    "id": "run-1",
    "label": "Introduction authored (lore-creation)",
    "status": "done",
    "startedAt": "2026-07-12",
    "trigger": "Narrator-voices initiative kickoff (owner request)",
    "note": "Brief = this pipeline's Context (form, beat outline, exclusion checklist). Lore-lock gate skipped: shippable text, not an asset-bound persona.",
    "stepOutcomes": [
      { "step": "write-brief", "status": "done" },
      { "step": "recall-pass", "status": "done" },
      { "step": "author", "status": "done" },
      { "step": "canon-review", "status": "done" },
      { "step": "reciprocal-link", "status": "done" },
      { "step": "lore-lock-gate", "status": "skipped" }
    ],
    "outputs": [
      { "label": "Concepts/Soul Steel — The Watch Beyond the Wall (Introduction).md (lore-brain)", "kind": "doc" }
    ]
  },
  {
    "id": "run-2",
    "label": "Two narration takes (audio-production)",
    "status": "done",
    "startedAt": "2026-07-12",
    "trigger": "Follows run-1 canon review + narrator voices existing",
    "note": "eleven_v3, full 495-word text verbatim, no audio tags. Ashael take via the ElevenLabs Player MCP (transport timed out; render recovered from account history — billed once). Custodian take via the web app produced two generations from one render; operator kept both (two-mix precedent; canonical cut = operator pick, open). stage-out deviation: browser downloads moved straight to lore-brain Media/audio/ — _inbox untouched; validate-ids skipped (nothing in the shared library). sensory_assets wired on the intro engram + both narrator engrams.",
    "stepOutcomes": [
      { "step": "write-brief", "status": "done" },
      { "step": "generate", "status": "done" },
      { "step": "stage-out", "status": "done" },
      { "step": "review-take", "status": "done" },
      { "step": "finalize", "status": "done" },
      { "step": "place-asset", "status": "done" },
      { "step": "validate-ids", "status": "skipped" }
    ],
    "outputs": [
      { "label": "soul-steel-intro-ashael-v1.mp3 (lore-brain)", "kind": "doc" },
      { "label": "soul-steel-intro-custodian-v1.mp3 (lore-brain)", "kind": "doc" },
      { "label": "soul-steel-intro-custodian-v2.mp3 (lore-brain)", "kind": "doc" }
    ]
  }
]
```
