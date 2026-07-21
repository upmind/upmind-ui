> Companion to [negative-controls.md](./negative-controls.md) — Upmind-monorepo-specific bindings/examples.

# Negative controls — Upmind bindings

## Provenance (concrete failure archetype)

The provenance is FE-2824: the only "staff" assertion mirrored the label it set, so it could never go red. The gate was green because the test was tautological, not because the capability existed.

## Protocol bindings

- **(a) Mutant directory.** Committed under `mutants/<ID>/<defect-name>/` holding both `mutant.patch` and `target.test.js` — e.g. `mutants/FE-XXXX/hardwire-session-id/{mutant.patch,target.test.js}`. Template and convention: `templates/mutants/README.md`.
- **(b) CI mutation lane.** `ci/negative-control-enforce.yml` — applies the mutant, runs the targeted test, asserts FAIL, then reverts. Owned by another package in this tranche; cite it by name. Its shape is the live `quarantine:enforce` lane.
- **(c) U7 blocks Needs Review** absent a green mutation-lane run for every new control the story adds. No mutation-lane run, no Needs Review.
- **(d)** The verifier re-runs the lane; a pasted "FAIL" line does not satisfy U7.

## ADR binding

This is the structural closure of the test-writer ≠ code-writer clause and the negative-control requirement in ADR-021 (Testing Trophy, Agentic Workflow & Coverage Policy). Cite ADR-021; do not restate it.
