# ADR 0001: elkjs over dagre for flowchart/graph layout

## Status
Accepted.

## Context
Need a layered graph layout engine for the per-automation flowchart (section 7) and the dependency graph's ego view. Candidates: elkjs (Eclipse Layout Kernel compiled to JS) and dagre.

## Findings (npm registry, 2026-07-05)

| | elkjs | dagre |
|---|---|---|
| Last publish | 2026-03-03 | 2022-06-14 |
| Unpacked size | ~8.0 MB | ~0.84 MB (dagre-d3-es: ~0.24 MB) |
| Maintenance | Active | Effectively abandoned (~4 years, no releases) |
| Edge routing | Orthogonal routing, ports, proper handling of hierarchical containers (needed for `choose`/`if`/`parallel` branch clusters) | Simple layered layout, no native container/port support |

## Decision
Use **elkjs**. The size gap is real (~9x) but is mitigated by the plan's existing mitigation (section 11): dynamic `import()` of the diagram module only when the Flowchart/Graph tab opens, so the Plain Language tab (the MVP, Phase 1) never pays this cost. dagre's lack of maintenance since 2022 is disqualifying on its own for a project intended to keep working across HA frontend/browser updates — an abandoned layout library is a liability regardless of size. elkjs's native support for hierarchical containers also maps directly onto `choose`/`if`/`parallel` branch clusters (section 7), which dagre would require hand-rolled workarounds for.

## Consequences
- `elkjs` stays a devDependency now, becomes a real dependency lazy-loaded in Phase 2.
- No Mermaid — confirmed by the plan's own rationale (shadow-DOM quirks) and not re-litigated here.
