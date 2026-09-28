# Receipt validation

Use the pinned profile's structural and visual gate IDs in the corresponding receipt arrays.
Use each `constraints.exactLayers[].id` in `validation.exactLayers`. IDs must be unique within
each array; additional checks are permitted. Record `pending` when a check has not been done.
A `not-applicable` entry must explain the exclusion in `detail`; that reason is a recorded
assessment, not automatically verified by the validator.

Run:

```bash
"$PYTHON_BIN" "$SKILL_DIR/scripts/validate_template.py" --run-receipt "/absolute/path/run-receipt.json"
```

The validator checks file integrity, required check coverage and observed PNG properties.
Missing required checks, duplicate IDs, blank non-applicability reasons and inconsistent file
digests or recorded geometry fail validation. It never rewrites the source receipt.

## Read results by scope

- Package preflight checks the retained package, not a generated result. The output can require
  transparency even when the reference is opaque.
- Candidate validation reports `scope: candidate-structural-checks-only`. Generation remains
  `not-established`, visual review is pending and acceptance is not inferred.
- Receipt validation reports `scope: receipt-integrity-and-check-coverage`. Its top-level
  `status: passed` means that the receipt passed those checks. Read `assessment` separately.
  Structural assessment combines observed candidate properties with recorded structural checks;
  visual and exact-layer assessments summarize recorded assertions, not automated visual review.
- `assessment.overall` is failed if any assessed check failed, pending if any check is pending,
  and passed only when the assessed applicable checks pass. Empty exact-layer requirements are
  not applicable. Passing this assessment does not create a human decision.
- `authority` retains the receipt's execution and human-decision claims; `authorityVerification`
  states that these actions were not independently verified. A completed generation can produce
  a failed candidate. A recorded acceptance claim cannot turn a pending or failed assessment into
  a pass. Preserve the actual decision and its source rather than inferring it from checks.

## Compatibility

Skill version 0.2.0 retains the `TemplateImageRunReceiptV1` serialization and template profile
schema. It tightens validation against the selected profile. Earlier receipts with incomplete
checklists may now fail coverage validation; their original bytes and historical evaluations
remain valid historical records. Do not fill gaps with invented passes or rewrite old receipts.
Produce a separate reassessment with the earlier receipt as its source when needed.

Candidate-validation reports now use `authority.generation: not-established` instead of inferring
`completed`. Receipt-validation reports add scope, observed checks, assessment and verification
limits. Consumers must inspect these fields instead of treating a top-level pass as execution,
visual conformance or acceptance. The JSON Schema describes receipt structure; the Python
validator also checks cross-file coverage, ID uniqueness and observed file properties.
