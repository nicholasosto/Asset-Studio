# Asset Production plugin

Version `0.1.0`.

This is the canonical first-party source shared by Claude and Codex:

- `trembus-image` owns raster presets, prompt construction, image validation, and optional macOS
  metadata.
- `asset-studio-batch` owns immutable generation-contract execution and the generator stop
  boundary.
- `textured-ui-asset-production` owns image-backed Roblox UI art contracts and acceptance.

It deliberately does not duplicate:

- execution-engine instructions from ImageGen;
- path, filename, status, registration, or promotion tables from
  `roblox-dev:asset-conventions`;
- web component APIs from the Trembus Component Library;
- Roblox runtime implementation ownership from Roblox-UI-Studio.

Runtime installs are derived from this directory and are checked by
`tools/check-agent-capabilities.mjs`.

## Unreleased guidance correction

`fix.asset-workflow-guidance` preserves actual-reference requirements in the batch
executor: a text description cannot satisfy `actualReferenceRequired: true`. The
shared workflow-gap procedure and companion workflow corrections live with their
Assets and Asset-Studio owners. Active filing guidance uses the current Assets
policy rather than retired library paths or filename status suffixes. This correction
does not update bundle manifests, install runtime packages, or establish a release or asset acceptance. Source-version
and capability-registry reconciliation remain a separate checkpoint because the
active workspace has earlier uncommitted capability migrations.

## Distribution status

This bundle is a local canonical source, consumed through the registered runtime skill symlinks. It
is not represented as marketplace-ready: the Codex marketplace evaluator requires public website,
privacy-policy, and terms-of-service URLs, and this internal bundle does not fabricate them.
`agent-assets/capabilities.yaml` records `marketplaceReady: false`; publishing is a separate owner
gate.
