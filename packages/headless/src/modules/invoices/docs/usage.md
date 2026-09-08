# Invoices Usage & API

`useInvoices` (the collection) and `useInvoice` (one invoice) are both SCOPED composables (`.as(actor)` / `.for(context, id)`), sharing one services factory. Neither the `staff` actor nor a `.for()` retarget is available for `self` — the two live scopes are `self` and an entitled other `client`.

## Reading your own invoices — the collection

```typescript
const invoices = useInvoices().as('self');

const { data, error, findOne, getOne, pagination, query, schemas, total } =
  invoices.useContext();
const {
  consolidatableCount, hasError, hasUnpaid, isAvailable, isEmpty, isFiltered, isLoading
} = invoices.useMeta();
const {
  isReady,
  refresh,
  invalidate,
  destroy,
  setCriteria,
  sortBy,
  filterConsolidatable,
  filterCreditNotes,
  assignPaymentMethod,
  refreshAfterPayment
} = invoices.useActions();
```

### Readiness (read this first)

`data` defaults to `[]` until the first fetch settles. Await `isReady()` before branching on it:

```typescript
const invoices = useInvoices().as('self');
const ok = await invoices.useActions().isReady();
if (!ok) return; // unauthenticated, or the fetch timed out
```

### Filtering, sorting, paging

All request state travels through `setCriteria` — there is no raw filter string, sort string, or limit/page literal anywhere in this module:

```typescript
invoices.useActions().setCriteria({
  filters: { "status.code": { in: ["invoice_unpaid", "invoice_overdue"] } },
  sort: [{ field: "due_date", dir: "asc" }],
  pagination: { limit: 25, offset: 0 }
});

invoices.useActions().sortBy("total_amount", "desc");
```

An undeclared filter column or operator does not silently pass through or get dropped — it fails validation, and no request carrying it reaches the wire.

### Credit notes and consolidation, as presets over the same collection

```typescript
// Read this client's credit notes
invoices.useActions().filterCreditNotes();

// Narrow the visible list to consolidatable invoices
invoices.useActions().filterConsolidatable();

// The notice/CTA count reads independently — it never mutates the list above
const { consolidatableCount } = invoices.useMeta();
```

### Does this client owe anything at all?

```typescript
const { hasUnpaid } = invoices.useMeta();
// Reading `hasUnpaid` is what triggers its own dedicated request — a scope
// that never reads it never issues that request.
if (hasUnpaid.value) showDunningBanner();
```

### The list's total

```typescript
const { total, pagination } = invoices.useContext();
// `total` is this scope's server-reported row total for the CURRENT
// published criteria — not the consolidation-notice count.
```

## Reading one invoice in full

```typescript
const invoice = useInvoice().withId(invoiceId);

const { data, error, unpaidAmount } = invoice.useContext();
const {
  isPaid, isFree, isPartiallyPaid, isPending, isLocked, isSettleable,
  paymentState, isLoading, isComplete, hasError, isAvailable
} = invoice.useMeta();
const { isReady, refresh, invalidate, destroy, refreshUnpaidAmount } = invoice.useActions();
```

```typescript
const invoice = useInvoice().withId(invoiceId);
await invoice.useActions().isReady();

const { data } = invoice.useContext();
data.value.number; // "QA-INV-23286"
data.value.status; // InvoiceStatus
data.value.summary.paidAmount; // number
data.value.summary.unpaidAmount; // number
data.value.summary.balance; // may diverge from unpaidAmount post-consolidation
data.value.payments; // Payment[] — newest first
data.value.attribution; // { isOwn, isChildOfClient, isDelegated, isSettleable }
```

### Re-reading the live unpaid amount

```typescript
const invoice = useInvoice().withId(invoiceId);
const { unpaidAmount } = invoice.useContext();

await invoice.useActions().refreshUnpaidAmount(); // on demand
await invoice.useActions().refreshUnpaidAmount(currencyId); // on a currency change — issues a fresh request
```

### Payment state (one discriminated value)

| Value | Meaning |
| --- | --- |
| `complete` | payments exist and unpaid is zero |
| `free` | no payments and unpaid is zero |
| `partial` | some has been paid, some is still owed |
| `pending` | nothing settled yet, but something is owed or an attempt exists |
| `failed` | the load itself failed — never a guessed state standing in for a failure |

```typescript
const invoice = useInvoice().withId(invoiceId);
await invoice.useActions().isReady();
if (invoice.useMeta().paymentState.value === "pending") promptPayment();
```

## Reading an entitled client's invoices

A parent account or an accepted delegate reads another client's invoices the same way, retargeted:

```typescript
const subAccount = useInvoices().as('client').for('client', clientId);
await subAccount.useActions().isReady();

const { data } = subAccount.useContext();
data.value.forEach(invoice => {
  if (invoice.attribution.isDelegated) return; // not this reader's to settle
  // ...
});

// The single read retargets the same way:
const theirInvoice = useInvoice().as('client').for('client', clientId).withId(invoiceId);
```

The retarget survives every published criteria write on the collection (`setCriteria`, `sortBy`, `filterConsolidatable`, `filterCreditNotes`) — none of them can silently widen the list back to the reader's own invoices.

## Assigning the payment method

```typescript
const invoices = useInvoices().as('self');

await invoices.useActions().assignPaymentMethod(invoiceId, paymentDetailsId);
await invoices.useActions().assignPaymentMethod(invoiceId, null); // clear — sends null, not an omitted field
```

Invalidates the shared invoices cache key on success, so both the list and the single read pick up the change.

## Refresh & invalidate

```typescript
const invoices = useInvoices().as('self');
await invoices.useActions().refresh(); // re-read the list
await invoices.useActions().refreshAfterPayment(); // the payment-outcome refetch
await invoices.useActions().invalidate(); // drop the cache and re-fetch

const invoice = useInvoice().withId(invoiceId);
await invoice.useActions().refresh();
await invoice.useActions().invalidate();
```

## Mapping a raw record

`mapInvoice(raw, readingClientId?)` and `mapInvoices(raw, readingClientId?)` are curated re-exports (also used by the query's own `select`). `readingClientId` drives the co-mingled row attribution — a call with no second argument (as `orders/order.machine.ts` makes) still resolves a correct delegated signal, but a conservative (never "mine") sub-account signal:

```typescript
import { mapInvoice } from "..";
const invoice = mapInvoice(rawInvoice, readingClientId);
```

## Vue component integration

```vue
<template>
  <div v-if="meta.isLoading">Loading…</div>
  <div v-else-if="meta.hasError">Could not load this invoice.</div>
  <Receipt v-else-if="meta.isPaid" :invoice="data" />
  <PayPanel v-else-if="meta.isPending || meta.isPartiallyPaid" :invoice="data" />
</template>

<script setup>
const invoice = useInvoice().withId(props.invoiceId);
const { data } = invoice.useContext();
const meta = invoice.useMeta();
await invoice.useActions().isReady();
</script>
```
