---
paths:
  - '**/*.ts'
  - '**/*.tsx'
  - '**/*.vue'
  - '**/*.js'
  - '**/*.mjs'
---
> Companion to `code-quality.md` — Upmind-monorepo bindings.

## No duplicate types (graphify gate)

Before you mint a type, enum or utility, find the existing one: the graphify MCP (`query_graph` / `get_node` on the name) is the fast lookup. The plugin's `graphify-gate.sh` denies a write that re-declares an exported type name already present anywhere in the repo, and names where it lives. Import it, or move it to `@upmind-automation/types` when two modules need it. A same-named export in a different module directory is allowed only for the per-module convention names below.

## Module Visibility Law

Mechanically enforced by two ESLint rules in the root `eslint.config.mjs`: `@internal/no-cross-module-imports` and `@internal/no-barrel-imports`. The internal-file set is `*.machine.ts`, `*.services.ts`, `*.mappers.ts`, `*.schemas.ts` and `session-store.*`.

## Import package binding

The scoped types package is `@upmind-automation/types` (`@app/types` in the base).

## Collection utilities — the Lodash mandate

Use Lodash (`lodash-es`) for ALL array and object operations. Never native `items.map/filter/find/reduce`. Prefer one traversal: `remove(arr, predicate)` yields both subsets in one pass; at worst one `reduce`/`forEach`.

Two exceptions:

- Never `lodash.get` for state or context access — use the Upmind state-read utilities (`code-xstate.md`).
- **The composed components carve out.** No `lodash-es` import under `design-system/packages/ui/src/components/**` — native methods and the local `lib/utils.ts` helpers stand in, per `COMPONENT_SPEC.md`. Enforced by `ui/no-lodash-in-components` (FE-3247). The vendored `src/form/**` subtree is unaffected.

## Gate bindings (graphify-gate.sh)

- per-module-names: Context, ContextTypes, Actions, Meta, Internals, Props, ScopeMatrix
