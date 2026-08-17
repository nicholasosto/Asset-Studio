# templates/ — authored structural masters

**The rule: a template's home follows its authorship** (ADR 0010's surviving half; ADR 0013
superseded the rest).

- **Authored masters live here** — SVG layout/geometry/guides you edit over time, one subdir per
  workflow or class, each with a `png/` twin folder for attaching as composition refs. Git-versioned
  with the process that binds them.
- **Generated exemplars live in the library** — themed comp-refs, style kits, and spec boards
  (finished PNGs) go in the shared `~/Master-Managed/Assets/image/reference/`, flat, the set in
  the name (`turnaround-blood-theme.png`, `graphite-cyan-reference-panel.png`). The
  `templates/<set>/` zone dissolved 2026-08-17; the Foundry decides where a file lives.
- **The bindings index** is `_project/mediums/image.md` § Template registry — every template,
  its home, and the workflow stage that binds it. It says what binds a template, not where it may
  live.

## Index

| Subdir | Masters | Bound by |
|---|---|---|
| `character/` | concept · portrait · turnaround · detail-callouts · pose-sheet | `character-creation` stages 1–5 |
| `environment/` | prop-family · encounter-environment | `image-generation` optional composition refs for prop and encounter briefs |
| `ui/` | (planned) icon-tile spec | `roblox-textured-ui-ux` art contract |

Library exemplar sets, all flat in `image/reference/` (see the registry for bindings):
`turnaround-<domain>-theme.png` (5 domain-skinned turnarounds; `shared` variant still missing) ·
`character-promo-*-theme.png` (key art) · `graphite-cyan-reference-{panel,tile,controls}.png` ·
`roguex-depot-supply-*-v1.png` (supply prop-family + encounter-environment sheets).
