# Invoices Usage & API

`useInvoice` is a flat composable — it does not use the `.as(actor)` scoped pattern.

## Structure

```ts
import { useInvoice } from "@upmind-automation/headless";

const invoiceId = "0f1e2d3c-4b5a-6978-8796-a5b4c3d2e1f0";
const invoice = useInvoice(invoiceId);

invoice.data; // ComputedRef<Invoice> — the mapped invoice (`[]` before load)
invoice.error; // Ref — the load error, if any
invoice.meta; // ComputedRef — settlement + presentation flags
invoice.isReady(); // Promise<boolean> — resolves once session + fetch settle
invoice.refetch(); // re-read the invoice
invoice.invalidate(); // drop the cached read and re-fetch
```

## Readiness (read this first)

`data` defaults to `[]` until the fetch settles, and `meta` derives from a loaded
invoice. Await `isReady()` before reading `meta` or `data`:

```ts
import { useInvoice } from "@upmind-automation/headless";

async function load(invoiceId: string) {
  const invoice = useInvoice(invoiceId);
  const ok = await invoice.isReady();
  if (!ok) return; // unauthenticated, or failed to authenticate
  // …only now are `meta` and `data` safe to read
}
```

## Data

```ts
import { useInvoice } from "@upmind-automation/headless";

const invoiceId = "0f1e2d3c-4b5a-6978-8796-a5b4c3d2e1f0";
const { data } = useInvoice(invoiceId);
// after isReady():
const invoice = data.value; // Invoice
invoice.number; // "CS-INV-02642"
invoice.status; // InvoiceStatus
invoice.summary.paidAmount; // number
invoice.summary.unpaidAmount; // number
invoice.summary.total; // formatted string, e.g. "£4.00"
invoice.payments; // Payment[] — newest first
```

## Meta (settlement + presentation flags)

All `ComputedRef`; read after `isReady()`:

| Flag                                      | Meaning                                             |
| ----------------------------------------- | --------------------------------------------------- |
| `isPaid`                                  | payments exist AND unpaid is zero                   |
| `isFree`                                  | no payments AND unpaid is zero                      |
| `isPartiallyPaid`                         | paid > 0 AND unpaid > 0                             |
| `isPending`                               | no payments AND unpaid > 0 (awaiting first payment) |
| `isAvailable` / `isAuthenticated`         | the session may read the invoice                    |
| `isLoading` / `isFetching` / `isComplete` | fetch lifecycle                                     |
| `isEmpty`                                 | no invoice data                                     |
| `hasError`                                | the load errored                                    |

```ts
import { useInvoice } from "@upmind-automation/headless";

declare function promptPayment(): void;

const invoice = useInvoice("0f1e2d3c-4b5a-6978-8796-a5b4c3d2e1f0");
await invoice.isReady();
if (invoice.meta.value.isPending) promptPayment();
```

## Refresh & invalidate

```ts
import { useInvoice } from "@upmind-automation/headless";

const invoice = useInvoice("0f1e2d3c-4b5a-6978-8796-a5b4c3d2e1f0");
await invoice.refetch(); // re-read (e.g. after a payment lands)
await invoice.invalidate(); // drop the cache and re-fetch
```

## Mapping a raw record

`mapInvoice(raw)` transforms a raw `IInvoice` into the customer-facing `Invoice`
(also used by the query's `select`):

```ts
import { mapInvoice } from "@upmind-automation/headless";
import type { IInvoice } from "@upmind-automation/types";

// the record straight off GET /invoices/{id}
declare const rawInvoice: IInvoice;

const invoice = mapInvoice(rawInvoice);
```

## Vue component integration

```vue
<template>
  <div v-if="meta.isLoading">Loading…</div>
  <div v-else-if="meta.hasError">Could not load this invoice.</div>
  <div v-else-if="meta.isPaid">Paid — {{ data.summary.total }}</div>
  <div v-else-if="meta.isPending || meta.isPartiallyPaid">
    {{ data.summary.unpaidAmountFormatted }} still owed
  </div>
</template>

<script setup lang="ts">
import { useInvoice } from "@upmind-automation/headless";

const props = defineProps<{ invoiceId: string }>();

const invoice = useInvoice(props.invoiceId);
const { data, meta } = invoice;
await invoice.isReady();
</script>
```
