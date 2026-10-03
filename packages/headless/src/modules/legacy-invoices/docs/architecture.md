# Legacy Invoices Architecture

## Overview

`legacy-invoices` ships two scoped composables registered under the same
module name — `useLegacyInvoices` (a TanStack-backed list) and
`useLegacyInvoice` (a TanStack-backed single-item read) — sharing one
services factory (`legacy-invoices.services.ts`) so both address the same
client through the same identity seam and the same cache key family. Neither
composable declares a context enum: both scope matrices are all-`never`, so
`.for(entity, id)` is a compile error on every actor, from application code.
The module is read-only plus one document download; no write member exists
anywhere in its surface.

## Data Flow

```text
┌──────────────┐     ┌───────────────────┐     ┌──────────────┐
│  Criteria /   │────▶│  legacy-invoices  │────▶│  TanStack    │
│  record id    │     │  .services.ts     │     │  query (list │
│  (caller)     │     │  (one factory)    │     │  / item)     │
└──────────────┘     └───────────────────┘     └──────────────┘
                              │                        │
                              ▼                        ▼
                     ┌──────────────────┐     ┌──────────────────┐
                     │ legacy-invoices  │◀────│  select: mapper  │
                     │ .mappers.ts      │     │  (wire → VM)     │
                     └──────────────────┘     └──────────────────┘
```

1. **Criteria in** → the collection's `setCriteria`/`filterBy`/`sortBy` write into the query's live criteria model; the single read takes a record id via `.withId(id)`, folded into the scope key at construction.
2. **One services factory** → both `loadList()` and `loadOne(recordId)` route through `legacy-invoices.services.ts`, which owns the one `isAddressable()` gate both queries call.
3. **Mapping** → the query's own `select` calls `mapLegacyInvoices`/`mapLegacyInvoice`, which keep the wire's top-level fields and pass `content` through whole — no flattened projection.

## Sub-Composables

Both composables return the same four-layer shape:

| Sub-composable | Purpose |
| --- | --- |
| `useActions()` | Collection: `filterBy`, `sortBy`, `setCriteria`, `nextPage`/`prevPage`, `refresh`, `reset`, `invalidate`, `isReady`, `destroy`. Manager: the same lifecycle set minus list controls, plus `downloadPdf` (no `reset`). |
| `useContext()` | Collection: `data`, `error`, `pagination`, `query`, `total`, `schemas`, `findOne`/`getOne`. Manager: `data` (the whole mapped record), `error`. |
| `useMeta()` | Collection: `hasError`, `hasLegacyInvoices`, `isAvailable`, `isEmpty`, `isFiltered`, `isLoading`. Manager: `hasError`, `isAvailable`, `isEmpty`, `isLoading`, plus `isComplete` and the five derived record conditions (`isPaid`/`isOverdue`/`isCredited`/`isStaged`/`isProforma`) and `isDownloading` — no `hasLegacyInvoices` or `isFiltered` (collection-only). |
| `useInternals()` | Debug: the raw TanStack query object; the collection also exposes `translateQuery()` (the wire the live criteria would build, without requesting it). |

## Services

One factory, no per-actor arms. `scopedServices(actorScope)` is a switch with
only a `default: () => ({})` case — every cell on both scope matrices,
`client` and `self` included, is `null as never`, since neither matrix names
a context a `.for()` call could retarget. The compiler does not itself
refuse a `.as('staff')` call
(the actor call carries no matrix bound); the arm-resolution switch plus the
all-`never` matrices are the two things that hold the client-only boundary in
practice, together with the request-contract assertion each specification
makes on the emitted URL.

| Actor | Behaviour |
| --- | --- |
| `client` (`self`) | Full behaviour — the only cell this module serves. |
| `staff` / `guest` / entity retarget | `.for(entity, id)` does not compile; `.as('staff')` compiles but still resolves the client path, carrying the signed-in session's own token and no acting-as header. |

## Dependencies

### `legacy-invoices` Depends On

| Module | Usage |
| --- | --- |
| `scope` | `createScopedComposable`, scope-key generation, registry removal |
| `session-store` | addressability (`isAuthenticated`, `activeUser`), `activeUser.has_legacy_invoices` |
| `query` | `useQuery` (list/item, and `download()` for the PDF, which attaches the access token and `lang`), `translateQuery`, `invalidateQueryByKey`, `resetQueryByKey` |
| `invoices` | `invoices.utils.ts` `downloadBlob` only (no service/type import) |
| `@upmind-automation/types` | `ILegacyInvoice`, `InvoiceStatus` |

### Modules That Depend On `legacy-invoices`

None yet — newly built, ahead of any consuming client-area page.

## Integration Points

| System | Integration |
| --- | --- |
| **Import archive API** (`/import_invoice_data*`) | Client path only; never `/admin/…`. Three endpoints: list, read one, download PDF. |
| **Shared status vocabulary** (`@upmind-automation/types`) | `InvoiceStatus.PAID`/`.OVERDUE` drive the two status-derived conditions. |
| **Session record** | The archive-availability flag (`hasLegacyInvoices`) is read straight off the signed-in session's own `activeUser`, not derived by this module. |
