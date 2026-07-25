#!/bin/zsh
set -euo pipefail

runtime_python="/Users/nicholasosto/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3"
metadata_writer="/Users/nicholasosto/.codex/skills/trembus-image/scripts/write_asset_metadata.py"
bundle_root="/Users/nicholasosto/Master-Managed/Project-Spaces/Asset-Studio/output/imagegen/ancient-tech-ui-theme-p0/library"

"${runtime_python}" "${metadata_writer}" --preset raster-default --style "ancient alien obsidian iridium tintable emission ui" --transparent true --aspect square --sidecar none "${bundle_root}/ui/frames/panel-ancient-tech-monument-body_BLK.png"
"${runtime_python}" "${metadata_writer}" --preset raster-default --style "ancient alien obsidian iridium tintable emission ui" --transparent true --aspect square --sidecar none "${bundle_root}/ui/frames/panel-ancient-tech-monument-signal_BLK.png"
"${runtime_python}" "${metadata_writer}" --preset raster-default --style "ancient alien obsidian iridium tintable emission ui" --transparent true --aspect square --sidecar none "${bundle_root}/ui/frames/panel-ancient-tech-compact-body_BLK.png"
"${runtime_python}" "${metadata_writer}" --preset raster-default --style "ancient alien obsidian iridium tintable emission ui" --transparent true --aspect square --sidecar none "${bundle_root}/ui/frames/panel-ancient-tech-compact-signal_BLK.png"
"${runtime_python}" "${metadata_writer}" --preset raster-default --style "ancient alien obsidian iridium tintable emission ui" --transparent true --aspect wide --sidecar none "${bundle_root}/ui/frames/panel-ancient-tech-control-body_BLK.png"
"${runtime_python}" "${metadata_writer}" --preset raster-default --style "ancient alien obsidian iridium tintable emission ui" --transparent true --aspect wide --sidecar none "${bundle_root}/ui/frames/panel-ancient-tech-control-signal_BLK.png"
"${runtime_python}" "${metadata_writer}" --preset raster-default --style "ancient alien obsidian iridium tintable emission ui" --transparent true --aspect wide --sidecar none "${bundle_root}/ui/frames/titlebar-ancient-tech-rail-body_BLK.png"
"${runtime_python}" "${metadata_writer}" --preset raster-default --style "ancient alien obsidian iridium tintable emission ui" --transparent true --aspect wide --sidecar none "${bundle_root}/ui/frames/titlebar-ancient-tech-rail-signal_BLK.png"
"${runtime_python}" "${metadata_writer}" --preset tileable-part-texture --style "ancient alien quiet obsidian ceramic ui material" --transparent false --aspect square --sidecar none "${bundle_root}/ui/backgrounds/tile-ancient-tech-obsidian_BLK.png"
