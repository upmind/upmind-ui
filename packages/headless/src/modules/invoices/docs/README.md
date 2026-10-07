# Invoices Module

Scoped read of a client's invoices — a filterable, sortable, paginated collection (`useInvoices`) and one invoice in full (`useInvoice`) — plus the assigned-method write and the observe-and-refresh half of the payment lifecycle.

## What Is This? (ELI5)

An invoice is a frozen bill. This module reads a client's invoices — the whole list, or one by id — works out whether each is paid, free, part-paid, or still owed, and tells you whether an invoice on a co-mingled list belongs to you, to a sub-account, or to someone who delegated it to you. It also drives paying one invoice down: triggering a pay attempt, retrying a decline, and handling an inline gateway challenge. It does not itself submit the charge or capture the payment method — the `payment` and `payment-details` modules do that, spawned as children of this module's own single-invoice machine.

- **List** = read a filtered, sorted, paginated page of a client's invoices, with the server's total. `useInvoices` — list-only, no write.
- **Read one, and pay it** = fetch one invoice in full by id, trigger/retry payment, handle an inline challenge, download the PDF, and assign/clear the payment method. `useInvoice` — scoped `.as('client' | 'guest' | 'self').withId(id)`.
- **Pay currency** = the brand currency an invoice is paid in. The invoice machine converts the unpaid amount when it changes; the basket plays no part.
- **Count** = "does this client owe anything at all?" and "how many could be consolidated?", each from its own dedicated read.
- **Assign / clear payment method** = the one write `useInvoice` owns.
- **Derive** = payment-progress flags and row attribution off already-loaded data.
- **Refresh / invalidate** = re-read after a payment lands, or drop the cache.

> **🧪 For Testers:** the settlement flags are valid only AFTER `isReady()` resolves — before load, the collection's `data` is `[]` and the single read's `data` is empty. See [gotchas](./gotchas.md).

> **👩‍💻 For Developers:** both composables are SCOPED (`.as(actor)` / `.for(context, id)`), following [ADR-001](../../../../../../docs/adr/001-scope-based-composables.md). `useInvoices()` is the collection; `useInvoice()` is the single read — the same shared services, two separate composables.

## Quick Start

```ts
import {
  InvoicesContextTypes,
  ScopeActorTypes,
  useInvoice,
  useInvoices
} from "@upmind-automation/headless";

declare const clientId: string;
declare const contractId: string;
declare const contractsProductId: string;
declare const invoiceId: string;

// Your own invoices
const invoices = useInvoices().as(ScopeActorTypes.SELF);
await invoices.useActions().isReady();
const { data, total } = invoices.useContext();

// One invoice by id — as the active session (resolves to client or guest)
const invoice = useInvoice().withId(invoiceId);
await invoice.useActions().isReady();
const { model: one } = invoice.useContext();

// Trigger payment, then retry a decline
invoice.useActions().pay();
invoice.useActions().retry();

// An entitled client's invoices (parent account / accepted delegate)
const subAccount = useInvoices()
  .as(ScopeActorTypes.CLIENT)
  .for(InvoicesContextTypes.CLIENT, clientId);

// One contract's invoices
const forContract = useInvoices()
  .as(ScopeActorTypes.CLIENT)
  .for(InvoicesContextTypes.CONTRACT, contractId);

// One contract product's invoices
const forProduct = useInvoices()
  .as(ScopeActorTypes.CLIENT)
  .for(InvoicesContextTypes.CONTRACT_PRODUCT, contractsProductId);

// One parent invoice's credit notes
const forInvoice = useInvoices()
  .as(ScopeActorTypes.CLIENT)
  .for(InvoicesContextTypes.INVOICE, invoiceId);
```

See [Usage](./usage.md) for the full API.

## Features

| Feature                                    | Status | Notes                                                                         |
| ------------------------------------------ | ------ | ----------------------------------------------------------------------------- |
| Read a filtered/sorted/paginated list      | ✅     | `GET /invoices`, declared filters/sort/pagination only                        |
| Read one invoice                           | ✅     | `GET /invoices/{id}`, mapped to the customer shape                            |
| Change the pay currency                    | ✅     | `useInvoice().useActions().setCurrency(code)`; converts via `GET /invoices/unpaid_amount/{id}?currency_code=`; read `model.currencyPayment` / `model.summary` |
| "Does this client owe anything?" count     | ✅     | dedicated existence read, own query, never the visible list                   |
| Consolidatable-invoices count              | ✅     | dedicated count read; coexists with the visible list                          |
| Assign / clear the payment method          | ✅     | `PATCH /invoices/{id}/payment_details`, on `useInvoice`; clearing sends `null` present |
| Trigger / retry payment, inline challenge  | ✅     | `useInvoice().useActions().pay() / .retry() / .renderChallenge()` — spawns `payment` + `payment-details` as machine children |
| Download the invoice (or credit note) PDF  | ✅     | `useInvoice().useActions().downloadPdf()`                                    |
| Credit notes as a filtered view            | ✅     | a criteria preset over the same collection — no separate resource             |
| Co-mingled row attribution                 | ✅     | own / sub-account / delegated, plus settleability                             |
| Reading an entitled client's invoices      | ✅     | `.for('client', id)` — a declared filter column, not a new endpoint           |
| Reading one contract's invoices            | ✅     | `.for('contract', id)` — a declared, read-only filter column                  |
| Reading one contract product's invoices    | ✅     | `.for('contracts_product', id)` — a declared, read-only filter column         |
| Reading one parent invoice's credit notes  | ✅     | `.for('invoice', id)` — a declared, read-only filter column                   |
| Settlement / payment-progress derivation   | ✅     | independent flags — free / complete / partial / pending / payment-due / locked; no single discriminated value |
| Readiness / refresh / invalidate           | ✅     | readiness and refresh on both composables; invalidate on the collection only  |
| `POST /payments` submission itself, and the payment-method picker | ❌ | owned by `payment` / `payment-details`, spawned as children of `useInvoice`'s own machine |
| Consolidation trigger + preferences        | ❌     | out of scope for this module — see [foundation](./foundation.md)              |
| Staff acting for a client                  | ❌     | deprecated for this resource — client-only, both `self` and `client` contexts |

## Key Concepts

### Two composables, two different shapes

`useInvoices` (the collection) is query-backed — no state machine, no write beyond its criteria. `useInvoice` (one invoice) is machine-backed: it loads the invoice AND drives its payment lifecycle, spawning `payment` and `payment-details` as machine children. They do not share a services factory. See [architecture](./architecture.md).

### Client-only on the collection; client-and-guest on the single invoice

The `staff` actor is deprecated for this resource on both composables. On `useInvoices`, the live actor is `client`, in two scopes: reading your own invoices (`.as('self')`), and reading with a context (`.as('client').for(type, id)`). The context names one of four relationships: `client` (an entitled other client's own invoices), `contract` (one contract's invoices), `contracts_product` (one contract product's invoices), or `invoice` (one parent invoice's credit notes). Each is a declared, read-only filter column — never a consumer-settable one — and each survives every published criteria write on the collection (`setCriteria`, `sortBy`, the presets), the same way the `client` retarget always has. On `useInvoice`, `.as('client')` and `.as('guest')` both resolve (and `.as('self')` resolves to whichever the active session is) — a guest checkout can read and pay its own invoice without a client session. `.for()` is a compile-time error on `useInvoice`; one invoice is addressed by `.withId(id)` alone.

### Frozen snapshot

The embedded client, address, and line items are frozen at conversion, not a live join.

### Co-mingled attribution

A row's attribution (own / sub-account / delegated) is computed from the row's own data — a sub-account read needs the reader's own id; a delegated read does not (see [gotchas](./gotchas.md)).

### All request state through one declared model

Filters, sort, and pagination all travel through one declared query model. There is no hand-appended filter string, sort string, or limit/page literal anywhere in this module.

## Documentation

| Doc                               | Audience           | Content                            |
| --------------------------------- | ------------------ | ---------------------------------- |
| **This README**                   | Everyone           | Overview, concepts, quick start    |
| [Usage](./usage.md)               | All devs           | API reference, examples            |
| [Architecture](./architecture.md) | Contributors       | Data flow, sub-units, dependencies |
| [Gotchas](./gotchas.md)           | All                | Edge cases, known issues           |
| [Changelog](./CHANGELOG.md)       | All                | Version history                    |
| [Foundation](./foundation.md)     | Rebuild / external | Framework-neutral spec             |

