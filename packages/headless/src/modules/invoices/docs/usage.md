# Invoices Usage & API

`useInvoice` is a flat composable — it does not use the `.as(actor)` scoped pattern.

## Structure

```typescript
const invoice = useInvoice(invoiceId);

invoice.data; // ComputedRef<Invoice | []> — the mapped invoice ([] before load)
invoice.error; // Ref — the load error, if any
invoice.meta; // ComputedRef — settlement + presentation flags
invoice.isReady(); // Promise<boolean> — resolves once session + fetch settle
invoice.refetch(); // re-read the invoice
invoice.invalidate(); // drop the cached read and re-fetch
```

## Readiness (read this first)

`data` defaults to `[]` until the fetch settles, and `meta` derives from a loaded
invoice. Await `isReady()` before reading `meta` or `data`:

```typescript
const invoice = useInvoice(invoiceId);
const ok = await invoice.isReady();
if (!ok) return; // unauthenticated, or failed to authenticate
```

## Data

```typescript
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

```typescript
const invoice = useInvoice(invoiceId);
await invoice.isReady();
if (invoice.meta.value.isPending) promptPayment();
```

## Refresh & invalidate

```typescript
const invoice = useInvoice(invoiceId);
await invoice.refetch(); // re-read (e.g. after a payment lands)
await invoice.invalidate(); // drop the cache and re-fetch
```

## Mapping a raw record

`mapInvoice(raw)` transforms a raw `IInvoice` into the customer-facing `Invoice`
(also used by the query's `select`):

```typescript
import { mapInvoice } from "..";
const invoice = mapInvoice(rawInvoice);
```

## Vue component integration

```vue
<template>
  <div v-if="meta.isLoading">Loading…</div>
  <div v-else-if="meta.hasError">Could not load this invoice.</div>
  <Receipt v-else-if="meta.isPaid" :invoice="data" />
  <PayPanel
    v-else-if="meta.isPending || meta.isPartiallyPaid"
    :invoice="data"
  />
</template>

<script setup>
const invoice = useInvoice(props.invoiceId);
const { data, meta } = invoice;
await invoice.isReady();
</script>
```
