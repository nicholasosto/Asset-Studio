# Agent assets

This directory is the versioned source for Asset-Studio-owned agent capabilities.

- `capabilities.yaml` is the authority and installation registry.
- `inventory-2026-07-24.md` is the dated locations/version/update scan; it is evidence, not
  authority.
- `skills/reference-image-kernel/` owns reference roles, template validation and candidate receipts;
  version 0.2.0 separates structural assessment from execution and acceptance claims.
- `plugins/asset-production/` is the shared Claude/Codex source bundle.
- Runtime skill folders are derived symlinks or generated distributions. They are never edited
  as sources.
- Vendor plugins remain vendor-owned adapters. Project-specific precedence and output rules live
  here instead of being patched into vendor caches.

Run `node tools/check-agent-capabilities.mjs` after changing a skill, manifest, install link, or
registered external authority.
