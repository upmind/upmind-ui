# client-address

> A client's own postal-address book — list, add, edit, delete, and set a default.

## What Is This?

Think of `client-address` as a client's own address book, but the platform manages it.

- Every entry is an address the client owns.
- One entry can be flagged as the **default** — the one used first.
- Each entry carries its own status: a **verification level** (display-only — see Gotchas), **deletability**, and a numeric **type** (Home, Office, Holiday, Company).

The module ships **two composables**, because reading a list and filling in a form are different jobs:

| Surface            | Composable                | Use it when                                                           |
| ------------------ | ------------------------- | --------------------------------------------------------------------- |
| **The collection** | `useClientAddresses`      | You are showing the list and acting on rows — delete, set default     |
| **The editor**     | `useClientAddressManager` | You are showing a form — add a new address, or change an existing one |

Both always manage the **calling client's own** book. There is no capability here to open or edit someone else's.

> **🧪 For Testers:** Both composables are built to be opened `.as('client')`. Neither scope matrix defines a context for `staff`, `self` or `guest`, so chaining `.for(...)` after either — the only way to name a target — is a compile-time error. There is nothing in this module for a staff member to reach another client's addresses; that capability is real on the platform, and it is tracked, not delivered here — see [gotchas.md](./gotchas.md#10-staff-address-management-is-not-delivered-here--its-tracked-not-forgotten).

## Quick Start

```ts
import {
  useClientAddresses,
  useClientAddressManager
} from "@upmind-automation/headless";

// --- The collection: read the list, promote an address to default
const addresses = useClientAddresses().as("client");
const { data, default: defaultAddressId, getOne } = addresses.useContext();
await addresses.useActions().isReady();
await addresses.useActions().setDefault("some-address-id");
const defaultAddress = getOne(defaultAddressId()); // look the row up — see below

// --- The editor: add a new address through the validated form
const draft = useClientAddressManager().as("client").fresh();
await draft.useActions().isReady();
await draft.useActions().update({
  address: {
    address1: "1 Prover Street",
    city: "Guildford",
    postcode: "GU4 8PH",
    countryId: "825d96e7-63ed-0913-46c4-174825283406"
  }
});
```

The editor's save invalidates the shared cache, so an open collection picks the change up on its next read.

## Features

| Capability                             | Surface                                                          | What it does                                                               |
| -------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------- |
| List own addresses                     | `useClientAddresses().useContext().data`                         | Reactive list of the client's own addresses                                |
| Read the default address's id          | `…useContext().default()`                                        | Returns the default address's **id** — look the row up with `getOne()`     |
| Read per-address status                | `…useContext().data[].meta`                                      | Default / verification level (display-only) / deletable flags              |
| Know whether the list is yours to read | `useClientAddresses().useMeta().isAvailable`                     | Authenticated **and** a client id resolved                                 |
| Delete                                 | `useClientAddresses().useActions().remove()`                     | Removes a deletable address; confirms success or failure by message        |
| Set default                            | `…useActions().setDefault()`                                     | Promotes an address to the default; confirms success or failure            |
| Find or create by id                   | `…useActions().ensure()`                                         | Resolves an existing match **by id**, or creates if the model carries none |
| Filter                                 | `…useActions().filters.query()`                                  | Narrows the list to a search term                                          |
| Add a new address                      | `useClientAddressManager().as('client').fresh()` then `update()` | Creates through the validated form                                         |
| Change an address                      | `…for('address', id)` then `update()`                            | Edits through the validated form; sends only the changed fields            |
| Validate as the client types           | `…useActions().input()` + `useMeta().isValid`                    | Reports acceptance and which field is wrong                                |
| Render the form                        | `…useContext().schema` / `.uischema`                             | The form definition, served by the editor                                  |
| Compose the address form into a parent | `useSchemaDefinitions()` / `useUischemaDefinitions()`            | Pure schema-fragment functions for embedding this form in another one      |

## Key Concepts

### Two surfaces, one client

The collection and the editor are separate composables, but they share one identity seam, one cache key and one set of request gates. Whichever surface issues a request, it resolves the same target client — from the scope the consumer opened, never from a direct session read.

> **👩‍💻 For Developers:** Per-address form editing (`input`, `update`, field validation) lives on the **editor**, not on the collection. The collection's create seam is `ensure()` — find-or-create by id. If you are reaching for a form on the collection, you want the editor.

### The collection is always the client's own

`useClientAddresses().as('client')` resolves to the calling client's own address book. There is no acting-on-behalf-of-another-client capability in this module today.

> **🧪 For Testers:** With no authenticated client session, the list never fires a request, `useMeta().isAvailable` is `false`, and any mutation rejects immediately rather than reaching the network.

### `default()` returns the address's **id**, not the row

`useClientAddresses().useContext().default()` returns the default address's `id` (or `undefined` if none) — it is not the address record itself. Look the row up with `getOne(default())` when you need the full record.

```ts
const { default: defaultId, getOne } = addresses.useContext();

const defaultAddressId = defaultId(); // e.g. "20e43579-5e78-d184-78db-31643202d986"
const defaultAddress = getOne(defaultAddressId); // the full row, or undefined
```

> **🧪 For Testers:** Against a fixture with exactly one `default: true` row, `default()` resolves to that row's `id`. Against a fixture with none, it resolves `undefined` and never throws. A test asserting `default()` returns a row object is asserting the wrong contract. This is compiler-invisible — nothing about the type signature stops a caller from treating it as the row.

### `ensure()` finds an existing address only by its `id` — never by matching address lines

Passing `ensure()` a model with an `id` already in the loaded collection resolves that existing record. Passing it a model with **no** `id` — however complete its address lines are — always creates a new address, even if an identical one already exists in the collection.

> **🧪 For Testers:** A read-back asserting `ensure()` de-duplicates by matching street/city/postcode against the loaded collection is asserting a capability this module does not have. Only `id` is checked.

### The editor waits on country, region and brand rules before it is usable

Opening the editor — fresh or on an existing address — resolves the country list, the resolved country's region list, and the brand's address-form rules (whether a region is required, whether an existing address's country can be changed) before the form is usable.

> **🧪 For Testers:** `useMeta().isLoading` stays `true` while the editor waits on these. Nothing is sent to the server before they settle.

### Changing the country can clear the region — and how that reaches the wire depends on whether the address is new

Picking a country whose region list does not contain the currently-selected region clears it. On an **edit**, that clearance reaches the server as an explicit `region_id: null` — not simply omitted, because omitting a changed field would leave the server's stale region in place. On a **create**, a region-less address never sends the key at all.

> **🧪 For Testers:** Do not expect the same wire shape for "region cleared by a country change on an existing address" and "no region ever picked on a new one" — one is `null`, the other is an absent key.

### The address type is editable — but only once the address exists

A client can change an existing address's type through the form. A brand-new address always starts as Home; the type control does not render until the address has been saved once.

### Deleting and setting default confirm with a message; nothing else does

This collection raises a success or failure message for exactly two mutations: `remove()` and `setDefault()`. Every other capability — adding, editing, find-or-create — reports its outcome only through the state the caller reads (`useContext().error`, the rejected/resolved promise), never a message of its own.

> **🧪 For Testers:** Only `remove()` and `setDefault()` produce a user-visible confirmation. Do not expect one from a manager save.

### A partial `update()` on the editor can silently discard a prior edit

`update({ address: { city } })` on its own is safe on an untouched form. But if the model was already edited once (through `input()` or a prior partial `update()`) and a second partial call follows, every key that second call omits is refilled from the form's **opening** snapshot — not from the live, edited model — discarding the earlier edit. The call still resolves as success. The renderer path is not exposed to this: the JSON-form UI always submits the whole model. A caller driving the editor directly with hand-built partials is the one exposed to it. See [gotchas.md](./gotchas.md#2-a-partial-update-can-silently-discard-a-prior-edit) before writing a direct-API integration against this editor.

### `isDirty` stays `true` after a save

The editor's `isDirty` flag compares the live model against its persisted baseline. After a successful save, the live model can carry a few extra display-only fields (the address's title and description among them) that the baseline was never given, so the two compare as different and `isDirty` reads `true` even immediately after a clean save. Nothing in this codebase currently reads `isDirty` to gate a save button, so this is inert today — but a future consumer that does would see a button that never goes quiet.

## Documentation

| Doc                                  | Audience                                                    | Content                                                                                 |
| ------------------------------------ | ----------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **This README**                      | Everyone                                                    | Overview, concepts, quick start                                                         |
| [usage.md](./usage.md)               | All devs                                                    | Full API reference for both composables, plus the paste-ready form schema and UI schema |
| [architecture.md](./architecture.md) | Internal / contributors                                     | Data flow, the shared identity seam, dependencies                                       |
| [gotchas.md](./gotchas.md)           | All                                                         | The sharp edges — the diff-only save, `default()`, `ensure()`, region clearing, scope   |
| [foundation.md](./foundation.md)     | Teams building against the Upmind back end on another stack | Framework-neutral platform spec: endpoints, payloads, failure modes                     |
| [CHANGELOG.md](./CHANGELOG.md)       | All                                                         | Change history and porting notes                                                        |

## Playground

None yet. Drive the collection and the editor through wherever a client manages their own postal addresses — the personal-details form, the billing-detail step of checkout, or the address picker composed into the client-company form.
