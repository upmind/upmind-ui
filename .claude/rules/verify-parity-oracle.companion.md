> Companion to [verify-parity-oracle.md](./verify-parity-oracle.md) — Upmind-monorepo-specific bindings/examples.

# Parity oracle — Upmind bindings

## The oracle KIND

In this monorepo the oracle is **legacy application + recorded acceptance**: the **vue-app legacy code plus the existing e2e suite**. "The real job" is what vue-app does and what the e2e suite already asserts — not the new headless code's own tests.

## The axis of variation

The axis of behavioural variation is the **ADR-001 (Scope-Based Composable Architecture) actor × context** matrix. The parity table carries **one row per ADR-001 actor×context cell**. Cite ADR-001; do not restate it. ADR-001 itself presupposes the legacy-consultation discipline this rule structures — this rule is that discipline's structured form.

## The receipt

The failure archetype in the base rule is **FE-2824**: the client-email pilot acquired the right shape (matrix entry, filenames, green tests) while `staff acting for a client` — a capability legacy plainly supported — was silently dropped, `.for('client', id)` removed, every gate green. Nobody was required to consult vue-app, so the drop went unnoticed.

## The Dropped disposition binds to Linear

The base rule's generic **`Dropped-with-tracked-issue`** disposition binds here to **Linear**: a dropped capability is recorded as **`Dropped-with-Linear-issue`**, carrying the Linear issue reference.

## Gate bindings (lint-plan-compliance.mjs)

Machine-readable bindings `ci/lint-plan-compliance.mjs` reads from this companion (resolved via `git rev-parse --show-toplevel` → `.claude/rules/`, mirroring `hooks/seat-guard.sh`). No env-var channel exists; absent this section the gate uses its generic default (the tracker is named "issue tracker" in messages only). This binds the tracker name the drop-disposition messages cite.

- issue-tracker: Linear
