# contract-product Usage & API

## Composable Structure

```typescript
const products = useContractProducts().as("client");
const product = useContractProduct().as("client").for("contract-product", id);

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

Every write resolves the re-read `ContractProduct`, or `false` when the machine refused the event outright (e.g. a subscription-only write sent on a one-time product).

## Meta (State Flags)

All return Vue `ComputedRef<boolean>`.

### `useContractProducts().useMeta()`

| Flag | Description |
|------|-------------|
| `isAvailable` | This scope can currently address a client |
| `isLoading` | The list is loading or has not completed its first fetch |
| `isEmpty` | The current page has no items |
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

```typescript
const { data, error, schemas } = products.useContext();       // collection: list data, error, query-schema family
const { contractProduct, error } = product.useContext();      // manager: mapped view model, error
```

## Future-cancellation date helpers

Pure functions, not tied to a loaded instance — import from the module barrel:

```typescript
import {
  minFutureCancellationDate,
  isSelectableFutureCancellationDate,
  anniversaryCycleForDate
} from "@upmind-automation/headless/modules/contract-product";

const earliest = minFutureCancellationDate(contractProduct);
const valid = isSelectableFutureCancellationDate(contractProduct, pickedDate);
```

## Unpaid-invoice predicates

```typescript
import { isDue, isCancellable } from "@upmind-automation/headless/modules/contract-product";

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
const product = useContractProduct().as("client").for("contract-product", props.id);
const { contractProduct, error } = product.useContext();
const { isLoading, isSubmitting, isSubscription, hasError } = product.useMeta();
const { stopRenewing } = product.useActions();
</script>
```
