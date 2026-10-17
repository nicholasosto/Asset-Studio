# Agent assets

This directory records capability ownership, committed source identity and scoped installation
observations. `capabilities.yaml` selects the owning source; it does not overrule that source or
turn an observation into approval. Runtime symlinks and generated caches are derived consumers.
Vendor plugins remain vendor-owned adapters; project rules belong here rather than in their caches.

## Registry contract

`capabilities.yaml` is JSON-compatible YAML, parsed with `JSON.parse`. Schema **2.0.0** separates
facts that version 1 mixed together:

| Record | Meaning |
|---|---|
| `sourceArtifact` | Repository, full Git commit, repository-relative subtree and complete file hashes/modes. An unrelated later commit does not change this artifact. |
| `canonicalPath` | The source owner's current working location, resolved against the declared source checkout when relative. It may differ from the committed artifact. |
| `workingObservation` | Dated observation of local source changes. Matching these observed values does not approve or promote them. |
| `installs` / `requiredActiveRuntimes` | Explicit current roles and required hosts, paths, selected artifacts and native identity evidence. Cache integrity, source freshness, session exposure and workflow execution are separate claims. |
| `historicalInstalls` | Preserved prior records with dates and scope. An absent old path is not an active requirement, and history cannot satisfy a current installation. |
| `pending-local-skill` | Observed standalone local source awaiting review; it is not an accepted Asset Production bundle member. |

The schema number is a registry data-contract revision. It does not bump a skill or plugin version.
Version 1 records require an explicit migration; ambiguous legacy records are rejected. Unknown
kinds, modes or states, invalid dates, incomplete artifact manifests and ambiguous active records
must fail validation rather than be ignored. Every capability declares `requiredActiveRuntimes`
as a unique Codex/Claude host list, including an explicit empty list for optional observations.
Each required host needs exactly one active record; omitted rows, history and demotion to an
observed snapshot cannot satisfy it. Descriptive authority/constraint fields remain prose.

The old `verifiedAt` date and `inventory-2026-07-24.md` remain historical evidence. Later receipts
are retained under `historicalObservations`. A scoped `observation` date does not renew those
earlier validation claims.

## Sources and runtime selection

`plugins/asset-production/` is the committed shared Claude/Codex bundle. The selected main baseline
still declares bundle and owned skill revisions **0.1.0**. The original working checkout declares
different revisions containing unreviewed features; they remain observations, not a new release.
The local kernel is pending standalone source and is not added to this bundle by this delivery.

The registry declares the owning `sourceRepository` and pinned artifacts. The checker keeps its
validation checkout, the owning working checkout and the host home separate, and verifies their
repository/commit relationship before trusting the source root. Fixture callers supply all three;
an arbitrary source directory is not accepted as a substitute.

For Roblox, canonical Asset Conventions **1.0.3** is pinned independently of the frozen Codex
selection, bundle **0.8.3** / skill **1.0.2**. The five-file skill-subtree manifest certifies only
that named subtree, not the entire plugin, its hooks or fresh execution. Claude's directory
marketplace reports its effective source through `readFromFolder`; its retained old cache is a
separate observation. A newer source revision is reported as unadopted where appropriate.

Active local plugin identities must agree with native enablement, registrations, manifests and
the configured selection. An internally consistent replacement catalog cannot override the actual
marketplace route. Source symlinks must point at the selected owner and must not introduce duplicate
global discovery. Remote vendor exposure remains scoped observation; it is not proof of fresh
authorization, document operations or workflow acceptance.

## Checks and result boundaries

```sh
node tools/check-agent-capabilities.mjs
node tools/check-agent-capabilities.mjs --json
node --test tools/tests/agent-capabilities.test.mjs
```

The helper in `tools/lib/agent-capabilities.mjs` checks committed provenance, complete selected
file sets, hashes/modes, current installation identity and scoped dates. Missing, extra or changed
files, wrong paths/versions, escaping symlinks and invalid manifests remain failures. Unexpected
filesystem metadata is reported; the checker never deletes it or reseals a package to hide drift.

Results distinguish integrity, freshness, discovery/loading, execution and source readiness. Exact
older selected bytes can pass integrity while reporting `newer-guidance-not-adopted`. Required
integrity/schema/identity failures and unreviewed owned-source/kernel divergence return non-success.
Optional workflows without execution evidence remain unknown. No aggregate verified claim is made
while required findings remain, and a passing fixture suite is not an installation or acceptance.

The CLI retains main's existing generation-contract checks and duplicate direct Figma registration
checks. It does not import the uncommitted generation-routing helper or adopt its idle/active
protocol. The routing checks apply to the validation checkout; changed operational selectors in
the original working checkout remain a separate source/routing delivery.

Skill identity/version parsing supports a documented scalar subset: plain or quoted strings,
comments outside quotes, CRLF, description blocks and flat string `metadata`. Duplicate keys,
conflicting legacy/metadata versions and unsupported selected scalar syntax fail explicitly.
This is not a general YAML parser. Reading a legacy version for provenance does not certify that
header against the current host skill schema; source metadata reconciliation remains separate.

The fixture suite uses disposable repositories, registries, homes and caches. It does not point at
the live home or execute installed hooks, skill scripts or installers. Live checker reads are
read-only, including the native Claude plugin listing when required; no configuration or cache
refresh occurs.

## Deferred work

Keep raster hardening, kernel provenance/receipt safeguards, source version selection, generation
routing and any new Roblox candidate as separate reviewed dependency groups. Current main's
legacy skill headers, original working-source divergence, kernel promotion, unexercised workflows
and dashboard drift are not repaired or accepted by this registry delivery.

After reconciliation, a short daily capability report can catch stale defaults, metadata drift
and missing validation. This is advisory, not a release or permission gate.
