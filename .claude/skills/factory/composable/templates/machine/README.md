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
`docs/sdd/FE-2966-FE-2967/evidence/decisions.md`, Task 7. This skeleton
follows the SKILL.md/design.md sequencing (populated during/after the Docs
stage) as this bundle's own, more recent ruling, without silently overwriting
the companion's text.
-->

## What Is This?

Replace with a plain-language explanation of the module's job to be done —
the "customer vs employee behind the counter" actor-type analogy from
`docs-writing.companion.md` if the module is actor-scoped.

## Public Surface

```typescript
import { useModule } from "@upmind-automation/headless";
```

## Quick Start

```typescript
const module = useModule().as("self");
```

## Actor Usage

| Call | Meaning |
| --- | --- |
| `useModule().as('self')` | The active session's own collection |
| `useModule().as('staff').for('client', id)` | Staff acting for a client's collection |

<!-- Keep only the rows this module's scope matrix (`MODULE_SCOPE_MATRIX`)
actually declares — an armless module still supports `.as('staff').for(...)` if
its matrix maps STAFF → CLIENT, so document it even before an arm is earned. -->

## Module Boundaries

<!-- Table of this module's design invariants and what each one means, if any
exist — see `auth/README.md`'s "Module Boundaries" table for the shape. -->

## Actor Arms

This module ships armless (clause 2, `code-composables.companion.md` "Variance
law"). All five layers — services, actions, context, meta, schemas — have an
opt-in arm template (`module.services.{actor}.ts` /
`useModule.actions.{actor}.ts` / `useModule.context.{actor}.ts` /
`useModule.meta.{actor}.ts` / `module.schemas.{actor}.ts`); clause 3 applies
uniformly to all five, not only the two layers with a real-world exemplar
(`auth/`). Copy + concretise one per layer, per actor that actually earns a
member exclusive to it or overriding the shared factory. See `.claude/skills/factory/composable/templates/ARMS.md` for
the full when/how/checker-gate decision tree; do not scaffold an arm un-earned.

## File Layout

```text
module/
├── module.types.ts
├── module.machine.ts       # owns its machine — OR useModule.machine.ts (shared machine), never both
├── useModule.machine.ts    # shared-machine config factory (dataManagerMachine) — see companion "Shared-machine config factory"
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

## Dependencies

<!-- List the module's real dependencies here (sibling modules, `scope`,
`query`, `session-store`, etc.) — see `account/README.md` / `auth/README.md`
"Dependencies" sections. -->

## State Machine Boundaries

<!-- Note any topology invariants (e.g. a `type: "final"` state another
module's `onDone` depends on) — see `auth/README.md`'s "State Machine
Boundaries" section for the shape. Omit this section entirely if the module
carries no such invariant. -->
