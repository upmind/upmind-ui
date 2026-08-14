# client-address — Usage

Full API reference for the module's two composables:

- **`useClientAddresses`** — the collection. Read the client's addresses and act on them row by row.
- **`useClientAddressManager`** — the per-address editor. Open one address (or start a new one) in a validated form and save it.

Both act on the calling client's own addresses. Every capability below carries a 🧪 **For Testers** expected-behaviour statement.

## Getting an instance

```ts
import {
  useClientAddresses,
  useClientAddressManager
} from "@upmind-automation/headless";

// The collection — the calling client's own addresses
const addresses = useClientAddresses().as("client");

// The editor, opened on one existing address
const manager = useClientAddressManager().as("client").for("address", addressId);

// The editor, started on a brand-new address
const draft = useClientAddressManager().as("client").fresh();
```

Both composables return the same four sub-composables:

| Layer     | Access             | Collection contains            | Editor contains                          |
| --------- | ------------------- | -------------------------------- | ------------------------------------------- |
| Actions   | `.useActions()`    | row mutations + list lifecycle   | form input, save, lifecycle                 |
| Context   | `.useContext()`    | reactive list + lookups          | model, schema, resolved lookups, errors     |
| Meta      | `.useMeta()`       | seven state flags                | eight state flags                           |
| Internals | `.useInternals()`  | the raw list query                | the raw machine state and sender            |

> **🧪 For Testers:** Both composables support the `client` scope only. `self`, `staff` and `guest` are compile-time errors, not runtime failures — there is no scope in this module today for a staff member to read or edit another client's addresses.

---

## The collection — `useClientAddresses`

### Collection actions — `useActions()`

Ten members. Per-address **form** editing (`input` / `update` / field validation) is deliberately not here — that lives on the editor, which owns the dirty/valid state those need.

#### `ensure(model)`

Finds an existing address **by id**, or creates one. This is the collection's create seam.

| Param       | Type                        | Required |
| ------------ | ---------------------------- | -------- |
| `model.id`  | `AddressModel["id"]`        | No       |
| `model.address` | `AddressModel["address"]` | Yes      |

**Returns:** `Promise<Address>` — the existing matching record, or the newly created one.

> **🧪 For Testers:** `ensure(model)` matches **only** on a supplied `id` against the loaded collection. A model with a full set of address lines but no `id` always creates — it is not a value-based duplicate check. When the `id` is not found (or none is supplied), it POSTs the whole model to the client's own resource with the client's session token, then resolves the created record.

#### `remove(id)`

Deletes an address the platform currently marks deletable.

**Returns:** `Promise<void>` — settles once the delete completes.

> **🧪 For Testers:** `remove(id)` DELETEs the client's own resource with the client's session token. On success the address is gone from the reactive list AND a success message is raised. On failure, an error message is raised AND the failure lands in `useContext().error` — both, not one.

#### `setDefault(id)`

Promotes an address to the client's default.

**Returns:** `Promise<void>`.

> **🧪 For Testers:** `setDefault(id)` PUTs a body that is **exactly** `{ default: true }` — no other key. On success the targeted record's `meta.isDefault` becomes `true`, the previous default's becomes `false`, and a success message is raised. On failure an error message is raised and the failure lands in `useContext().error`.

#### `isReady()` — waiting for the list

Resolves once the collection is ready to read.

**Returns:** `Promise<boolean>` — `true` once the first fetch has settled; `false` if the session settles without an addressable client, or if the list never arrives within the readiness bound.

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

> **🧪 For Testers:** the collection opens its read with no page size, so it already holds the entire address list in one response. A forced call **settles as a rejection rather than throwing synchronously** — see [gotchas.md](./gotchas.md#4-nextpage--prevpage-cannot-move-through-this-surface) for why paging genuinely works one layer down instead.

#### `filters.query(value)`

Applies a free-text filter and re-issues the list request.

**Returns:** `void`.

#### `destroy()` — releasing the collection

Removes this scoped instance from the registry.

**Returns:** `void`.

> **🧪 For Testers:** `destroy()` removes the scope-registry entry, so the next `useClientAddresses().as('client')` mints a fresh collection rather than a cached one. The collection has no service to stop — unlike the editor, whose `destroy()` also stops its machine. Call on component unmount.

### Collection context — `useContext()`

| Property     | Type                                                        | Meaning                                                    |
| ------------ | ------------------------------------------------------------ | ------------------------------------------------------------- |
| `data`       | `ComputedRef<Address[]>`                                     | The client's reactive list of addresses                   |
| `default()`  | `(data?) => Address["id"] \| undefined`                     | The collection's default address's **id**, if any (not the row — see below) |
| `error`      | `ComputedRef<ResponseError \| undefined>`                    | The last failed row mutation, else the list read's error   |
| `findOne()`  | `(mapping, data?, searchableProps?) => Address \| undefined` | Finds a single address by a partial mapping or free text   |
| `getOne(id)` | `(id, data?) => Address \| undefined`                        | Finds a single address by id                                |
| `pagination` | `ComputedRef<PaginationInfo>`                                 | `{ limit, total, page, pages, from, to }`                   |

> **🧪 For Testers:** `data` is always an array — before the first read completes, and when the read errors. Read `useMeta().isLoading` / `hasError` rather than inferring state from an empty list. `error` is **state you read**, never an event: a failed mutation lands here and stays until the next one supersedes it. `default()` returns the **id**, not the address — chain `getOne(default())` for the row. `findOne()` matches a **nested partial mapping** — `findOne({ address: { city } })` matches on the city alone, without needing the rest of the `address` object.

### Collection meta — `useMeta()`

Seven flags.

| Flag           | True when                                                                       |
| --------------- | ---------------------------------------------------------------------------------- |
| `hasError`     | a row mutation or the list read failed                                             |
| `hasNextPage`  | the underlying query reports a further page after the current one                  |
| `hasPages`     | pagination applies to this list at all                                             |
| `hasPrevPage`  | the underlying query reports a page before the current one                        |
| `isAvailable`  | the session is authenticated **and** the scope resolved a client id to address    |
| `isEmpty`      | the resolved collection has no addresses                                          |
| `isLoading`    | the list read is in flight or has not completed its first fetch                   |

`isAvailable` is worth reading twice. It is **both limbs**: authenticated, _and_ a client id resolved. A session that authenticates but resolves no client correctly reports `false`. It is also the _same predicate_ every request gate in this module calls — not a second copy of it — so the flag you render and the guard the wire enforces cannot drift apart.

> **🧪 For Testers:** `isAvailable` is `false` before sign-in (while `isLoading` is still `true`), `true` once a client session is active, and `false` again the moment the session goes away — with zero requests emitted on that flip. `hasNextPage` / `hasPrevPage` / `hasPages` describe the underlying query's pagination metadata; they do not mean a caller can page through this surface (see `nextPage()` / `prevPage()` above).

### Collection internals — `useInternals()`

| Property     | Meaning                                     |
| ------------ | ---------------------------------------------- |
| `actorScope` | the resolved actor for this instance            |
| `query`      | the raw list-query object backing the list      |

For debugging and tests. Not for production consumers.

---

## The per-address editor — `useClientAddressManager`

A form editor over one address. Open an existing address with `.for("address", id)`; start a new one with `.fresh()`. Each call to `.fresh()` mints its own isolated instance, so two concurrent drafts never share a model.

```ts
const manager = useClientAddressManager().as("client").for("address", addressId);

await manager.useActions().isReady();
await manager.useActions().update({
  address: { city: "Manchester" }
});
```

### Editor actions — `useActions()`

Seven members.

#### `isReady()` — waiting for the form

Resolves when the form is available for input.

**Returns:** `Promise<boolean>` — `true` once available, `false` if the session settles without an addressable client.

**Rejects:** with a catchable timeout error if the wait exceeds the readiness bound — see [gotchas.md](./gotchas.md#5-isready-ondone-and-nextpage--prevpage-are-all-bounded).

> **🧪 For Testers:** The editor never issues a request before it knows which client it is editing for, and never becomes usable before its country, region and brand-config lookups have resolved. A session that never authenticates leaves it waiting with no request emitted, rather than firing an unaddressed one.

#### `input(model)`

Feeds a model into the form. **Debounced** — rapid calls collapse into one parse.

| Param   | Type                                       | Required |
| ------- | -------------------------------------------- | -------- |
| `model` | `AddressModel \| Record<string, unknown>`    | Yes      |

**Returns:** `Promise<AddressModel>` — the parsed model, after validation has run.

**⚠️ A partial model has every OMITTED key refilled from the form's opening snapshot, not from the live model.** See [gotchas.md](./gotchas.md#2-a-partial-update-can-silently-discard-a-prior-edit) before writing a hand-built partial payload — a single prior edit followed by one partial call is enough to lose it silently.

> **🧪 For Testers:** `input()` resolves the _parsed_ model, not the raw one you passed, once the debounce settles. Typing an invalid value does not reject — it resolves and flips `useMeta().isValid` to `false`, with the field-level reason in `useContext().validationErrors`. A country change re-resolves the region list; a region no longer valid for the new country is cleared in the model (see the editor's `update()` for how that clearance reaches the wire).

#### `update(value?)`

Saves the current model — or the one you pass — and resolves the persisted model. **This is the editor's save, and it covers both create and edit:** a `.fresh()` draft creates (via find-or-create by id); an address-scoped editor updates, sending **only the fields that changed** since the form opened.

| Param   | Type                                       | Required |
| ------- | -------------------------------------------- | -------- |
| `value` | `AddressModel \| Record<string, unknown>`    | No       |

**Returns:** `Promise<AddressModel>` — the persisted model.

**Rejects:** with a `DetailedError` carrying the underlying failure, for you to render.

> **🧪 For Testers:** `update()` flushes any pending debounced input first, so a save immediately after a keystroke persists the typed value, not the pre-edit one. Editing an existing address PUTs only the changed keys — the exact diff-only shape legacy sends — with ONE exception: a region cleared by a country change PUTs an explicit `region_id: null`, never simply omitted. Saving a fresh draft always creates (a new draft carries no `id` for `ensure` to match on). **No success or failure message is raised from this action** — unlike the collection's `remove()` / `setDefault()`, a manager save reports its outcome only through the resolved/rejected promise and `useContext().errors`. **A partial `value` carries the same fill-from-snapshot rule as `input()`** — see the gotcha linked above.

#### `clear()`

Clears the current form context back to its starting state.

**Returns:** `void`.

> **🧪 For Testers:** After `clear()`, the model returns to the same baseline the form opened on, not to an empty object. `useMeta().isDirty`'s behaviour after a `clear()` on a never-saved form reads `false`; see [gotchas.md](./gotchas.md#3-isdirty-reads-true-even-right-after-a-clean-save) for the one case it does not.

#### `onDone()`

Resolves once a save has completed.

**Returns:** `Promise<boolean>` — `true` on completion, `false` if it never settled within the readiness bound.

#### `stop()` — pausing the editor

Stops the underlying editor, leaving the registry entry in place.

**Returns:** `void`.

#### `destroy()` — releasing the editor

Stops the editor **and** removes it from the registry. This is the call to make on unmount.

**Returns:** `void`.

> **🧪 For Testers:** After `stop()` the instance is still registered but no longer working; after `destroy()` it is released, and reopening that address mints a fresh editor.

### Editor context — `useContext()`

Fourteen members. This is where the form's schema and UI definition surface — the module exports no other way to obtain them.

Every member is read through the shared state helpers, so each is a `ComputedRef` that can be `undefined` before the editor has settled.

| Property           | Type                                          | Meaning                                                        |
| ------------------ | ----------------------------------------------- | ------------------------------------------------------------------- |
| `baseModel`        | `ComputedRef<AddressModel \| undefined>`       | The dependency-resolved starting model the form opened on          |
| `config`           | `ComputedRef<Record<string, unknown> \| undefined>` | The brand config keys the form fetched (region-required, country-locked) |
| `context`          | `ComputedRef<AddressContext \| undefined>`     | The full editor context object                                     |
| `country`          | `ComputedRef<ICountry \| undefined>`           | The country resolved from the model's `countryId`                  |
| `countries`        | `ComputedRef<ICountry[] \| undefined>`         | All available countries                                             |
| `description`      | `ComputedRef<string \| undefined>`             | Display description — the address lines, joined                    |
| `errors`           | `ComputedRef<string \| undefined>`             | The captured error message, if any — read, never raised            |
| `id`               | `ComputedRef<string \| undefined>`             | The id of the address being edited; `undefined` for a new one       |
| `model`            | `ComputedRef<AddressModel \| undefined>`       | The current form model                                              |
| `regions`          | `ComputedRef<IRegion[] \| undefined>`          | The regions available for the selected country                     |
| `schema`           | `ComputedRef<JsonSchema \| undefined>`         | The form's JSON schema                                              |
| `title`            | `ComputedRef<string \| undefined>`             | Display title — the address's first line, or the name              |
| `uischema`         | `ComputedRef<UISchemaElement \| undefined>`    | The form's UI definition, paired with `schema`                      |
| `validationErrors` | `ComputedRef<ErrorObject[] \| undefined>`      | Field-level validation errors — read, never raised                  |

> **🧪 For Testers:** `errors` and `validationErrors` are **state**, not events. Nothing is thrown at you and nothing is announced — a rejected save lands here and stays readable until the next operation supersedes it. `country` / `countries` / `regions` / `config` are the form's resolved dependencies, exposed for a consumer that wants to render its own country/region picker rather than relying on the editor's own `schema` / `uischema`.

### Editor meta — `useMeta()`

Eight flat flags — one computed per flag. There is no single `meta` object to unwrap; read `useMeta().isValid`, not `meta.value.isValid`.

| Flag           | True when                                                          |
| -------------- | ----------------------------------------------------------------- |
| `hasErrors`    | the editor captured an error                                       |
| `isAvailable`  | the form is available for input                                    |
| `isComplete`   | the address has been saved                                          |
| `isDirty`      | the model differs from its persisted baseline                       |
| `isLoading`    | the editor is waiting for its client id, or resolving its lookups   |
| `isNew`        | the address is new — the editor carries no address id               |
| `isProcessing` | a save is in flight                                                 |
| `isValid`      | the current model passes schema validation                          |

> **🧪 For Testers:** `isLoading` is `true` while the editor waits for its client id AND while it resolves country/region/brand-config lookups — all loading, not broken. `isNew` reads the editor's own address id, so a `.fresh()` draft reports `true` until its first successful save. `isDirty` can read `true` immediately after a clean save — see [gotchas.md](./gotchas.md#3-isdirty-reads-true-even-right-after-a-clean-save).

### Editor internals — `useInternals()`

| Property     | Meaning                              |
| ------------ | ---------------------------------------- |
| `actorScope` | the resolved actor for this instance      |
| `send`       | the raw event sender                      |
| `service`    | the raw underlying service                 |
| `state`      | the raw reactive state                     |

For debugging and tests. Not for production consumers.

---

## The form definition — paste-ready

The editor serves its form definition at runtime through **`useClientAddressManager().useContext().schema`** and **`.uischema`**. Separately, the barrel also exports two pure **schema fragments** — `useSchemaDefinitions()` and `useUischemaDefinitions()` — for a different module composing the address form's fields into a *parent* schema (a company form, a unified billing-details form). Those fragment functions take no scope, issue no request, and read no reactive state; they are not a second route to this module's own data, and a consumer rendering the address form itself always reads the editor's context instead.

The two blocks below are the editor's own schema/uischema pair, rendered for a **brand-new address** (`id` undefined) with two example countries loaded and no regions fetched yet. Paste them into [jsonforms.io](https://jsonforms.io/examples/basic) — schema on the left, UI schema on the right — to see the rendered form.

### Schema

```json
{
  "type": "object",
  "title": "Address",
  "required": ["address"],
  "definitions": {
    "address": {
      "type": "object",
      "title": "Address",
      "required": ["address1", "city", "postcode", "countryId"],
      "properties": {
        "address1": { "type": "string", "title": "Address" },
        "address2": { "type": ["string", "null"], "title": "" },
        "city": { "type": "string", "title": "City" },
        "postcode": { "type": "string", "title": "Postcode" },
        "regionId": { "type": ["string", "null"], "title": "Region" },
        "countryId": {
          "type": "string",
          "title": "Country",
          "enum": ["825d96e7-63ed-0913-46c4-174825283406", "another-country-id"],
          "options": [
            { "label": "Iceland", "value": "825d96e7-63ed-0913-46c4-174825283406" },
            { "label": "United Kingdom", "value": "another-country-id" }
          ]
        }
      }
    }
  },
  "properties": {
    "id": {
      "type": ["string", "null"],
      "title": "ID",
      "description": "The AutoGenerated ID of this Address.",
      "readOnly": true
    },
    "name": { "type": ["string", "null"], "title": "Name" },
    "address": { "$ref": "#/definitions/address" },
    "type": {
      "type": "number",
      "title": "Address Type",
      "default": 1,
      "oneOf": [
        { "const": 1, "title": "Home" },
        { "const": 2, "title": "Office" },
        { "const": 3, "title": "Holiday" },
        { "const": 4, "title": "Company" }
      ]
    }
  }
}
```

> On an EXISTING address (`id` set), the schema additionally requires `name`, and — if the brand's config requires a region for the address's country — pushes `regionId` into the `address` definition's `required` array too. Both are context-derived: the schema this editor serves is re-built whenever `id`, `countries`, `regions` or `config` change, unlike a static form definition.

### UI schema

```json
{
  "type": "VerticalLayout",
  "elements": [
    {
      "type": "Control",
      "scope": "#/properties/address",
      "i18n": "form.address",
      "options": {
        "autoFocus": true,
        "autocomplete": "off",
        "detail": {
          "type": "VerticalLayout",
          "elements": [
            {
              "type": "Control",
              "scope": "#/properties/countryId",
              "i18n": "form.country",
              "options": { "placeholder": "Select a country…" }
            },
            {
              "type": "address",
              "i18n": "form.address",
              "options": {
                "fields": ["address1", "address2"],
                "placeholder": "Start typing your address",
                "autoFocus": true
              },
              "elements": [
                {
                  "type": "Group",
                  "options": { "border": false },
                  "elements": [
                    {
                      "type": "Control",
                      "scope": "#/properties/address1",
                      "i18n": "form.address1",
                      "options": {
                        "placeholder": "House name, apartment number etc.",
                        "autocomplete": "address-line1",
                        "autoFocus": true
                      }
                    },
                    {
                      "type": "Control",
                      "scope": "#/properties/address2",
                      "i18n": "form.address2",
                      "options": {
                        "placeholder": "Road, street name etc.",
                        "autocomplete": "address-line2"
                      }
                    }
                  ]
                },
                {
                  "type": "Control",
                  "scope": "#/properties/city",
                  "i18n": "form.city",
                  "options": {
                    "placeholder": "City, town etc.",
                    "autocomplete": "address-level2"
                  }
                },
                {
                  "type": "HorizontalLayout",
                  "elements": [
                    {
                      "type": "Control",
                      "scope": "#/properties/regionId",
                      "i18n": "form.region",
                      "options": {
                        "placeholder": "Select a region…",
                        "autocomplete": "address-level1"
                      }
                    },
                    {
                      "type": "Control",
                      "scope": "#/properties/postcode",
                      "i18n": "form.postcode",
                      "options": {
                        "placeholder": "eg. 10011",
                        "autocomplete": "postal-code"
                      }
                    }
                  ]
                }
              ]
            }
          ]
        }
      }
    }
  ]
}
```

> **On an EXISTING address:** two things differ. First, a **type** control is appended at the root, beside the address control:
>
> ```json
> {
>   "type": "Control",
>   "scope": "#/properties/type",
>   "i18n": "form.address_type",
>   "options": { "placeholder": "Select an address type…" }
> }
> ```
>
> Second, the address sub-widget's `type` flips from `"address"` (the autocomplete-style widget used on create) to `"VerticalLayout"` on an edit. Third, if the brand forbids changing an existing address's country, the `countryId` control gains a `DISABLE` rule:
>
> ```json
> { "effect": "DISABLE", "condition": { "const": true } }
> ```

Notes for the paste:

- **The address fields are a nested object.** Unlike `type` and `name`, the seven address fields are bound as one nested `address` control, driven by the `$ref`'d definition.
- **`i18n: "form.address"` (and similar)** name translation keys. With no translator registered, a control falls back to the schema's `title` — so labels read their English defaults in the playground.
- **The pair moves together.** A schema field with no matching control renders as a required-but-invisible input, which is why these two blocks are never edited apart.

> **🧪 For Testers:** The barrel exposes no bare *parsed* schema-pair export for rendering the address form directly. The only supported way to obtain the form definition for **rendering** is the editor's context. `useSchemaDefinitions()` / `useUischemaDefinitions()` exist for a different job — composing the address fields into someone else's schema — not for a consumer that wants to render the address form on its own.

---

## Errors and feedback

This module is not uniform on feedback, and that is deliberate — see [gotchas.md](./gotchas.md#6-remove-and-setdefault-raise-feedback--nothing-else-does) for why:

```ts
// Collection — remove() / setDefault() raise a message AND capture state
const { error } = addresses.useContext();
const { hasError } = addresses.useMeta();

// Editor — never raises a message; read the captured state, or await onDone()
const { errors, validationErrors } = manager.useContext();
const { hasErrors } = manager.useMeta();
await manager.useActions().onDone();
```

> **🧪 For Testers:** A consumer that shows nothing after a failed manager save has not lost the error — it has not rendered `useContext().errors`. A failed `remove()` / `setDefault()`, by contrast, DOES raise a message on your behalf, in addition to landing in state.

## Types

```ts
import {
  useClientAddresses,
  useClientAddressManager,
  CLIENT_ADDRESSES_SCOPE_MATRIX,
  CLIENT_ADDRESS_SCOPE_MATRIX,
  ClientAddressesContextTypes,
  ClientAddressContextTypes,
  AddressTypes,
  ADDRESS_TYPE_KEYS,
  useSchemaDefinitions,
  useUischemaDefinitions,
  mapAddress,
  type UseClientAddresses,
  type UseClientAddressesActions,
  type UseClientAddressesContext,
  type UseClientAddressesMeta,
  type UseClientAddressesInternals,
  type UseClientAddressManager,
  type UseClientAddressManagerActions,
  type UseClientAddressManagerContext,
  type UseClientAddressManagerMeta,
  type UseClientAddressManagerInternals,
  type ClientAddressesScopeMatrix,
  type ClientAddressScopeMatrix,
  type Address,
  type AddressModel,
  type AddressContext
} from "@upmind-automation/headless";
```

That list is the module's whole public surface. The services, mappers (aside from `mapAddress`), schema parsers and machine config are internal and are not exported — see [gotchas.md](./gotchas.md).
