> Companion to [legacy-parity-oracle.md](./legacy-parity-oracle.md) — Upmind-monorepo-specific bindings/examples.

# Parity oracle — Upmind bindings

## The oracle KIND

In this monorepo the oracle is **legacy application + recorded acceptance**: the **vue-app legacy code plus the existing e2e suite**. "The real job" is what vue-app does and what the e2e suite already asserts — not the new headless code's own tests.

## The axis of variation

The axis of behavioural variation is the **ADR-001 (Scope-Based Composable Architecture) actor × context** matrix. The parity table carries **one row per ADR-001 actor×context cell**. Cite ADR-001; do not restate it.

## The receipt

The failure archetype in the base rule is **FE-2824**: the client-email pilot acquired the right shape (matrix entry, filenames, green tests) while `staff acting for a client` — a capability legacy plainly supported — was silently dropped, `.for('client', id)` removed, every gate green. Nobody was required to consult vue-app, so the drop went unnoticed.

## Machinery (owned elsewhere)

- Machine-readable artifact: `docs/sdd/<ID>/parity.yaml` — one entry per ADR-001 cell, disposition enum, drop-token field. Template and emission owned by another package.
- CI enforcement of cell coverage + disposition validity: `ci/lint-plan-compliance.mjs`.
- The `Dropped-with-tracked-issue` disposition binds to **Linear** (`Dropped-with-Linear-issue`).
- SDD-chain integration is out of scope for the current tranche.

Reference these; do not build or define them here.
