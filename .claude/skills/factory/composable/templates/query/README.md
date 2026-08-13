# module module

> **TEMPLATE — doctrine wins.** `code-composables.md` + `code-composables.companion.md` ("Variance law") are the authority; this skeleton and its named worked example are one worked example each, never a match target. A disagreement is a surfaced finding, never silently resolved toward either.

<!--
@doctrine `docs-modules.companion.md` — "the module README.md is internal-
facing and stays untouched" (this file's own doctrine binding).

@surfaced-finding this bundle's own `design.md` (§D3 Docs-stage row) and
`SKILL.md` (Stage map, Docs row) state the module README.md is "authored
inside" the Docs stage — in apparent tension with the companion's older
"stays untouched" framing. NOT resolved here (a doctrine-vs-doctrine
disagreement between two of this project's own artefacts, not a
doctrine-vs-example one) — filed for Dom in
`docs/sdd/FE-2966-FE-2967/evidence/decisions.md`, Task 7. `client-email`'s own
tree only carries `docs/README.md`, not a module-root `README.md` — this
skeleton templates the file per D3's explicit file-set list regardless.
-->

## What Is This?

Replace with a plain-language explanation of the module's collection — see
`client-email/docs/README.md`'s "ELI5" section for the shape.

## Public Surface

```typescript
import { useModule } from "@upmind-automation/headless";
```

## Quick Start

```typescript
const module = useModule().as("self");
const { data, findOne, getOne } = module.useContext();
const { isReady, refresh } = module.useActions();

await isReady();
const items = data.value;
```

## Actor Usage

| Call | Meaning |
| --- | --- |
| `useModule().as('self')` | The active session's own collection |
| `useModule().as('staff').for('client', id)` | Staff reading a client's collection |

## Actor Arms

This module ships armless (clause 2, `code-composables.companion.md` "Variance
law"). All five layers — services, actions, context, meta, schemas — have an
opt-in arm template (`module.services.{actor}.ts` /
`useModule.actions.{actor}.ts` / `useModule.context.{actor}.ts` /
`useModule.meta.{actor}.ts` / `module.schemas.{actor}.ts`), cross-cited from the
machine variant's `auth/` (services/actions) or the doctrine PROSE directly
(context/meta/schemas) — no TanStack-backed module has earned an arm at any
layer yet. Copy + concretise one per layer, per actor that actually earns a
member exclusive to it or overriding the shared factory. See `.claude/skills/factory/composable/templates/ARMS.md` for
the full when/how/checker-gate decision tree; do not scaffold an arm un-earned.

## File Layout

```text
module/
├── module.types.ts
├── module.services.ts
├── module.services.{actor}.ts    # opt-in — see .claude/skills/factory/composable/templates/ARMS.md
├── module.mappers.ts
├── module.schemas.ts
├── module.schemas.{actor}.ts     # opt-in — see .claude/skills/factory/composable/templates/ARMS.md
├── useModule.ts
├── useModule.actions.ts
├── useModule.actions.{actor}.ts  # opt-in — see .claude/skills/factory/composable/templates/ARMS.md
├── useModule.context.ts
├── useModule.context.{actor}.ts  # opt-in — see .claude/skills/factory/composable/templates/ARMS.md
├── useModule.meta.ts
├── useModule.meta.{actor}.ts     # opt-in — see .claude/skills/factory/composable/templates/ARMS.md
├── useModule.internals.ts
├── index.ts
└── README.md            # this file
```

(`.claude/skills/factory/composable/templates/ARMS.md` / `.claude/skills/factory/composable/templates/NOT-APPLICABLE.md` are this template set's own factory-authoring
guidance — they are not copied into a built module.)

No `module.machine.ts` — query-backed, no machine (see `.claude/skills/factory/composable/templates/NOT-APPLICABLE.md`).

## Dependencies

<!-- List the module's real dependencies here (sibling modules, `query`,
`session-store`, etc.) — see `client-email/docs/README.md`'s implicit
dependency set (session-store, query) for the shape. -->

## Gotchas

<!-- Lifecycle/singleton-per-scope-key gotchas — see
`client-email/docs/README.md`'s "Gotchas" section for the shape. -->
