> Companion to [verify-negative-controls.md](./verify-negative-controls.md) — Upmind-monorepo-specific bindings/examples.

# Negative controls — Upmind bindings

## Repo bindings

- **CI negative-control lane.** The base `ci/negative-control-enforce` lane is owned by another package in this tranche; its shape is the live `quarantine:enforce` lane — cite that lane by name.
- **U7 review handoff.** U7's review-ready gate maps to the Linear status **Needs Review**: no green negative-control run for every new control the story adds, no Needs Review.

## ADR binding

This is the structural closure of the test-writer ≠ code-writer clause and the negative-control requirement in ADR-021 (Testing Trophy, Agentic Workflow & Coverage Policy). Cite ADR-021; do not restate it.
