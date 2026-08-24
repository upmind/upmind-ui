# client-company

> A client's own companies — list, create, edit, delete, set a default, and fill
> in the form that manages one.

## What Is This?

Think of `client-company` as the client's own list of billing entities — the
businesses they invoice through or check out as.

- Every entry is a company the client owns.
- One entry can be flagged as the **default** — the one used first for
  billing.
- Each entry carries its own status: registration number, tax/VAT details, and
  whether it **can be deleted**.

The module ships **two composables**, because reading a list and filling in a
form are different jobs:

| Surface            | Composable                | Use it when                                                               |
| ------------------ | ------------------------- | ------------------------------------------------------------------------- |
| **The collection** | `useClientCompanies`      | You are showing the list and acting on rows — delete, set default, search |
| **The editor**     | `useClientCompanyManager` | You are showing a form — create a new company, or change an existing one  |

Both always manage the **calling client's own** companies. There is no
capability here to open or edit another client's companies, and no capability
for a staff member to act on a client's companies through this module.

> **🧪 For Testers:** Both composables are built to be opened `.as('client')`.
> Neither scope matrix defines a context for `staff` or `guest`, so chaining
> `.for(...)` after either — the only way to name a target — is a
> compile-time error. There is nothing in this module for a staff member to
> reach a _named_ client's companies, and nothing for one client to reach
> another's.

## Quick Start

```ts
import {
  useClientCompanies,
  useClientCompanyManager
} from "@upmind-automation/headless";

// --- The collection: read the list, promote the default company
const companies = useClientCompanies().as("client");
const { data, default: defaultCompanyId } = companies.useContext();
await companies.useActions().isReady();
await companies.useActions().setDefault("some-company-id");

// --- The editor: create a new company through the validated form
const draft = useClientCompanyManager().as("client").fresh();
await draft.useActions().isReady();
await draft
  .useActions()
  .update({ name: "Acme Ltd", addressId: "some-address-id" });
```

The editor's save invalidates the shared cache, so an open collection picks the
change up on its next read.

## Features

| Capability                             | Surface                                                          | What it does                                                             |
| -------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------ |
| List own companies                     | `useClientCompanies().useContext().data`                         | Reactive list of the client's own companies                              |
| Read the default company's id          | `…useContext().default()`                                        | Returns the default company's **id** — look the row up with `getOne()`   |
| Know whether the list is yours to read | `useClientCompanies().useMeta().isAvailable`                     | Authenticated **and** a client id resolved                               |
| Delete                                 | `useClientCompanies().useActions().remove()`                     | Removes a deletable company                                              |
| Set default                            | `…useActions().setDefault()`                                     | Promotes a company to the default                                        |
| Find or create                         | `…useActions().ensure()`                                         | Resolves an existing match by id, or creates the company if absent       |
| Filter                                 | `…useActions().filterBy({ name: { like } })`                     | Re-queries the server, narrowed to a free-text match on the name         |
| Sort                                   | `…useActions().sortBy([{ field, dir }])`                         | Re-queries the server in the given order — `name` or `created_at`        |
| Open a page size                       | `…useActions().setCriteria({ pagination: { limit } })`           | Turns on paging — `pagination.limit` starts at `0`, an unpaged read      |
| Know whether a filter is active        | `useClientCompanies().useMeta().isFiltered`                      | True while the declared filter column carries a value                    |
| Render the filter bar                  | `useClientCompanies().useContext().schemas.query`                | `{ schema, uischema, sortUischema }` — the ready-made filter description |
| Create a new company                   | `useClientCompanyManager().as('client').fresh()` then `update()` | Creates through the validated form                                       |
| Change a company                       | `…for('company', id)` then `update()`                            | Edits through the validated form; sends only the changed fields          |
| Pick address/email/phone               | the form's schema controls, or an inline value                   | Choose an existing sibling record, or supply one inline to create it     |
| Validate as the client types           | `…useActions().input()` + `useMeta().isValid`                    | Reports acceptance and which field is wrong                              |
| Render the form                        | `…useContext().schema` / `.uischema`                             | The form definition, served by the editor                                |
| Compose the company form into a parent | `useCompanySchema()` / `useCompanyUischema()`                    | Pure schema-fragment functions for embedding this form in another one    |

## Key Concepts

### Two surfaces, one client

The collection and the editor are separate composables, but they share one
identity seam and one cache key. Whichever surface issues a request, it
resolves the same target client — from the scope the consumer opened, never
from a direct session read.

> **👩‍💻 For Developers:** Per-company form editing (`create`, `update`, field
> validation) lives on the **editor**, not on the collection. The collection's
> create seam is `ensure()` — find-or-create by id. If you are reaching for a
> form on the collection, you want the editor.

### The collection is always the client's own

`useClientCompanies().as('client')` resolves to the calling client's own
company list. There is no acting-on-behalf-of-another-client capability in
this module, and no capability for a staff member to act on a client's
companies through it — that capability exists on the real platform, but this
module does not carry it. See [gotchas.md](./gotchas.md) for what that means
in practice.

> **🧪 For Testers:** With no authenticated client session, the list never
> fires a request, `useMeta().isAvailable` is `false`, and any mutation
> rejects immediately rather than reaching the network.

### Filtering, sorting and paging are one request, three intents

`filterBy()`, `sortBy()` and `setCriteria()` each write one branch of the same
underlying request — `filters`, `sort`, or `pagination` — and every call
re-queries the server; none of the three slices the rows already loaded.
Compose freely: setting a filter and a sort at the same time produces one
request carrying both, not two competing ones.

```ts
const companies = useClientCompanies().as("client");

await companies.useActions().filterBy({ name: { like: "acme" } });
await companies.useActions().sortBy([{ field: "created_at", dir: "desc" }]);
await companies.useActions().setCriteria({ pagination: { limit: 10 } });
await companies.useActions().nextPage();
```

`pagination.limit` starts at `0` — an unpaged, whole-collection read, because
that is what both consuming legacy screens ask for. `setCriteria` is the door
that opens a smaller page, after which `nextPage()` / `prevPage()` have
somewhere to move to. The sortable columns are `name` and `created_at` only —
`default` is deliberately not one of them, because nothing sorts by it today
and an unrecognised order column is rejected by the server.

> **🧪 For Testers:** `useMeta().isFiltered` is `true` only while the `filters`
> branch carries a value — sorting or paging alone never sets it. Clearing the
> filter with `filterBy({})` drops it back to `false`.

### `default()` returns the company's **id**, not the row

`useClientCompanies().useContext().default()` returns the default company's
`id` (or `undefined` if none) — it is not the company record itself. Look the
row up with `getOne(default())` when you need the full record.

```ts
const { default: defaultId, getOne } = companies.useContext();

const defaultCompanyId = defaultId(); // e.g. "4d036794-24d0-e710-639b-3153698d582e"
const defaultCompany = getOne(defaultCompanyId()); // the full row, or undefined
```

> **🧪 For Testers:** Against a fixture with exactly one `default: true` row,
> `default()` resolves to that row's `id`. Against a fixture with none, it
> resolves `undefined` and never throws. A test asserting `default()` returns
> a row object is asserting the wrong contract.

### There is no way to name a different client's companies

`useClientCompanyManager` accepts no client-targeting option of any kind —
under any name. The company being edited comes from `.for('company', id)` or
`.fresh()`; the client it belongs to is always the one the scope resolved, and
that is always the calling client's own session. A caller that used to pass a
client id to the editor has nothing to migrate that option to — it is gone,
not renamed.

### The form's schema is only reachable through the editor — except for two fragments

`useClientCompanyManager().useContext().schema` / `.uischema` are the schemas
the editor actually validates against. Separately, `useCompanySchema()` /
`useCompanyUischema()` are exported on the module barrel as **pure schema
fragments** — for a different module composing the company form's fields into
a _parent_ schema (for example, checkout's business-details step), not for
rendering the company form on its own. See [gotchas.md](./gotchas.md) for why
both exist and when to reach for which.

### Errors are state — the module raises nothing

No toast, no notification, no message is raised on your behalf. Every failure
is captured where the consumer can read and render it: `useContext().error` /
`useMeta().hasError` on the collection, `useContext().errors` and
`.validationErrors` / `useMeta().hasErrors` on the editor.

> **👩‍💻 For Developers:** If your UI shows nothing after a failed delete, the
> error was not lost — it is sitting in `useContext().error` waiting to be
> rendered.

### Two drafts never collide

Each `.fresh()` call mints its own editor instance with its own model. Two new
-company forms open at the same time do not interfere.

## Documentation

| Doc                                  | Audience                                                    | Content                                                                                 |
| ------------------------------------ | ----------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **This README**                      | Everyone                                                    | Overview, concepts, quick start                                                         |
| [usage.md](./usage.md)               | All devs                                                    | Full API reference for both composables, plus the paste-ready form schema and UI schema |
| [architecture.md](./architecture.md) | Internal / contributors                                     | Data flow, the shared identity seam, dependencies                                       |
| [gotchas.md](./gotchas.md)           | All                                                         | The sharp edges — paging, the default() contract, scope, error handling                 |
| [foundation.md](./foundation.md)     | Teams building against the Upmind back end on another stack | Framework-neutral platform spec: endpoints, payloads, failure modes                     |
| [CHANGELOG.md](./CHANGELOG.md)       | All                                                         | Change history and porting notes                                                        |

## Playground

`playgrounds/labs/src/pages/client/Companies.vue` and
`.../billing/components/ClientBillingAddresses.vue` drive the collection and
editor pair against a live client session.
