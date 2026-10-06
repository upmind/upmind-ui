# module module

> TEMPLATE FILE — scaffolded by the factory; replace every placeholder.

## What Is This?

Replace with a plain-language explanation of the module's collection.

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
| `useModuleItem().withId(id)` | One record, read in full — self by default |
| `useModuleItem().as('staff').withId(id)` | Staff reading one record |

A record id is not a scope context: it rides on `.withId(id)`.

## Actor Arms

The module ships armless. An actor earns an arm only for members exclusive to it or overriding the shared factory.

## File Layout

```text
module/
├── module.types.ts
├── module.services.ts
├── module.services.{actor}.ts    # opt-in arm
├── module.mappers.ts
├── module.schemas.ts
├── module.schemas.{actor}.ts     # opt-in arm
├── useModule.ts
├── useModuleItem.ts              # opt-in single-record read
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

<!-- The module's real dependencies: sibling modules, `query`, `session-store`. -->

## Gotchas

<!-- Lifecycle and one-instance-per-scope-key gotchas. -->
