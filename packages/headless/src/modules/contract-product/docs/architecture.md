# contract-product Architecture

## Overview

The module ships two scoped composables under one module name: `useContractProducts` (a TanStack-query-backed collection, no machine) and `useContractProduct` (a bespoke XState machine, one instance per contract product). Both are armless — the parity table carries the one cell `client×self`, so there is no per-actor `.client.ts`/`.staff.ts` split and `scopedServices` returns `{}` for every case. The two matrices say this differently: the collection resolves a context for `client` alone, and the manager, a single-record read, resolves one for nobody. One services file, `contract-product.services.ts`, backs both composables and owns the module's one cache key, `["contracts"]`; every write invalidates it whole rather than a narrower key.

## State Machine (`useContractProduct`)

`contract-product.machine.ts` follows the house write-spine convention: every FORMLESS write (`RESUME`, `WITHDRAW`, `SCHEDULE_CANCEL_REVOKE`) runs through one top-level `processing` state, which invokes one named service and returns to `#loading`. Each write that takes a MODEL — the combined cancellation form and the consolidation form — is instead its own PARALLEL REGION of `available`, beside `status`/`setup`/`trial`: opening the form never leaves the status node, so every status flag stays live while the client edits it, and each form has its own `processing` child so a failed submit returns the client to the open form's `error` node with the model still in place, rather than to the machine's top-level one. A load failure, or an unrecognised status code, is instead routed to a distinct top-level `error` node (`id: "error"`); the only way out is `REFRESH`, which re-enters `#loading` from the top.

```mermaid
stateDiagram-v2
    [*] --> subscribing
    subscribing --> loading: AUTHENTICATED

    loading --> available: status resolved
    loading --> unavailable: staged/cancelled/lapsed/fraud
    loading --> error: load failed / unrecognised status

    state available {
      [*] --> status
      state status {
        pending --> processing_: SCHEDULE_CANCEL_REVOKE
        inactive --> processing_: SCHEDULE_CANCEL_REVOKE
        active --> processing_: SCHEDULE_CANCEL_REVOKE
        suspended --> processing_: SCHEDULE_CANCEL_REVOKE
        expiring --> processing_: RESUME / SCHEDULE_CANCEL_REVOKE
        cancelling --> processing_: SCHEDULE_CANCEL_REVOKE / WITHDRAW
      }
      state "setup (parallel)" as setup
      state "trial (parallel)" as trial
      state "cancelling FORM (parallel)" as cancellingForm {
        idle --> available_: CANCELLATION (cond hasCancellationOptions)
        available_ --> cancellingForm_processing: STOP_RENEWING* / SCHEDULE_CANCEL / REQUEST_CANCEL**
        cancellingForm_processing --> "#loading": onDone
        cancellingForm_processing --> available_.error: onError
        available_ --> idle: CANCEL.CANCELLATION
      }
      state "consolidating FORM (parallel)" as consolidatingForm {
        cidle --> cavailable: CONSOLIDATION (cond canConsolidate)
        cavailable --> consolidatingForm_processing: SET_CONSOLIDATION (cond canConsolidate)
        consolidatingForm_processing --> "#loading": onDone
        consolidatingForm_processing --> cavailable.error: onError
        cavailable --> cidle: CANCEL.CONSOLIDATION
      }
    }
    state unavailable {
      staged
      cancelled
      lapsed
      fraud
    }

    processing_ --> loading: onDone/onError
    note right of processing_ : *cond: isSubscription; **cond: canRequestHardCancellation

    loading --> subscribing: UNAUTHENTICATED
    available --> loading: REFRESH
    unavailable --> loading: REFRESH
    error --> loading: REFRESH
```

`available` is `type: "parallel"` over five regions — `status`, `setup`, `trial`, `cancelling`, `consolidating` — evaluated simultaneously off one read. `unavailable` (staged/cancelled/lapsed/fraud) has no transition that leaves it; the only way out is a fresh `loading` cycle from `REFRESH` or re-subscription.

The `loading` state's `onDone` is an ordered list of guarded transitions over the record the settled read returned (the event, never the previous context). The order is staged → cancelled → lapsed → fraud → cancelling → expiring → pending → inactive → active → suspended, so that, e.g., a staged-import record is never routed into a status-code branch at all. Each guard is a one-line check on a raw wire field. A record that matches none takes the last entry, records a status error and lands on `error`.

`cancelling` and `consolidating` are the write-form regions. Each has its own `idle` → `available` (`checking`/`valid`/`invalid`/`error`, re-entered on every `SET.<form>`) → `processing` (its own `validating` → `updating` children) cycle, entirely independent of the `status`/`setup`/`trial` regions beside it. Opening the cancellation form is itself guarded — `CANCELLATION` only transitions when `hasCancellationOptions` is true, i.e. the record currently offers at least one of the three cancellation options; opening the consolidation form is guarded the same way by `canConsolidate`.

## Data Flow

```text
┌──────────────┐     ┌───────────────────────┐     ┌──────────────────────────┐
│  useActions  │────▶│  contractProductMachine │────▶│ contract-product.services │
│ (send event) │     │  (processing.*)         │     │ (PUT .../modify_renew etc)│
└──────────────┘     └───────────┬─────────────┘     └──────────────┬────────────┘
                                  │  onDone (raw record)              │
                                  ▼                                   │
                         setContractProduct (assign)◀─────────────────┘
                                  │
                                  ▼
                    context.rawContractProduct / context.contractProduct
                                  │
                                  ▼
                        useMeta() / useContext() (readers)
```

1. **`useActions().<write>()`** — a formless write sends its event directly; a form write (cancellation, consolidation) opens the form, feeds it a model (parsed and validated against that form's own JSONForms schema), then submits — and waits for the machine to settle back on `available`/`unavailable`.
2. **The invoked `processing` child** (top-level for a formless write, or the form's own region-scoped one) invokes the matching service from `contract-product.services.ts`, which issues the request, invalidates the `["contracts"]` cache key, and returns the raw updated record.
3. **`setContractProduct`** maps the raw record through `contract-product.mappers.ts` and assigns both the raw record and the mapped view model onto context; the settled form's slot (`cancellation`/`consolidation`) is cleared as the machine returns to `#loading`.
4. **`useMeta()`/`useContext()`** read the settled state and context reactively; every published flag is a `computed` over `state`/`context`, never a snapshot.

## Sub-Composables

| Sub-composable | `useContractProducts` | `useContractProduct` |
|----------------|------------------------|------------------------|
| `useActions()` | `filterBy`, `sortBy`, `setCriteria`, `nextPage`, `prevPage`, `loadGroupedCounts`, `loadPurchasedCategories`, `isReady`, `refresh`, `invalidate`, `reset`, `destroy` (`invalidate`/`reset` are `@scenario-exclude` internal) | `openCancellation`, `openConsolidation`, `set`, `cancelForm`, `submitCancellation`, `submitConsolidation`, `stopRenewing`, `resumeRenewing`, `requestCancellation`, `withdrawCancellation`, `scheduleCancellation`, `revokeScheduledCancellation`, `setConsolidation`, `isReady`, `onDone`, `refresh`, `stop`, `destroy` |
| `useContext()` | `data`, `error`, `findOne`, `getOne`, `pagination`, `query`, `schemas` | `context`, `contractId`, `contractProduct`, `id`, `cancellation`, `consolidation`, `description`, `error`, `errors`, `lookups`, `minFutureCancellationDate`, `rawContractProduct`, `scheduledActions`, `title`, `validationErrors` |
| `useMeta()` | `isAvailable`, `isLoading`, `isEmpty`, `isFiltered`, `hasPages`, `hasError` | the thirteen status/setup/trial node flags, the `isAvailable`/`isLoading`/`isProcessing` state-derived flags, `canRequestCancellation`/`canRequestEndOfTerm`/`canScheduleFutureCancellation`, plus the other record-fact flags (see usage.md) |
| `useInternals()` | raw query access | raw machine-state access |

## Services

The collection (`useContractProducts`) resolves its requests through `createContractProductServices`. The manager (`useContractProduct`) does not call that factory — it interprets `contract-product.machine.ts`, whose services import `contractProductMachineServices` directly. Both sides come from the one services file, `contract-product.services.ts`; there is no per-actor split — the parity table carries the one cell `client×self`.

| Concern | Function | Endpoint |
|---------|----------|----------|
| Collection list | `loadList` | `GET contracts_products` |
| Grouped counts | `loadGroupedCounts` | `GET clients/{clientId}/contracts/products` |
| Purchased categories | `loadPurchasedCategories` | `GET contract_product_categories` |
| Manager read | `load` | `GET contract_products/{id}` (also settles the CANCEL_REQUEST custom-field catalogue lookup for the cancellation form) |
| Stop/resume renewal (soft) | `requestSoftCancel` / `abortSoftCancel` | `PUT contracts/{c}/products/{p}/modify_renew` |
| Request/withdraw cancellation (hard) | `requestCancellation` / `withdrawCancellation` | `POST` / `DELETE contracts/{c}/cancel/request` — contract-scoped by URL, this product's own id in the body |
| Consolidation | `setConsolidation` | `PUT contracts/{c}/products/{p}/properties` |
| Schedule cancel | `scheduleCancellation` | `PUT contracts/{c}/products/{p}/schedule-cancel` |
| Revoke schedule | `revokeScheduledCancellation` | `PUT contracts/{c}/products/{p}/schedule-cancel-revoke` |
| Cancellation form validation | `validateCancellation` | none (local — rejects with a 422 on an invalid model) |
| Consolidation form validation | `validateConsolidation` | none (local — rejects with a 422 on an invalid model) |

## Dependencies

### contract-product Depends On

| Module | Usage |
|--------|-------|
| `session-store` | `resolveClientId`, `useActiveSession`, `authSubscription` — identity resolution and the auth-lifecycle actor the machine spawns |
| `client-personal-details` | The show-delegated-products preference, read via a fresh scoped instance the collection owns and destroys |
| `client-custom-fields` | The brand's CANCEL_REQUEST field catalogue, reused as the cancellation form's `customFields`, settled alongside the manager's read |
| `query` | `useQuery`, `translateQuery`, cache invalidation — the whole HTTP/query layer |
| `system-localisation` | `useI18n` — write-failure messages |
| `scope` | `createScopedComposable`, `ScopeActorTypes`, `ScopeContext`, the scope registry |

### Modules That Depend On contract-product

| Module | Usage |
|--------|-------|
| `contract` | Imports `mapContractProduct` and the `ContractProduct` type (via the barrel) to map and type a contract's embedded `products` relation |

## Integration Points

| System | Integration |
|--------|-------------|
| **TanStack Query** | The collection's list query; keyed on `["contracts", { client }, "products", { excludeDelegated }]`, re-keys on client or preference change |
| **XState** | `contractProductMachine`, one spawned instance per `useContractProduct` scope |
| **JSON Schema (jsonforms)** | The collection's one Draft-07 query schema (`useQuerySchema`) — filters, quick search, sort and pagination as one instance |
