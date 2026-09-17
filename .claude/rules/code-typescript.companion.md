---
paths:
  - '**/*.ts'
  - '**/*.tsx'
---
> Companion to [code-typescript.md](./code-typescript.md) — Upmind-monorepo-specific bindings/examples.

## Types-module suffix

The base rule's "dedicated types module" binds concretely to the **`<module>.types.ts`** suffix in this monorepo. Types are never defined inline in a `.vue`, a `.styles.ts`, or a composable — they live in the module's `*.types.ts` file, the single source of truth.

**Enforced (FE-3249)** over `packages/headless/src/modules/**` by two `error` rules in the root `eslint.config.mjs`:

- `file-responsibility/types-in-types-file` — an exported `type` / `interface` / `enum` must live in a `*.types.ts` file. A local non-exported type stays legal anywhere. A co-located derived type (`export type X = ReturnType<typeof factory>` / `Awaited<…>`) is exempt: it cannot leave the file without a cycle.
- `file-responsibility/no-type-reexport` — a type has one home. Do not re-export it from ANOTHER module. A module's own barrel re-exporting its own `*.types` is fine; a package re-export (ajv) is fine.

## Enum example

The base rule's generic enum example (`Status.ACTIVE`, not `"active"`) is, in this repo, most often the actor enum: use **`AccessRoleTypes.STAFF`**, never the raw string `"staff"`. Enum members are used in ALL contexts — comparisons, defaults, CVA `defaultVariants`, story args.