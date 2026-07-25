# Durable generation run records

Each child folder holds only the lightweight, reviewable control material recovered from a
generation run: briefs, layout contracts, JSON manifests, and reproducibility scripts.

Large source art, generated candidates, derived PNGs, and QA renders remain in the ignored working
lane named by the run record or in the shared Assets library after filing. A run folder is evidence
and provenance, not a second asset store.

Recovered files are exact source snapshots. Script-relative paths and Markdown links to omitted
`sources/`, `library/`, `qa/`, or other binary folders still describe the original ignored run
folder; those links are intentionally broken inside this lightweight record. Resolve the same
relative path under `output/imagegen/<run-id>/`, or use the filed shared-library path named by the
manifest. Run the preserved original script under `output/imagegen/` unless the logic is later
generalized and moved into `tools/` or a canonical skill.

Current recovered runs:

- `ancient-alien-architecture-trim-sheet/`
- `ancient-alien-vertical-service-trim-sheet/`
- `ancient-alien-ui-component-concepts/`
- `ancient-tech-ui-theme-p0/`
- `ancient-tech-ui-theme-p1-tight/`
