# module module

> TEMPLATE FILE — scaffolded by the factory; replace every placeholder.

## What Is This?

Replace with a plain-language explanation of the module's job to be done.

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
| `useModule().as('self')` | The active session acting for itself |
| `useModule().as('staff').for('client', id)` | Staff acting for a client |

<!-- Keep only the rows `MODULE_SCOPE_MATRIX` declares. -->

## Module Boundaries

<!-- The module's design invariants and what each one means. -->

## Actor Arms

The module ships armless. An actor earns an arm only for members exclusive to it or overriding the shared factory.

## File Layout

```text
module/
├── module.types.ts
├── module.machine.ts             # owns its machine — or useModule.machine.ts, never both
├── useModule.machine.ts          # configures the shared dataManagerMachine
├── module.services.ts
├── module.services.{actor}.ts    # opt-in arm
├── module.mappers.ts
├── module.schemas.ts
├── module.schemas.{actor}.ts     # opt-in arm
├── useModule.ts
├── useModule.actions.ts
├── useModule.actions.{actor}.ts  # opt-in arm
├── useModule.context.ts
├── useModule.context.{actor}.ts  # opt-in arm
├── useModule.meta.ts
├── useModule.meta.{actor}.ts     # opt-in arm
├── useModule.internals.ts
├── index.ts
└── README.md
```

## Dependencies

<!-- The module's real dependencies: sibling modules, `scope`, `query`, `session-store`. -->

## State Machine Boundaries

<!-- Topology invariants another module depends on, such as a `type: "final"`
state an `onDone` waits for. Omit the section if there are none. -->
