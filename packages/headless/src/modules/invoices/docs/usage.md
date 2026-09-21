# Invoices Usage & API

`useInvoices` (the collection) and `useInvoice` (one invoice) are both SCOPED composables (`.as(actor)` / `.for(context, id)`), sharing one services factory. Neither the `staff` actor nor a `.for()` context is available for `self`. The collection's `client` scope carries four context members: `client` (an entitled other client's own invoices), `contract`, `contracts_product`, and `invoice` (the last three narrow to one relationship's invoices/credit notes). The single read (`useInvoice`) has no context at all — it is marked with `.withId(id)`, and `.for(type, id)` is a compile-time error on it.

## Reading your own invoices — the collection

```ts
import { ScopeActorTypes, useInvoices } from "@upmind-automation/headless";

const invoices = useInvoices().as(ScopeActorTypes.SELF);

const { data, error, findOne, getOne, pagination, query, schemas, total } =
  invoices.useContext();
const {
  consolidatableCount,
  hasError,
  hasUnpaid,
  isAvailable,
  isEmpty,
  isFiltered,
  isLoading
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

```ts
import { ScopeActorTypes, useInvoices } from "@upmind-automation/headless";

async function load() {
  const invoices = useInvoices().as(ScopeActorTypes.SELF);
  const ok = await invoices.useActions().isReady();
  if (!ok) return; // unauthenticated, or the fetch timed out
}
```

### Filtering, sorting, paging

All request state travels through `setCriteria` — there is no raw filter string, sort string, or limit/page literal anywhere in this module:

```ts
import {
  ScopeActorTypes,
  SortDirection,
  useInvoices
} from "@upmind-automation/headless";
import { InvoiceStatus } from "@upmind-automation/types";

const invoices = useInvoices().as(ScopeActorTypes.SELF);

invoices.useActions().setCriteria({
  filters: { "status.code": [InvoiceStatus.UNPAID, InvoiceStatus.OVERDUE] },
  sort: [{ field: "due_date", dir: SortDirection.ASC }],
  pagination: { limit: 25, offset: 0 }
});

invoices.useActions().sortBy([
  { field: "total_amount", dir: SortDirection.DESC }
]);
```

An undeclared filter column or operator does not silently pass through or get dropped — it fails validation, and no request carrying it reaches the wire.

### Credit notes and consolidation, as presets over the same collection

```ts
import { ScopeActorTypes, useInvoices } from "@upmind-automation/headless";

const invoices = useInvoices().as(ScopeActorTypes.SELF);

// Read this client's credit notes
invoices.useActions().filterCreditNotes();

// Narrow the visible list to consolidatable invoices
invoices.useActions().filterConsolidatable();

// The notice/CTA count reads independently — it never mutates the list above
const { consolidatableCount } = invoices.useMeta();
```

### Does this client owe anything at all?

```typescript
import { ScopeActorTypes, useInvoices } from "@upmind-automation/headless";

declare function showDunningBanner(): void;

const invoices = useInvoices().as(ScopeActorTypes.SELF);

const { hasUnpaid } = invoices.useMeta();
// Reading `hasUnpaid` is what triggers its own dedicated request — a scope
// that never reads it never issues that request.
if (hasUnpaid.value) showDunningBanner();
```

### The list's total

```typescript
import { ScopeActorTypes, useInvoices } from "@upmind-automation/headless";

const invoices = useInvoices().as(ScopeActorTypes.SELF);

const { total, pagination } = invoices.useContext();
// `total` is this scope's server-reported row total for the CURRENT
// published criteria — not the consolidation-notice count.
```

## Reading one invoice in full

```typescript
import { useInvoice } from "@upmind-automation/headless";

declare const invoiceId: string;

const invoice = useInvoice().withId(invoiceId);

const { data, error, unpaidAmount } = invoice.useContext();
const {
  isPaid,
  isFree,
  isPartiallyPaid,
  isPending,
  isLocked,
  isSettleable,
  paymentState,
  isLoading,
  isComplete,
  hasError,
  isAvailable
} = invoice.useMeta();
const { isReady, refresh, invalidate, destroy, refreshUnpaidAmount } =
  invoice.useActions();
```

```typescript
import { useInvoice } from "@upmind-automation/headless";

declare const invoiceId: string;

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
import { useInvoice } from "@upmind-automation/headless";

declare const invoiceId: string;
declare const currencyId: string;

const invoice = useInvoice().withId(invoiceId);
const { unpaidAmount } = invoice.useContext();

await invoice.useActions().refreshUnpaidAmount(); // on demand
await invoice.useActions().refreshUnpaidAmount(currencyId); // on a currency change — issues a fresh request
```

### Payment state (one discriminated value)

| Value      | Meaning                                                                  |
| ---------- | ------------------------------------------------------------------------ |
| `complete` | payments exist and unpaid is zero                                        |
| `free`     | no payments and unpaid is zero                                           |
| `partial`  | some has been paid, some is still owed                                   |
| `pending`  | nothing settled yet, but something is owed or an attempt exists          |
| `failed`   | the load itself failed — never a guessed state standing in for a failure |

```typescript
import { useInvoice } from "@upmind-automation/headless";

declare const invoiceId: string;
declare function promptPayment(): void;

const invoice = useInvoice().withId(invoiceId);
await invoice.useActions().isReady();
if (invoice.useMeta().paymentState.value === "pending") promptPayment();
```

## Reading an entitled client's invoices

A parent account or an accepted delegate reads another client's invoices the same way, retargeted:

```typescript
import {
  InvoicesContextTypes,
  ScopeActorTypes,
  useInvoice,
  useInvoices
} from "@upmind-automation/headless";

declare const clientId: string;
declare const invoiceId: string;

const subAccount = useInvoices()
  .as(ScopeActorTypes.CLIENT)
  .for(InvoicesContextTypes.CLIENT, clientId);
await subAccount.useActions().isReady();

const { data } = subAccount.useContext();
data.value.forEach(invoice => {
  if (invoice.attribution.isDelegated) return; // not this reader's to settle
  // ...
});

// The single read needs no retarget — it is marked by record id alone
// (`.for()` is a compile-time error on it):
const theirInvoice = useInvoice().withId(invoiceId);
```

The retarget survives every published criteria write on the collection (`setCriteria`, `sortBy`, `filterConsolidatable`, `filterCreditNotes`) — none of them can silently widen the list back to the reader's own invoices.

## Scoping the collection to a relationship

Three more `.for()` contexts narrow the collection to one relationship's invoices, each a declared, read-only filter column:

```typescript
import {
  InvoicesContextTypes,
  ScopeActorTypes,
  useInvoices
} from "@upmind-automation/headless";

declare const contractId: string;
declare const contractsProductId: string;
declare const parentInvoiceId: string;

// One contract's invoices — filter[contracts.id]
const forContract = useInvoices()
  .as(ScopeActorTypes.CLIENT)
  .for(InvoicesContextTypes.CONTRACT, contractId);

// One contract product's invoices — filter[products.contracts_product_id]
const forProduct = useInvoices()
  .as(ScopeActorTypes.CLIENT)
  .for(InvoicesContextTypes.CONTRACT_PRODUCT, contractsProductId);

// One parent invoice's credit notes — filter[credit_invoice_id]
const forParent = useInvoices()
  .as(ScopeActorTypes.CLIENT)
  .for(InvoicesContextTypes.INVOICE, parentInvoiceId);
await forParent.useActions().isReady();
```

Each context's id is seeded onto its own filter column when the scope mints, and stays durable across every published criteria write — including `filterCreditNotes()`, whose own preset carries no relationship id. A `.for('contract', id)` scope that then calls `filterCreditNotes()` still keeps `contracts.id` on the next request. The column is declared `readOnly` in the query schema — it is not drawn as a filter-bar control — because it is the scope's own context slot, not a free filter a caller picks.

## Assigning the payment method

```typescript
import { ScopeActorTypes, useInvoices } from "@upmind-automation/headless";

declare const invoiceId: string;
declare const paymentDetailsId: string;

const invoices = useInvoices().as(ScopeActorTypes.SELF);

await invoices.useActions().assignPaymentMethod(invoiceId, paymentDetailsId);
await invoices.useActions().assignPaymentMethod(invoiceId, null); // clear — sends null, not an omitted field
```

Invalidates the shared invoices cache key on success, so both the list and the single read pick up the change.

## Refresh & invalidate

```ts
import {
  ScopeActorTypes,
  useInvoice,
  useInvoices
} from "@upmind-automation/headless";

declare const invoiceId: string;

const invoices = useInvoices().as(ScopeActorTypes.SELF);
await invoices.useActions().refresh(); // re-read the list
await invoices.useActions().refreshAfterPayment(); // the payment-outcome refetch
await invoices.useActions().invalidate(); // drop the cache and re-fetch

const invoice = useInvoice().withId(invoiceId);
await invoice.useActions().refresh();
await invoice.useActions().invalidate();
```

## Mapping a raw record

`mapInvoice(raw, readingClientId?)` and `mapInvoices(raw, readingClientId?)` are curated re-exports (also used by the query's own `select`). `readingClientId` drives the co-mingled row attribution — a call with no second argument (as `orders/order.machine.ts` makes) still resolves a correct delegated signal, but a conservative (never "mine") sub-account signal:

```ts
import { mapInvoice } from "@upmind-automation/headless";
import type { IInvoice } from "@upmind-automation/types";

// the record straight off GET /invoices/{id}
declare const rawInvoice: IInvoice;
declare const readingClientId: string;

const invoice = mapInvoice(rawInvoice, readingClientId);
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

const invoice = useInvoice().withId(props.invoiceId);
const { data } = invoice.useContext();
const meta = invoice.useMeta();
await invoice.useActions().isReady();
</script>
```
