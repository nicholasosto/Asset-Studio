#!/bin/zsh
set -euo pipefail

runtime_python="/Users/nicholasosto/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3"
metadata_writer="/Users/nicholasosto/.codex/skills/trembus-image/scripts/write_asset_metadata.py"
frame_root="/Users/nicholasosto/Master-Managed/Project-Spaces/Asset-Studio/output/imagegen/ancient-tech-ui-theme-p1-tight/library/ui/frames"
style_text="ancient alien obsidian iridium tight-cropped tintable emission ui"

"${runtime_python}" "${metadata_writer}" --preset raster-default --style "${style_text}" --transparent true --aspect custom --sidecar none "${frame_root}/panel-ancient-tech-monument-tight-body_BLK.png"
"${runtime_python}" "${metadata_writer}" --preset raster-default --style "${style_text}" --transparent true --aspect custom --sidecar none "${frame_root}/panel-ancient-tech-monument-tight-signal_BLK.png"
"${runtime_python}" "${metadata_writer}" --preset raster-default --style "${style_text}" --transparent true --aspect custom --sidecar none "${frame_root}/panel-ancient-tech-compact-tight-body_BLK.png"
"${runtime_python}" "${metadata_writer}" --preset raster-default --style "${style_text}" --transparent true --aspect custom --sidecar none "${frame_root}/panel-ancient-tech-compact-tight-signal_BLK.png"
"${runtime_python}" "${metadata_writer}" --preset raster-default --style "${style_text}" --transparent true --aspect wide --sidecar none "${frame_root}/panel-ancient-tech-control-tight-body_BLK.png"
"${runtime_python}" "${metadata_writer}" --preset raster-default --style "${style_text}" --transparent true --aspect wide --sidecar none "${frame_root}/panel-ancient-tech-control-tight-signal_BLK.png"
"${runtime_python}" "${metadata_writer}" --preset raster-default --style "${style_text}" --transparent true --aspect wide --sidecar none "${frame_root}/titlebar-ancient-tech-rail-tight-body_BLK.png"
"${runtime_python}" "${metadata_writer}" --preset raster-default --style "${style_text}" --transparent true --aspect wide --sidecar none "${frame_root}/titlebar-ancient-tech-rail-tight-signal_BLK.png"
