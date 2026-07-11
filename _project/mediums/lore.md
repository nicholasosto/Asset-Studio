---
title: "Lore"
status: experimental
updated: 2026-07-04
links:
  - { rel: references, target: workflows/character-creation }
tags: { mediumType: lore, tool: lore-brain }
---

# Lore

> **Status:** experimental (2026-07-04)

## Purpose

The studio's narrative capability — the **upstream medium**: the engrams, production briefs, and
shippable text (dialog, flavor, lyrics) that image / audio / 3d project from. The studio produces
lore *into the lore-brain*; this card is the studio-side contract for doing it well. First
consumer: [[character-creation]] at its `lore-lock` gate.

## Standard

Reality-tagged Neural Notes per the brain/v1.1 contract (`reality`, `engram_subtype`,
`canon_status`, tone hints). Content matches its reality's declared register (soul-steel
cyber-gothic · tessera process-philosophy · claude-lab speculative-fiction). Three deliverable
classes: **engrams** (canon source) · **briefs** (what downstream workflows consume) ·
**shippable text** (dialog, flavor, lyrics — projects into game repos).

## Tooling

The lore-brain plugin: `/lore-brain:capture · create · weave · recall · health · reality` plus the
`creative-director` subagent (brief → generated lore). Runtime consumer: Soul Steel's Event
Generator Interface (LLM-as-narrator contract).

## Output convention

**By reference only.** Lore lives in the lore-brain graph
(`~/Master-Managed/Knowledge-Architectures/graphs/lore-brain/`); its media artifacts in the
graph's `Media/`; game-facing text projects into game repos via codegen. Nothing is filed in
Asset-Studio or the shared `Assets/` library — the graph is to lore what the library is to files
(the [[0001-reference-the-shared-asset-library-via-external-locations]] treaty, second
application).

## Quality bar

A `/lore-brain:recall` continuity pass before authoring (no contradictions with established
attributes; scars surfaced). Tone matches the reality register; `canon_status` set honestly;
reciprocal link to the reality cortex. For asset-bound personas/regions: **lore-lock complete** —
palette · silhouette · materials · one signature tell on the engram before any downstream medium
starts.
