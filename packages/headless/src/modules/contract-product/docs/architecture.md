# contract-product Architecture

## Overview

The module ships two scoped composables under one module name: `useContractProducts` (a TanStack-query-backed collection, no machine) and `useContractProduct` (a bespoke XState machine, one instance per contract product). Both are armless — client is the only actor that resolves on either scope matrix, so there is no per-actor `.client.ts`/`.staff.ts` split; `scopedServices` returns `{}` for every case. One services file, `contract-product.services.ts`, backs both composables and owns the module's one cache key, `["contracts"]`; every write invalidates it whole rather than a narrower key.

## State Machine (`useContractProduct`)

`contract-product.machine.ts` follows the house write-spine convention: every write runs through one `processing` state, which invokes one named service and returns to `#loading` to re-read and re-place the record. A failure is recorded on the `error` context property, never a distinct state.

```mermaid
stateDiagram-v2
    [*] --> subscribing
    subscribing --> loading: AUTHENTICATED

    loading --> available: status resolved
    loading --> unavailable: staged/cancelled/lapsed/fraud

    state available {
      [*] --> status
      state status {
        pending --> processing_: SCHEDULE_CANCEL / SCHEDULE_CANCEL_REVOKE / SET_CONSOLIDATION*
        inactive --> processing_: STOP_RENEWING* / SET_CONSOLIDATION* / SCHEDULE_CANCEL / SCHEDULE_CANCEL_REVOKE
        active --> processing_: STOP_RENEWING* / SET_CONSOLIDATION* / SCHEDULE_CANCEL / SCHEDULE_CANCEL_REVOKE
        suspended --> processing_: STOP_RENEWING* / SET_CONSOLIDATION* / SCHEDULE_CANCEL / SCHEDULE_CANCEL_REVOKE
        expiring --> processing_: RESUME / SET_CONSOLIDATION* / SCHEDULE_CANCEL / SCHEDULE_CANCEL_REVOKE
        cancelling --> processing_: SET_CONSOLIDATION* / SCHEDULE_CANCEL / SCHEDULE_CANCEL_REVOKE
      }
      state "setup (parallel)" as setup
      state "trial (parallel)" as trial
    }
    state unavailable {
      staged
      cancelled
      lapsed
      fraud
    }

    processing_ --> loading: onDone/onError
    note right of processing_ : *cond: isSubscription

    loading --> subscribing: UNAUTHENTICATED
    available --> loading: REFRESH
    unavailable --> loading: REFRESH
```

`available` is `type: "parallel"` over three regions — `status`, `setup`, `trial` — evaluated simultaneously off one read. `unavailable` (staged/cancelled/lapsed/fraud) has no transition that leaves it; the only way out is a fresh `loading` cycle from `REFRESH` or re-subscription.

The `loading` state's `always` array is the one place `selectStatusNode` is consulted; it runs a fixed priority order (staged → cancelled → lapsed → fraud → cancelling → expiring → the four published codes → unrecognised-error) so that, e.g., a staged-import record is never routed into a status-code branch at all.

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

1. **`useActions().<write>()`** sends an event to the machine and waits for it to settle back on `available`/`unavailable`.
2. **The machine's `processing.*` child** invokes the matching service from `contract-product.services.ts`, which issues the `PUT`, invalidates the `["contracts"]` cache key, and returns the raw updated record.
3. **`setContractProduct`** maps the raw record through `contract-product.mappers.ts` and assigns both the raw record and the mapped view model onto context.
4. **`useMeta()`/`useContext()`** read the settled state and context reactively; every published flag is a `computed` over `state`/`context`, never a snapshot.

## Sub-Composables

| Sub-composable | `useContractProducts` | `useContractProduct` |
|----------------|------------------------|------------------------|
| `useActions()` | `filterBy`, `sortBy`, `setCriteria`, `nextPage`, `prevPage`, `loadGroupedCounts`, `loadPurchasedCategories`, `isReady`, `refresh`, `invalidate`, `reset`, `destroy` (`invalidate`/`reset` are `@scenario-exclude` internal) | `stopRenewing`, `resumeRenewing`, `setConsolidation`, `scheduleCancellation`, `revokeScheduledCancellation`, `isReady`, `refresh`, `stop`, `destroy` |
| `useContext()` | `data`, `error`, `findOne`, `getOne`, `pagination`, `query`, `schemas` | `context`, `contractId`, `contractProduct`, `contractProductId`, `error`, `minFutureCancellationDate`, `rawContractProduct`, `scheduledActions` |
| `useMeta()` | `isAvailable`, `isLoading`, `isEmpty`, `isFiltered`, `hasPages`, `hasError` | the thirteen status/setup/trial node flags, the `isAvailable`/`isLoading`/`isSubmitting` state-derived flags, plus the record-fact flags (see usage.md) |
| `useInternals()` | raw query access | raw machine-state access |

## Services

The collection (`useContractProducts`) resolves its requests through `createContractProductServices`. The manager (`useContractProduct`) does not call that factory — it interprets `contract-product.machine.ts`, whose services import `contractProductMachineServices` directly. Both sides come from the one services file, `contract-product.services.ts`; there is no per-actor split — client is the only resolving actor on either scope matrix.

| Concern | Function | Endpoint |
|---------|----------|----------|
| Collection list | `loadList` | `GET contracts_products` |
| Grouped counts | `loadGroupedCounts` | `GET clients/{clientId}/contracts/products` |
| Purchased categories | `loadPurchasedCategories` | `GET contract_product_categories` |
| Manager read | `load` | `GET contract_products/{id}` |
| Stop/resume renewal | `requestSoftCancel` / `abortSoftCancel` | `PUT contracts/{c}/products/{p}/modify_renew` |
| Consolidation | `setConsolidation` | `PUT contracts/{c}/products/{p}/properties` |
| Schedule cancel | `scheduleCancellation` | `PUT contracts/{c}/products/{p}/schedule-cancel` |
| Revoke schedule | `revokeScheduledCancellation` | `PUT contracts/{c}/products/{p}/schedule-cancel-revoke` |

## Dependencies

### contract-product Depends On

| Module | Usage |
|--------|-------|
| `session-store` | `resolveClientId`, `useActiveSession`, `authSubscription` — identity resolution and the auth-lifecycle actor the machine spawns |
| `client-personal-details` | The show-delegated-products preference, read via a fresh scoped instance the collection owns and destroys |
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
| **JSON Schema (jsonforms)** | The collection's one Draft-07 query schema (`useQuerySchema`) — filters, sort and pagination as one instance |
