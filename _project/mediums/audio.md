---
title: "Audio"
status: experimental
updated: 2026-07-12
links:
  - { rel: references, target: workflows/audio-production }
tags: { mediumType: audio-sfx, tool: elevenlabs, pattern: symlink }
---

# Audio

> **Status:** experimental (2026-07-12)

## Purpose

The studio's audio capability — music beds, SFX, and voice lines generated via ElevenLabs and filed into
the shared library. Process: [[audio-production]].

## Standard

`wav` / `mp3` / `ogg` / `flac`. Kebab-case descriptor + `_BLK`; categorized by zone
(`audio/{music, sfx, ui, ambient, voice}` — voice per-character subfoldered), per
[[0008-restructure-the-shared-assets-library-into-staging-library-r]].

## Tooling

ElevenLabs Player MCP (`generate_music` · `generate_sound_effect` · `generate_tts`); ElevenLabs Agents
for voice configuration.

## Output convention

Staged in `_inbox/audio/` (`tts/` · `voice-previews/` · `sfx/`); finalized into
`audio/{music, sfx, ui, ambient, voice}/`. Persona-bound audio places **by reference** into
lore-brain `Media/audio/` instead (Ghost in the Grid precedent).
**Pattern A** (symlink, zero-upload) per [[0001-reference-the-shared-asset-library-via-external-locations]].

## Named voices

The studio's ElevenLabs voice registry — permanent designed voices, their IDs, and the owning
persona (personas live by reference in the lore-brain; design prompts are recorded verbatim in
each persona engram's *Voice Design (ElevenLabs)* section). Never store API keys here.

| Voice (ElevenLabs name) | voice_id | Persona (lore-brain, by reference) | Provenance |
|---|---|---|---|
| Ashael - Soul Steel | `ruxSNzODa3KpaHd5XW6j` | Ashael, the Dreaming Scribe — narrator: the Record | Voice Design, 2026-07-12 |
| The Custodian of the Ledger - Soul Steel | `VSiMhzoGYAWmh67ySiCN` | The Custodian of the Ledger — narrator: the Ledger | Voice Design, 2026-07-12 |
| Penitent Knight - Soul Steel | `5T5zUlb7Z8odV3I15LJ9` | Penitent Knight | pre-existing; registered 2026-07-12 (collision check) |

## Quality bar

Loudness-consistent; loop-clean where looped; correct sample format for the channel; passes
`validate_asset_ids.py`.
