# client-orders Changelog

All notable changes to the client-orders module.

## [Unreleased]

### Added

- `useClientOrders` — the client's own order-history collection: list, page, sort, quick-search and filter a signed-in client's own placed (`new_contract`) orders.
- `useClientOrder` — the single-order manager: read one placed order in full (detail, items, status conditions), including the catalogue-image and online-gateway secondary reads.
- The pay delegate (`usePayment(paymentDetail)`), delegating wholesale to the platform's payment engine — the manager injects its own `orderId`; the caller supplies the chosen `paymentDetail`. Completion is watched off the engine's own `meta.hasPaid`.
- The cancel delegate (`cancel()`), delegating through an injectable cancellation port — no live flow is connected to the port yet.
- The six order-condition predicates (`isOverdue`, `isPaid`, `isCancelled`, `isPartiallyPaid`, `canPay`, `canCancel`), exported from the module barrel for reuse by other capabilities that read a placed order or a basket.
- `useActions().setCriteria` on the history — a raw-intent `filters` / `sort` / `pagination` write applied in one call, branch by branch, alongside the named per-filter setters. A `filters` intent replaces the whole branch and re-asserts the forced category leaf on its own copy.
- `useMeta().isFiltered` on the history — true while any filter other than the forced category leaf currently applies.
- One shared services factory behind both composables (`scopeActor`/`scopeContext` in, the list read plus the single-order read and its two secondary reads out), so the history and the single-order manager address the same client identity through one seam.
- The browser-driven playground pages for both composables, proven reachable member-by-member by hand.
- The full documentation set: foundation, README, usage, architecture, gotchas.

### Known gaps (tracked, not yet closed)

- The completed-payment stale-mark on `usePayment()` is proven structurally (the invalidation call is wired and delegation is genuine) but has not yet been proven end-to-end against a real completed payment on a live environment.
- On the playground page, the filter-bar status control's write is dropped by a form-renderer defect outside this module — see [gotchas.md](./gotchas.md). The module's own data layer is proven correct against the wire independently of this gap.

---

## Migration Guide

### From v1.x to v2.x

> _No migrations yet — this section will be populated when breaking changes occur._
