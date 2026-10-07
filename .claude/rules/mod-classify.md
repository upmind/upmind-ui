---
id: mod-classify
when: placing or moving a declaration in a module
paths:
  - 'packages/headless/src/modules/**/use*.ts'
  - 'packages/headless/src/modules/**/*.services.ts'
  - 'packages/headless/src/modules/**/*.services.*.ts'
  - 'packages/headless/src/modules/**/*.machine.ts'
  - 'packages/headless/src/modules/**/*.mappers.ts'
  - 'packages/headless/src/modules/**/*.schemas.ts'
  - 'packages/headless/src/modules/**/*.schemas.*.ts'
  - 'packages/headless/src/modules/**/*.utils.ts'
  - 'packages/headless/src/modules/**/*.types.ts'
---
# Classify a declaration by its nature

Each file has one job. Ask "what is this?" for every declaration, then put it in the file whose job that kind is (see mod-layer-contents).

| Kind | The tell |
| --- | --- |
| request | calls a `useQuery()` verb and returns a record, a promise or a query handle |
| machine service | async work that the machine invokes with `(context, event)` |
| services factory | returns an object of service functions |
| state | the machine or a query handle |
| meta | a yes/no flag derived from state |
| context | data derived from state |
| action | a verb that a consumer calls |
| mapper | turns the wire shape into the domain shape, or back |
| schema | a form or query declaration |
| type | a `type`, an `enum` or an `as const` table |
| utility | a pure computation of several steps with more than one caller |

Classify by nature, never by location, by callee or by history. The inputs never change the kind. A flag that reads the session is meta. A function that returns a `computed` is state, not a helper. A file must not keep a declaration of another kind, however many files do the same.
