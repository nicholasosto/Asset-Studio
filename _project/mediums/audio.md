---
title: "Audio"
status: experimental
updated: 2026-06-30
links:
  - { rel: references, target: workflows/audio-production }
tags: { mediumType: audio, tool: elevenlabs, pattern: symlink }
---

# Audio

> **Status:** experimental (2026-06-30)

## Purpose

The studio's audio capability — music beds, SFX, and voice lines generated via ElevenLabs and filed into
the shared library. Process: [[audio-production]].

## Standard

`wav` / `mp3` / `ogg` / `flac`. Kebab-case descriptor + `_BLK`; categorized by context
(ability-combat-fx · ui-fx · world-fx · voice-dialog · bg-music · environment · generic).

## Tooling

ElevenLabs Player MCP (`generate_music` · `generate_sound_effect` · `generate_tts`); ElevenLabs Agents
for voice configuration.

## Output convention

Staged in `ai-output/audio/` (+ `voice-previews/`, `sfx/`); finalized into `audio/<context>/`.
**Pattern A** (symlink, zero-upload) per [[0001-reference-the-shared-asset-library-via-external-locations]].

## Quality bar

Loudness-consistent; loop-clean where looped; correct sample format for the channel; passes
`validate_asset_ids.py`.
