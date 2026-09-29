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
  filterCreditNotes
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

## Reading and paying one invoice — `useInvoice`

`useInvoice` is a scoped, machine-backed composable. Every actor call resolves the invoice through `.withId(id)`, never through a `.for()` context — `.for()` is a compile-time error on this composable, since one invoice has no relationship slots to retarget. `.as('client')` and `.as('guest')` both resolve, and `.as('self')` resolves to whichever of the two the active session is; there is no `staff` arm.

```typescript
import { ScopeActorTypes, useInvoice } from "@upmind-automation/headless";

declare const invoiceId: string;

// As the active session (resolves to client or guest)
const invoice = useInvoice().withId(invoiceId);

// Explicitly as a guest checkout
const guestInvoice = useInvoice().as(ScopeActorTypes.GUEST).withId(invoiceId);

const { model, error, unpaidAmount } = invoice.useContext();
const {
  hasError,
  isAuthenticated,
  isAvailable,
  isComplete,
  isFree,
  isLoading,
  isLocked,
  isPartial,
  isPaymentDue,
  isPending,
  isProcessing,
  needsApproval,
  isRenderingChallenge,
  isUnavailable
} = invoice.useMeta();
const {
  cancelChallenge,
  destroy,
  downloadPdf,
  input,
  isReady,
  pay,
  refresh,
  renderChallenge,
  retry,
  setCurrency,
  updatePaymentDetails
} = invoice.useActions();
```

```typescript
import { useInvoice } from "@upmind-automation/headless";

declare const invoiceId: string;

const invoice = useInvoice().withId(invoiceId);
await invoice.useActions().isReady();

const { model } = invoice.useContext();
model.value?.number; // "QA-INV-23286"
model.value?.status; // InvoiceStatus
model.value?.summary.paidAmount; // number
model.value?.summary.unpaidAmount; // number
model.value?.summary.balance; // may diverge from unpaidAmount post-consolidation
model.value?.payments; // Payment[] — newest first
model.value?.attribution; // { isOwn, isChildOfClient, isDelegated, isSettleable }
```

> **🧪 For Testers:** `useContext().model` is the published render key for the mapped invoice — there is no `data` member on this composable's context. Do not port an assertion written against `useInvoices()`'s `data` onto `useInvoice()` without renaming it.

### Paying, retrying, and inline challenges

```typescript
import { ScopeActorTypes, useInvoice } from "@upmind-automation/headless";

declare const invoiceId: string;
declare const container: HTMLElement;

const invoice = useInvoice().withId(invoiceId);
await invoice.useActions().isReady();

invoice.useActions().pay(); // triggers the pay flow

// If a declined attempt sets `hasError`, retry with the same staged inputs:
invoice.useActions().retry();

// An inline (non-redirect) 3DS challenge:
if (invoice.useMeta().needsApproval.value) {
  invoice.useActions().renderChallenge(container);
}
if (invoice.useMeta().isRenderingChallenge.value) {
  invoice.useActions().cancelChallenge();
}
```

`pay()` and `retry()` send events into this invoice's own machine; neither this module nor its consumer calls `POST /payments` directly — the machine spawns the platform's `payment` module to submit and observe the attempt, and hands an inline challenge (when the gateway needs one) to the same child. `paymentDetails` supplies the payment-method picker the machine spawns alongside it.

### Assigning or clearing the payment method

```typescript
import { useInvoice } from "@upmind-automation/headless";

declare const invoiceId: string;
declare const paymentDetailsId: string;

const invoice = useInvoice().withId(invoiceId);

invoice.useActions().input({ payment_details_id: paymentDetailsId });
await invoice.useActions().updatePaymentDetails();

invoice.useActions().input({ payment_details_id: null }); // clear — sends null
await invoice.useActions().updatePaymentDetails();
```

`input()` stages the model; `updatePaymentDetails()` saves the staged model (`PATCH /invoices/{id}/payment_details`) and re-reads the invoice. This write lives on `useInvoice`, not on the collection — `useInvoices` is list-only.

### Downloading the PDF

```typescript
import { useInvoice } from "@upmind-automation/headless";

declare const invoiceId: string;

const invoice = useInvoice().withId(invoiceId);
await invoice.useActions().isReady();
await invoice.useActions().downloadPdf(); // saves locally as `${number}.pdf`
```

A credit note is read through the same downloader — there is no separate credit-note PDF endpoint.

### Switching the pay currency

```typescript
import { useInvoice } from "@upmind-automation/headless";
import { ISO_4217_CURRENCY_CODE } from "@upmind-automation/types";

declare const invoiceId: string;

const invoice = useInvoice().withId(invoiceId);

// Pass the target currency by code (or by id).
await invoice.useActions().setCurrency({ code: ISO_4217_CURRENCY_CODE.EUR }); // re-reads unpaidAmount in the new currency
```

### Re-reading the live unpaid amount

`unpaidAmount` re-reads automatically when `setCurrency()` saves a currency change; there is no separate `refreshUnpaidAmount()` action on this composable.

```typescript
import { useInvoice } from "@upmind-automation/headless";

declare const invoiceId: string;

const invoice = useInvoice().withId(invoiceId);
const { unpaidAmount } = invoice.useContext();
```

### Single-invoice meta flags

| Flag                    | True when                                                                |
| ------------------------ | ------------------------------------------------------------------------ |
| `hasError`               | An error or a failed attempt sits on an available invoice                |
| `isAuthenticated`        | The reading session is authenticated                                     |
| `isAvailable`            | The invoice has loaded and the pay flow is active                        |
| `isComplete`             | The pay flow has completed — paid in full or free                        |
| `isFree`                 | No payments recorded and nothing owed                                    |
| `isLoading`              | The invoice is still loading                                             |
| `isLocked`               | The invoice cannot accept a new payment method                           |
| `isPartial`              | Some, but not all, of the invoice has been paid                          |
| `isPaymentDue`           | Payment is due and nothing is settled or pending                         |
| `isPending`               | A payment is in flight, awaiting settlement                              |
| `isProcessing`           | A payment or refresh is currently processing                             |
| `needsApproval`          | An inline 3DS challenge is awaiting the customer                         |
| `isRenderingChallenge`   | An inline challenge is rendering into its container                      |
| `isUnavailable`          | The invoice could not be loaded                                          |

There is no single discriminated `paymentState` value on this composable — branch on the individual flags above (`isFree` / `isComplete` / `isPartial` / `isPending` / `isPaymentDue`) rather than reconstructing one.

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

The collection has no payment-method write — `useInvoices` is list-only. Assign or clear an invoice's payment method on `useInvoice` with `input()` and `updatePaymentDetails()`; see [Assigning or clearing the payment method](#assigning-or-clearing-the-payment-method).

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
await invoices.useActions().invalidate(); // mark the cache stale; the next read re-fetches

const invoice = useInvoice().withId(invoiceId);
await invoice.useActions().refresh(); // re-read this one invoice
```

## Mapping a raw record

`mapInvoice(raw, readingClientId?)` and `mapInvoices(raw, readingClientId?)` are curated re-exports (also used by the query's own `select`). `readingClientId` drives the co-mingled row attribution — a call with no second argument (as this module's own `invoice.machine.ts` makes when it loads a single invoice) still resolves a correct delegated signal, but a conservative (never "mine") sub-account signal:

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
  <div v-else-if="meta.isComplete">Paid — {{ model?.summary.total }}</div>
  <div v-else-if="meta.isPending || meta.isPartial">
    {{ model?.summary.unpaidAmountFormatted }} still owed
  </div>
</template>

<script setup lang="ts">
import { useInvoice } from "@upmind-automation/headless";

const props = defineProps<{ invoiceId: string }>();

const invoice = useInvoice().withId(props.invoiceId);
const { model } = invoice.useContext();
const meta = invoice.useMeta();
await invoice.useActions().isReady();
</script>
```
