---
title: "Soul Steel narrator voices"
status: ship
updated: 2026-07-12
links:
  - { rel: references, target: workflows/lore-creation }
  - { rel: references, target: workflows/audio-production }
---

# Soul Steel narrator voices

> **Status:** ship (2026-07-12)

## Context

Soul Steel media (trailers, session overtures, in-game events, downstream character pipelines)
needs a recurring narration identity — two lore-fitted ElevenLabs voices, one male-based, one
female-based, explicitly *not* typical documentary narrators. **No voice-ID registry exists
anywhere in the studio; this pipeline creates the convention** (a `## Named voices` section on
[[mediums/audio]]).

Personas (owner call, 2026-07-12): **Ashael, the Dreaming Scribe** (existing canon chronicler —
male-based voice, derived from its canon *Voice and Manner* spec: "layered: a primary tone
(warm, measured, slightly archaic) with ghost-echoes of the five original scholars") plus **one
new female-voiced counterpart** — an auditor/attendant of Reality Balance: Ashael voices *the
record (what was)*; she voices *the ledger (what remains)*.

**Canon constraints baked into the counterpart** (nameless-architects resolution):

- She carries an **office/title, not a name** — an office describes what the entity attends to
  without claiming to capture it (the canon's own move: "the architects").
- **Audience-only address** — she never speaks to anyone inside the universe, preserving the
  one-way-communication canon of the Exoverse. The audience structurally occupies the watcher
  position.
- She is an **emanation/instrument-tier entity** (the ledger given a voice), not a named
  architect; no architect schism is canonized (that remains an open Creative Hook).
- She is **deliberately distinct from Vesper the Unwritten** — Vesper is the hidden answer to
  the who-erases-Ashael mystery; a public narrator role would spoil it.

Voice creation runs through **elevenlabs.io Voice Design in the operator's browser** — the
connected ElevenLabs MCPs render TTS but cannot create voices. Design prompts derive from the
personas' Voice sections and are recorded verbatim on the engrams (Ghost in the Grid pattern).

## Build plan

1. **Persona pair (lore-creation)** — recall pass on the Exoverse / Reality Balance / Ashael
   neighborhood → author the counterpart engram (`canon_status: speculative`; title picked at
   canon-review from: *Keeper of the Threshold* · *The Custodian of the Ledger* · *The
   Attending*) → additive *Voice Design (ElevenLabs)* section on the Ashael engram (no canon
   rewrites) → canon review (operator) → reciprocal links (hub · [[Exoverse]] · Reality
   Balance). Lore-lock gate skipped: personas are audio-bound, no visual tell yet.
2. **Voice design (audio-production)** — brief = the two voice descriptions + persona-true
   audition lines; generate previews in elevenlabs.io Voice Design (operator's Chrome);
   operator auditions audibly and picks; save as `Soul Steel — <persona>`; capture permanent
   voice_ids.
3. **Registry** — create `## Named voices` on [[mediums/audio]] (voice name · voice_id ·
   design-prompt ref → persona engram · provenance); record prompts verbatim on both engrams.

## Exit criteria

- Two permanent ElevenLabs voice_ids exist (`search_voices` finds both `Soul Steel — …` names)
  and each renders audibly via `generate_tts`.
- `mediums/audio.md § Named voices` is live; both persona engrams carry Voice Design sections
  and reciprocal links; `canon_status` honest (counterpart stays `speculative` until promoted).

## Runs

```json
[
  {
    "id": "run-1",
    "label": "Narrator personas authored (lore-creation)",
    "status": "done",
    "startedAt": "2026-07-12",
    "trigger": "Narrator-voices initiative kickoff (owner request)",
    "note": "Brief = this pipeline's Context. Lore-lock gate skipped: audio-bound personas, no visual tell yet — a future portrait run reopens it.",
    "stepOutcomes": [
      { "step": "write-brief", "status": "done" },
      { "step": "recall-pass", "status": "done" },
      { "step": "author", "status": "done" },
      { "step": "canon-review", "status": "done" },
      { "step": "reciprocal-link", "status": "done" },
      { "step": "lore-lock-gate", "status": "skipped" }
    ],
    "outputs": [
      { "label": "Concepts/The Custodian of the Ledger.md (lore-brain)", "kind": "doc" },
      { "label": "Ashael engram § Voice Design (ElevenLabs) — additive (lore-brain)", "kind": "doc" }
    ]
  },
  {
    "id": "run-2",
    "label": "Voice design + permanent voices (audio-production)",
    "status": "done",
    "startedAt": "2026-07-12",
    "trigger": "Follows run-1 canon review",
    "note": "Generated via elevenlabs.io Voice Design in the operator's Chrome (connected MCPs cannot create voices); operator auditioned 3 previews per voice audibly and picked (Ashael: take 3; Custodian: take 2). stage-out deviation: previews/takes arrived via browser download, moved straight to the bound destination (lore-brain Media/audio/) — _inbox untouched. validate-ids skipped: nothing placed in the shared Assets library. Registry convention created: mediums/audio § Named voices.",
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
      { "label": "ElevenLabs voice ruxSNzODa3KpaHd5XW6j — Ashael - Soul Steel", "kind": "doc" },
      { "label": "ElevenLabs voice VSiMhzoGYAWmh67ySiCN — The Custodian of the Ledger - Soul Steel", "kind": "doc" },
      { "label": "mediums/audio § Named voices (registry, new convention)", "kind": "doc" },
      { "label": "soul-steel-ashael-voice-preview-v1.mp3 (lore-brain)", "kind": "doc" },
      { "label": "soul-steel-custodian-of-the-ledger-voice-preview-v1.mp3 (lore-brain)", "kind": "doc" }
    ]
  }
]
```
