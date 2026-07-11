# Client Email

Scoped composables for a client's email addresses: a **collection**
(`useClientEmails`) and a per-email **form editor** (`useClientEmailManager`).
Both follow the ADR 001 scope pattern — `.as(actor)` + the four-layer return
(`useContext` / `useMeta` / `useActions` / `useInternals`), no direct props.

## ELI5

A client has one or more email addresses (one is the default; each is verified
or not). This module gives you two things:

- `useClientEmails` — the **list**: read the emails, find the default, remove
  one, resend a verification, set a new default, or find-or-create one.
- `useClientEmailManager` — the **single-email form**: type into it, validate,
  and save one email (add or edit).

You always say _who_ you are with `.as(...)`: `.as('self')` (the current
session's client) or `.as('staff').for('client', id)` (staff acting on a
client). You never pass a client id by hand — the active session supplies it.

## Quick start

```ts
import {
  useClientEmails,
  useClientEmailManager
} from "@upmind-automation/headless";
import { ScopeActorTypes } from "@upmind-automation/headless"; // for .as(SELF)

// --- Collection (current session's client)
const emails = useClientEmails().as(ScopeActorTypes.SELF);

const { data, default: getDefault, getOne } = emails.useContext();
const { isLoading, isEmpty, hasError } = emails.useMeta();
const { isReady, refresh, remove, verify, setDefault, ensure } =
  emails.useActions();

await isReady(); // resolves once the list is loaded
const list = data.value; // Email[]
const primary = getDefault(); // the default Email (or undefined)

// --- Manager (edit one email)
const manager = useClientEmailManager()
  .as(ScopeActorTypes.CLIENT)
  .for("email", emailId);
const { model, schema, uischema, errors } = manager.useContext();
const { meta } = manager.useMeta(); // { isValid, isDirty, isProcessing, ... }
const { input, update, isReady: ready } = manager.useActions();

await ready();
await input({ email: "new@example.com" }); // debounced parse + validate
await update(); // persists, resolves the saved model
```

## Actor usage

| Call                                                    | Meaning                               |
| ------------------------------------------------------- | ------------------------------------- |
| `useClientEmails().as('self')`                          | The active session's own email list   |
| `useClientEmails().as('client')`                        | A client's list (self)                |
| `useClientEmails().as('staff').for('client', id)`       | Staff reading a client's list         |
| `useClientEmailManager().as('client').for('email', id)` | Edit a specific email                 |
| `useClientEmailManager().as('client').fresh()`          | A brand-new email (isolated instance) |

`.as(...)` takes the `ScopeActorTypes` enum. Use `ScopeActorTypes.SELF` for the
common "current session" case.

## Layers

**Collection (`useClientEmails`)** — query-backed (TanStack), no machine:

- `useContext()` → `data`, `default()`, `error`, `pagination`, `getOne`, `findOne`
- `useMeta()` → `isAvailable`, `isEmpty`, `hasError`, `isLoading`
- `useActions()` → `isReady`, `ensure`, `remove`, `verify`, `setDefault`,
  `refresh`, `nextPage`, `prevPage`, `invalidate`, `filters.query`, `destroy`
- `useInternals()` → `actorScope`, `query` (raw TanStack query)

**Manager (`useClientEmailManager`)** — backed by the shared `dataManagerMachine`:

- `useContext()` → `model`, `schema`, `uischema`, `errors`, `validationErrors`,
  `title`, `description`, `id`, `context`
- `useMeta()` → `meta` (`isAvailable`, `isValid`, `isDirty`, `isNew`,
  `isProcessing`, `isComplete`, `hasErrors`, `isLoading`)
- `useActions()` → `input` (debounced), `update`, `clear`, `stop`, `isReady`,
  `onDone`, `destroy`
- `useInternals()` → `actorScope`, `send`, `service`, `state`

## Gotchas

- **Lifecycle.** Both composables are non-singletons in spirit — call
  `useActions().destroy()` on unmount. The collection's `destroy()` evicts the
  registry entry; the manager's `destroy()` also **stops the service** first.
  `stop()` (manager) only halts the service and leaves a stale registry entry —
  prefer `destroy()`.
- **Singletons per scope key.** Two calls with the same `(actor, context)` share
  one instance (one query / one machine). `.fresh()` forces a new manager
  instance for a new-email form.
- **The manager seeds its model from the collection.** Editing `for('email', id)`
  reads the initial model from the active client's `useClientEmails` list, so a
  stale list yields a stale starting model — `refresh()` the collection first if
  needed.
- **`update()` flushes the debounce.** It commits any pending debounced `input()`
  before saving, so the save never reads a pre-edit model.
- **Save keeps the form editable.** Scoped manager instances run with
  `allowMultipleEdits`, so after a save the machine returns to `available`
  (not the `complete` final state) and a remounting form reuses the instance.
- **Errors are never silent empties.** A 401/4xx on the list surfaces through
  `useMeta().hasError` + `useContext().error` — do not read an empty `data` as
  "no emails".

## Tests

- `__tests__/useClientEmails.test.ts` — collection scope resolution, four-layer
  surface, action delegation, singleton + eviction (query layer mocked).
- `__tests__/useClientEmailManager.test.ts` — manager actions/meta/context
  factories in isolation (machine seam mocked).
- `__tests__/client-email.int.test.ts` — real collection query over a seeded
  client session against replayed fixtures: happy mapping, 401, 4xx, and the
  remove DELETE contract. Fixtures in `__tests__/fixtures/`.
