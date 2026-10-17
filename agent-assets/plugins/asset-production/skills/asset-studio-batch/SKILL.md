---
name: asset-studio-batch
version: 0.1.0
description: >
  Use when running or authoring Asset-Studio immutable image-generation contracts, especially for
  "Run generation batch <id>", generation/ACTIVE.md, generation/contracts/, Asset-Studio
  candidate staging, batch-id mismatches, or requests to preserve image prompt provenance.
  Enforces the generator-only stop boundary and never reviews, files, registers, promotes,
  uploads, or publishes a candidate during the generation pass.
---

# Asset-Studio Batch

> **Skill version: 0.1.0.** Asset-Studio owns the handoff and run record. ImageGen executes
> pixels. `trembus-image` may supply raster craft. Assets policy owns library storage and naming;
> `roblox-dev:asset-conventions` routes filing, registration and upload. The owning contract or
> pipeline records review, acceptance and later consumer gates separately.

## Before any batch action

1. Work from the Asset-Studio checkout.
2. Read `generation/README.md`.
3. Read `generation/ACTIVE.md` and resolve its exact `contracts/<batch-id>.md` target.
4. If the operator supplied an ID, require an exact match with both the pointer and contract.
   Stop and report any mismatch; never guess or silently choose the newest file.
5. Treat the immutable contract as the prompt, variant, reference, negative, count, and filename
   authority. `generation/BATCH.md` is compatibility-only and must resolve to the same contract.

## Generator role

For each requested candidate:

1. Attach every required composition, identity or style reference as an actual tool input.
   If a required reference cannot be attached, stop and report the unsatisfied input.
   A textual description cannot satisfy `actualReferenceRequired: true`.
2. Use textual fallback only when the owning contract explicitly permits it and no
   actual-reference requirement applies. Record the limitation and encode the permitted
   composition constraints in every prompt: aspect, crop/full-body framing,
   ground/contact behavior, safe margins and locked style traits.
3. Never reproduce guides, annotations, magenta lines, labels, or template chrome in the output.
4. Append the contract's negative block to every generation request.
5. Write candidates only to the immutable contract's bound output path and filename. New
   contracts default to
   `generation/work/<batch-id>/candidates/<batch-id>_v<variant>c<n>.png`; preserved
   compatibility contracts may still bind `generation/staging/`.
6. Preserve every existing candidate; a rerun receives a new batch ID or an unused candidate
   number.

Then stop. Report `batch staged` with the batch ID and candidate count.

The generator role must not review, rank, shortlist, rename, transform, file, register, promote,
upload, publish, or alter a pipeline outcome.

## Author/reviewer role

- Create a new immutable contract for every new batch or revision. Never overwrite a prior
  `generation/contracts/<batch-id>.md`.
- Update `generation/ACTIVE.md` and the compatibility `generation/BATCH.md` together.
- Keep source/style reference copies under `generation/refs/<batch-id>/`.
- Review only after the generator has stopped. Record acceptance and durable evidence in the
  owning `_project/pipeline/` entity.
- Generated candidates, losing variants, intermediate rasters, and QA images remain ignored.
  Durable contracts, manifests, deterministic builders, validators, and reusable rules are
  tracked.

## Substantial interactive work

Do not use `output/imagegen/` as a production lane. If interactive exploration becomes
substantial enough to need manifests, builders, validators, or pipeline evidence, mint a batch ID
and use the same `contracts/`, `work/`, and pipeline structure.
