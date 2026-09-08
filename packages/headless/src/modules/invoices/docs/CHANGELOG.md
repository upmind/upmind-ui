# Invoices Changelog

All notable changes to the invoices module.

## [Unreleased]

### Added

- Full test suite: unit (mappers, settlement/readiness surface) and integration
  (`useInvoice` against recorded fixtures), plus the module `.feature` contract and a
  fixture generator with recorded, PII-masked fixtures. Function coverage 100%.

### Fixed

- `invalidate()` was a silent no-op: it invalidated the query key
  `[["invoices"], { invoiceId }]` (double-nested) while the query registers under
  `["invoices", { invoiceId }]`, so it matched no query even with `exact: false`. The
  key now spreads `service.queryKey`, so `invalidate()` drops the cache and the next
  read re-fetches. (FE-3130)

---

## Migration Guide

> _No migrations yet — this section will be populated when breaking changes occur._
