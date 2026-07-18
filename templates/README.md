# templates/ — authored structural masters

**The rule (ADR 0010): a template's home follows its authorship.**

- **Authored masters live here** — SVG layout/geometry/guides you edit over time, one subdir per
  workflow or class, each with a `png/` twin folder for attaching as composition refs. Git-versioned
  with the process that binds them.
- **Generated exemplars live in the library** — themed comp-refs, style kits, and spec boards
  (finished PNGs) go in the shared `~/Master-Managed/Assets/templates/<set>/` zone, one folder per
  set, never split by consumption format.
- **The authoritative index** is `_project/mediums/image.md` § Template registry — every template,
  its home, and the workflow stage that binds it. If it isn't registered there, it's buried.

## Index

| Subdir | Masters | Bound by |
|---|---|---|
| `character/` | concept · portrait · turnaround · detail-callouts · pose-sheet | `character-creation` stages 1–5 |
| `ui/` | (planned) icon-tile spec | `roblox-textured-ui-ux` art contract |

Library exemplar sets (see the registry for bindings): `turnaround-themes/` (5 domain-skinned
turnarounds; `shared` variant still missing) · `key-art/` · `ui-style/graphite-cyan/`.
