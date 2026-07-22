> Companion to [code-quality.md](./code-quality.md) — Upmind-monorepo-specific bindings/examples.

## The graphify gate (existing-type mechanical gate)

Before proposing any new type, enum, or utility, run `/graphify query "<concept>"` to confirm one does not already exist. This is mechanically enforced by `hooks/graphify-gate.sh`, which blocks a new type/enum that skipped the graph query. Consume what the graph already exposes rather than adding a parallel construct.

## Module Visibility Law — ESLint rule names + receipts

The internal-file set includes `session-store.*` alongside `*.machine.ts` / `*.services.ts` / `*.mappers.ts` / `*.schemas.ts`.

**ESLint enforcement (root `eslint.config.mjs`):**

- `@internal/no-cross-module-imports` — errors on any cross-module import of a file whose first lines carry `@internal`.
- `@internal/no-barrel-imports` — errors on aggregator-barrel imports.

Receipts:

- The aggregator-barrel `export *` cycle is the `useTime is not a function` load-order crash.
- Intra-module imports pointing at the module's own barrel create import-time cycles — see commit `2db6fc391`.

## Import package binding

The scoped types package in the import-order example is `@upmind-automation/types` (shown as `@app/types` in the base).

## Collection utilities — the Lodash mandate

**Use Lodash for ALL array/object operations:**

```typescript
import { map, filter, find, reduce, isEmpty } from "lodash-es";

const ids = map(items, 'id');
const active = filter(items, item => item.active);
const found = find(items, { id: targetId });
const total = reduce(items, (sum, item) => sum + item.price, 0);

// WRONG - Do NOT use native JS methods: items.map/filter/find/reduce
```

**Prefer one traversal, and mutating utilities over immutable chains.** Each lodash call is a full pass — deriving subsets with `filter` + `reject` + `map` loops the same array repeatedly. Use a single `remove(arr, predicate)` (mutates in place, returns the pulled items) so one call yields both subsets; at worst one `reduce`/`forEach`. Side effects inline in an `assign` are idiomatic here (precedent: `setAuthHelper`).

**Exception:** Do NOT use `lodash.get` for state/context access — use the Upmind state-read utilities instead (see `code-xstate.md`).

## Gate bindings (graphify-gate.sh)

Machine-readable bindings `hooks/graphify-gate.sh` reads from this companion (resolved via `git rev-parse --show-toplevel` → `.claude/rules/`, exactly like `hooks/seat-guard.sh`). No env-var channel exists. This section is what ACTIVATES the graphify gate: absent it (or absent a `citation-pattern`) the gate is INACTIVE and exits 0 for every write. With it present, a Write/Edit of a public-surface file (or one introducing an exported enum) is denied unless the content carries the citation substring.

- citation-pattern: graphify-out/
- public-surface-globs: *.types.ts
