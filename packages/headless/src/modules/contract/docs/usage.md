# contract Usage & API

## Composable Structure

```typescript
const contracts = useContracts().as("client");
const contract = useContract().as("client").for("contract", contractId);

// Sub-composables (both composables)
const context = contracts.useContext();   // reactive query / computed values
const meta = contracts.useMeta();         // state flags
const actions = contracts.useActions();   // methods
```

## `useContracts` — the collection

### Reading & lifecycle

```typescript
const { isReady, refresh } = contracts.useActions();

await isReady();   // resolves once the first fetch has settled; false if the session settles unaddressable
await refresh();   // forces a re-read; throws NotAuthenticatedError when unaddressable
```

### Paging

```typescript
const { setCriteria, nextPage, prevPage } = contracts.useActions();

setCriteria({ pagination: { limit: 20 } });
await nextPage();
await prevPage();
```

There is no `filterBy`/`sortBy` on this collection — its query schema declares pagination only. A client narrowing or ordering their holdings does so on the sibling `useContractProducts` collection instead.

### Utility

```typescript
const { destroy } = contracts.useActions();

destroy(); // deregisters the scope instance
```

## `useContract` — the manager

### Lifecycle

```typescript
const { isReady, refresh, stop, destroy } = contract.useActions();

await isReady();  // resolves once the contract is placed on `available` or `unavailable`
refresh();        // re-reads the contract
stop();           // stops the machine, keeps the registry entry
destroy();        // stops the machine and deregisters it
```

### The payment-method write

Available two ways: a direct call (opens the form, feeds it a model, submits — all in one), or the raw form flow for a consumer building an actual form UI.

```typescript
const { openPaymentMethod, input, clear, update, setPaymentMethod, onDone } = contract.useActions();

// Direct call
const result = await setPaymentMethod({ paymentDetailsId: storedCardId });

// Raw form flow
openPaymentMethod();
const { paymentMethod } = contract.useContext(); // { schema, uischema, model }
input({ paymentDetailsId: storedCardId }); // debounced; feeds and validates the model against the form's schema
await update();
clear(); // closes without submitting

// Waiting for a write to settle
await onDone(); // resolves once a submitted write leaves processing; false if the machine stops first
```

`update()` (and therefore `setPaymentMethod()`, which calls it) resolves `false` — sending nothing — when the model names no method, or names the method the contract already uses. This is a deliberate no-op, not a failure:

```typescript
try {
  const result = await setPaymentMethod({ paymentDetailsId: alreadyInUseId });
  if (result === false) {
    // nothing changed, so nothing was sent — not an error
  }
} catch (error) {
  // the model failed validation, or the write (or its re-read) reached the server and failed
}
```

The form is offered on every `available` status node and, unlike every other capability this module or its sibling exposes, on `unavailable.cancelled` and `unavailable.lapsed` too — refused only on `unavailable.fraud`. An open form never moves the contract off its current status node.

## Meta (State Flags)

All return Vue `ComputedRef<boolean>`.

### `useContracts().useMeta()`

| Flag | Description |
|------|-------------|
| `isAvailable` | This scope can currently address a client |
| `isLoading` | The list is loading or has not completed its first fetch |
| `isEmpty` | This scope has no contracts |
| `hasPages` / `hasNextPage` / `hasPrevPage` | Pagination facts for the current page |
| `hasError` | The list query or its criteria failed |

### `useContract().useMeta()`

| Flag | Description |
|------|-------------|
| `isLoading` | Waiting for the session or reading the contract; `false` once a read has failed |
| `isAvailable` | Placed on any `available` node |
| `isPending` / `isInactive` / `isActive` / `isSuspended` / `isCancelling` | Which published status node |
| `isCancelled` / `isLapsed` / `isFraud` | Which unavailable node |
| `isProcessing` | The payment-method write is being processed, from either parent (`available` or `unavailable`) |
| `isValid` | The open payment-method form passes validation, from either parent |
| `hasError` | The machine captured an error |

## Context (Computed Values)

### `useContracts().useContext()`

```typescript
const {
  data,        // ComputedRef<Contract[]> — always an array
  error,       // ComputedRef<ResponseError | undefined>
  findOne,     // finds a single contract by a partial mapping
  getOne,      // finds a single contract by id
  pagination,  // reactive pagination descriptor
  query,       // this scope's active request state (pagination only)
  schemas      // { query: { schema } } — pagination-only, no uischema for a filter bar or sort control
} = contracts.useContext();
```

### `useContract().useContext()`

```typescript
const {
  cancellationRequestStatus,     // the cancellation-request status, in the platform vocabulary; undefined when no request exists
  cancellationRequestStatusCode, // the raw wire string, next to the field above
  contract,                      // ComputedRef<Contract | undefined> — the mapped view model
  context,                        // the full machine context object
  contractStatus,                // the contract status, in the platform vocabulary
  contractStatusCode,            // the raw wire string, next to the field above
  error,                          // ComputedRef<ResponseError | undefined> — machine-captured, read never raised
  errors,                          // the machine-captured error message, if any
  id,                              // the id of the contract being managed
  lookups,                         // the reused lookups the payment-method form draws from
  paymentMethod,                  // the open payment-method form: { schema, uischema, model } | undefined
  rawContract,                     // the raw wire record beside the view model
  title,                           // display title of the record, derived off the raw wire record
  validationErrors                 // field-level validation errors (AJV `ErrorObject[]`) — read, never raised
} = contract.useContext();
```

`paymentMethod` is `undefined` until `openPaymentMethod()` runs; it becomes `{ schema, uischema, model }` for the lifetime of the form and clears again on `clear()` or on a successful submit (which re-reads the contract and returns to `#loading`).

## Vue Component Integration

```vue
<template>
  <div v-if="isLoading">Loading...</div>
  <div v-else-if="hasError">{{ error?.message }}</div>
  <div v-else>
    <button :disabled="isFraud || isProcessing" @click="openPaymentMethod()">
      Change payment method
    </button>
  </div>
</template>

<script setup>
const contract = useContract().as("client").for("contract", props.contractId);
const { error } = contract.useContext();
const { isLoading, isProcessing, isFraud, hasError } = contract.useMeta();
const { openPaymentMethod } = contract.useActions();
</script>
```
