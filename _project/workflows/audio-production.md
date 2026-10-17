---
title: "Audio production"
status: active
updated: 2026-10-17
links:
  - { rel: references, target: mediums/audio }
---

# Audio production

> **Status:** active (2026-07-11)

## Purpose

A briefed audio cue — music bed, SFX, or voice line — generated, reviewed, and filed into its
target slot. Generation runs through ElevenLabs (music / sound-effect / TTS); placement follows
**Pattern A** (symlink, zero-upload) per
[[0001-reference-the-shared-asset-library-via-external-locations]] — the brief's *target slot*
names the destination (library `audio/<context>/` by default; a calling workflow may bind a
by-reference destination such as lore-brain `Media/audio/`, where the Roguex-33 theme mixes live).

Assets' `AGENTS.md` and `_catalog/media-assets/README.md` govern provenance and
retention. Preserve the exact brief, sent settings, reference inputs and hashes,
returned provider identifiers and every original candidate. Record unavailable
facts as explicit unknowns; never infer a model version or retain credentials or
expiring access URLs.

Use one logical `_catalog/media-assets/<assetId>.json` record. Conversion, trimming,
normalization or looping creates a linked derivative while preserving its original.
Before an authorized update to an existing record, retain its exact previous bytes
and SHA-256 in a new immutable receipt as the catalog requires. The media catalog's
`index` command emits its derived projection to stdout; persist a cached index only
as a separately authorized write. Image-specific batch contracts do not automatically
govern audio.

Audition, technical validation, human listening, human acceptance, upload and
consumer adoption are separate claims. Record only judgments actually supplied.
Use `Assets/_catalog/workflow-gap.md` if a required step or destination is unresolved.

## Workflow

```json
{
  "caption": "A briefed audio cue, generated → reviewed → filed into its target slot (Pattern A).",
  "lanes": [
    { "id": "brief", "label": "Brief", "kind": "human" },
    { "id": "gen", "label": "Generate", "kind": "ai" },
    { "id": "stage", "label": "Staging", "kind": "system" },
    { "id": "review", "label": "Review", "kind": "human" },
    { "id": "place", "label": "Place + validate", "kind": "tool" }
  ],
  "steps": [
    { "id": "write-brief", "lane": "brief", "label": "Write the audio brief", "detail": "type (music/sfx/voice) · mood · length · target slot", "note": "The target slot is the leaf's parameter point: library audio/<context>/ by default; a calling workflow (e.g. character-creation's audio-identity) may bind a by-reference destination.", "status": "pending", "to": ["generate"] },
    { "id": "generate", "lane": "gen", "label": "Generate with ElevenLabs", "detail": "music · sound_effect · tts", "status": "pending", "to": ["stage-out"] },
    { "id": "stage-out", "lane": "stage", "label": "Stage to the bound work path or inbox fallback", "detail": "approved slot; otherwise external-locations/assets/_inbox/audio/", "note": "Unattended output without an approved bound work path lands in _inbox/audio/. Deliberate filing preserves all candidates and generation provenance. Rejected takes remain recorded and retained; this step does not authorize deletion.", "status": "pending", "to": ["review-take"] },
    { "id": "review-take", "lane": "review", "label": "Audition takes", "note": "Record the exact take auditioned and the human judgment actually supplied. Technical checks or a saved audition selection do not establish human listening, acceptance or adoption. Preserve other candidates when revising.", "status": "pending", "to": ["finalize", "revise"] },
    { "id": "revise", "lane": "brief", "label": "Adjust the brief", "status": "pending", "to": ["generate"] },
    { "id": "finalize", "lane": "review", "label": "Prepare reviewed output (kebab-media name)", "detail": "kebab-case · no status token", "status": "pending", "to": ["place-asset"] },
    { "id": "place-asset", "lane": "place", "label": "Place per the brief's target slot", "detail": "library audio/<context>/ — or a bound destination", "status": "pending", "refs": [{ "rel": "references", "target": "decisions/0001-reference-the-shared-asset-library-via-external-locations" }], "to": ["validate-ids"] },
    { "id": "validate-ids", "lane": "place", "label": "Validate the filed source and media record", "detail": "technical facts · exact hashes · provenance · conditional registry check", "note": "Validate the named _catalog/media-assets/<assetId>.json with _tools/media_asset_catalog.py validate, then rebuild the derived index to stdout. Apply the owning brief's technical checks. Run _tools/validate_asset_ids.py only when an upload/registry ID actually exists; local files do not acquire an ID by implication. Report unknowns and check coverage.", "status": "pending", "to": [] }
  ]
}
```
