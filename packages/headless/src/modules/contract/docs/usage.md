# contract Usage & API

## Composable Structure

```typescript
const contracts = useContracts().as("client");
const contract = useContract().as("client").withId(contractId);

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

### Filtering, sorting & paging

```typescript
const { filterBy, sortBy, setCriteria, nextPage, prevPage } = contracts.useActions();

filterBy({ "status.code": ["contract_active"] });
sortBy([{ field: "next_due_date", dir: "asc" }]);
setCriteria({ pagination: { limit: 20 } });
await nextPage();
await prevPage();
```

`filterBy` and `sortBy` each REPLACE their own branch of the one query model whole — a later call does not merge into an earlier one. `filterBy({ name: { like: "acme" } })` followed by `filterBy({ "status.code": ["contract_active"] })` drops the `name` filter, so pass the FULL filter (or sort) set on every call; `sort` and `pagination` are left standing by either call. `setCriteria` merges any branch directly, including `pagination`, under the same whole-branch-replace rule. A filter or sort write that carries no `pagination` branch of its own resets `pagination.offset` back to the first page — the page SIZE survives, the page POSITION does not. A write that fails validation is never committed: the previous criteria stay live, and the rejection surfaces on `useContext().error` / `useMeta().hasError` rather than as a thrown error. The collection's own filterable fields are name, status code, and the `created_at` / `next_due_date` date ranges; sortable fields are name, created_at, next_due_date, total_amount and status.

### The contracts picker

`useContext().schemas.contractPicker` is a `{ schema, uischema }` pair for a `Lookup` control that finds one of the client's own contracts by name — for a consumer who has no contract id yet (the same shape `useTickets` publishes as `schemas.ticketPicker`). Typing into the control searches `filters.name.like` and issues its own `GET contracts?with=status` request, keyed separately from the listing's own list query so a picker search never evicts the rows a listing is showing.

```typescript
const { schemas } = contracts.useContext();
const { schema, uischema } = schemas.contractPicker; // renders a Lookup control
```

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
await reset();    // drops the module's cache entries and re-reads the contract through REFRESH
stop();           // stops the machine, keeps the registry entry
destroy();        // stops the machine and deregisters it
```

### The payment-method write

Available two ways: a direct call (opens the form, feeds it a model, submits — all in one), or the raw form flow for a consumer building an actual form UI.

```typescript
const { openPaymentMethod, input, clear, update, setPaymentMethod, onDone, reset } = contract.useActions();

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
| `isFiltered` | True while any declared filter carries a value |
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
| `isPaymentMethodOpen` | The payment-method form is open — mid-edit or mid-submit, from either parent. Gate the form's visibility on this flag, not on whether `paymentMethod` is defined (it survives a successful submit) |
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
  query,       // this scope's active request state — filters, sort and pagination
  schemas      // { query: { schema, uischema, sortUischema }, contractPicker: { schema, uischema } }
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

`paymentMethod` is `undefined` until `openPaymentMethod()` runs; it becomes `{ schema, uischema, model }` and STAYS set even after a successful submit — the write re-reads the contract and returns the machine to its status node, but nothing clears the form's slot on that transition. Only `clear()` (which sends `CANCEL.PAYMENT_METHOD`) empties it. Gate the form's visibility on `useMeta().isPaymentMethodOpen`, not on whether `paymentMethod` is defined, and call `clear()` once a submit resolves if the form should close.

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
const contract = useContract().as("client").withId(props.contractId);
const { error } = contract.useContext();
const { isLoading, isProcessing, isFraud, hasError } = contract.useMeta();
const { openPaymentMethod } = contract.useActions();
</script>
```
