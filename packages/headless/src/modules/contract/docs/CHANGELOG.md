# contract Changelog

All notable changes to the contract module.

## [Unreleased]

### Changed

- **The settled read places the status node directly.** The load's completion is one ordered list of guarded transitions over the record it returned; a record with no known status lands on `error`.
- **The payment-method form is offered only for a subscription the client owns** — never a one-off contract, never a contract holding a product delegated to the client. Each `products[]` stub now carries `isDelegatedObject`.
- **Paging forward keeps the split total**, and the count read waits on the list's own addressability check.

### Added

- Initial module: `useContracts` (client's own contract collection, filterable, sortable and pageable) and `useContract` (per-contract manager backed by `contract.machine.ts` — the one write this module keeps, changing which stored payment method pays the contract's future invoices).
- `useContracts` ships a full criteria query schema — filters on name, status code, and the `created_at` / `next_due_date` date ranges; sort on created_at, next_due_date, total_amount and status; and pagination — plus a contracts-picker schema/uischema pair for the no-id manager case.
- Full documentation set: `foundation.md`, `README.md`, `usage.md`, `architecture.md`, `gotchas.md`, and this changelog.

### Design notes

- **Every cancellation write (soft, hard, and scheduled) lives on the sibling `contract-product` module, not here.** A contract only groups the ids of the products it holds; changing what happens to one product is addressed at that product directly. The contract manager keeps exactly one write: the payment-method form.
- **The payment-method form is a parallel region of BOTH `available` and `unavailable`** (guarded to exclude `fraud` on the latter), so opening it never moves the contract off its current status node, and it stays reachable on a cancelled or lapsed contract.
- **The contracts list carries the full criteria surface** — filters, sort and pagination, in one query model, exactly like every other collection in this codebase.
- **The single-contract read carries each product as a list-row stub, not a full record.** `contract.products` is an id, the product's own `name`, and its catalogue product's `name` — nothing else, and never its status, tags, brand currency, or cancellation state — a caller needing any of that loads that one product directly through `useContractProduct`.

---

## Migration Guide

> _No migrations yet — this is the module's first documented release._
