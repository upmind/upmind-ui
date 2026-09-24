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

### Quick search

`query` is a sibling of `filters` on the one query model, not a filter leaf — set it through `setCriteria`, not `filterBy`. A term under three characters fails the query model's own validation.

```typescript
setCriteria({ query: "widget" }); // minimum 3 characters
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
const { isReady, onDone, refresh, stop, destroy } = product.useActions();

await isReady();  // resolves once the product is placed on `available` or `unavailable`
await onDone();    // resolves once an in-flight write settles: true on available/unavailable, false on error or a timeout
refresh();         // re-reads the product
stop();            // stops the machine, keeps the registry entry
destroy();          // stops the machine and deregisters it
```

### Writes

Every write that touches the product record is available two ways: as a **direct call** (opens the form, feeds it a model, submits — all in one), or as the raw **form flow** (`open*` → `set` → `submit*`) for a consumer building an actual form UI that needs the form's schema/uischema before the client has decided anything.

#### Cancellation — one combined form, three options

```typescript
const {
  openCancellation,
  set,
  cancelForm,
  submitCancellation,
  stopRenewing,
  resumeRenewing,
  requestCancellation,
  withdrawCancellation,
  scheduleCancellation,
  revokeScheduledCancellation
} = product.useActions();

// Direct calls — subscription products only, refused (event has no effect) otherwise
await stopRenewing({ reason: "too expensive" });          // soft: end of term
await resumeRenewing();                                    // undo a pending soft cancel
await requestCancellation({ reason: "no longer needed" }); // hard: immediate, needs staff review
await withdrawCancellation();                               // withdraw a pending hard request
await scheduleCancellation({ futureCancellationDate: "2026-10-21", reason: "downsizing" }); // must be a valid anniversary
await revokeScheduledCancellation();                        // undo a booked scheduled cancellation

// The raw form flow — same three options, driven through the ONE form
openCancellation();
const { cancellation } = product.useContext(); // { schema, uischema, model }
set(ContractProductFormTypes.CANCELLATION, { option: ContractProductCancelOption.SOFT, reason: "too expensive" });
await submitCancellation(); // routes off model.option to the matching write
cancelForm(ContractProductFormTypes.CANCELLATION); // closes without submitting
```

`submitCancellation()` reads `cancellation.model.option` and sends the matching event — an unset or unrecognised option resolves `false` with nothing sent. Which options `cancellation.schema` actually lists is computed from the product's own record facts (see gotchas.md); a caller renders whichever ones are present, never a fixed three.

#### Consolidation — its own form

```typescript
const { openConsolidation, set, cancelForm, submitConsolidation, setConsolidation } = product.useActions();

// Direct call
await setConsolidation({ invoiceConsolidationEnabled: InvoiceConsolidationTypes.ENABLED });

// Raw form flow
openConsolidation();
set(ContractProductFormTypes.CONSOLIDATION, { invoiceConsolidationEnabled: InvoiceConsolidationTypes.ENABLED });
await submitConsolidation();
cancelForm(ContractProductFormTypes.CONSOLIDATION);
```

Every write resolves the re-read `ContractProduct`, or `false` when the machine refused the event outright (e.g. a subscription-only write sent on a one-time product, or a form opened when the record does not currently allow it). This is distinct from a write that reaches the server and fails, or whose re-read fails, or a submitted model that fails validation: any of those **rejects** the promise with a `DetailedError` — an invalid model rejects with a 422 carrying the AJV errors, before any request is sent:

```typescript
try {
  const result = await stopRenewing();
  if (result === false) {
    // refused: not a subscription, the form isn't currently offered, or another write already in flight
  }
} catch (error) {
  // the model failed validation, or the write (or its re-read) reached the server and failed
}
```

An open form never moves the product off its current status node — a client can be mid-cancellation-form on a product still reporting `isActive`, right up until the write actually settles.

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
| `isProcessing` | A write is in flight |
| `isSubscription` | `billingCycleMonths > 0` |
| `canCancel` | Platform-reported cancellable (the hard-cancellation record fact) |
| `canRequestCancellation` | May open a HARD (immediate) cancellation request: no hard request already pending, none scheduled |
| `canRequestEndOfTerm` | May open a SOFT (end-of-term) cancellation: as above, plus the contract is not pending |
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
  query,       // this scope's active request state (filters/quick search/sort/pagination)
  schemas      // the query schema family ({ query: { schema, uischema, sortUischema } })
} = products.useContext();
```

### `useContractProduct().useContext()`

```typescript
const {
  context,                  // the full machine context object
  contractId,                // the contract this product belongs to
  contractProduct,           // ComputedRef<ContractProduct | undefined> — the mapped view model
  id,                        // the product this manager acts on
  cancellation,              // the open cancellation form: { schema, uischema, model } | undefined
  consolidation,             // the open consolidation form: { schema, uischema, model } | undefined
  description,               // ComputedRef<string | undefined> — the product's description, off the raw wire record
  error,                     // ComputedRef<ResponseError | undefined>
  errors,                    // ComputedRef<ResponseError["message"] | undefined> — the machine-captured error message
  lookups,                   // reference data the machine's `load` service resolved (the CANCEL_REQUEST custom fields)
  minFutureCancellationDate, // instance-bound earliest selectable date, or null
  rawContractProduct,        // the raw wire record beside the view model
  scheduledActions,          // ComputedRef<ScheduledAction[]> — [] until the read carries them (see hasFetchedScheduledActions)
  title,                     // ComputedRef<string | undefined> — the product's display title
  validationErrors           // ErrorObject[] — field-level validation errors (AJV), read, never raised
} = product.useContext();
```

`cancellation` and `consolidation` are `undefined` until their `open*` action runs; each becomes `{ schema, uischema, model }` for the lifetime of that form and clears again on `cancelForm()` or on a successful submit (which re-reads the product and returns to `#loading`).

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
    <button :disabled="!isSubscription || isProcessing" @click="stopRenewing()">
      Stop renewing
    </button>
  </div>
</template>

<script setup>
const product = useContractProduct().as("client").withId(props.id);
const { contractProduct, error } = product.useContext();
const { isLoading, isProcessing, isSubscription, hasError } = product.useMeta();
const { stopRenewing } = product.useActions();
</script>
```
