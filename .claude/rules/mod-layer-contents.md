---
id: mod-layer-contents
when: writing a composable layer or a module utility
paths:
  - 'packages/headless/src/modules/**/use*.ts'
  - 'packages/headless/src/modules/**/*.utils.ts'
  - 'packages/headless/src/modules/**/*.machine.ts'
---
# Each layer file holds only its own kind

A composable layer holds one kind. The test: name the kind of each declaration, then check the row for its file.

| File | Holds | Never holds |
| --- | --- | --- |
| `use<Module>.ts` | the scope factory: it builds the machine or the queries and wires the layers | business logic, a flag, a request |
| `use<Module>.meta.ts` | yes/no flags derived from state | data, a verb |
| `use<Module>.context.ts` | data derived from state | a flag, a verb |
| `use<Module>.actions.ts` | verbs and the lifecycle members, with the actor arm spread last | a flag, derived data |
| `use<Module>.internals.ts` | the raw state holder and `send`, for tests and advanced use | logic |
| `<module>.machine.ts` | the machine: states, assign actions, guards, delays | any other declaration |
| `<module>.utils.ts` | utilities | state, a mapper, a schema |

Linters place requests, types, schemas and mappers. This rule covers the layers that need judgment. For the kinds themselves, see mod-classify.

Exemplar: `packages/headless/src/modules/account/`.
