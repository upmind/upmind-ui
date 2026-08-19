# client-phone — Usage

Full API reference for the module's two composables:

- **`useClientPhones`** — the collection. Read the client's phone numbers and act on them row by row.
- **`useClientPhoneManager`** — the per-phone editor. Open one number (or start a new one) in a validated form and save it.

Both act on the calling client's own numbers. Every capability below carries a 🧪 **For Testers** expected-behaviour statement.

## Getting an instance

```ts
import {
  useClientPhones,
  useClientPhoneManager
} from "@upmind-automation/headless";

// The collection — the calling client's own phone numbers
const phones = useClientPhones().as("self");

// The editor, opened on one existing phone number
const manager = useClientPhoneManager().as("self").for("phone", phoneId);

// The editor, started on a brand-new phone number
const draft = useClientPhoneManager().as("self").fresh();
```

Both composables return the same four sub-composables:

| Layer     | Access            | Collection contains            | Editor contains                  |
| --------- | ----------------- | ------------------------------ | -------------------------------- |
| Actions   | `.useActions()`   | row mutations + list lifecycle | form input, save, lifecycle      |
| Context   | `.useContext()`   | reactive list + lookups        | model, schema, errors            |
| Meta      | `.useMeta()`      | four state flags               | eight state flags                |
| Internals | `.useInternals()` | the raw list query             | the raw machine state and sender |

> **🧪 For Testers:** Both composables support the client's own (`self`) scope only. `staff` and `guest` are compile-time errors, not runtime failures — there is no scope in this module today for a staff member to read or edit another party's phone numbers.

---

## The collection — `useClientPhones`

### Collection actions — `useActions()`

Ten members. Per-number **form** editing (`add` / `update` / field validation) is deliberately not here — that lives on the editor, which owns the dirty/valid state those need.

#### `ensure(model)`

Finds an existing phone number by value, or creates it. This is the collection's create seam.

| Param         | Type                  | Required |
| ------------- | --------------------- | -------- |
| `model.phone` | `PhoneModel["phone"]` | Yes      |

**Returns:** `Promise<Phone>` — the existing matching record, or the newly created one.

> **🧪 For Testers:** When the number is already in the loaded collection, `ensure(model)` resolves it with **no** create request fired. When absent, it POSTs `{ phone, phone_code, phone_country_code }` — no `type` field — to the client's own resource with the client's session token, then resolves the created record.

#### `remove(id)`

Deletes a phone number the platform currently marks deletable.

**Returns:** `Promise<void>` — settles once the delete completes.

> **🧪 For Testers:** `remove(id)` DELETEs the client's own resource with the client's session token. On success the number is gone from the reactive list AND a success message is raised. On failure, an error message is raised AND the failure lands in `useContext().error` — both, not one (this collection is one of the few in this codebase that raises its own feedback on a row mutation; see [gotchas.md](./gotchas.md)).

#### `setDefault(id)`

Promotes a phone number to the client's default.

**Returns:** `Promise<Phone | undefined>` — the updated wire record, mapped.

> **🧪 For Testers:** `setDefault(id)` PUTs a body that is **exactly** `{ default: true }` — no other key. On success the targeted record's `meta.isDefault` becomes `true`, the previous default's becomes `false`, and a success message is raised. On failure an error message is raised and the failure lands in `useContext().error`.

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

Advertised list-paging members.

**Returns:** would move the collection to the next or previous page.

> **🧪 For Testers: these two ALWAYS THROW `text.page_next_not_available` through this surface.** The collection opens its read with no page size, so it already holds the entire list in one response — there is never a second page for these to move to. This is not a bug specific to this module; see [gotchas.md](./gotchas.md#2-nextpage--prevpage-always-throw--the-collection-already-holds-everything) for why paging genuinely works one layer down instead, and where.

#### `filters.query(value)`

Applies a free-text filter and re-issues the list request.

**Returns:** `void`.

#### `destroy()` — releasing the collection

Removes this scoped instance from the registry.

**Returns:** `void`.

> **🧪 For Testers:** `destroy()` removes the scope-registry entry, so the next `useClientPhones().as('self')` mints a fresh collection rather than a cached one. The collection has no service to stop — unlike the editor, whose `destroy()` also stops its machine. Call on component unmount.

### Collection context — `useContext()`

| Property     | Type                                                       | Meaning                                                  |
| ------------ | ---------------------------------------------------------- | -------------------------------------------------------- |
| `data`       | `ComputedRef<Phone[]>`                                     | The client's reactive list of phone numbers              |
| `default()`  | `(data?) => Phone \| undefined`                            | The collection's current default number, if any          |
| `error`      | `ComputedRef<ResponseError \| undefined>`                  | The last failed row mutation, else the list read's error |
| `findOne()`  | `(mapping, data?, searchableProps?) => Phone \| undefined` | Finds a single number by a partial mapping or free text  |
| `getOne(id)` | `(id, data?) => Phone \| undefined`                        | Finds a single number by id                              |
| `pagination` | `ComputedRef<PaginationInfo>`                              | `{ limit, total, page, pages, from, to }`                |

> **🧪 For Testers:** `data` is always an array — before the first read completes, and when the read errors. Read `useMeta().isLoading` / `hasError` rather than inferring state from an empty list. `error` is **state you read**, never an event: a failed mutation lands here and stays until the next one supersedes it. `findOne()` matches a **nested partial mapping** — `findOne({ phone: { number } })` matches on the parsed number alone, without needing the rest of the `phone` object. See [gotchas.md](./gotchas.md#6-findone-matches-nested-partials-the-shared-usecollection-helper-does-not) for why that matters if you are porting matching logic from another module.

### Collection meta — `useMeta()`

Four flags.

| Flag          | True when                                                                      |
| ------------- | ------------------------------------------------------------------------------ |
| `hasError`    | a row mutation or the list read failed                                         |
| `isAvailable` | the session is authenticated **and** the scope resolved a client id to address |
| `isEmpty`     | the resolved collection has no phone numbers                                   |
| `isLoading`   | the list read is in flight or has not completed its first fetch                |

`isAvailable` is worth reading twice. It is **both limbs**: authenticated, _and_ a client id resolved. A session that authenticates but resolves no client correctly reports `false`. It is also the _same predicate_ every request gate in this module calls — not a second copy of it — so the flag you render and the guard the wire enforces cannot drift apart. It is reactive: it flips to `false` in the same tick the session goes away.

> **🧪 For Testers:** `isAvailable` is `false` before sign-in (while `isLoading` is still `true`), `true` once a client session is active, and `false` again the moment the session goes away — with zero requests emitted on that flip.

### Collection internals — `useInternals()`

| Property     | Meaning                                    |
| ------------ | ------------------------------------------ |
| `actorScope` | the resolved actor for this instance       |
| `query`      | the raw list-query object backing the list |

For debugging and tests. Not for production consumers.

---

## The per-phone editor — `useClientPhoneManager`

A form editor over one phone number. Open an existing number with `.for("phone", id)`; start a new one with `.fresh()`. Each call to `.fresh()` mints its own isolated instance, so two concurrent drafts never share a model.

```ts
const manager = useClientPhoneManager().as("self").for("phone", phoneId);

await manager.useActions().isReady();
await manager.useActions().update({
  phone: {
    number: null,
    nationalNumber: "7911123456",
    countryCallingCode: null,
    country: null
  }
});
```

### Editor actions — `useActions()`

Seven members.

#### `isReady()` — waiting for the form

Resolves when the form is available for input.

**Returns:** `Promise<boolean>` — `true` once available, `false` if it settled in error.

**Rejects:** with a timeout error if the wait exceeds 60 seconds — see [gotchas.md](./gotchas.md#4-isready-and-ondone-are-bounded-at-60-seconds).

> **🧪 For Testers:** The editor never issues a request before it knows which client it is editing for, and never becomes usable before its country reference data has resolved. On a cold boot it waits, then loads once both settle — a session that never authenticates leaves it waiting with no request emitted, rather than firing an unaddressed one.

#### `input(model)`

Feeds a model into the form. **Debounced** — rapid calls collapse into one parse.

| Param   | Type                                    | Required |
| ------- | --------------------------------------- | -------- |
| `model` | `PhoneModel \| Record<string, unknown>` | Yes      |

**Returns:** `Promise<PhoneModel>` — the parsed model, after validation has run.

**⚠️ The published return type is a live model — the actual resolved value surfaces through state, not through this promise's resolution on the synchronous call.** See [gotchas.md](./gotchas.md#1-input-is-debounced--never-await-it-expecting-the-parsed-model) before writing an `await input(...)` that expects the parsed model back immediately.

> **🧪 For Testers:** Typing an invalid number does not reject — it resolves and flips `useMeta().isValid` to `false`, with the field-level reason in `useContext().validationErrors`. The parser fills all four parts of the number (`number`, `nationalNumber`, `countryCallingCode`, `country`) using a fallback chain: whatever the parser resolves, else the prior model value, else the event's country, else the form's current country — so a partially-typed number never loses a part a previous keystroke already resolved.

#### `update(value?)`

Saves the current model — or the one you pass — and resolves the persisted model. **This is the editor's save, and it covers both create and edit:** a `.fresh()` draft creates (via find-or-create); a number-scoped editor updates.

| Param   | Type                                    | Required |
| ------- | --------------------------------------- | -------- |
| `value` | `PhoneModel \| Record<string, unknown>` | No       |

**Returns:** `Promise<PhoneModel>` — the persisted model.

**Rejects:** with a `DetailedError` carrying the underlying failure, for you to render.

> **🧪 For Testers:** `update()` flushes any pending debounced input first, so a save immediately after a keystroke persists the typed value, not the pre-edit one. Editing an existing number PUTs `{ phone, phone_code, phone_country_code }` — the exact wire shape `mapIPhone` produces, with the national number and no leading `+`, and the dial code carrying one. Saving a fresh draft goes through find-or-create: a number the client already holds resolves the existing record instead of creating a duplicate. On success the shared cached list is invalidated, so an open collection reflects the saved value. **No success or failure message is raised from this action** — unlike the collection's `remove()` / `setDefault()`, a manager save reports its outcome only through the resolved/rejected promise and `useContext().errors`.

#### `clear()`

Clears the current form context back to its starting state.

**Returns:** `void`.

> **🧪 For Testers:** After `clear()`, `useMeta().isDirty` reads `false` — the model returns to the same baseline the form opened on, not to an empty object.

#### `onDone()`

Resolves once a save has completed.

**Returns:** `Promise<boolean>` — `true` on completion, `false` if it never settled within 60 seconds.

#### `stop()` — pausing the editor

Stops the underlying editor, leaving the registry entry in place.

**Returns:** `void`.

#### `destroy()` — releasing the editor

Stops the editor **and** removes it from the registry. This is the call to make on unmount — see [gotchas.md](./gotchas.md#5-release-an-editor-with-destroy-not-stop) for what is left behind if you call `stop()` instead.

**Returns:** `void`.

> **🧪 For Testers:** After `stop()` the instance is still registered but no longer working; after `destroy()` it is released, and reopening that number mints a fresh editor.

### Editor context — `useContext()`

Nine members. This is where the form's schema and UI definition surface — the module exports no other way to obtain them.

Every member is read through the shared state helpers, so each is a `ComputedRef` that can be `undefined` before the editor has settled.

| Property           | Type                                        | Meaning                                                      |
| ------------------ | ------------------------------------------- | ------------------------------------------------------------ |
| `context`          | `ComputedRef<PhoneContext \| undefined>`    | The full editor context object                               |
| `description`      | `ComputedRef<string \| undefined>`          | Display description — the resolved country's name            |
| `errors`           | `ComputedRef<string \| undefined>`          | The captured error message, if any — read, never raised      |
| `id`               | `ComputedRef<string \| undefined>`          | The id of the number being edited; `undefined` for a new one |
| `model`            | `ComputedRef<PhoneModel \| undefined>`      | The current form model                                       |
| `schema`           | `ComputedRef<JsonSchema \| undefined>`      | The form's JSON schema                                       |
| `title`            | `ComputedRef<string \| undefined>`          | Display title — the model's phone number                     |
| `uischema`         | `ComputedRef<UISchemaElement \| undefined>` | The form's UI definition, paired with `schema`               |
| `validationErrors` | `ComputedRef<ErrorObject[] \| undefined>`   | Field-level validation errors — read, never raised           |

> **🧪 For Testers:** `errors` and `validationErrors` are **state**, not events. Nothing is thrown at you and nothing is announced — a rejected save lands here and stays readable until the next operation supersedes it.

### Editor meta — `useMeta()`

Eight flat flags — one computed per flag. There is no single `meta` object to unwrap; read `useMeta().isValid`, not `meta.value.isValid`.

| Flag           | True when                                                         |
| -------------- | ----------------------------------------------------------------- |
| `hasErrors`    | the editor captured an error                                      |
| `isAvailable`  | the form is available for input                                   |
| `isComplete`   | the number has been saved                                         |
| `isDirty`      | the model differs from its persisted baseline                     |
| `isLoading`    | the editor is waiting for its client id, or resolving its lookups |
| `isNew`        | the number is new — the editor carries no phone id                |
| `isProcessing` | a save is in flight                                               |
| `isValid`      | the current model passes schema validation                        |

> **🧪 For Testers:** `isLoading` is `true` while the editor waits for its client id AND while it resolves the country lookup — both states are loading, not broken. `isNew` reads the editor's own phone id, so a `.fresh()` draft reports `true` until its first successful save.

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

The editor serves its form definition at runtime through **`useClientPhoneManager().useContext().schema`** and **`.uischema`**. They travel as a pair through the editor's own context; the module's barrel exports neither, because a form rendered from a definition the editor has not adopted validates against a different contract than the one that saves.

The two blocks below are that same pair rendered as plain JSON. Paste them into [jsonforms.io](https://jsonforms.io/examples/basic) — schema on the left, UI schema on the right — to see the rendered form.

### Schema

```json
{
  "type": "object",
  "title": "Phone Number",
  "required": ["phone"],
  "properties": {
    "id": {
      "type": ["string", "null"],
      "title": "ID",
      "description": "The AutoGenerated ID of this Phone.",
      "readOnly": true
    },
    "phone": {
      "type": "object",
      "required": ["number", "nationalNumber", "countryCallingCode", "country"],
      "properties": {
        "number": {
          "type": "string",
          "title": "Phone number ( with dialing code )"
        },
        "nationalNumber": { "type": "string", "title": "Phone number" },
        "countryCallingCode": {
          "type": "string",
          "title": "Country calling code"
        },
        "country": { "type": "string", "title": "Country", "default": null }
      }
    }
  }
}
```

> The real schema also carries a custom AJV keyword, `phone_country_code`, on the `phone` object — set to the editor's resolved country code at build time. It drives validation rather than rendering, so it is omitted from the pasteable copy above; see [architecture.md](./architecture.md).

### UI schema

```json
{
  "type": "VerticalLayout",
  "elements": [
    {
      "type": "Control",
      "scope": "#/properties/phone",
      "i18n": "form.phone",
      "options": {
        "autoFocus": true,
        "autocomplete": "phone"
      }
    }
  ]
}
```

### Starting data

The editor's baseline model — what an untouched form holds before a key is pressed, once the country has resolved (here, `GB`):

```json
{
  "phone": {
    "number": null,
    "nationalNumber": null,
    "countryCallingCode": null,
    "country": "GB"
  }
}
```

Notes for the paste:

- **One control, one nested object.** Unlike a flat form, the whole `phone` object is bound to a single control — the four parts are derived from and re-derived into one typed value, not four independent inputs.
- **`i18n: "form.phone"`** names a translation key. With no translator registered, the control falls back to the schema's `title` — so the label reads "Phone Number" in the playground and the localised string in the app.
- **The pair moves together.** A schema field with no matching control renders as a required-but-invisible input, which is why these two blocks are never edited apart.

> **🧪 For Testers:** The barrel exposes no bare schema-pair export. The only supported way to obtain the form definition is the editor's context — a consumer reaching for a bare export is reaching for something the module does not offer.

---

## Errors and feedback

This module is not uniform on feedback, and that is deliberate — see [gotchas.md](./gotchas.md#8-remove-and-setdefault-raise-feedback--nothing-else-does) for why:

```ts
// Collection — remove() / setDefault() raise a message AND capture state
const { error } = phones.useContext();
const { hasError } = phones.useMeta();

// Editor — never raises a message; read the captured state, or await onDone()
const { errors, validationErrors } = manager.useContext();
const { hasErrors } = manager.useMeta();
await manager.useActions().onDone();
```

> **🧪 For Testers:** A consumer that shows nothing after a failed manager save has not lost the error — it has not rendered `useContext().errors`. A failed `remove()` / `setDefault()`, by contrast, DOES raise a message on your behalf, in addition to landing in state.

## Types

```ts
import {
  useClientPhones,
  useClientPhoneManager,
  CLIENT_PHONES_SCOPE_MATRIX,
  CLIENT_PHONE_SCOPE_MATRIX,
  ClientPhonesContextTypes,
  ClientPhoneContextTypes,
  type UseClientPhones,
  type UseClientPhonesActions,
  type UseClientPhonesContext,
  type UseClientPhonesMeta,
  type UseClientPhonesInternals,
  type UseClientPhoneManager,
  type UseClientPhoneManagerActions,
  type UseClientPhoneManagerContext,
  type UseClientPhoneManagerMeta,
  type UseClientPhoneManagerInternals,
  type ClientPhonesScopeMatrix,
  type ClientPhoneScopeMatrix,
  type Phone,
  type PhoneModel,
  type PhoneContext,
  type IPhoneData
} from "@upmind-automation/headless";
```

That list is the module's whole public surface. The services, mappers, schema factories and machine config are internal and are not exported — see [gotchas.md](./gotchas.md).
