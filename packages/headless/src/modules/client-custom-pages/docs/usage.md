# client-custom-pages — Usage

Full API reference for the module's two composables:

- **`useClientCustomPages`** — the collection. Browse, narrow, sort, and page
  through the brand's custom pages.
- **`useClientCustomPage`** — the single read. Open one page in full, by its
  route slug.

Every capability below carries a 🧪 **For Testers** expected-behaviour
statement.

## Getting an instance

```ts
import {
  ScopeActorTypes,
  useClientCustomPages,
  useClientCustomPage
} from "@upmind-automation/headless";

// The collection — readable by every actor, including a signed-out guest
const pages = useClientCustomPages().as(ScopeActorTypes.CLIENT);

// The single read — opened by route slug; the actor defaults to self
const page = useClientCustomPage().withId("about");
```

Both composables return the same four sub-composables:

| Layer     | Access             | Collection contains                                                  | Single read contains       |
| --------- | ------------------ | ---------------------------------------------------------------------- | ---------------------------- |
| Actions   | `.useActions()`    | `destroy`, `filters` (`showOnMenu`, `slug`), `invalidate`, `isReady`, `nextPage`, `prevPage`, `refresh`, `sort` | `destroy`, `invalidate`, `isReady`, `refresh` |
| Context   | `.useContext()`    | reactive list, lookups, live request state, pagination, error         | the resolved page, error     |
| Meta      | `.useMeta()`       | eight state flags                                                     | six state flags              |
| Internals | `.useInternals()`  | the raw list handle                                                   | the raw item handle          |

> **🧪 For Testers:** The collection resolves for every actor, including a
> guest with no session — the list read carries no bearer token. The single
> read carries a bearer token whenever a session is active. Naming a client
> id through `.for()` on the collection compiles and runs, but does not
> change which pages come back — see
> [gotchas.md](./gotchas.md#1-forclient-otherid-on-the-collection-type-checks--and-retargets-nothing).
> `.for()` is a compile-time error on the single read, for every actor —
> there is no context to name there at all; the slug is a record identifier,
> reached through `.withId()`, never a scope.

---

## The collection — `useClientCustomPages`

### Collection actions — `useActions()`

#### `filters.showOnMenu(value?)`

Narrows the list to pages matching the given menu-visibility flag. An absent
value clears the filter.

| Param   | Type                | Required |
| ------- | ------------------- | -------- |
| `value` | `boolean \| undefined` | No     |

**Returns:** `void`.

> **🧪 For Testers:** `filters.showOnMenu(true)` sends the request narrowed
> to menu-visible pages. Whether the platform's response is actually
> narrowed by this parameter is unconfirmed — see
> [gotchas.md](./gotchas.md#3-whether-the-menu-visibility-filter-narrows-the-wire-response-is-unconfirmed).
> Only the outbound request shape is currently provable.

#### `filters.slug(value?)`

Narrows the list to one page matching the given route slug. An absent value
clears the filter. This is a list-side narrowing that ships alongside the
single-read door — neither replaces the other.

| Param   | Type                 | Required |
| ------- | -------------------- | -------- |
| `value` | `string \| undefined` | No      |

**Returns:** `void`.

Calling `filters.showOnMenu()` and `filters.slug()` in sequence combines both
narrowings — each call merges into the live filter state rather than
replacing the whole branch, so setting one does not clear the other.

#### `sort(property?, direction?)`

Sorts the list by the given property and direction. Sortable properties are
creation order and name. Omitting the property returns the list to the
platform's own default order (its own record insertion order — no explicit
sort parameter is sent for the boot read).

| Param       | Type                                   | Required | Default |
| ----------- | --------------------------------------- | -------- | ------- |
| `property`  | one of the sortable fields, or absent    | No       | —       |
| `direction` | ascending / descending                   | No       | ascending |

**Returns:** `void`.

#### `nextPage()` / `prevPage()`

Moves to the next or previous page of the server-paged window.

**Returns:** `void`.

#### `isReady()` — waiting for the list

Resolves once the collection is ready to read.

**Returns:** `Promise<boolean>` — always settles.

> **🧪 For Testers:** The collection needs no session, so `isReady()`
> resolves purely on the first fetch completing, for every actor including a
> signed-out guest.

#### `refresh()`

Forces a re-read of the list from the server.

**Returns:** `Promise<void>`.

#### `invalidate()`

Marks the cached list stale so the next read re-fetches it.

**Returns:** `Promise<T | undefined>`.

#### `destroy()` — releasing the collection

Removes this scoped instance from the registry.

**Returns:** `void`.

> **🧪 For Testers:** `destroy()` removes the registry entry, so the next
> `.as('client')` mints a fresh collection. Call on component unmount.

### Collection context — `useContext()`

| Property     | Type                                                     | Meaning                                                                        |
| ------------ | --------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `data`       | `ComputedRef<CustomPage[]>`                              | The reactive list of the brand's pages                                        |
| `error`      | `ComputedRef<ResponseError \| undefined>`                | The list read's captured error                                                |
| `findOne()`  | `(mapping) => CustomPage \| undefined`                   | Finds one page already on the list by a partial mapping (e.g. by slug)        |
| `getOne(id)` | `(id) => CustomPage \| undefined`                        | Finds one page already on the list by its identifier                          |
| `pagination` | `ComputedRef<PaginationInfo>`                             | `{ limit, total, page, pages, from, to }`                                     |
| `query`      | `ComputedRef<QueryModel>`                                 | This scope's ACTIVE request state — read-only; write through `useActions().filters` / `.sort` |
| `schemas`    | `{ query: { schema, uischema, sortUischema } }`           | The request schema, the filter-bar presentation, and the sort control's own presentation |

> **🧪 For Testers:** `data` is always an array — before the first read
> completes, and when the read errors. `error` is **state you read**, never
> an event. `query` and `schemas` both travel as plain JSON — no function
> crosses either.

### Collection meta — `useMeta()`

| Flag          | True when                                                       |
| ------------- | ----------------------------------------------------------------- |
| `hasError`    | the list read failed                                              |
| `isAvailable` | unconditionally — the list needs no session                       |
| `isEmpty`     | the resolved list has no rows                                     |
| `isLoading`   | the list read is in flight or has not completed its first fetch   |
| `isReloading` | a background re-fetch is in flight, following an already-completed first load |
| `hasNextPage` | there is a further page beyond the current one                    |
| `hasPrevPage` | there is a page before the current one                            |
| `hasPages`    | the collection spans more than one page                           |

> **🧪 For Testers:** `isLoading` covers only the first load; `isReloading`
> covers a later background re-read. A consumer rendering a spinner keyed
> only on `isLoading` shows nothing during a refresh — see
> [gotchas.md](./gotchas.md#5-isloading-and-isreloading-are-two-different-signals-not-one).

### Collection internals — `useInternals()`

| Property     | Meaning                              |
| ------------ | --------------------------------------- |
| `actorScope` | the resolved actor for this instance    |
| `query`      | the raw handle backing the list         |

For debugging and tests. Not for production consumers.

---

## The single page — `useClientCustomPage`

Opens one page by its route slug and reads it in full. The actor defaults to
self, so `.as()` is optional.

```ts
import { useClientCustomPage } from "@upmind-automation/headless";

const page = useClientCustomPage().withId("about");

await page.useActions().isReady();
const { data } = page.useContext();
```

### Single-read actions — `useActions()`

#### `isReady()` — waiting for the page

Resolves once the page is ready to read — including the moment a matching
slug resolves from an already-loaded collection, without waiting on a
request that this door's own guard may never issue (see
[gotchas.md](./gotchas.md#4-opening-an-already-listed-page-by-slug-is-built-to-skip-a-second-request--proving-the-skip-itself-needs-a-page-that-does-not-exist-yet)).

**Returns:** `Promise<boolean>` — always settles.

#### `refresh()`

Forces a re-read of the page from the server.

**Returns:** `Promise<void>`.

#### `invalidate()`

Marks the cached read stale so the next read re-fetches it.

**Returns:** `Promise<T | undefined>`.

#### `destroy()` — releasing the read

Removes this scoped instance from the registry.

**Returns:** `void`.

> **🧪 For Testers:** After `destroy()`, a fresh `.withId(slug)` mints a new
> instance rather than reusing the released one.

### Single-read context — `useContext()`

| Property | Type                                      | Meaning                       |
| -------- | ------------------------------------------ | -------------------------------- |
| `data`   | `ComputedRef<CustomPage>`                  | The resolved page               |
| `error`  | `ComputedRef<ResponseError \| undefined>`  | The read's captured error       |

> **🧪 For Testers:** When the slug is already present on an already-loaded
> collection under the same actor, `data` resolves that SAME record. Whether
> that substitution actually prevents the network request in a live response
> is unconfirmed — see
> [gotchas.md](./gotchas.md#4-opening-an-already-listed-page-by-slug-is-built-to-skip-a-second-request--proving-the-skip-itself-needs-a-page-that-does-not-exist-yet).

### Single-read meta — `useMeta()`

| Flag          | True when                                                       |
| ------------- | ----------------------------------------------------------------- |
| `hasError`    | the read failed                                                  |
| `isAvailable` | unconditionally — same reason as the collection's                |
| `isEmpty`     | the resolved page carries no id                                  |
| `isLoading`   | the read is in flight or has not completed its first fetch       |
| `isNotFound`  | the resolved slug does not exist as a page                       |
| `isReloading` | a background re-fetch is in flight, following an already-completed first load |

> **🧪 For Testers:** `isNotFound` is `true` only for a genuine unknown-slug
> response (a real HTTP 404 with the platform's own not-found message); it is
> `false` for every other failure. Real capture:
> `__tests__/fixtures/get-custom-pages-no-such-page-xyz.json`.

### Single-read internals — `useInternals()`

| Property     | Meaning                              |
| ------------ | --------------------------------------- |
| `actorScope` | the resolved actor for this instance    |
| `query`      | the raw handle backing this read        |

For debugging and tests. Not for production consumers.

---

## Errors are state, never announcements

Nothing in this module raises a toast, a notification, or any other message
on your behalf.

```ts
import { useClientCustomPages, useClientCustomPage } from "@upmind-automation/headless";

const pages = useClientCustomPages().as("client");
const page = useClientCustomPage().withId("about");

// Collection
const { error } = pages.useContext();
const { hasError } = pages.useMeta();

// Single read
const { error: pageError } = page.useContext();
const { hasError: pageHasError, isNotFound } = page.useMeta();
```

> **🧪 For Testers:** A consumer that shows nothing for an unknown slug has
> not lost the error — it has not rendered `useContext().error` or checked
> `useMeta().isNotFound`.

## Rendering a page's body

This module resolves a page's identifying and menu fields only — there is no
body field on either composable's data. Rendering a page's actual content is
a separate, already-shipped surface, keyed by the resolved page's own id:

```ts
import {
  useClientCustomPage,
  useClientTemplate,
  ClientTemplateSlotCodes
} from "@upmind-automation/headless";

const page = useClientCustomPage().withId("about");
await page.useActions().isReady();
const { data } = page.useContext();

// A separate, already-shipped surface renders the body, keyed by the
// resolved page's id — this module mints no renderer of its own.
const body = useClientTemplate({
  code: ClientTemplateSlotCodes.CUSTOM_PAGE,
  objectId: data.value?.id
});
```

## Types

```ts
import {
  useClientCustomPages,
  useClientCustomPage,
  CLIENT_CUSTOM_PAGES_SCOPE_MATRIX,
  ClientCustomPagesContextTypes,
  CustomPagesSortableProperties,
  type UseClientCustomPages,
  type UseClientCustomPagesActions,
  type UseClientCustomPagesContext,
  type UseClientCustomPagesMeta,
  type UseClientCustomPagesInternals,
  type UseClientCustomPage,
  type UseClientCustomPageActions,
  type UseClientCustomPageContext,
  type UseClientCustomPageMeta,
  type UseClientCustomPageInternals,
  type ClientCustomPagesScopeMatrix,
  type CustomPage,
  type CustomPagesFilters,
  type CustomPagesFilterModel,
  type CustomPagesSortEntry,
  type CustomPagesSortModel
} from "@upmind-automation/headless";
```

That list is the module's whole public surface. The services, schemas, and
mappers are internal and are not exported — see
[gotchas.md](./gotchas.md) and [architecture.md](./architecture.md).
