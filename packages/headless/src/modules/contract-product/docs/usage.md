# contract-product Usage & API

## Composable Structure

```typescript
const products = useContractProducts().as("client");
const product = useContractProduct().as("client").withId(id);

// Sub-composables (both composables)
const context = products.useContext();   // reactive query / computed values
const meta = products.useMeta();         // state flags
const actions = products.useActions();   // methods
```

## `useContractProducts` — the collection

### Reading & lifecycle

```typescript
const { isReady, refresh } = products.useActions();

await isReady();   // resolves once the first fetch has settled; false if the session settles unaddressable
await refresh();   // forces a re-read; throws NotAuthenticatedError when unaddressable
```

### Filtering, sorting & paging

```typescript
const { filterBy, sortBy, setCriteria, nextPage, prevPage } = products.useActions();

filterBy({ "status.code": ContractStatusCodes.ACTIVE });
sortBy([{ field: "next_due_date", dir: SortDirection.ASC }]);
setCriteria({ pagination: { limit: 20 } });

await nextPage();
await prevPage();
```

### Extra reads

```typescript
const { loadGroupedCounts, loadPurchasedCategories } = products.useActions();

const groups = await loadGroupedCounts();          // dashboard counts by category/service
const categories = await loadPurchasedCategories(); // categories the client has bought into
```

### Utility

```typescript
const { destroy } = products.useActions();

destroy(); // deregisters the scope instance and stops the delegated-preference reader
```

## `useContractProduct` — the manager

### Lifecycle

```typescript
const { isReady, refresh, stop, destroy } = product.useActions();

await isReady();  // resolves once the product is placed on `available` or `unavailable`
refresh();         // re-reads the product
stop();            // stops the machine, keeps the registry entry
destroy();          // stops the machine and deregisters it
```

### Writes

```typescript
const {
  stopRenewing,
  resumeRenewing,
  setConsolidation,
  scheduleCancellation,
  revokeScheduledCancellation
} = product.useActions();

// Subscription products only — refused (event has no effect) otherwise
await stopRenewing({ reason: "too expensive" });
await resumeRenewing();
await setConsolidation({ invoiceConsolidationEnabled: InvoiceConsolidationTypes.ENABLED });

// Any status; the date must be a valid future anniversary
await scheduleCancellation({ futureCancellationDate: "2026-10-21", reason: "downsizing" });
await revokeScheduledCancellation();
```

Every write resolves the re-read `ContractProduct`, or `false` when the machine refused the event outright (e.g. a subscription-only write sent on a one-time product). This is distinct from a write that reaches the server and fails, or whose re-read fails: either of those **rejects** the promise with a `DetailedError`, for the caller to catch and render:

```typescript
try {
  const result = await stopRenewing();
  if (result === false) {
    // refused: not a subscription, or another write already in flight
  }
} catch (error) {
  // the write (or its re-read) reached the server and failed
}
```

## Meta (State Flags)

All return Vue `ComputedRef<boolean>`.

### `useContractProducts().useMeta()`

| Flag | Description |
|------|-------------|
| `isAvailable` | This scope can currently address a client |
| `isLoading` | The list is loading or has not completed its first fetch |
| `isEmpty` | The list's data is empty (no items have been loaded at all, not merely "this page") |
| `isFiltered` | Any filter is applied |
| `hasPages` | Pagination applies to this list |
| `hasError` | The list query or its criteria failed |

### `useContractProduct().useMeta()`

| Flag | Description |
|------|-------------|
| `isLoading` | Subscribing or reading |
| `isAvailable` | Placed on any `available` node |
| `isActive` / `isPending` / `isInactive` / `isSuspended` / `isExpiring` / `isCancelling` | Which published status node |
| `isStaged` / `isCancelled` / `isLapsed` / `isFraud` | Which unavailable node |
| `isOnTrial` / `isOnTerminatingTrial` | Trial region |
| `isSetupIncomplete` | Setup region |
| `isSubmitting` | A write is in flight |
| `isSubscription` | `billingCycleMonths > 0` |
| `canCancel` | Platform-reported cancellable |
| `canScheduleFutureCancellation` | Not cancelling, not pending, none booked, an anniversary exists |
| `hasScheduledFutureCancellation` | A future cancellation is booked |
| `hasAutoRenewDisabled` | `autoCreateRenewInvoice` is false |
| `hasUnpaidRecurringInvoices` / `isDue` / `isCancellable` | Unpaid-invoice facts |
| `hasMoved` | Product moved to another contract product |
| `isDelegatedAccess` | Delegated to this client |
| `isImported` | Product was imported |
| `hasFetchedScheduledActions` | The read carried the `scheduled_actions` include |
| `hasError` | The machine captured an error |
| `isEmpty` | No product loaded |

## Context (Computed Values)

### `useContractProducts().useContext()`

```typescript
const {
  data,        // ComputedRef<ContractProduct[]> — always an array
  error,       // ComputedRef<ResponseError | undefined>
  findOne,     // finds a single product by a partial mapping
  getOne,      // finds a single product by id
  pagination,  // reactive pagination descriptor
  query,       // this scope's active request state (filters/sort/pagination)
  schemas      // the query schema family ({ query: { schema, uischema, sortUischema } })
} = products.useContext();
```

### `useContractProduct().useContext()`

```typescript
const {
  context,                  // the full machine context object
  contractId,                // the contract this product belongs to
  contractProduct,           // ComputedRef<ContractProduct | undefined> — the mapped view model
  contractProductId,         // the product this manager acts on
  error,                     // ComputedRef<ResponseError | undefined>
  minFutureCancellationDate, // instance-bound earliest selectable date, or null
  rawContractProduct,        // the raw wire record beside the view model
  scheduledActions           // ComputedRef<ScheduledAction[]> — [] until the read carries them (see hasFetchedScheduledActions)
} = product.useContext();
```

## Future-cancellation date helpers

Pure functions, not tied to a loaded instance — import from the package root:

```typescript
import {
  minFutureCancellationDate,
  isSelectableFutureCancellationDate,
  anniversaryCycleForDate
} from "@upmind-automation/headless";

const earliest = minFutureCancellationDate(contractProduct);
const valid = isSelectableFutureCancellationDate(contractProduct, pickedDate);
```

A loaded manager instance also exposes its own instance-bound `minFutureCancellationDate`, computed off the loaded product — no import or manual argument needed:

```typescript
const { minFutureCancellationDate } = product.useContext();
```

## Unpaid-invoice predicates

```typescript
import { isDue, isCancellable } from "@upmind-automation/headless";

contractProduct.unpaidRecurringInvoices.filter(isDue);
contractProduct.unpaidRecurringInvoices.filter(isCancellable);
```

## Vue Component Integration

```vue
<template>
  <div v-if="isLoading">Loading...</div>
  <div v-else-if="hasError">{{ error?.message }}</div>
  <div v-else>
    <button :disabled="!isSubscription || isSubmitting" @click="stopRenewing()">
      Stop renewing
    </button>
  </div>
</template>

<script setup>
const product = useContractProduct().as("client").withId(props.id);
const { contractProduct, error } = product.useContext();
const { isLoading, isSubmitting, isSubscription, hasError } = product.useMeta();
const { stopRenewing } = product.useActions();
</script>
```
