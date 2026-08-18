# Changelog

All notable changes to the `client-email` module are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added

- **`useClientEmailManager`** — a second composable in this module: the per-email form editor, backed by the shared data-manager machine. Open an existing address with `.as('self').for('email', id)`, or start a new one with `.as('self').fresh()`. Each `.fresh()` call mints an isolated instance, so two concurrent drafts never share a model.
  - 7 actions — `clear`, `destroy`, `input`, `isReady`, `onDone`, `stop`, `update`.
  - 9 context members — `context`, `description`, `errors`, `id`, `model`, `schema`, `title`, `uischema`, `validationErrors`.
  - 8 flat meta flags — `hasErrors`, `isAvailable`, `isComplete`, `isDirty`, `isLoading`, `isNew`, `isProcessing`, `isValid`.
  - 4 internals — `actorScope`, `send`, `service`, `state`.
- **`useClientEmails().useMeta().isAvailable`** — reports whether this scope can address a client at all. It is `true` only when the session is authenticated **and** the scope resolved a client id, it is reactive (it flips `false` in the same tick the session goes away, emitting no request), and it is the _same predicate_ every request gate in the module calls rather than a second copy of it.
- **`useClientEmails().useMeta().isFiltered`** — reports whether any declared filter column currently carries a value, read straight off the collection's own query criteria. Distinguishes a collection that is empty _because_ a filter narrowed it to nothing from one with no addresses at all.
- **A per-address read** behind the editor: opening one address no longer requires the whole collection to have loaded first.
- **Form definition through the editor** — `useContext().schema` and `.uischema`, adopted by the editor and served as a pair. The pair is also published as plain copy-pasteable JSON in [usage.md](./usage.md#the-form-definition--paste-ready).
- **A captured rejection for defaulting an unverified address** (`409`, _"The default email cannot be changed to unverified email address!"_), documented in [foundation.md](./foundation.md#failure-modes) and [gotchas.md](./gotchas.md).
- **Schema-driven filtering and sorting.** `useContext().schemas.query` publishes one JSON Schema + UI schema describing the collection's whole request state: which columns can be filtered (`email` substring, `verified` / `bounced` status), which columns can be sorted (`default`, `email`, `verified`, `bounced`, `created_at`), and the current page window. `useContext().query` is the live, read-only model; write it through `useActions().filterBy()` / `.sortBy()`. Both re-query the server — neither filters nor sorts the already-loaded rows client-side. See [usage.md](./usage.md#the-collections-query-schema--paste-ready) for the paste-ready pair, and this module's [README](./README.md#playground) for a live rendering.
- **`sortBy(intent)`** — applies a sort order (`[{ field, dir }, …]`); an empty intent re-applies the collection's own default order rather than leaving the list unordered.
- **A real, drivable rendering of the filter bar.** The uischema declares a `FilterBar` layout of plain `Control` elements, each scoping one operator leaf and naming its control through `options.format` — a search box for `email`, a tri-state for each boolean status column. `@upmind-automation/client-vue` registers a renderer per format and JSON Forms' own tester scorecard picks between them, so labels and enum-option labels resolve through the standard i18n pipeline. Renders live end to end in the `labs-nuxt` playground; see this module's [README](./README.md#playground) for the exact command and url.

### Changed

- **The editor's `useMeta()` returns flat computeds, not a single `meta` object.** Read `useMeta().isValid`; the `meta.value.isValid` form is gone. See the migration guide below.
- **`UseClientEmail` is now `UseClientEmailManager`**, alongside `UseClientEmailManagerActions` / `…Context` / `…Meta` / `…Internals`.
- **The collection's create seam is `ensure()` (find-or-create).** Per-address `add`, `update` and field validation are the editor's, because they need the dirty/valid state the editor owns. The collection's twelve actions are `destroy`, `ensure`, `filterBy`, `invalidate`, `isReady`, `nextPage`, `prevPage`, `refresh`, `remove`, `setDefault`, `sortBy`, `verify`.
- **The free-text search now reaches the server.** The earlier `filters.query(value)` sent a search term `GET /clients/{id}/emails` silently ignored — every keystroke re-fetched the same unfiltered list. It is replaced by `filterBy({ email: { like: value } })`, which narrows through a real `filter[email|like]` parameter.
- **`refresh()` rejects with `NotAuthenticatedError`** when the scope cannot address a client — both before the request is issued and if the session dies mid-flight. Every other collection read resolves quietly.
- **The collection's `useMeta()` is five members** — `hasError`, `isAvailable`, `isEmpty`, `isFiltered`, `isLoading`.
- **The collection's declared page size is `10`, not `0`.** The list now boots on `limit=10&offset=0` — the schema's own declared default — instead of requesting the entire collection unpaged. A collection of ten addresses or fewer still sees everything on the first read; a larger one now needs `nextPage()` to see the rest.
- **Filtering and sorting no longer translate in the actions layer.** `filterBy()` / `sortBy()` only declare intent; the one function that turns the declared model into `filter[col|op]=` / `order=` / `limit=`&`offset=` now lives in the shared query layer, not this module's services file.
- **A rejected filter/sort/page write is refused whole, not partially applied.** Writing an invalid value on a declared column used to let the bad value into the model before validation caught it. It no longer does: the candidate is validated before it is committed, so a refused write leaves the last valid model standing, fires zero requests, and surfaces only on `useContext().error` — see [gotchas.md](./gotchas.md#16-an-unrecognised-filter-or-sort-column-is-silently-dropped-a-known-column-with-a-bad-value-is-rejected-whole-not-partially-applied).
- **Optional filter leaves accept `null`.** Clearing the free-text search no longer produces a validation error — see [gotchas.md](./gotchas.md#17-clearing-the-search-box-is-a-valid-empty-state-not-an-error).
- **Documentation refreshed against the shipped surface** — README, usage, architecture, gotchas and foundation now describe both composables, the real recorded fixtures, and the real failure modes.

### Removed

- **Toast and notification feedback.** `remove`, `verify` and `setDefault` no longer raise success or error messages. Errors are captured as state; the consumer raises its own feedback. See the migration guide below.
- **`useSchema` / `useUischema` are not exported** from the module barrel. The form definition is reachable only through the editor's context, because a form rendered from a definition the editor has not adopted validates against a different contract than the one that saves.
- **`filters.query(value)`** — replaced by `filterBy()` (see Changed and the migration guide below). The old call shape is now a compile error, not a silent no-op.

### Fixed

- **Every request URL derives its target client from the resolved scope**, through one seam shared by the collection, the editor and all eight request functions — the list read, the per-address read, create, update, find-or-create, delete, set-default and verification. An instance addresses exactly the client its scope named.

### Recorded fixtures

Ten request/response pairs captured against a live environment back the documented behaviour:

| Fixture                                                     | Covers                                              |
| ----------------------------------------------------------- | --------------------------------------------------- |
| `get-clients-id-emails.json`                                | the default list read, under the schema's page size |
| `get-clients-id-emails-case-page-1.json`                    | first page, `limit=2&offset=0`                      |
| `get-clients-id-emails-case-page-2.json`                    | second page, `limit=2&offset=2`                     |
| `get-clients-id-emails-id.json`                             | the per-address read                                |
| `post-clients-id-emails.json`                               | create (request body captured too)                  |
| `put-clients-id-emails-id.json`                             | change the address value, `{ email, verified: 0 }`  |
| `put-clients-id-emails-id-case-set-default.json`            | promote a verified address to default               |
| `put-clients-id-emails-id-case-set-default-unverified.json` | the `409` rejection on an unverified target         |
| `delete-clients-id-emails-id.json`                          | delete                                              |
| `patch-clients-id-emails-id-send-verify.json`               | request a fresh verification message                |

### Notes

- Both composables act on the calling client's own collection only. `staff` and `guest` are compile-time errors in both scope matrices — there is no capability here for one party to reach another party's addresses.
- Saving an existing address always resets its verified flag, and `canDelete` / `isDefault` are informational client-side — see [gotchas.md](./gotchas.md).

### Not captured

- The rejection shape when the platform declines to delete a record it marked `can_delete: false`. The flag stays documented as informational until a rejection is observed.

---

## Migration Guide

### Reading the editor's state flags

**Breaking change:** the editor's `useMeta()` returns one computed per flag instead of a single `meta` object.

```ts
// Before
const { meta } = manager.useMeta();
if (meta.value.isValid) await save();

// After
const { isValid } = manager.useMeta();
if (isValid.value) await save();
```

Flags available: `hasErrors`, `isAvailable`, `isComplete`, `isDirty`, `isLoading`, `isNew`, `isProcessing`, `isValid`.

### Renaming the editor's type

```ts
// Before
import type { UseClientEmail } from "@upmind-automation/headless";

// After
import type { UseClientEmailManager } from "@upmind-automation/headless";
```

### Raising your own feedback

**Breaking change:** the module no longer raises toasts or notifications. Render feedback from the captured state.

```ts
// Before — the module announced success and failure itself
await remove(id);

// After — read the outcome and decide what the user sees
const { error } = emails.useContext();
const { hasError } = emails.useMeta();

await remove(id).catch(() => undefined);
if (hasError.value) notifyFailure(error.value?.message);
else notifySuccess();
```

For the editor, `useActions().onDone()` resolves once a save has completed, and `useContext().errors` / `.validationErrors` carry the failure detail.

### Adding an address

**Breaking change:** there is no `add()` on the collection.

```ts
// Before
await emails.useActions().add({ email });

// After — find-or-create, no form
await emails.useActions().ensure({ email });

// After — through the validated form
const draft = useClientEmailManager().as("self").fresh();
await draft.useActions().isReady();
await draft.useActions().update({ email });
```

### Obtaining the form definition

```ts
// Before
import { useSchema, useUischema } from "@upmind-automation/headless";

// After
const { schema, uischema } = manager.useContext();
```

### Filtering the collection

**Breaking change:** `filters.query(value)` is gone — it sent a search term the platform silently ignored.

```ts
// Before — a no-op search
await emails.useActions().filters.query("nathan");

// After — a real substring filter that re-queries the server
await emails.useActions().filterBy({ email: { like: "nathan" } });

// Verified / bounced / default are the other three declared filters
await emails.useActions().filterBy({ verified: { eq: false } });

// Clear every active filter
await emails.useActions().filterBy({});
```

The declared columns and operators are on `useContext().schemas.query.schema` — see [usage.md](./usage.md#the-collections-query-schema--paste-ready).

### Sorting the collection

**New:** there was no sort action before this change.

```ts
await emails.useActions().sortBy([{ field: "email", dir: "asc" }]);

// Clearing the sort re-applies the collection's own default order,
// rather than leaving the list unordered
await emails.useActions().sortBy([]);
```
