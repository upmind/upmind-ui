# orders Usage & API

Two scoped composables share this module: `useOrders` (the history — a list) and `useOrder` (one order, addressed by id). Both are client-only — neither accepts a staff actor, and neither accepts a `.for(client, id)` retarget. Every read is against the signed-in client's own identity.

## The history — `useOrders`

```ts
import { ScopeActorTypes, useOrders } from "@upmind-automation/headless";

const orders = useOrders().as(ScopeActorTypes.SELF);

const { data, error, findOne, getOne, pagination, query, schemas } =
  orders.useContext();
const {
  hasError,
  hasNextPage,
  hasPages,
  hasPrevPage,
  isAvailable,
  isEmpty,
  isFiltered,
  isLoading,
  isMultibrand,
  showStore,
  storefrontUrl
} = orders.useMeta();
const {
  destroy,
  filters,
  filterBy,
  invalidate,
  isReady,
  nextPage,
  prevPage,
  refresh,
  reset,
  setPage,
  setLimit,
  setCriteria,
  sort,
  sortBy
} = orders.useActions();
```

### Readiness (read this first)

`data` defaults to `[]` until the first read settles. Await `isReady()` before branching on the list:

```ts
import { ScopeActorTypes, useOrders } from "@upmind-automation/headless";

const orders = useOrders().as(ScopeActorTypes.SELF);
await orders.useActions().isReady(); // always settles — never hangs
```

### Filtering

Each named setter composes a fresh copy of the live filters and writes it back — it never mutates the live model in place:

```ts
import { ScopeActorTypes, useOrders } from "@upmind-automation/headless";

const orders = useOrders().as(ScopeActorTypes.SELF);
const { filters } = orders.useActions();

// Narrow to unpaid orders (one choice, two underlying statuses under the hood).
filters.status(["invoice_unpaid,invoice_adjusted"]);

// A total-amount comparison.
filters.total(50, "gte");

// Quick search — debounced, matches the exact order number.
filters.query("QA-INV-25144");

// Clear a filter by passing no value.
filters.status(undefined);
```

### Setting several criteria in one write

`setCriteria` applies a `filters` / `sort` / `pagination` intent as one write, branch by branch — a `filters` intent you pass **replaces** the whole filters branch, the same way the named setters above do, and re-asserts the forced `category.slug` leaf on the copy it writes:

```ts
import { ScopeActorTypes, useOrders } from "@upmind-automation/headless";

const orders = useOrders().as(ScopeActorTypes.SELF);
const { setCriteria } = orders.useActions();

setCriteria({
  filters: { total_amount: { gte: 50 } },
  sort: [{ field: "total_amount", dir: "desc" }]
});
```

### Paging and sorting

```ts
import {
  OrdersSortableColumn,
  ScopeActorTypes,
  SortDirection,
  useOrders
} from "@upmind-automation/headless";

const orders = useOrders().as(ScopeActorTypes.SELF);
const { nextPage, prevPage, setPage, setLimit, sort } = orders.useActions();

setPage(2);
setLimit(25); // returns to page one
nextPage();
prevPage();
sort(OrdersSortableColumn.TOTAL_AMOUNT, SortDirection.DESC);
```

### Rendering a row

`data` publishes the raw order record — the same shape documented in the invoices module's own foundation doc, narrowed to placed orders:

```vue
<template>
  <div v-if="isLoading">Loading…</div>
  <div v-else-if="hasError">Something went wrong.</div>
  <ul v-else>
    <li v-for="order in data" :key="order.id">
      {{ order.number }} — {{ order.total_amount_formatted }}
    </li>
  </ul>
</template>

<script setup lang="ts">
import { ScopeActorTypes, useOrders } from "@upmind-automation/headless";

const orders = useOrders().as(ScopeActorTypes.SELF);
const { data } = orders.useContext();
const { hasError, isLoading } = orders.useMeta();
</script>
```

## One order — `useOrder`

```ts
import { ScopeActorTypes, useOrder } from "@upmind-automation/headless";

declare const orderId: string;
const order = useOrder().as(ScopeActorTypes.SELF).withId(orderId);

const { contractId, data, detail, error, products } = order.useContext();
const {
  canCancel,
  canPay,
  hasError,
  hasOnlineGateways,
  hasPendingPayment,
  isAvailable,
  isCancellable,
  isCancelled,
  isComplete,
  isDelegated,
  isDue,
  isEmpty,
  isLoading,
  isOverdue,
  isPaid,
  isPartiallyPaid,
  isPayable,
  isProcessing
} = order.useMeta();
const { cancel, destroy, invalidate, isReady, refresh, usePayment } =
  order.useActions();
// usePayment(paymentDetail) — call inside the caller's own component setup.
```

### Reading the detail and the items

```ts
import { ScopeActorTypes, useOrder } from "@upmind-automation/headless";

declare const orderId: string;
const order = useOrder().as(ScopeActorTypes.SELF).withId(orderId);
const { detail, products } = order.useContext();

// `detail` is the projected field set (number, status, totals, dates, …).
// `products` is the item list — snapshot-first, each entry carrying its
// term, price, tags, sub-items and (once resolved) catalogue image.
```

### Paying

`usePayment(paymentDetail)` must be called inside the caller's own component setup — it binds to that component's lifecycle, the same way the underlying payment engine always has. The manager supplies its own `orderId`; the caller passes the `paymentDetail` the customer chose:

```vue
<script setup lang="ts">
import { ScopeActorTypes, useOrder } from "@upmind-automation/headless";
import type { PaymentDetailData } from "@upmind-automation/headless";

const props = defineProps<{
  orderId: string;
  paymentDetail: PaymentDetailData;
}>();
const order = useOrder().as(ScopeActorTypes.SELF).withId(props.orderId);
const { canPay } = order.useMeta();

// Call usePayment(paymentDetail) only while canPay is true, and only in THIS
// component's own setup — never memoised or hoisted elsewhere.
const payment = order.useActions().usePayment(props.paymentDetail);
const { meta, pay } = payment;

// meta.hasPaid turns true once the payment completes.
</script>
```

### Cancelling

```ts
import { ScopeActorTypes, useOrder } from "@upmind-automation/headless";

declare const orderId: string;
const order = useOrder().as(ScopeActorTypes.SELF).withId(orderId);
const { cancel } = order.useActions();

try {
  await cancel();
} catch (error) {
  // OrderCancellationUnavailableError — nothing has connected to the
  // cancellation port yet. canCancel being true does not guarantee a
  // connected flow.
}
```

## Meta (state flags)

All return Vue `ComputedRef`:

| Flag | Surface | Description |
| --- | --- | --- |
| `isLoading` | both | The read has not completed its first fetch, or is still loading. |
| `hasError` | both | The read failed. |
| `isAvailable` | both | This scope can address the signed-in client. |
| `isEmpty` | history: no rows / order: no record resolved | |
| `isFiltered` | history | True while any filter other than the forced `category.slug` leaf applies. |
| `hasNextPage` / `hasPrevPage` / `hasPages` | history | Pagination state. |
| `isMultibrand` | history | Whether the deployment spans more than one brand. |
| `showStore` / `storefrontUrl` | history | Store call-to-action visibility + target. |
| `isDue` / `isPayable` | order | Alias pair — the order is due and something is still owed. |
| `isCancellable` | order | The order is due and in a status the client may act on. |
| `isOverdue` / `isPaid` / `isCancelled` / `isPartiallyPaid` | order | The order status conditions. |
| `canPay` / `canCancel` | order | The two action gates. |
| `hasPendingPayment` | order | A payment on this order is still pending. |
| `isDelegated` | order | This order belongs to someone else who delegated it. |
| `hasOnlineGateways` | order | The order's brand offers an online gateway. |
| `isProcessing` | order | A `cancel()` call that reached the port is in flight. |

## Context (computed values)

| Value | Surface | Type | Description |
| --- | --- | --- | --- |
| `data` | history | `IOrder[]` | The current page's raw order rows. |
| `pagination` | history | — | Reactive pagination descriptor. |
| `query` | history | — | The live criteria model — read-only; write through `useActions()`. |
| `schemas.query` | history | — | The criteria schema plus its filter-bar and sort UI schemas. |
| `data` | order | `IOrder \| undefined` | The raw order record. |
| `detail` | order | `OrderDetail` | The projected detail fields. |
| `products` | order | `OrderItem[]` | The projected item list. |
| `contractId` | order | `string \| undefined` | The order's contract id — `cancel()`'s argument. |
| `error` | both | — | The scope's captured failure, read-only. |

## Lifecycle

```ts
import { ScopeActorTypes, useOrders } from "@upmind-automation/headless";

const orders = useOrders().as(ScopeActorTypes.SELF);

// Wait for the first read to settle. Always settles.
await orders.useActions().isReady();

// Re-issue the read against the server.
await orders.useActions().refresh();

// Mark the cached read stale so the next read goes back to the server.
orders.useActions().invalidate();

// Clean up when the consuming component unmounts.
orders.useActions().destroy();
```

## Vue Component Integration

```vue
<template>
  <div v-if="isLoading">Loading…</div>
  <div v-else-if="hasError">{{ error?.message }}</div>
  <div v-else>
    <button :disabled="!canPay" @click="pay">Pay</button>
    <button :disabled="!canCancel || isProcessing" @click="cancel">
      Cancel
    </button>
  </div>
</template>

<script setup lang="ts">
import { ScopeActorTypes, useOrder } from "@upmind-automation/headless";

const props = defineProps<{ orderId: string }>();
const order = useOrder().as(ScopeActorTypes.SELF).withId(props.orderId);
const { error } = order.useContext();
const { canCancel, canPay, hasError, isLoading, isProcessing } =
  order.useMeta();
const { cancel } = order.useActions();
const { pay } = order.useActions().usePayment();
</script>
```
