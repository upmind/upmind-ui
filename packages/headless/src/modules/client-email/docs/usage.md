# client-email — Usage

Full API reference for the module's two composables:

- **`useClientEmails`** — the collection. Read the client's addresses and act on them row by row.
- **`useClientEmailManager`** — the per-email editor. Open one address (or start a new one) in a validated form and save it.

Both act on the calling client's own addresses. Every capability below carries a 🧪 **For Testers** expected-behaviour statement.

## Getting an instance

```ts
import {
  useClientEmails,
  useClientEmailManager
} from "@upmind-automation/headless";

// The collection — the calling client's own addresses
const emails = useClientEmails().as("self");

// The editor, opened on one existing address
const manager = useClientEmailManager().as("self").for("email", emailId);

// The editor, started on a brand-new address
const draft = useClientEmailManager().as("self").fresh();
```

Both composables return the same four sub-composables:

| Layer     | Access            | Collection contains            | Editor contains                  |
| --------- | ----------------- | ------------------------------ | -------------------------------- |
| Actions   | `.useActions()`   | row mutations + list lifecycle | form input, save, lifecycle      |
| Context   | `.useContext()`   | reactive list + lookups        | model, schema, errors            |
| Meta      | `.useMeta()`      | four state flags               | eight state flags                |
| Internals | `.useInternals()` | the raw list query             | the raw machine state and sender |

> **🧪 For Testers:** Both composables support the client's own (`self`) scope only. `staff` and `guest` are compile-time errors, not runtime failures — there is no scope in this module for one party to read or edit another party's addresses.

---

## The collection — `useClientEmails`

### Collection actions — `useActions()`

Eleven members. Per-address **form** editing (`add` / `update` / field validation) is deliberately not here — that lives on the editor, which owns the dirty/valid state those need.

#### `ensure(model)`

Finds an existing address by value, or creates it. This is the collection's create seam.

| Param         | Type     | Required |
| ------------- | -------- | -------- |
| `model.email` | `string` | Yes      |

**Returns:** `Promise<Email>` — the existing matching record, or the newly created one.

> **🧪 For Testers:** When the address is already in the loaded collection, `ensure({ email })` resolves it with **no** create request fired. When absent, it POSTs `{ email }` — no `type` field — to the client's own resource with the client's session token and no acting-as headers, then resolves the created record.

#### `remove(id)`

Deletes an address the platform currently marks deletable.

**Returns:** `Promise<void>` — settles once the delete completes.

> **🧪 For Testers:** `remove(id)` DELETEs the client's own resource with the client's session token and no acting-as headers. On success the address is gone from the reactive list. **No toast or notification is raised** — a failure lands in `useContext().error` for you to render.

#### `setDefault(id)`

Promotes a verified address to the client's default.

**Returns:** `Promise<IEmail | undefined>` — the updated wire record.

> **🧪 For Testers:** `setDefault(id)` PUTs `{ default: true }`. On success the targeted record's `meta.isDefault` becomes `true` and the previous default's becomes `false`. Against an **unverified** address the platform rejects with `409`; the rejection lands in `useContext().error`, and nothing is checked locally before the request goes out.

#### `verify(id)`

Requests a fresh verification message for an address. This does not submit a code — it asks the platform to (re-)send one.

**Returns:** `Promise<void>` — settles once the request completes.

> **🧪 For Testers:** `verify(id)` PATCHes the address's `send_verify` path with no body, using the client's session token and no acting-as headers.

#### `isReady()` — waiting for the list

Resolves once the collection is ready to read.

**Returns:** `Promise<boolean>` — `true` once the first fetch has settled; `false` if the session settles without an addressable client.

> **🧪 For Testers:** `isReady()` waits only while the session is still settling. A session that never authenticates resolves it `false` rather than hanging. It resolves once the first fetch has _settled_ — a first fetch that settles in error also counts as settled, so pair it with `hasError` before treating an empty list as an empty collection.

#### `refresh()`

Forces a re-read of the list from the server.

**Returns:** `Promise<void>`.

**Throws:** `NotAuthenticatedError` when the scope cannot address a client — either before the request is issued, or if the session dies mid-flight.

> **🧪 For Testers:** `refresh()` is the one collection read that **rejects** rather than resolving quietly. With no addressable client it throws `NotAuthenticatedError` and no request leaves the client.

#### `invalidate()`

Marks this module's cached list stale so the next read re-fetches it.

**Returns:** `Promise<T | undefined>` — resolves with whatever it was passed, so it can be chained onto another promise.

#### `nextPage()` / `prevPage()`

Moves the collection to the next or previous page.

**Returns:** `void`.

> **🧪 For Testers:** The collection is unpaged by default — the whole list arrives in one response, and both calls are no-ops with no other page to move to. They only do anything when a page size was requested.

#### `filters.query(value)`

Applies a free-text filter and re-issues the list request.

**Returns:** `void`.

#### `destroy()` — releasing the collection

Removes this scoped instance from the registry.

**Returns:** `void`.

> **🧪 For Testers:** `destroy()` removes the scope-registry entry, so the next `useClientEmails().as('self')` mints a fresh collection rather than a cached one. The collection has no service to stop — unlike the editor, whose `destroy()` also stops its machine. Call on component unmount.

### Collection context — `useContext()`

| Property     | Type                                                       | Meaning                                                  |
| ------------ | ---------------------------------------------------------- | -------------------------------------------------------- |
| `data`       | `ComputedRef<Email[]>`                                     | The client's reactive list of addresses                  |
| `default()`  | `(data?) => Email \| undefined`                            | The collection's current default address, if any         |
| `error`      | `ComputedRef<ResponseError \| undefined>`                  | The last failed row mutation, else the list read's error |
| `findOne()`  | `(mapping, data?, searchableProps?) => Email \| undefined` | Finds a single address by a partial mapping or free text |
| `getOne(id)` | `(id, data?) => Email \| undefined`                        | Finds a single address by id                             |
| `pagination` | `ComputedRef<PaginationInfo>`                              | `{ limit, total, page, pages, from, to }`                |

> **🧪 For Testers:** `data` is always an array — before the first read completes, and when the read errors. Read `useMeta().isLoading` / `hasError` rather than inferring state from an empty list. `error` is **state you read**, never an event: a failed mutation lands here and stays until the next one supersedes it.

### Collection meta — `useMeta()`

Four flags.

| Flag          | True when                                                                      |
| ------------- | ------------------------------------------------------------------------------ |
| `hasError`    | a row mutation or the list read failed                                         |
| `isAvailable` | the session is authenticated **and** the scope resolved a client id to address |
| `isEmpty`     | the resolved collection has no addresses                                       |
| `isLoading`   | the list read is in flight or has not completed its first fetch                |

`isAvailable` is worth reading twice. It is **both limbs**: authenticated, _and_ a client id resolved. A session that authenticates but resolves no client correctly reports `false`. It is also the _same predicate_ every request gate in this module calls — not a second copy of it — so the flag you render and the guard the wire enforces cannot drift apart. It is reactive: it flips to `false` in the same tick the session goes away.

> **🧪 For Testers:** `isAvailable` is `false` before sign-in (while `isLoading` is still `true`), `true` once a client session is active, and `false` again the moment the session goes away — with zero requests emitted on that flip. A session that authenticates without resolving a client id reads `false`, which is the case that tells this flag apart from a plain "am I logged in" check.

### Collection internals — `useInternals()`

| Property     | Meaning                                    |
| ------------ | ------------------------------------------ |
| `actorScope` | the resolved actor for this instance       |
| `query`      | the raw list-query object backing the list |

For debugging and tests. Not for production consumers.

---

## The per-email editor — `useClientEmailManager`

A form editor over one address. Open an existing address with `.for("email", id)`; start a new one with `.fresh()`. Each call to `.fresh()` mints its own isolated instance, so two concurrent drafts never share a model.

```ts
const manager = useClientEmailManager().as("self").for("email", emailId);

await manager.useActions().isReady();
await manager.useActions().update({ email: "new@example.com" });
```

### Editor actions — `useActions()`

Seven members.

#### `isReady()` — waiting for the form

Resolves when the form is available for input.

**Returns:** `Promise<boolean>` — `true` once available, `false` if it settled in error.

> **🧪 For Testers:** The editor never issues a request before it knows which client it is editing for. On a cold boot it waits, then loads once the client id resolves — a session that never authenticates leaves it waiting with no request emitted, rather than firing an unaddressed one.

#### `input(model)`

Feeds a model into the form. **Debounced** — rapid calls collapse into one parse.

| Param   | Type                                    | Required |
| ------- | --------------------------------------- | -------- |
| `model` | `EmailModel \| Record<string, unknown>` | Yes      |

**Returns:** `Promise<EmailModel>` — the parsed model, after validation has run.

> **🧪 For Testers:** `input()` resolves the _parsed_ model, not the raw one you passed. Typing an invalid address does not reject — it resolves and flips `useMeta().isValid` to `false`, with the field-level reason in `useContext().validationErrors`.

#### `update(value?)`

Saves the current model — or the one you pass — and resolves the persisted model. **This is the editor's save, and it covers both create and edit:** a `.fresh()` draft creates; an address-scoped editor updates.

| Param   | Type                                    | Required |
| ------- | --------------------------------------- | -------- |
| `value` | `EmailModel \| Record<string, unknown>` | No       |

**Returns:** `Promise<EmailModel>` — the persisted model.

**Rejects:** with a `DetailedError` carrying the underlying failure, for you to render.

> **🧪 For Testers:** `update()` flushes any pending debounced input first, so a save immediately after a keystroke persists the typed value, not the pre-edit one. Editing an existing address PUTs `{ email, verified: 0 }` — the change always re-marks the record unverified, even when the submitted value equals the stored one. Saving a fresh draft goes through find-or-create: an address the client already holds resolves the existing record instead of creating a duplicate. On success the shared cached list is invalidated, so an open collection reflects the saved value.

#### `clear()`

Clears the current form context back to its starting state.

**Returns:** `void`.

> **🧪 For Testers:** After `clear()`, `useMeta().isDirty` reads `false` — the model returns to the same baseline the form opened on, not to an empty object.

#### `onDone()`

Resolves once a save has completed.

**Returns:** `Promise<boolean>` — `true` on completion, `false` if it never settled.

#### `stop()` — pausing the editor

Stops the underlying editor, leaving the registry entry in place.

**Returns:** `void`.

#### `destroy()` — releasing the editor

Stops the editor **and** removes it from the registry.

**Returns:** `void`.

> **🧪 For Testers:** After `stop()` the instance is still registered but no longer working; after `destroy()` it is released, and reopening that address mints a fresh editor. Call `destroy()` on component unmount.

### Editor context — `useContext()`

Nine members. This is where the form's schema and UI definition surface — the module exports no other way to obtain them.

Every member is read through the shared state helpers, so each is a `ComputedRef` that can be `undefined` before the editor has settled.

| Property           | Type                                        | Meaning                                                       |
| ------------------ | ------------------------------------------- | ------------------------------------------------------------- |
| `context`          | `ComputedRef<EmailContext \| undefined>`    | The full editor context object                                |
| `description`      | `ComputedRef<string \| undefined>`          | Display description for the address being edited              |
| `errors`           | `ComputedRef<string \| undefined>`          | The captured error message, if any — read, never raised       |
| `id`               | `ComputedRef<string \| undefined>`          | The id of the address being edited; `undefined` for a new one |
| `model`            | `ComputedRef<EmailModel \| undefined>`      | The current form model                                        |
| `schema`           | `ComputedRef<JsonSchema \| undefined>`      | The form's JSON schema                                        |
| `title`            | `ComputedRef<string \| undefined>`          | Display title — the address, or `"New Email"` for a draft     |
| `uischema`         | `ComputedRef<UISchemaElement \| undefined>` | The form's UI definition, paired with `schema`                |
| `validationErrors` | `ComputedRef<ErrorObject[] \| undefined>`   | Field-level validation errors — read, never raised            |

> **🧪 For Testers:** `errors` and `validationErrors` are **state**, not events. Nothing is thrown at you and nothing is announced — a rejected save lands here and stays readable until the next operation supersedes it.

### Editor meta — `useMeta()`

Eight flat flags — one computed per flag. There is no single `meta` object to unwrap; read `useMeta().isValid`, not `meta.value.isValid`.

| Flag           | True when                                                         |
| -------------- | ----------------------------------------------------------------- |
| `hasErrors`    | the editor captured an error                                      |
| `isAvailable`  | the form is available for input                                   |
| `isComplete`   | the address has been saved                                        |
| `isDirty`      | the model differs from its persisted baseline                     |
| `isLoading`    | the editor is waiting for its client id, or resolving its lookups |
| `isNew`        | the address is new — the editor carries no address id             |
| `isProcessing` | a save is in flight                                               |
| `isValid`      | the current model passes schema validation                        |

> **🧪 For Testers:** `isLoading` is `true` while the editor waits for its client id — that state is loading, not broken. `isNew` reads the editor's own address id, so a `.fresh()` draft reports `true` until its first successful save.

### Editor internals — `useInternals()`

| Property     | Meaning                              |
| ------------ | ------------------------------------ |
| `actorScope` | the resolved actor for this instance |
| `send`       | the raw event sender                 |
| `service`    | the raw underlying service           |
| `state`      | the raw reactive state               |

For debugging and tests. Not for production consumers.

---

## The form definition — paste-ready

The editor serves its form definition at runtime through **`useClientEmailManager().useContext().schema`** and **`.uischema`**. They travel as a pair through the editor's own context; the module's barrel exports neither, because a form rendered from a definition the editor has not adopted validates against a different contract than the one that saves.

The two blocks below are that same pair rendered as plain JSON. Paste them into [jsonforms.io](https://jsonforms.io/examples/basic) — schema on the left, UI schema on the right — to see the rendered form.

### Schema

```json
{
  "type": "object",
  "title": "Email",
  "required": ["email"],
  "definitions": {
    "id": {
      "type": ["string", "null"],
      "title": "ID",
      "description": "The auto-generated ID of this email.",
      "readOnly": true
    },
    "email": {
      "type": "string",
      "format": "email",
      "title": "Email"
    }
  },
  "properties": {
    "id": { "$ref": "#/definitions/id" },
    "email": { "$ref": "#/definitions/email" }
  }
}
```

### UI schema

```json
{
  "type": "VerticalLayout",
  "elements": [
    {
      "type": "Control",
      "scope": "#/properties/id",
      "rule": {
        "effect": "HIDE",
        "condition": { "const": true }
      }
    },
    {
      "type": "Control",
      "scope": "#/properties/email",
      "i18n": "form.email",
      "options": {
        "autoFocus": true,
        "autocomplete": "email",
        "placeholder": "name@email.com"
      }
    }
  ]
}
```

### Starting data

The editor's baseline model — what an untouched form holds before a key is pressed:

```json
{
  "email": null
}
```

Notes for the paste:

- **The `id` control renders nothing.** Its `HIDE` rule is unconditional and deliberate: without it, the auto-generated id renders in the email field's place. One visible field is the correct result.
- **`i18n: "form.email"`** names a translation key. With no translator registered, the control falls back to the schema's `title` — so the label reads "Email" in the playground and the localised string in the app.
- **The pair moves together.** A schema field with no matching control renders as a required-but-invisible input, which is why these two blocks are never edited apart.

> **🧪 For Testers:** The barrel exposes no `useSchema` / `useUischema`. The only supported way to obtain the form definition is the editor's context — a consumer reaching for a bare export is reaching for something the module does not offer.

---

## Errors are state, never announcements

Nothing in this module raises a toast, a notification, or any other message on your behalf. Every failure is captured where you can read and render it:

```ts
// Collection
const { error } = emails.useContext();
const { hasError } = emails.useMeta();

// Editor
const { errors, validationErrors } = manager.useContext();
const { hasErrors } = manager.useMeta();

// Success signal for the editor
await manager.useActions().onDone();
```

> **🧪 For Testers:** No mutation in this module produces user-visible feedback of its own. A consumer that shows nothing after a failed delete has not lost the error — it has not rendered `useContext().error`.

## Types

```ts
import {
  useClientEmails,
  useClientEmailManager,
  CLIENT_EMAILS_SCOPE_MATRIX,
  CLIENT_EMAIL_SCOPE_MATRIX,
  ClientEmailsContextTypes,
  ClientEmailContextTypes,
  EmailTypes,
  type UseClientEmails,
  type UseClientEmailsActions,
  type UseClientEmailsContext,
  type UseClientEmailsMeta,
  type UseClientEmailsInternals,
  type UseClientEmailManager,
  type UseClientEmailManagerActions,
  type UseClientEmailManagerContext,
  type UseClientEmailManagerMeta,
  type UseClientEmailManagerInternals,
  type ClientEmailsScopeMatrix,
  type ClientEmailScopeMatrix,
  type Email,
  type EmailModel,
  type EmailContext
} from "@upmind-automation/headless";
```

That list is the module's whole public surface. The services, mappers, schema factories and machine config are internal and are not exported — see [gotchas.md](./gotchas.md).
