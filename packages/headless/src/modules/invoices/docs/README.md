# Invoices Module

Customer-facing read of a single invoice and the settlement view derived from it.

## What Is This? (ELI5)

An invoice is a frozen bill. This module fetches one bill by id, tidies it into a
customer-facing shape, and works out whether it is paid, free, part-paid, or still
owed. It does not take the payment — the `payment` and `payment-details` modules do.

- **Load** = fetch one invoice by id for the signed-in client.
- **Derive** = read paid / free / partial / pending off the loaded invoice.
- **Refresh / invalidate** = re-read after a payment lands, or drop the cache.

> **🧪 For Testers:** the settlement flags are valid only AFTER `isReady()` resolves — before load, `data` is `[]`. See [gotchas](./gotchas.md).

> **👩‍💻 For Developers:** `useInvoice` is a FLAT composable (no `.as(actor)`); it returns `{ isReady, meta, data, error, refetch, invalidate }` directly.

## Quick Start

```ts
import { useInvoice } from "@upmind-automation/headless";

const invoice = useInvoice("0f1e2d3c-4b5a-6978-8796-a5b4c3d2e1f0");

await invoice.isReady(); // wait for session + fetch to settle

const { isPaid, isPending } = invoice.meta.value;
const summary = invoice.data.value?.summary;
```

See [Usage](./usage.md) for the full API.

## Features

| Feature                          | Status | Notes                                              |
| -------------------------------- | ------ | -------------------------------------------------- |
| Read one invoice                 | ✅     | `GET /invoices/{id}`, mapped to the customer shape |
| Settlement derivation            | ✅     | paid / free / partially paid / pending             |
| Readiness / refresh / invalidate | ✅     | lifecycle helpers                                  |
| Payment submission               | ❌     | owned by `payment` / `payment-details`             |

## Key Concepts

### Frozen snapshot

The embedded client, address, and line items are frozen at conversion, not a live join.

### Settlement view

`meta` derives paid / free / partial / pending from the loaded invoice's payments and summary.

### Guard

The read fires only for an authenticated client with a resolved id; guests are refused.

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

Then open the invoices pages (`playgrounds/labs/src/pages/invoices/` — `Invoices.vue`, `Invoice.vue`).
