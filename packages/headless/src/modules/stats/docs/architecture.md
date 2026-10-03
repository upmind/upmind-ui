# stats Architecture

## Overview

`stats` is a read-only, query-backed module with no state machine and no manager — five independent reactive reads (four stat tiles, one usage block) behind ONE scoped composable, `useStats`, over one services file, one identity seam, and one addressability predicate. There is exactly one arm: `client`, acting for itself. The scope matrix declares `SELF` alone, so the module compiles a hard stop against a caller trying to retarget it at another client, or address it as staff.

**The two concerns keep separate members throughout.** The usage read carries the Upmind host-context gate on top of the shared addressability predicate; the four tile reads do not. Every layer therefore publishes the usage half under its own names (`data.usage`, `usageError`, `isLoadingUsage`, `hasUsageError`, `isUsageVisible`, `isUsageReady`, `refreshUsage`, `resetUsage`, `usageQuery`), so a host with the usage read gated off still reads four honest counts.

## Data Flow

```text
┌──────────────┐     ┌──────────────────────┐     ┌──────────────┐
│  .as(actor)  │────▶│  Scoped composable    │────▶│   Services   │
│              │     │  (per-scope factory)  │     │ (query calls)│
└──────────────┘     └──────────────────────┘     └──────────────┘
                              │                            │
                              ▼                            ▼
                     ┌──────────────────┐         ┌──────────────┐
                     │  Sub-composables  │◀────────│    Mapper    │
                     │ Context/Meta/     │         │ (wire→count) │
                     │ Actions/Internals │         └──────────────┘
                     └──────────────────┘
```

1. **`.as('client')`** → the scope builder resolves the concrete actor and mints (or re-uses) one scoped instance, keyed by actor + context + brand.
2. **The per-scope factory** → calls the services file once, which resolves the target client off the active session and mints one reactive query per read: four tile queries plus the usage query, all minted ONCE per scope.
3. **Services → mapper** → each currency-bound query's `select` step runs the wire report through a mapper that reads exactly one path (`total.result.ALL[0].count` or `open.result[0].count`) and returns `number | null`; never a coalesced zero.
4. **Sub-composables** → `useContext` republishes the mapped data flat and normalises a stray array-typed default back to the module's own absent value; `useMeta` derives the tiles' loading/error/empty/visibility flags and the usage read's own three; `useActions` exposes readiness, refresh and reset per concern, plus one shared `destroy`; `useInternals` exposes the raw query objects for debugging.

## Sub-Composables

| Sub-composable | Purpose |
| --- | --- |
| `useContext()` | Computed values: the published counts, the usage answer, and one error member per concern |
| `useMeta()` | State flags: per-tile and aggregate loading, error, empty, visibility — and the usage read's own three |
| `useActions()` | Methods: `isReady` / `refresh` / `reset` (tiles), `isUsageReady` / `refreshUsage` / `resetUsage` (usage), `destroy` (shared) |
| `useInternals()` | Debug: the four raw tile queries, and the usage query beside them |

The composable returns this same four-layer shape regardless of actor — there is no actor-specific arm on any of the four layers, because the scope matrix admits only one addressable actor.

## Services

One services file, one factory — there is no per-actor service split, because the module has no second arm to split toward.

| Concern | Factory member | Requests |
| --- | --- | --- |
| TILES | `loadTotalOrders` / `loadTotalInvoices` / `loadUnpaidInvoices` / `loadActiveTickets` | Four `GET stats` reads, one fixed parameter bag each |
| USAGE | `loadUsage` | One `GET clients/upmind_usage` read, on its own cache key |

Every request-issuing function in the services file shares one client-id resolver (reads the active session's own client) and one addressability predicate (authenticated **and** a resolved client id). The composable reads no scope-context id, because the scope matrix admits none.

The usage read alone adds a SECOND gate on top of that predicate: `isUpmindContext()`, a hostname allowlist read from `VITE_APP_UPMIND_HOSTNAMES`, wired into both the query's `enabled` and its `guard`. It is never a field on the client record. The same predicate closes `isUsageReady()` early and closes `isLoadingUsage`, so a consumer off the allowlist is never left on a spinner that cannot resolve.

## Dependencies

### stats Depends On

| Module | Usage |
| --- | --- |
| `session-store` | Resolves the active session's client id and authentication state — the module's ONE identity seam |
| `scope` | Scoped-composable registration, scope-key generation, and the addressability-guard machinery |
| `query` | The reactive query primitive every read calls |
| `brand` | Reads the already-loaded support-system config key that gates the active-tickets tile's visibility |
| `@upmind-automation/types` | `STATS_ALL_CURRENCY_CODE`, `InvoiceStatus`, `IClient` (for the `PackageLimits` read-back type) |

### Modules That Depend On stats

None today. This is a newly landed module with no cross-module consumers yet — the client dashboard page that will render these tiles is a separate front-end deliverable.

## Integration Points

| System | Integration |
| --- | --- |
| **`GET api/stats`** | Four fixed-parameter reads, one per tile, all client-path, all currency-pinned to `ALL` except the tickets read |
| **`GET api/clients/upmind_usage`** | One read; proven refusal path only |
| **Session store** | Supplies the acting client's id and authentication state to every request gate |
| **Brand configuration** | Supplies the support-system enablement flag that governs the tickets tile's visibility |
