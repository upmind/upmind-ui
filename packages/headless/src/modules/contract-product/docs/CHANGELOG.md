# contract-product Changelog

All notable changes to the contract-product module.

## [Unreleased]

### Added

- Initial module: `useContractProducts` (client's own contract-products collection, filter/sort/pagination, grouped counts, purchased-category read, delegated-product inclusion) and `useContractProduct` (per-product manager backed by `contract-product.machine.ts` — stop/resume renewal, invoice-consolidation preference, scheduled/future-dated cancellation booking and revocation, unpaid-invoice due/cancellable predicates, future-cancellation anniversary date maths).
- Full documentation set: `foundation.md`, `README.md`, `usage.md`, `architecture.md`, `gotchas.md` (this changelog).

---

## Migration Guide

### From v1.x to v2.x

> _No migrations yet — this is the module's first documented release._
