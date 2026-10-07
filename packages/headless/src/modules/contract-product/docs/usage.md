# contract-product Usage & API

## Composable Structure

```typescript
import { ScopeActorTypes, useContractProduct, useContractProducts } from "@upmind-automation/headless";

declare const id: string;

const products = useContractProducts().as(ScopeActorTypes.CLIENT);
const product = useContractProduct().as(ScopeActorTypes.CLIENT).withId(id);

// Sub-composables (both composables)
const context = products.useContext();   // reactive query / computed values
const meta = products.useMeta();         // state flags
const actions = products.useActions();   // methods
```

## `useContractProducts` — the collection

### Reading & lifecycle

```typescript
import { ScopeActorTypes, useContractProducts } from "@upmind-automation/headless";

const products = useContractProducts().as(ScopeActorTypes.CLIENT);
const { isReady, refresh } = products.useActions();

await isReady();   // resolves once the first fetch has settled; false if the session settles unaddressable
await refresh();   // forces a re-read; throws NotAuthenticatedError when unaddressable
```

### Filtering, sorting & paging

```typescript
import { ScopeActorTypes, SortDirection, useContractProducts } from "@upmind-automation/headless";
import { ContractStatusCodes } from "@upmind-automation/types";

const products = useContractProducts().as(ScopeActorTypes.CLIENT);
const { filterBy, sortBy, setCriteria, nextPage, prevPage } = products.useActions();

filterBy({ "status.code": ContractStatusCodes.ACTIVE });
sortBy([{ field: "next_due_date", dir: SortDirection.ASC }]);
setCriteria({ pagination: { limit: 20 } });

await nextPage();
await prevPage();
```

The list reads with a split count: the total arrives on a separate count read. Paging forward keeps that total. The count read waits on the same addressability check as the list itself, so it is not sent for a scope that cannot address a client.

### Quick search

`query` is a sibling of `filters` on the one query model, not a filter leaf — set it through `setCriteria`, not `filterBy`. A term under three characters fails the query model's own validation.

```typescript
import { ScopeActorTypes, useContractProducts } from "@upmind-automation/headless";

const products = useContractProducts().as(ScopeActorTypes.CLIENT);
const { setCriteria } = products.useActions();

setCriteria({ query: "widget" }); // minimum 3 characters
```

### Extra reads

```typescript
import { ScopeActorTypes, useContractProducts } from "@upmind-automation/headless";

const products = useContractProducts().as(ScopeActorTypes.CLIENT);
const { loadGroupedCounts, loadPurchasedCategories } = products.useActions();

const groups = await loadGroupedCounts();          // dashboard counts by category/service
const categories = await loadPurchasedCategories(); // categories the client has bought into
```

### Utility

```typescript
import { ScopeActorTypes, useContractProducts } from "@upmind-automation/headless";

const products = useContractProducts().as(ScopeActorTypes.CLIENT);
const { destroy } = products.useActions();

destroy(); // deregisters the scope instance and stops the delegated-preference reader
```

## `useContractProduct` — the manager

### Lifecycle

```typescript
import { ScopeActorTypes, useContractProduct } from "@upmind-automation/headless";

declare const id: string;

const product = useContractProduct().as(ScopeActorTypes.CLIENT).withId(id);
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
import {
  ScopeActorTypes,
  ContractProductCancelOption,
  ContractProductFormTypes,
  useContractProduct
} from "@upmind-automation/headless";

declare const id: string;

const product = useContractProduct().as(ScopeActorTypes.CLIENT).withId(id);
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
import { ScopeActorTypes, ContractProductFormTypes, useContractProduct } from "@upmind-automation/headless";
import { InvoiceConsolidationTypes } from "@upmind-automation/types";

declare const id: string;

const product = useContractProduct().as(ScopeActorTypes.CLIENT).withId(id);
const { openConsolidation, set, cancelForm, submitConsolidation, setConsolidation } = product.useActions();

// Direct call
await setConsolidation({ invoiceConsolidationEnabled: InvoiceConsolidationTypes.ENABLED });

// Raw form flow
openConsolidation();
set(ContractProductFormTypes.CONSOLIDATION, { invoiceConsolidationEnabled: InvoiceConsolidationTypes.ENABLED });
await submitConsolidation();
cancelForm(ContractProductFormTypes.CONSOLIDATION);
```

`submitConsolidation()` (and so `setConsolidation()`) sends nothing and resolves `false` when the chosen value equals the product's current setting. The form stays open.

Every write resolves the re-read `ContractProduct`, or `false` when the machine refused the event outright (e.g. a subscription-only write sent on a one-time product, or a form opened when the record does not currently allow it). This is distinct from a write that reaches the server and fails, or whose re-read fails, or a submitted model that fails validation: any of those **rejects** the promise with a `DetailedError` — an invalid model rejects with a 422 carrying the AJV errors, before any request is sent:

```typescript
import { ScopeActorTypes, useContractProduct } from "@upmind-automation/headless";

declare const id: string;

const product = useContractProduct().as(ScopeActorTypes.CLIENT).withId(id);
const { stopRenewing } = product.useActions();

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

#### Change of plan

A client can move a recurring single product to another plan its own plan allows. The flow has four steps: open the plan list, choose a plan, configure it (the dry-run cost updates as options change), commit.

| Action | Does | Returns |
|--------|------|---------|
| `openMigration()` | Opens the plan list; the list starts to load | `true` once open; `false` when `canMigrate` is false |
| `selectMigrationTarget(id)` | Chooses a plan of the loaded list; its configurator starts to load | `false`, with nothing sent, when the loaded list holds no plan of that id |
| `loadMoreMigrationTargets()` | Loads the next page of the plan list (four plans a page) | `Promise<void>` |
| `reloadMigrationTarget()` | Loads the chosen plan again from the start, after it failed to load | `void` |
| `cancelMigration()` | Closes the change of plan; the chosen plan's configurator stops | `void` |
| `migrate()` | Commits the change | `MigrationResult`; `false` when the commit is not offered now (no configurator ready, or no dry run or refused state); throws `DetailedError` when the platform refuses the change |

```typescript
import { ScopeActorTypes, useContractProduct } from "@upmind-automation/headless";
import { until } from "@vueuse/core";

declare const productId: string;

async function changePlan() {
const product = useContractProduct().as(ScopeActorTypes.CLIENT).withId(productId);
const actions = product.useActions();
const {
  canMigrate,
  canCommitMigration,
  isChoosingMigrationTarget,
  isMigrationTargetsLoading,
  isMigrationTargetLoading,
  isMigrationPreviewing,
  hasMigrationTargetsError,
  hasMoreMigrationTargets
} = product.useMeta();
const { migrationsCount, migrationTargets, migrationPreview } = product.useContext();

await actions.isReady();

// 1. Offer the entry point only when the product can change plan.
if (canMigrate.value && migrationsCount.value > 0) {
  // 2. Open the list. `openMigration()` only starts the list query; wait for
  //    the first page before reading `migrationTargets`.
  if (actions.openMigration()) {
    await until(
      () =>
        isChoosingMigrationTarget.value &&
        (!isMigrationTargetsLoading.value || hasMigrationTargetsError.value)
    ).toBe(true);
    if (hasMigrationTargetsError.value) return;
    if (hasMoreMigrationTargets.value) await actions.loadMoreMigrationTargets();

    // 3. Choose a plan. Its configurator starts to load, and the first dry
    //    run follows. `migrate()` returns `false` while the plan still loads.
    const target = migrationTargets.value[0];
    if (target?.id && (await actions.selectMigrationTarget(target.id))) {
      // 4. Wait for the dry run to settle, then commit — or
      //    `actions.cancelMigration()` to leave without changing. A dry run
      //    that fails settles with no `migrationPreview`, and the commit stays
      //    offered, so gate on `canCommitMigration`, never on the preview.
      await until(
        () => !isMigrationTargetLoading.value && !isMigrationPreviewing.value
      ).toBe(true);
      console.log("Change costs", migrationPreview.value?.total);

      if (canCommitMigration.value) {
        const result = await actions.migrate();
        if (result && result.requiresPayment) {
          console.log("Pay invoice", result.invoiceId, result.unpaidAmount);
        }
      }
    }
  }
}
}
```

`migrationConfig` is the configurator of the chosen plan (`null` when none is chosen). It is a subset of the product configurator: it carries the plan's schema, uischema and option setters, but no provision fields and no trial choice, and it has no way to commit; only `migrate()` commits.

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

**Change-of-plan flags**

| Flag | Description |
|------|-------------|
| `canMigrate` | The product may start a change of plan: a recurring single product, active or suspended, the platform allows a modification, plans are allowed, no hard cancellation request, no auto-expire, not a staged import, no unpaid pro-rata invoice |
| `canCommitMigration` | The open change can be committed: no dry run in flight and the configurator can take the commit. Local validation does not gate it |
| `hasPendingProRata` | The pro-rata invoice of an earlier change is still unpaid |
| `isMigrationOpen` | The plan list or a chosen plan is open |
| `isChoosingMigrationTarget` | The plan list is open and no plan is chosen |
| `isMigrationTargetsLoading` | The plan list is loading its **first page** only |
| `isMigrationTargetsLoadingMore` | The plan list is loading a further page |
| `hasMigrationTargetsError` | The plan list failed to load |
| `hasNoMigrationTargets` | The plan list loaded and is empty |
| `hasMoreMigrationTargets` | The plan list has another page |
| `isMigrationTargetLoading` | The chosen plan is loading |
| `isMigrationTargetUnavailable` | The chosen plan failed to load; `reloadMigrationTarget()` retries |
| `isMigrationPreviewing` | The dry run is in flight |
| `isMigrationPreviewed` | The dry run returned a cost |
| `isMigrationFree` | The dry run's converted total is zero |
| `isMigrationProcessing` | The commit is in flight |
| `requiresPayment` | The committed change left an amount to pay |

## Context (Computed Values)

### `useContractProducts().useContext()`

```typescript
import { ScopeActorTypes, useContractProducts } from "@upmind-automation/headless";

const products = useContractProducts().as(ScopeActorTypes.CLIENT);
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

Each `ContractProduct` in `data` carries a display `title` (the shared product title, e.g. "Starter Hosting (testdomain.com)") and a `priceTermSummary` (the price and, for a subscription, its lower-cased cycle — "£4 monthly", "£60"). The picker's options read the same title.

A `ContractProduct` also carries `contractBillingCycleLabel`, the owning contract's translated billing-cycle label (the product record's "Contract billing cycle"; "One time" for a one-off contract). It is `undefined` when the read carries no contract relation, and it is absent from the type of a product embedded in a contract read (`ContractProductEmbedded`). It is distinct from the product's own `billingCycle`.

### `useContractProduct().useContext()`

```typescript
import { ScopeActorTypes, useContractProduct } from "@upmind-automation/headless";

declare const productId: string;

const product = useContractProduct().as(ScopeActorTypes.CLIENT).withId(productId);
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
  migrationConfig,           // the chosen plan's configurator (no provision fields, no trial), or null
  migrationPreview,          // MigrationPreview | undefined — the cost the last dry run gave
  migrationResult,           // MigrationResult | null — the invoice the last commit raised; null before a commit and after openMigration
  migrationTarget,           // MigrationTarget | undefined — the chosen plan: { id, product }
  migrationTargets,          // ComputedRef — the plans of the pages loaded so far
  migrationsCount,           // ComputedRef<number> — how many plans the platform counted; 0 until the count lands
  rawContractProduct,        // the raw wire record beside the view model
  scheduledActions,          // ComputedRef<ScheduledAction[]> — [] until the read carries them (see hasFetchedScheduledActions)
  title,                     // ComputedRef<string | undefined> — the product's own name (the view model's `title` is the display title)
  validationErrors           // ErrorObject[] — field-level validation errors (AJV), read, never raised
} = product.useContext();
```

`MigrationPreview` is `{ invoice, total, isFree }` (`total` is the dry-run invoice's formatted total). `MigrationResult` is `{ invoiceId?, unpaidAmount, requiresPayment, invoice? }`. The types `MigrationConfig`, `MigrationPreview`, `MigrationResult` and `MigrationTarget` are exported from the package root.

`cancellation` and `consolidation` are `undefined` until their `open*` action runs; each becomes `{ schema, uischema, model }` for the lifetime of that form and clears again on `cancelForm()` or on a successful submit (which re-reads the product and returns to `#loading`).

## Future-cancellation date helpers

Pure functions, not tied to a loaded instance — import from the package root:

```typescript
import {
  minFutureCancellationDate,
  isSelectableFutureCancellationDate,
  anniversaryCycleForDate
} from "@upmind-automation/headless";
import type { ContractProduct } from "@upmind-automation/headless";

declare const contractProduct: ContractProduct;
declare const pickedDate: string;

const earliest = minFutureCancellationDate(contractProduct);
const valid = isSelectableFutureCancellationDate(contractProduct, pickedDate);
const cycle = anniversaryCycleForDate(contractProduct, pickedDate); // whole cycles from nextDueDate, or null
```

A loaded manager instance also exposes its own instance-bound `minFutureCancellationDate`, computed off the loaded product — no import or manual argument needed:

```typescript
import { ScopeActorTypes, useContractProduct } from "@upmind-automation/headless";

declare const id: string;

const product = useContractProduct().as(ScopeActorTypes.CLIENT).withId(id);
const { minFutureCancellationDate } = product.useContext();
```

## Unpaid-invoice predicates

```typescript
import { isDue, isCancellable } from "@upmind-automation/headless";
import type { ContractProduct } from "@upmind-automation/headless";

declare const contractProduct: ContractProduct;

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
import { ScopeActorTypes, useContractProduct } from "@upmind-automation/headless";

const props = defineProps({ id: { type: String, required: true } });

const product = useContractProduct().as(ScopeActorTypes.CLIENT).withId(props.id);
const { contractProduct, error } = product.useContext();
const { isLoading, isProcessing, isSubscription, hasError } = product.useMeta();
const { stopRenewing } = product.useActions();
</script>
```
