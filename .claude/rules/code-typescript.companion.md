---
paths:
  - '**/*.ts'
  - '**/*.tsx'
---
> Companion to [code-typescript.md](./code-typescript.md) — Upmind-monorepo-specific bindings/examples.

## Types-module suffix

The base rule's "dedicated types module" binds concretely to the **`<module>.types.ts`** suffix in this monorepo. Types are never defined inline in a `.vue`, a `.styles.ts`, or a composable — they live in the module's `*.types.ts` file, the single source of truth.

## Enum example

The base rule's generic enum example (`Status.ACTIVE`, not `"active"`) is, in this repo, most often the actor enum: use **`AccessRoleTypes.STAFF`**, never the raw string `"staff"`. Enum members are used in ALL contexts — comparisons, defaults, CVA `defaultVariants`, story args.