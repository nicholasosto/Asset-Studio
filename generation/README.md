# Generation handoff and run records

This directory is Asset-Studio's tracked control plane for image generation. Creative payloads still
belong in the shared Assets library; large candidates and QA renders remain local working files.

## Authority

| Surface | Authority |
|---|---|
| `contracts/<batch-id>.md` | Immutable prompt, variants, negatives, references, output grammar, and stop boundary for one batch |
| `ACTIVE.md` | The one active batch pointer |
| `BATCH.md` | Compatibility copy consumed by the existing operator trigger and Codex instructions |
| `runs/<run-id>/` | Durable text, manifests, and reproducibility scripts recovered from a completed or in-flight run |
| `_project/pipeline/<id>.md` | Run state, owner gates, outcomes, and verification evidence |
| `refs/` | Local reference-image copies; ignored |
| `work/<batch-id>/` | Local candidates, QA renders, and intermediates; ignored |
| `staging/` | Legacy compatibility drop used by existing batches; ignored |
| `output/imagegen/` | Preserved legacy scratch lane; ignored and never authoritative |

## Contracted batch lane

1. Write `contracts/<batch-id>.md` once. After generation starts, corrections become a new contract
   id or an explicitly named revision; do not overwrite the historical contract.
2. Point `ACTIVE.md` at that immutable contract.
3. Refresh `BATCH.md` as the compatibility copy. Its batch id and substantive prompt must match the
   active contract.
4. Put input-image copies under `refs/<batch-id>/` when possible. Existing flat refs remain valid for
   the currently active compatibility batch.
5. Generate candidates into `work/<batch-id>/candidates/`. A contract may bind
   `generation/staging/` when compatibility with the existing Codex trigger requires it.
6. Put repeat sheets, overlays, and other disposable review renders in
   `work/<batch-id>/qa/`.
7. Promote only durable text, JSON manifests, and reproducibility scripts into
   `runs/<run-id>/`; cite them from the owning `_project/pipeline/` entity.
8. File reviewed creative assets into their bound destination. Never use a file's presence in a
   working directory as evidence of `_FNL`, upload, registry, package, save, or publish state.

The current operator phrase remains `Run generation batch <id>`. Codex must still stop on an id
mismatch and must honor the exact candidate-only boundary in the contract.

## Legacy interactive runs

`output/imagegen/` contains historical interactive Codex work that predated immutable contracts.
The binaries remain in place and are not deleted by this restructuring. Durable records recovered
from that lane live under `runs/`; new production-worthy image work uses the contracted lane above.

The recovered files under `runs/` are exact provenance snapshots, not relocated working trees.
Script-relative paths and Markdown links to omitted binary folders describe the original ignored
run layout; resolve them under `output/imagegen/<run-id>/`. Invoke preserved originals there unless
a script is deliberately generalized and promoted into project `tools/` or a canonical skill.
