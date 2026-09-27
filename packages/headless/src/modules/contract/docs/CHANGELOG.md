# contract Changelog

All notable changes to the contract module.

## [Unreleased]

### Added

- Initial module: `useContracts` (client's own contract collection, pagination only) and `useContract` (per-contract manager backed by `contract.machine.ts` — the one write this module keeps, changing which stored payment method pays the contract's future invoices).
- Full documentation set: `foundation.md`, `README.md`, `usage.md`, `architecture.md`, `gotchas.md` (this changelog).

### Design notes

- **Every cancellation write (soft, hard, and scheduled) lives on the sibling `contract-product` module, not here.** A contract only groups the ids of the products it holds; changing what happens to one product is addressed at that product directly. The contract manager keeps exactly one write: the payment-method form.
- **The payment-method form is a parallel region of BOTH `available` and `unavailable`** (guarded to exclude `fraud` on the latter), so opening it never moves the contract off its current status node, and it stays reachable on a cancelled or lapsed contract.
- **The contracts list is pagination-only.** No filter, no sort — every client screen that narrows or orders a client's holdings does so on the sibling `useContractProducts` collection instead.
- **The single-contract read omits every product's cancellation facts.** `contract.products` carries each product's status, catalogue product, tags and brand currency, never its pending-request or scheduled-cancellation state — a caller needing those loads that one product directly through `useContractProduct`.

---

## Migration Guide

> _No migrations yet — this is the module's first documented release._
