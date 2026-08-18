# client-company — Usage

Full API reference for the module's two composables:

- **`useClientCompanies`** — the collection. Read the client's companies and
  act on them row by row.
- **`useClientCompanyManager`** — the per-company editor. Open one company (or
  start a new one) in a validated form and save it.

Both act on the calling client's own companies. Every capability below carries
a 🧪 **For Testers** expected-behaviour statement.

## Getting an instance

```ts
import {
  useClientCompanies,
  useClientCompanyManager
} from "@upmind-automation/headless";

// The collection — the calling client's own companies
const companies = useClientCompanies().as("client");

// The editor, opened on one existing company
const manager = useClientCompanyManager()
  .as("client")
  .for("company", companyId);

// The editor, started on a brand-new company
const draft = useClientCompanyManager().as("client").fresh();
```

Both composables return the same four sub-composables:

| Layer     | Access            | Collection contains            | Editor contains                      |
| --------- | ----------------- | ------------------------------ | ------------------------------------ |
| Actions   | `.useActions()`   | row mutations + list lifecycle | form input, save, lifecycle          |
| Context   | `.useContext()`   | reactive list + lookups        | model, schema, lookups, display text |
| Meta      | `.useMeta()`      | 7 flags                        | 8 flags                              |
| Internals | `.useInternals()` | the raw list query             | the raw machine state and sender     |

> **🧪 For Testers:** Both composables are built to be opened `.as('client')`.
> Neither scope matrix defines a context for `staff` or `guest`, so
> `.for(...)` — the only way to name a target — fails to compile after
> either. There is no supported scope in this module for a staff member, or a
> different client, to reach a _named_ client's companies. See
> [gotchas.md](./gotchas.md) §1 for the precise, verified boundary of what is
> and is not blocked by the type system here.

---

## The collection — `useClientCompanies`

### Collection actions — `useActions()`

Ten members. Per-company **form** editing (`create` / `update` / field
validation) is deliberately not here — that lives on the editor, which owns
the dirty/valid state those need.

#### `ensure(model)`

Finds an existing company by id, or creates it. This is the collection's
create seam.

| Param      | Type           | Required                   |
| ---------- | -------------- | -------------------------- |
| `model.id` | `string`       | No — omit to always create |
| `model.*`  | `CompanyModel` | Yes, for the create path   |

**Returns:** `Promise<Company>` — the existing matching record, or the newly
created one.

> **🧪 For Testers:** When `model.id` matches a company already in the loaded
> collection, `ensure(model)` resolves it with **no** create request fired.
> When absent or unmatched, it resolves the model's address/email/phone
> dependencies (creating any supplied inline), then POSTs the resolved payload
> to the client's own resource, then resolves the created record.

#### `remove(id)`

Deletes a company the platform currently marks deletable.

**Returns:** `Promise<void>` — settles once the delete completes.

> **🧪 For Testers:** `remove(id)` DELETEs the client's own resource with the
> client's session token and no acting-as header. The URL's client segment is
> the session's own resolved client id — never the literal `undefined`, even
> when called against an unauthenticated session (it rejects first; see
> `isReady()`/[gotchas.md](./gotchas.md)). On success the company is gone from
> the reactive list. **No toast or notification is raised** — a failure lands
> in `useContext().error` for you to render.

#### `setDefault(id)`

Promotes a company to the client's default.

**Returns:** `Promise<ICompany | undefined>` — the updated wire record.

> **🧪 For Testers:** `setDefault(id)` PUTs `{ default: true }` to the client's
> own resource. On success the targeted record's `meta.isDefault` becomes
> `true` and the previous default's becomes `false`, and
> `useContext().default()` resolves to the newly promoted row's id on the next
> read.

#### `isReady()` — waiting for the list

Resolves once the collection is ready to read.

**Returns:** `Promise<boolean>` — `true` once the first fetch has settled;
`false` if the session settles without an addressable client.

> **🧪 For Testers:** `isReady()` waits only while the session is still
> settling. A session that never authenticates resolves it `false` rather
> than hanging — it resolves once the addressability question is answered,
> not by polling a timer that never clears.

#### `refresh()`

Forces a re-read of the list from the server.

**Returns:** `Promise<void>`.

**Throws:** `NotAuthenticatedError` when the scope cannot address a client —
either before the request is issued, or if the session dies mid-flight.

> **🧪 For Testers:** `refresh()` is the one collection read that **rejects**
> rather than resolving quietly. With no addressable client it throws
> `NotAuthenticatedError` and no request leaves the client.

#### `invalidate()`

Marks this module's cached list stale so the next read re-fetches it.

**Returns:** `Promise<T | undefined>` — resolves with whatever it was passed,
so it can be chained onto another promise.

#### `nextPage()` / `prevPage()`

**Returns:** `Promise<void>` — always settles, never throws synchronously.

> **🧪 For Testers:** The collection mounts its list query with an explicit
> "no page size" setting, and both calls have no other page to move to under
> that setting — every call to `useClientCompanies()` gets the same
> configuration, so there is no consumer-facing way to make these two do
> anything today. See [gotchas.md](./gotchas.md) for the detail and why this
> is not a new gap introduced by this module.

#### `filters.query(value)`

Applies a free-text filter and re-issues the list request.

**Returns:** `void`.

> **🧪 For Testers:** Calling with a value produces a request whose decoded
> URL carries `query=<value>`; calling with `undefined` (clearing the filter)
> produces a request carrying no `query` key at all, not a lingering empty
> one.

#### `destroy()` — releasing the collection

Removes this scoped instance from the registry.

**Returns:** `void`.

> **🧪 For Testers:** `destroy()` removes the scope-registry entry, so the
> next `useClientCompanies().as('client')` mints a fresh collection rather
> than a cached one. The collection has no service to stop — unlike the
> editor, whose `destroy()` also stops its machine. Call on component
> unmount.

### Collection context — `useContext()`

| Property     | Type                                                         | Meaning                                                             |
| ------------ | ------------------------------------------------------------ | ------------------------------------------------------------------- |
| `data`       | `ComputedRef<Company[]>`                                     | The client's reactive list of companies                             |
| `default()`  | `() => string \| undefined`                                  | **The client's default company's id** — not the row (see below)     |
| `error`      | `ComputedRef<ResponseError \| undefined>`                    | The last failed row mutation, else the list read's error            |
| `findOne()`  | `(mapping, data?, searchableProps?) => Company \| undefined` | Finds a single company by a partial mapping, or by `name` substring |
| `getOne(id)` | `(id, data?) => Company \| undefined`                        | Finds a single company by id                                        |
| `pagination` | `ComputedRef<PaginationInfo>`                                | `{ limit, total, page, pages, from, to }`                           |

> **🧪 For Testers:** `default()` resolves the default company's **id**. To
> render the row, pair it with `getOne`:
>
> ```ts
> const { default: defaultId, getOne } = companies.useContext();
> const row = getOne(defaultId());
> ```
>
> Against a fixture with no default row, `default()` resolves `undefined` and
> `getOne(undefined)` also resolves `undefined` — neither throws. `findOne`
> without an explicit `searchableProps` argument matches free text against
> `name` only.

### Collection meta — `useMeta()`

Seven flags.

| Flag          | True when                                                                      |
| ------------- | ------------------------------------------------------------------------------ |
| `hasError`    | a row mutation or the list read failed                                         |
| `hasNextPage` | the query has a further page after the current one (see the paging note above) |
| `hasPages`    | pagination applies to this list at all (see the paging note above)             |
| `hasPrevPage` | the query has a page before the current one (see the paging note above)        |
| `isAvailable` | the session is authenticated **and** the scope resolved a client id to address |
| `isEmpty`     | the resolved collection has no companies                                       |
| `isLoading`   | the list read is in flight or has not completed its first fetch                |

`isAvailable` is worth reading twice. It is **both limbs**: authenticated,
_and_ a client id resolved. It is also the _same predicate_ every request gate
in this module calls — not a second copy of it — so the flag you render and
the guard the wire enforces cannot drift apart. It is reactive: it flips to
`false` in the same tick the session goes away.

> **🧪 For Testers:** `isAvailable` is `false` before sign-in (while
> `isLoading` is still `true`), `true` once a client session is active, and
> `false` again the moment the session goes away — with zero requests emitted
> on that flip.

### Collection internals — `useInternals()`

| Property     | Meaning                                    |
| ------------ | ------------------------------------------ |
| `actorScope` | the resolved actor for this instance       |
| `query`      | the raw list-query object backing the list |

For debugging and tests. Not for production consumers.

---

## The per-company editor — `useClientCompanyManager`

A form editor over one company. Open an existing company with
`.for("company", id)`; start a new one with `.fresh()`. Each call to `.fresh()`
mints its own isolated instance, so two concurrent drafts never share a model.

```ts
const manager = useClientCompanyManager()
  .as("client")
  .for("company", companyId);

await manager.useActions().isReady();
await manager.useActions().update({ name: "New Name" });
```

There is no client-targeting parameter of any kind on this composable — the
client is always the one the scope resolved, which is always the calling
client's own session.

### Editor actions — `useActions()`

Seven members.

#### `isReady()` — waiting for the form

Resolves when the form is available for input.

**Returns:** `Promise<boolean>` — `true` once available; `false` if the
session settles without an addressable client.

> **🧪 For Testers:** The editor never issues a request before it knows which
> client it is editing for. On a cold boot it waits, then loads once the
> client id resolves — a session that never authenticates leaves it waiting
> with no request emitted, rather than firing an unaddressed one, and
> `isReady()` resolves `false` in that case. See [gotchas.md](./gotchas.md)
> for a documented limitation in this promise's separate, error-settled
> branch.

#### `input(model)`

Feeds a model into the form. **Debounced** — rapid calls collapse into one
parse.

| Param   | Type                                      | Required |
| ------- | ----------------------------------------- | -------- |
| `model` | `CompanyModel \| Record<string, unknown>` | Yes      |

**Returns:** `Promise<CompanyModel>` — the parsed model, after validation has
run.

> **🧪 For Testers:** `input()` resolves the _parsed_ model, not the raw one
> you passed. Submitting an incomplete company (for example, with no `name`)
> does not reject — it resolves and flips `useMeta().isValid` to `false`, with
> the field-level reason in `useContext().validationErrors`.

#### `update(value?)`

Saves the current model — or the one you pass — and resolves the persisted
model. **This is the editor's save, and it covers both create and edit:** a
`.fresh()` draft creates; a company-scoped editor updates.

| Param   | Type                                      | Required |
| ------- | ----------------------------------------- | -------- |
| `value` | `CompanyModel \| Record<string, unknown>` | No       |

**Returns:** `Promise<CompanyModel>` — the persisted model.

**Rejects:** with a `DetailedError` carrying the underlying failure, for you
to render.

> **🧪 For Testers:** `update()` flushes any pending debounced input first, so
> a save immediately after a keystroke persists the typed value, not the
> pre-edit one. Editing an existing company sends **only the fields that
> changed** relative to the model's persisted baseline — not the whole form.
> Saving a fresh draft resolves every address/email/phone dependency first
> (creating any supplied inline), then goes through find-or-create — a company
> the client already holds by id resolves the existing record instead of
> creating a duplicate. On success the shared cached list is invalidated, so
> an open collection reflects the saved value.

#### `clear()`

Clears the current form context back to its starting state.

**Returns:** `void`.

#### `onDone()`

Resolves once a save has completed.

**Returns:** `Promise<boolean>` — `true` on completion, `false` if it never
settled.

#### `stop()` — pausing the editor

Stops the underlying editor, leaving the registry entry in place.

**Returns:** `void`.

#### `destroy()` — releasing the editor

Stops the editor **and** removes it from the registry.

**Returns:** `void`.

> **🧪 For Testers:** After `stop()` the instance is still registered but no
> longer working; after `destroy()` it is released, and reopening that
> company mints a fresh editor. Call `destroy()` on component unmount — an
> undestroyed editor leaks a live watcher; see [gotchas.md](./gotchas.md).

### Editor context — `useContext()`

Sixteen members. This is where the form's schema and UI definition surface —
along with the sibling look-ups (addresses, emails, phones, countries,
regions) the form needs to render its dependency pickers.

Every member is read through the shared state helpers, so each is a
`ComputedRef` that can be `undefined` before the editor has settled.

| Property           | Type                                                | Meaning                                                                   |
| ------------------ | --------------------------------------------------- | ------------------------------------------------------------------------- |
| `addresses`        | `ComputedRef<Address[] \| undefined>`               | The client's own addresses, loaded for the form's address control         |
| `baseModel`        | `ComputedRef<CompanyModel \| undefined>`            | The dependency-resolved starting model — the diff baseline for `update()` |
| `config`           | `ComputedRef<Record<string, unknown> \| undefined>` | The brand config keys the form needs (address-region requirement)         |
| `context`          | `ComputedRef<CompanyContext \| undefined>`          | The full editor context object                                            |
| `countries`        | `ComputedRef<ICountry[] \| undefined>`              | All available countries, for the inline address block                     |
| `description`      | `ComputedRef<string \| undefined>`                  | Display description for the company being edited                          |
| `emails`           | `ComputedRef<Email[] \| undefined>`                 | The client's own emails, loaded for the form's email control              |
| `errors`           | `ComputedRef<string \| undefined>`                  | The captured error message, if any — read, never raised                   |
| `id`               | `ComputedRef<string \| undefined>`                  | The id of the company being edited; `undefined` for a new one             |
| `model`            | `ComputedRef<CompanyModel \| undefined>`            | The current form model                                                    |
| `phones`           | `ComputedRef<Phone[] \| undefined>`                 | The client's own phones, loaded for the form's phone control              |
| `regions`          | `ComputedRef<IRegion[] \| undefined>`               | The regions available for the selected country                            |
| `schema`           | `ComputedRef<JsonSchema \| undefined>`              | The form's JSON schema                                                    |
| `title`            | `ComputedRef<string \| undefined>`                  | Display title — the company's name, or `"New Company"` for a draft        |
| `uischema`         | `ComputedRef<UISchemaElement \| undefined>`         | The form's UI definition, paired with `schema`                            |
| `validationErrors` | `ComputedRef<ErrorObject[] \| undefined>`           | Field-level validation errors — read, never raised                        |

> **🧪 For Testers:** `errors` and `validationErrors` are **state**, not
> events. Nothing is thrown at you and nothing is announced — a rejected save
> lands here and stays readable until the next operation supersedes it.
> `description` names the sentence the form displays, built from the address
> plus the company's registration and tax numbers — it is a different string
> to the collection row's own `description` field (the address alone).

### Editor meta — `useMeta()`

Eight flat flags — one computed per flag. There is no single `meta` object to
unwrap; read `useMeta().isValid`, not `meta.value.isValid`.

| Flag           | True when                                                          |
| -------------- | ------------------------------------------------------------------ |
| `hasErrors`    | the editor captured an error                                       |
| `isAvailable`  | the form is available for input                                    |
| `isComplete`   | the company has been saved                                         |
| `isDirty`      | the model differs from its persisted baseline                      |
| `isLoading`    | the editor is waiting for its client id, or resolving its look-ups |
| `isNew`        | the company is new — the editor carries no company id              |
| `isProcessing` | a save is in flight                                                |
| `isValid`      | the current model passes schema validation                         |

> **🧪 For Testers:** `isLoading` is `true` while the editor waits for its
> client id — that state is loading, not broken. `isNew` reads the editor's
> own company id, so a `.fresh()` draft reports `true` until its first
> successful save.

### Editor internals — `useInternals()`

| Property     | Meaning                              |
| ------------ | ------------------------------------ |
| `actorScope` | the resolved actor for this instance |
| `send`       | the raw event sender                 |
| `service`    | the raw underlying service           |
| `state`      | the raw reactive state               |

For debugging and tests. Not for production consumers.

---

## The form definition

### Rendering the editor's own form

The editor serves its form definition at runtime through
**`useClientCompanyManager().useContext().schema`** and **`.uischema`**. They
travel as a pair through the editor's own context — they are not on the
module barrel, because a form rendered from a definition the editor has not
adopted validates against a different contract than the one that saves.

```ts
const { schema, uischema } = useClientCompanyManager()
  .as("client")
  .for("company", id)
  .useContext();
```

The form's core fields: `name` (required), `regNumber`, `tax.number`, and one
of `addressId` (an existing address) or an inline `address` block, plus
`emailId` and `phoneId` controls for the client's other own records. Which
address form the schema requires — `addressId` or `address` — depends on
whether the model already has an address: once one exists, only the id branch
is offered.

### Composing the company form into a parent form

`useCompanySchema()` and `useCompanyUischema()` are exported on the module
barrel separately, as **pure schema-fragment functions** — for a different
module that wants to embed the company's fields inside its own, larger schema
(for example, a checkout step that collects billing details alongside other
fields). They take the same shape of arguments the editor's own schema
building does (`countries`, `regions`, `baseModel`, `config`, and an optional
`minimal` flag that drops the email/phone controls for a reduced field set),
and return plain schema/uischema objects with no scope, no session and no
request behind them.

```ts
import {
  useCompanySchema,
  useCompanyUischema
} from "@upmind-automation/headless";

const fragment = useCompanySchema({ countries, regions, baseModel, config });
const fragmentUi = useCompanyUischema({
  countries,
  regions,
  baseModel,
  minimal: true
});
```

> **🧪 For Testers:** These two functions are not a second way to render the
> company form for its own sake — a consumer rendering the company form
> _itself_ reads `useClientCompanyManager().useContext().schema` /
> `.uischema` instead. See [gotchas.md](./gotchas.md) for why both exist.

---

## Errors are state, never announcements

Nothing in this module raises a toast, a notification, or any other message
on your behalf. Every failure is captured where you can read and render it:

```ts
// Collection
const { error } = companies.useContext();
const { hasError } = companies.useMeta();

// Editor
const { errors, validationErrors } = manager.useContext();
const { hasErrors } = manager.useMeta();

// Success signal for the editor
await manager.useActions().onDone();
```

> **🧪 For Testers:** No mutation in this module produces user-visible
> feedback of its own. A consumer that shows nothing after a failed delete has
> not lost the error — it has not rendered `useContext().error`.

## Types

```ts
import {
  useClientCompanies,
  useClientCompanyManager,
  CLIENT_COMPANIES_SCOPE_MATRIX,
  ClientCompaniesContextTypes,
  CLIENT_COMPANY_SCOPE_MATRIX,
  ClientCompanyContextTypes,
  useCompanySchema,
  useCompanyUischema,
  type UseClientCompanies,
  type UseClientCompaniesActions,
  type UseClientCompaniesContext,
  type UseClientCompaniesMeta,
  type UseClientCompaniesInternals,
  type UseClientCompanyManager,
  type UseClientCompanyManagerActions,
  type UseClientCompanyManagerContext,
  type UseClientCompanyManagerMeta,
  type UseClientCompanyManagerInternals,
  type UseClientCompany, // deprecated alias — see CHANGELOG.md
  type ClientCompaniesScopeMatrix,
  type ClientCompanyScopeMatrix,
  type Company,
  type CompanyModel,
  type CompanyContext
} from "@upmind-automation/headless";
```

That list is the module's whole public surface. The services layer and the
mappers are internal and are not exported — see [gotchas.md](./gotchas.md).
`useCompanySchema` / `useCompanyUischema` are the one deliberate exception to
the "no schema exports" convention this module otherwise follows; both are
documented above and in [gotchas.md](./gotchas.md).
