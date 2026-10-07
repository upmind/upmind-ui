# Invoices Changelog

All notable changes to the invoices module.

## [Unreleased]

### Added

- Converted the module from a single unscoped read into a full scoped module: a
  filterable/sortable/paginated, query-backed collection (`useInvoices`) and a
  scoped, machine-backed single invoice (`useInvoice`), each with its own services.
- Reading an entitled other client's invoices (`.for('client', id)`) — a parent
  account or an accepted delegate reads a sub-account's or delegator's invoices,
  addressed by the target client's id.
- `useInvoices().useContext().schemas.invoicePicker` — a searchable invoice lookup
  (`{ schema, uischema }`, model `{ invoice?: string | null }`, label key
  `form.invoice_picker`) with its control pre-bound to its own lookup, which lists every invoice the
  scope's client owns (not only credited ones). It finds one invoice by number; it is distinct from `schemas.lookups`,
  the `.for()` retarget picker, and does not narrow the list.
- Three more collection scope contexts, each a declared, read-only filter column
  that is seeded on scope and stays durable across every published criteria write:
  `.for('contract', id)` (`filter[contracts.id]`), `.for('contracts_product', id)`
  (`filter[products.contracts_product_id]`), and `.for('invoice', id)`
  (`filter[credit_invoice_id]`, a parent invoice's credit notes). Generalises the
  seam that already kept the `client` retarget durable so all four scoped columns
  go through the same resolve/seed/durability path.
- Co-mingled row attribution — own / sub-account / delegated, and whether the reader
  may settle a given row.
- Two dedicated count reads: "does this client owe anything at all" and "how many
  invoices could be consolidated" — each from its own query, never disturbing a
  concurrently-visible list.
- Credit notes as a filtered view of the same collection, with a consolidation-first
  label precedence so a consolidation credit note never labels as a plain refund.
- Consolidation identity/credit fields, bundled line-item grouping by originating
  subscription, and a large-bundle flag derived from the server's reported item count.
- The assigned-payment-method write, including clearing the assignment as an
  explicit value rather than an omitted field — lives on `useInvoice`, not the
  collection.
- **The former `orders` module's payment orchestration is merged into `useInvoice`.**
  There is no `orders` module in this codebase any more. `useInvoice` is now
  machine-backed (`invoiceManager`): `useActions().pay()` / `.retry()` trigger and
  retry a payment attempt, `.renderChallenge()` / `.cancelChallenge()` drive an
  inline 3DS challenge, `.downloadPdf()` saves the invoice (or credit note) PDF, and
  `.setCurrency(code)` switches the pay currency and converts the unpaid amount. The machine spawns `payment`'s machine and a `payment-details` picker as
  children rather than re-implementing submission.
- `.as('client')` and `.as('guest')` both resolve on `useInvoice` (and `.as('self')`
  resolves to whichever the active session is) — a guest checkout reads and pays its
  own invoice with no client session.
- Full test suite across both composables: unit (mappers, attribution, settlement)
  and integration (against recorded fixtures), the module `.feature` contract, and a
  fixture generator with recorded, PII-masked fixtures.

### Changed (breaking)

- **The invoice machine owns the pay currency; the basket is out of the pay path.**
  - `useInvoice().useActions().setCurrency()` takes a currency code
    (`setCurrency(code)`), not an object, and returns nothing. It is ignored unless
    `useMeta().hasPaymentCurrencyChoice` is true.
  - `useInvoice().useContext().unpaidAmount` is removed. Read
    `model.summary.unpaidAmountConverted` / `unpaidAmountFormatted` instead.
  - `useInvoice().useInternals().basketCurrency` is removed.
  - `model.currencyPayment` is added: the pay currency, when the invoice has one.
  - `useMeta().isProcessing` is also true while the pay currency converts.
  - `useMeta().hasPaymentCurrencyChoice` and `useMeta().isSettling` are added.
    `isSettling` is true during the post-payment balance re-fetch.
  - A failed conversion sets `useMeta().hasError`, and leaves the invoice unchanged.
  - The payment request sends `currency_code`: the pay currency, else the invoice
    currency.

- `useInvoice(invoiceId)` becomes `useInvoice().withId(invoiceId)` — the single
  invoice is now a scoped, machine-backed composable rather than a flat read. No
  consumer outside this module called the old flat form at the time of this change.
- `invoices.service.ts` is renamed `invoices.services.ts`.
- **`useInvoices().useActions()` loses `assignPaymentMethod()` and
  `refreshAfterPayment()`.** The payment-method write and its refresh move onto
  `useInvoice` (`input()` + `updatePaymentDetails()`) — the collection is list-only.
- `useInvoice().useContext()`'s published invoice key is renamed `model` (was `data`
  on the pre-conversion flat read).

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
import { useInvoice } from "@upmind-automation/headless";

declare const invoiceId: string;

// Before — `useInvoice(invoiceId)` (the pre-conversion call, no longer spellable)

// After
const invoice = useInvoice().withId(invoiceId);
```

`data`, `error`, `isReady()`, `refresh()`/`refetch()`, and `invalidate()` all move
behind `useContext()` / `useActions()` — see [Usage](./usage.md).
