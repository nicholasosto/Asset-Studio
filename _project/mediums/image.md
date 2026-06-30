---
title: "Image"
status: experimental
updated: 2026-06-30
links:
  - { rel: references, target: workflows/image-generation }
tags: { mediumType: image, tool: openai, pattern: symlink }
---

# Image

> **Status:** experimental (2026-06-30)

## Purpose

The studio's 2D raster capability — UI icons, sprites, portraits, and tileable textures produced via
AI generation and finalized into the shared library. Process: [[image-generation]].

## Standard

PNG (raster). Kebab-case descriptor + `_BLK` → `_FNL` status suffix; sized to the target slot (icon,
sprite sheet, tileable texture). Transparency where the slot requires it.

## Tooling

OpenAI image generation + Figma (the `figma` MCP). Finalize / slice locally.

## Output convention

Staged in `ai-output/images/`; finalized into `ui/<group>/` or `textures/<group>/`. **Pattern A**
(symlink, zero-upload) per [[0001-reference-the-shared-asset-library-via-external-locations]].

## Quality bar

Correct dimensions for the slot; clean alpha where required; registered + passing `validate_asset_ids.py`.
