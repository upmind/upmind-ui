# client-orders Changelog

All notable changes to the client-orders module.

## [Unreleased]

### Added

- `useClientOrders` — the client's own order-history collection: list, page, sort, quick-search and filter a signed-in client's own placed (`new_contract`) orders.
- `useClientOrder` — the single-order manager: read one placed order in full (detail, items, status conditions), including the catalogue-image and online-gateway secondary reads.
- The pay delegate (`usePayment()`), delegating wholesale to the existing payment engine.
- The cancel delegate (`cancel()`), delegating through an injectable cancellation port — no live flow is connected to the port yet.
- The six order-condition predicates (`isOverdue`, `isPaid`, `isCancelled`, `isPartiallyPaid`, `canPay`, `canCancel`), exported from the module barrel for reuse by other capabilities that read a placed order or a basket.
- The full documentation set: foundation, README, usage, architecture, gotchas.

### Known gaps (tracked, not yet closed)

- The completed-payment stale-mark on `usePayment()` is proven structurally (the invalidation call is wired and delegation is genuine) but has not yet been proven end-to-end against a real completed payment on a live environment.
- The browser-driven playground page and its end-to-end proof are a separate, not-yet-landed lane — the scoped composables do not yet have a driven page to exercise them by hand.

---

## Migration Guide

### From v1.x to v2.x

> _No migrations yet — this section will be populated when breaking changes occur._
