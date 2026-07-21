> Companion to [agent-token-budget.md](./agent-token-budget.md) — Upmind-monorepo-specific bindings/examples.

## Enforcement binding

The mechanical check for the "set the model explicitly on every spawned agent" law is **U2**, living in `hooks/workflow-lint.mjs` (owned by Wave 2) — this rule states the law; that hook enforces it.

## Measured receipt

On a large SDD fan-out, tiering plus a shared scout delivers the same-or-better result for **>60% less spend** (measured on the **FE-2774** run, **2026-06-10**).
