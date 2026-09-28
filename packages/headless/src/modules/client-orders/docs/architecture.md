# client-orders Architecture

## Overview

`client-orders` ships two query-backed scoped composables with no state machine: `useClientOrders` (the history collection, one TanStack list query per scope) and `useClientOrder` (the single-order manager, one TanStack item query per `(actor, id)` scope). Every write this module owns is a criteria write against its own list query — the only writes that touch the network delegate to engines this module does not own: paying an order hands it wholesale to the existing payment engine, and cancelling hands the order's contract id to an injectable port. Both composables resolve the client (self) actor only; every `.for()` cell on both scope matrices is `null as never`, so a staff actor or a delegated-entity retarget is a compile-time error, not a runtime guard.

## Data Flow

```text
┌───────────────────┐     ┌────────────────────┐     ┌────────────────────┐
│  Criteria write    │────▶│  TanStack list      │────▶│  GET /invoices      │
│  (filters/sort/    │     │  query (forced      │     │  (client-orders.    │
│  pagination)       │     │  new_contract)       │     │   services.ts)      │
└───────────────────┘     └────────────────────┘     └────────────────────┘
                                     │
                                     ▼
                           ┌────────────────────┐
                           │  Collection context  │  raw rows, pagination,
                           │  / meta / actions    │  the live criteria model
                           └────────────────────┘

┌────────────────────┐     ┌────────────────────┐     ┌────────────────────┐
│  .withId(id)        │────▶│  TanStack item      │────▶│  GET /invoices/{id} │
│                     │     │  query               │     │  (13 relations)     │
└────────────────────┘     └────────────────────┘     └────────────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    ▼                ▼                ▼
          ┌──────────────┐ ┌──────────────────┐ ┌────────────────────┐
          │ mapOrderDetail│ │ GET /products      │ │ GET /brands/{id}/   │
          │ mapOrderItems │ │ (item images,      │ │ gateways (online-   │
          │ (mappers)     │ │  non-blocking)     │ │ gateway count)       │
          └──────────────┘ └──────────────────┘ └────────────────────┘
```

1. **Criteria write** → the list query's own `setCriteria`, always a fresh copy of the live model with the `category.slug` forced leaf re-asserted.
2. **List query settles** → the collection context publishes the raw `IOrder[]` rows unchanged (no `select` mapper — a mapper throw on the list would otherwise hide as a 200 with a zero count).
3. **`.withId(id)` mints the manager's item query** → the context runs `mapOrderDetail` / `mapOrderItems` over the raw record in computed values, and kicks off the two secondary reads (item images, gateway count) reactively off fields the item query resolves.

## Sub-Composables

Both roots follow the standard four-layer scoped-composable shape:

| Sub-composable | Purpose |
| --- | --- |
| `useActions()` | Paging/filtering/sorting (collection); pay/cancel delegates, refresh, readiness (manager). |
| `useContext()` | Computed values: raw rows/record, pagination, the live criteria, the detail/item projections. |
| `useMeta()` | State flags: loading/error/availability, plus the order conditions and gates on the manager. |
| `useInternals()` | Debug: the raw TanStack query, the wire the live criteria builds (collection only). |

Both roots are **armless** — one actor (`client`) resolves for this client-self-only module, so no `.{actor}.ts` sibling exists at any layer.

## Services

There is no per-actor service split — the module resolves `client` only, so `client-orders.services.ts` is a single factory:

| Factory | Reads | Endpoints |
| --- | --- | --- |
| `createClientOrdersServices` | `loadList` | `GET /invoices` |
| `createClientOrderServices` | `loadOne`, `loadItemImages`, `loadOnlineGateways` | `GET /invoices/{id}`, `GET /products`, `GET /brands/{id}/gateways` |

The billing-cycle reference list is read by the `system` module's own lazy singleton query (`useSystem().ensureBillingCycles()`); this module's manager root calls it once per scope and keeps the resolved list in its own ref — it never issues that request itself and never awaits it as part of readiness.

## Dependencies

### client-orders Depends On

| Module | Usage |
| --- | --- |
| `query` | `useQuery().list` / `.query` / `.request`, `useUrl`, `translateQuery`, `invalidateQueryByKey`, `resetQueryByKey` |
| `scope` | `createScopedComposable`, `ScopeActorTypes`, registry `remove` |
| `session-store` | `useActiveSession` — the signed-in client identity and authentication state |
| `brand` | `brandId`, `uiCart`, `getConfigValue` — multi-brand detection, store visibility, storefront address |
| `system` | `useSystem().ensureBillingCycles()` — the billing-cycle reference list |
| `invoices` | `mapInvoice` — the delegated marker and pending-payment condition |
| `contract-product` | `isDue`, `isCancellable` — the due/cancellable judgment this module's order conditions build on |
| `orders` | `useOrder(invoiceId)` — the payment engine `usePayment()` delegates to |

### Modules That Depend On client-orders

None yet — the module is newly delivered and has no consumers in the codebase. The intended consumer is the presentation layer's order-history and single-order pages, which have not been built against it.

## Integration Points

| System | Integration |
| --- | --- |
| **Platform `api/invoices`** | The list read and the single read; every request forces the `new_contract` category on the wire via a schema `const`, never a client-supplied value. |
| **Platform `api/products`** | The item-image read, keyed by each item's linked catalogue product id — never the item's own line id. |
| **Platform `api/brands/{id}/gateways`** | The online-gateway count, read as the response envelope's `total` rather than through the shared `query()`/`list()` primitives (both drop `total`). |
| **Payment engine (`orders` module)** | `usePayment()` runs `useOrder(order.id)` inside the caller's own component setup — the engine binds `onUnmounted` to whatever component is active when it runs, so this delegate must never be memoised at the composable-factory level. |
| **Cancellation port** | `client-orders.ports.ts` holds one module-level registration slot (`provideOrderCancellation`); `cancel()` reads it at call time. A later registration's remover is the only thing that can clear it — an earlier remover is a no-op once superseded. |
| **Cache root** | Every key this module owns lives under the shared `["invoices", ...]` root, since an order is an invoice, so an `invoices`-module invalidation with `exact: false` reaches this module's keys too, and vice versa after a pay or a cancel. |

## Known structural risks

- **The brand-settled latch requires a mutable `stop` binding.** The list query's `enabled` gate is a self-stopping `watch` with `{ immediate: true }`; if that watch's stop handle is a `const` assigned from the `watch()` call itself, the callback can fire synchronously before the assignment completes, and calling the not-yet-assigned `stop()` throws. The fix in this module is a `let stop: () => void = () => {}` pre-declared no-op, reassigned once `watch()` returns — the same shape `client-custom-fields.services.ts` uses.
- **The `system` module's billing-cycle variable is a plain module-level `let`, not a reactive ref.** A computed that resolves before `ensureBillingCycles()` has assigned it keeps `[]` forever, even after the reference list arrives — the manager keeps its own `billingCycles` ref instead of a computed over that module-level variable, precisely to stay reactive to the late resolution.
- **The list has no `select` mapper by design.** A `select` failure inside the query core surfaces as a 200 with an empty/zero-count result rather than an error — publishing the raw rows unmapped removes that failure class entirely for the list; the detail/item projections run afterwards, in the context layer's own computed values, where a thrown error is directly attributable to the projection rather than disguised as an empty list.
