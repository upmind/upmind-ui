# Invoices Changelog

All notable changes to the invoices module.

## [Unreleased]

### Added

- Converted the module from a single unscoped read into a full scoped, query-backed
  module: a filterable/sortable/paginated collection (`useInvoices`) and a scoped
  single read (`useInvoice`), sharing one services factory.
- Reading an entitled other client's invoices (`.for('client', id)`) — a parent
  account or an accepted delegate reads a sub-account's or delegator's invoices,
  addressed by the target client's id.
- Co-mingled row attribution — own / sub-account / delegated, and whether the reader
  may settle a given row.
- A live, on-demand re-read of one invoice's unpaid amount, independent of the full
  invoice load, re-issued on a currency change.
- Two dedicated count reads: "does this client owe anything at all" and "how many
  invoices could be consolidated" — each from its own query, never disturbing a
  concurrently-visible list.
- Credit notes as a filtered view of the same collection, with a consolidation-first
  label precedence so a consolidation credit note never labels as a plain refund.
- Consolidation identity/credit fields, bundled line-item grouping by originating
  subscription, and a large-bundle flag derived from the server's reported item count.
- The assigned-payment-method write, including clearing the assignment as an
  explicit value rather than an omitted field.
- A discriminated overall payment state (`complete` / `free` / `partial` / `pending`
  / `failed`) replacing four booleans that could previously disagree with each other.
- Full test suite across both composables: unit (mappers, attribution, settlement)
  and integration (against recorded fixtures), the module `.feature` contract, and a
  fixture generator with recorded, PII-masked fixtures.

### Changed (breaking)

- `useInvoice(invoiceId)` becomes `useInvoice().withId(invoiceId)` — the single read
  is now a scoped composable. No consumer outside this module called the old flat
  form at the time of this change.
- `invoices.service.ts` is renamed `invoices.services.ts`.

### Fixed

- `invalidate()` was a silent no-op: it invalidated the query key
  `[["invoices"], { invoiceId }]` (double-nested) while the query registers under
  `["invoices", { invoiceId }]`, so it matched no query even with `exact: false`. The
  key now spreads the shared base query key, so `invalidate()` drops the cache and
  the next read re-fetches. (FE-3130)
- The detail read's relation set omitted `address`, so the mapped address was always
  `undefined` despite the mapper already reading it. The relation is now requested.

---

## Migration Guide

### `useInvoice(invoiceId)` → `useInvoice().withId(invoiceId)`

The single-invoice read is now a scoped composable, matching the collection's shape:

```typescript
// Before
const invoice = useInvoice(invoiceId);

// After
const invoice = useInvoice().withId(invoiceId);
```

`data`, `error`, `isReady()`, `refresh()`/`refetch()`, and `invalidate()` all move
behind `useContext()` / `useActions()` — see [Usage](./usage.md).
