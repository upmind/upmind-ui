> Companion to [code-typescript.md](./code-typescript.md) — Upmind-monorepo-specific bindings/examples.

## Types-module suffix

The base rule's "dedicated types module" binds concretely to the **`<module>.types.ts`** suffix in this monorepo. Types are never defined inline in a `.vue`, a `.styles.ts`, or a composable — they live in the module's `*.types.ts` file, the single source of truth.

## Enum example

The base rule's generic enum example (`Status.ACTIVE`, not `"active"`) is, in this repo, most often the actor enum: use **`AccessRoleTypes.STAFF`**, never the raw string `"staff"`. Enum members are used in ALL contexts — comparisons, defaults, CVA `defaultVariants`, story args.

## Composable re-export clause

The base rule's "no type re-exports from other modules" binds specifically to **composables** here: never re-export a type through a composable (`useX`); import it from the module's `.types.ts` directly. The full composable contract lives in `code-composables.md` (+ `code-composables.companion.md`).
