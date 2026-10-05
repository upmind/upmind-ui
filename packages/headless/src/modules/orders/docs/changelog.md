# orders Changelog

All notable changes to the orders module.

## [Unreleased]

### Changed

- Renamed the module from `client-orders` to `orders`. The folder is now `packages/headless/src/modules/orders/`; the composables `useClientOrders` and `useClientOrder` are now `useOrders` and `useOrder`; every export drops the `Client` prefix (for example `ClientOrdersSortableColumn` is now `OrdersSortableColumn`, `ClientOrderDetail` is now `OrderDetail`, `ClientOrderItem` is now `OrderItem`); the services factory is `createOrdersServices`. The registry key is `orders`, the playground routes are `/useOrders` and `/useOrder/:id`, and the playground i18n keys are `form.orders_*`, `labs.orders_*` and `labs.order_*`. Behaviour is unchanged.

### Fixed

- The status filter on the playground history now sends its request: the filter-bar status control writes a `status.code` equality leaf (`filter[status.code|eq]=invoice_paid`). The headless integration test for dotted filter operators proves the request on the wire; the playground page itself has no automated browser proof.
- The history list no longer renders a Delegated column, which crashed the table's header model and rendered zero rows. The delegated marker remains on the single-order view as `meta.isDelegated`.

### Added

- `useOrders` — the client's own order-history collection: list, page, sort, quick-search and filter a signed-in client's own placed (`new_contract`) orders.
- `useOrder` — the single-order manager: read one placed order in full (detail, items, status conditions), including the catalogue-image and online-gateway secondary reads.
- The pay delegate (`usePayment(paymentDetail)`), delegating wholesale to the platform's payment engine — the manager injects its own `orderId`; the caller supplies the chosen `paymentDetail`. Completion is watched off the engine's own `meta.hasPaid`.
- The cancel delegate (`cancel()`), delegating through an injectable cancellation port — no live flow is connected to the port yet.
- The six order-condition predicates (`isOverdue`, `isPaid`, `isCancelled`, `isPartiallyPaid`, `canPay`, `canCancel`), exported from the module barrel for reuse by other capabilities that read a placed order or a basket.
- `useActions().setCriteria` on the history — a raw-intent `filters` / `sort` / `pagination` write applied in one call, branch by branch, alongside the named per-filter setters. A `filters` intent replaces the whole branch and re-asserts the forced category leaf on its own copy.
- `useMeta().isFiltered` on the history — true while any filter other than the forced category leaf currently applies.
- One shared services factory behind both composables (`scopeActor`/`scopeContext` in, the list read plus the single-order read and its two secondary reads out), so the history and the single-order manager address the same client identity through one seam.
- The playground pages for both composables (manual demo surface; no automated browser proof): `/useOrders` renders on the shared playground renderer (the same surface as `/useInvoices`), and `/useOrder/:id` is a self-drawn order view. The history list has no Delegated column; the delegated marker is the order view's `meta.isDelegated`.
- The full documentation set: foundation, README, usage, architecture, gotchas.

### Known gaps (tracked, not yet closed)

- The completed-payment stale-mark on `usePayment()` is proven structurally (the invalidation call is wired and delegation is genuine) but has not yet been proven end-to-end against a real completed payment on a live environment.

---

## Migration Guide

### From v1.x to v2.x

> _No migrations yet — this section will be populated when breaking changes occur._
