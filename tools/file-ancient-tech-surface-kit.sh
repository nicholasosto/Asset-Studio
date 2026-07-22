#!/usr/bin/env bash
# File the ancient-tech surface kit into the shared library.
#
#   Six seamless robotic-domain tiles from the Codex run of 2026-07-22:
#   an exterior wall ladder (crown · field · plinth) + a transit ground set
#   (road · sidewalk · plaza). See _project/pipeline/ancient-tech-surface-kit.md.
#
#   Bakes 1024x1024 runtime copies, archives the 2048 masters under a dated
#   _archive/, writes a .trembus.md sidecar per tile, and re-checks the seams
#   after the downsample.
#
#   Dry-run by default. Pass --confirm to write.
#
#   Idempotent: refuses to clobber an existing destination. To re-run after a
#   partial pass, remove the files it already wrote.

set -euo pipefail

ASSETS="$HOME/Master-Managed/Assets"
STUDIO="$HOME/Master-Managed/Project-Spaces/Asset-Studio"
SRC="$STUDIO/output/imagegen"
DEST="$ASSETS/textures/tileable/robotic"
STAMP="2026-07-22"
ARCHIVE="$DEST/_archive/$STAMP"
RUNTIME_PX=1024

CONFIRM=0
[[ "${1:-}" == "--confirm" ]] && CONFIRM=1

if [[ $CONFIRM -eq 0 ]]; then
  echo "DRY RUN — no files written. Re-run with --confirm to apply."
  echo
fi

# source-relative-path | library-slug | surface type | tiling note | studs-per-tile
# Fields are tab-separated; the loop variable is deliberately NOT named `path`
# (zsh ties `path` to PATH — see the zsh-shell-gotchas memory).
TILES=$(cat <<'EOF'
ancient-alien-wall-family/ancient-alien-wall-top-crown.png	ancient-tech-exterior-wall-crown-01	exterior wall — crown band	Horizontal tiling only; V must render exactly one tile (set StudsPerTileV to the band part's height). Baked top-down lighting locks it upright — never mirror or rotate.	StudsPerTileU 16 · StudsPerTileV = part height
ancient-alien-wall-family/ancient-alien-wall-mid-main.png	ancient-tech-exterior-wall-field-01	exterior wall — field	True 4-way seamless; tile freely on both axes.	StudsPerTileU/V 16
ancient-alien-wall-family/ancient-alien-wall-bottom-plinth.png	ancient-tech-exterior-wall-plinth-01	exterior wall — plinth band	Horizontal tiling only; V must render exactly one tile (set StudsPerTileV to the band part's height). Baked top-down lighting locks it upright — never mirror or rotate.	StudsPerTileU 16 · StudsPerTileV = part height
ancient-alien-transit-surfaces/ancient-alien-road.png	ancient-tech-road-01	ground — road	4-way seamless but DIRECTIONAL: vertical lane channels must run along the road axis. Keep U and V scale equal or the lane pitch skews.	StudsPerTileU/V 16 (locked equal)
ancient-alien-transit-surfaces/ancient-alien-sidewalk.png	ancient-tech-sidewalk-01	ground — sidewalk	4-way seamless and isotropic; rotate-safe. Dense small pavers, so it takes a tighter studs-per-tile than the rest of the family.	StudsPerTileU/V 8
ancient-alien-transit-surfaces/ancient-alien-walkway.png	ancient-tech-plaza-01	ground — plaza / concourse	4-way seamless and isotropic; rotate-safe. Large chamfered slabs.	StudsPerTileU/V 16
EOF
)

run() {
  if [[ $CONFIRM -eq 1 ]]; then "$@"; else echo "  would: $*"; fi
}

# --- preflight -------------------------------------------------------------
missing=0
while IFS=$'\t' read -r rel slug _rest; do
  [[ -z "$rel" ]] && continue
  [[ -f "$SRC/$rel" ]] || { echo "MISSING SOURCE: $SRC/$rel"; missing=1; }
  for existing in "$DEST/${slug}_BLK.png" "$DEST/${slug}_BLK.trembus.md"; do
    [[ -e "$existing" ]] && { echo "DESTINATION EXISTS: $existing"; missing=1; }
  done
done <<< "$TILES"
[[ -d "$DEST" ]] || { echo "MISSING DEST DIR: $DEST"; missing=1; }
[[ $missing -eq 1 ]] && { echo; echo "Preflight failed — nothing written."; exit 1; }
echo "Preflight OK: 6 sources present, 12 destinations clear."
echo

run mkdir -p "$ARCHIVE"

# --- file ------------------------------------------------------------------
while IFS=$'\t' read -r rel slug surface tiling studs; do
  [[ -z "$rel" ]] && continue
  src="$SRC/$rel"
  base=$(basename "$rel" .png)
  dims=$(sips -g pixelWidth -g pixelHeight "$src" | awk '/pixelWidth/{w=$2} /pixelHeight/{h=$2} END{print w"x"h}')
  master="$ARCHIVE/${slug}.original-${dims}.png"
  runtime="$DEST/${slug}_BLK.png"

  echo "$base"
  echo "  → $runtime  (${RUNTIME_PX}x${RUNTIME_PX})"
  echo "  → $master"

  run cp "$src" "$master"
  run sips -Z "$RUNTIME_PX" "$src" --out "$runtime"

  sidecar="$DEST/${slug}_BLK.trembus.md"
  echo "  → $sidecar"
  if [[ $CONFIRM -eq 1 ]]; then
    cat > "$sidecar" <<SIDECAR
# Trembus Asset Sidecar

- Asset: \`${slug}_BLK.png\`
- Preset: \`tileable-part-texture\`
- Domain: \`robotic\`
- Family: \`ancient-tech\` — the monumental cyan-on-graphite precursor lane
- Surface Type: \`${surface}\`
- Style: \`ancient-tech surface kit\`
- Transparent: \`false\`
- Aspect: \`1:1\`
- Status: \`generated\` - asset created ${STAMP} as part of the ancient-tech surface kit

## Reference Files

- Run record: \`Asset-Studio/_project/pipeline/ancient-tech-surface-kit.md\` - naming, domain,
  resolution and Roblox-config decisions, plus the seam-check evidence table.
- Process: \`Asset-Studio/_project/workflows/image-generation.md\` - the leaf this run follows.
- Routing authority: tileable surfaces live under \`textures/tileable/<domain>/\` with
  \`_BLK\`/\`_FNL\` status suffixes; promotion is a rename, never a folder move.
- Family token authority: \`templates/key-art/character-promo-robotic-ancient-tech-theme.png\`.

## Roblox Configuration

- Consume as a \`Texture\` instance with \`StudsPerTileU/V\` — **not** \`SurfaceAppearance\`
  (MeshPart-only) and **not** \`Decal\` (does not tile).
- Declared scale: **${studs}** — provisional until the Studio pass; record the resolved
  value back here. The family shares one scale reference so surfaces read consistently
  where they meet.
- Tiling: ${tiling}

## Generated Output

- Output: \`external-locations/assets/textures/tileable/robotic/${slug}_BLK.png\`
- Method: Codex image generation, ${STAMP} (run outside the \`generation/BATCH.md\` contract —
  see the pipeline record's run-1 note).
- Master: \`_archive/${STAMP}/${slug}.original-${dims}.png\` retained at source resolution;
  the working file is downsampled to ${RUNTIME_PX}x${RUNTIME_PX} because Roblox caps uploaded
  textures at 1024 and discards anything larger.
- Review evidence: \`Asset-Studio/output/imagegen/\` 2x2 \`qa-repeat-*\` proofs + family
  previews. Review artifacts, deliberately not filed into the library.

## Acceptance Checks

- [x] Square PNG at ${RUNTIME_PX}x${RUNTIME_PX}
- [x] Wrap-seam verified 4-way at source resolution and re-verified after downsample
      (mean abs RGB wrap delta within the in-image local-variation baseline)
- [x] 2x2 tile preview generated for seam review
- [ ] File size under the 500 KB tileable budget — **knowingly exceeded** (~1.6 MB at 1024).
      The 500 KB line was written for procedurally-generated 512 tiles; see the pipeline
      record's "Tileable budget drift" open thread.
- [ ] Studio material check: apply through \`Texture\`, verify the declared studs-per-tile
      against a reference humanoid, and confirm the tiling constraint above.

## Notes

- \`_BLK\` means blockout/iterating, not upload-ready final.
- Promote to \`_FNL\` only after human review and Studio material validation.
- On upload, register via \`Assets/_tools/roblox_asset_metadata.py register <path> <asset-id>\`.
  Never hand-edit \`_catalog/roblox-upload-registry.jsonl\`.
SIDECAR
  else
    echo "  would: write sidecar (${surface})"
  fi
  echo
done <<< "$TILES"

# --- post-write seam re-check ---------------------------------------------
if [[ $CONFIRM -eq 1 ]]; then
  echo "Filed. Next:"
  echo "  node $STUDIO/tools/build-asset-registry.mjs"
  echo "  then confirm the six appear in the Explorer under textures/tileable/robotic/"
else
  echo "Dry run complete. Re-run with --confirm to apply."
fi
