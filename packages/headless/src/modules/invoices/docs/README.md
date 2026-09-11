# Invoices Module

Scoped read of a client's invoices — a filterable, sortable, paginated collection (`useInvoices`) and one invoice in full (`useInvoice`) — plus the assigned-method write and the observe-and-refresh half of the payment lifecycle.

## What Is This? (ELI5)

An invoice is a frozen bill. This module reads a client's invoices — the whole list, or one by id — works out whether each is paid, free, part-paid, or still owed, and tells you whether an invoice on a co-mingled list belongs to you, to a sub-account, or to someone who delegated it to you. It does not take the payment — the `payment` and `payment-details` modules do.

- **List** = read a filtered, sorted, paginated page of a client's invoices, with the server's total.
- **Read one** = fetch one invoice in full by id.
- **Re-read unpaid amount** = a live, on-demand re-check of what's still owed on one invoice.
- **Count** = "does this client owe anything at all?" and "how many could be consolidated?", each from its own dedicated read.
- **Assign / clear payment method** = the one write this module owns.
- **Derive** = payment state, payment surface, and row attribution off already-loaded data.
- **Refresh / invalidate** = re-read after a payment lands, or drop the cache.

> **🧪 For Testers:** the settlement flags are valid only AFTER `isReady()` resolves — before load, the collection's `data` is `[]` and the single read's `data` is empty. See [gotchas](./gotchas.md).

> **👩‍💻 For Developers:** both composables are SCOPED (`.as(actor)` / `.for(context, id)`), following [ADR-001](../../../../../../docs/adr/001-scope-based-composables.md). `useInvoices()` is the collection; `useInvoice()` is the single read — the same shared services, two separate composables.

## Quick Start

```ts
import { useInvoices } from "@upmind-automation/headless";

// Your own invoices
const invoices = useInvoices().as("self");
await invoices.useActions().isReady();
const { data, total } = invoices.useContext();

// One invoice by id
const invoice = useInvoice().withId(invoiceId);
await invoice.useActions().isReady();
const { data: one } = invoice.useContext();

// An entitled client's invoices (parent account / accepted delegate)
const subAccount = useInvoices().as("client").for("client", clientId);
```

See [Usage](./usage.md) for the full API.

## Features

| Feature                                | Status | Notes                                                                         |
| -------------------------------------- | ------ | ----------------------------------------------------------------------------- |
| Read a filtered/sorted/paginated list  | ✅     | `GET /invoices`, declared filters/sort/pagination only                        |
| Read one invoice                       | ✅     | `GET /invoices/{id}`, mapped to the customer shape                            |
| Re-read the live unpaid amount         | ✅     | `GET /invoices/unpaid_amount/{id}`, re-reads on currency change               |
| "Does this client owe anything?" count | ✅     | dedicated existence read, own query, never the visible list                   |
| Consolidatable-invoices count          | ✅     | dedicated count read; coexists with the visible list                          |
| Assign / clear the payment method      | ✅     | `PATCH /invoices/{id}/payment_details`; clearing sends `null` present         |
| Credit notes as a filtered view        | ✅     | a criteria preset over the same collection — no separate resource             |
| Co-mingled row attribution             | ✅     | own / sub-account / delegated, plus settleability                             |
| Reading an entitled client's invoices  | ✅     | `.for('client', id)` — a declared filter column, not a new endpoint           |
| Settlement / payment-state derivation  | ✅     | fully paid / free / partially paid / pending / failed-to-resolve              |
| Readiness / refresh / invalidate       | ✅     | lifecycle helpers on both composables                                         |
| Payment submission                     | ❌     | owned by `payment` / `payment-details`                                        |
| Consolidation trigger + preferences    | ❌     | out of scope for this module — see [foundation](./foundation.md)              |
| Staff acting for a client              | ❌     | deprecated for this resource — client-only, both `self` and `client` contexts |

## Key Concepts

### Two composables, one services factory

`useInvoices` (the collection) and `useInvoice` (the single read) share one services factory so the two can never disagree about whose invoices are being read or how a target client is resolved. See [architecture](./architecture.md).

### Client-only, both contexts

The `staff` actor is deprecated for this resource. Both live cells are `client` — reading your own invoices (`self`), and reading an entitled other client's (`client`, via `.for('client', id)`).

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

## Playground

A runnable demo lives in the labs playground:

```bash
cd playgrounds/labs
pnpm dev
```

Then open the invoices pages (`playgrounds/labs/src/pages/invoices/` — `Invoices.vue`, `Invoice.vue`). Neither page has yet been updated to drive the scoped collection/single-read surface this module now exposes (the list page reads session state directly; the detail page reads through `orders`), and `labs-nuxt` has no invoices scenario page at all — this module's capabilities are proven at the request-contract level in its own test suite rather than through a driveable page today.
