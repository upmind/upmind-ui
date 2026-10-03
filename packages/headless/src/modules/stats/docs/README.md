# stats

> The read-only data layer behind the client dashboard's stat tiles — four counts and one partner-usage refusal read, on ONE composable, client-and-self only.

## What Is This?

Think of `stats` as the numbers feeding the four little stat cards on a client's own dashboard, plus one more block that only shows up for a specific class of account.

- **Four stat tiles** = total orders, total invoices, unpaid invoices, active support tickets — each its own independent read.
- **One usage block** = a partner-usage read that, for every account this module has been proven against, comes back refused.

The module ships **one composable**, `useStats`, carrying both concerns:

| Surface | Members | Use them when |
| --- | --- | --- |
| **The four stat tiles** | `data.totalOrders` / `.totalInvoices` / `.unpaidInvoices` / `.activeTickets`, `error`, `isLoading*`, `hasError`, `isEmpty`, `isVisible`, `hasVisibilityError`, `isReady`, `refresh`, `reset` | You are rendering the dashboard's stat-count row |
| **The partner-usage block** | `data.usage`, `usageError`, `isLoadingUsage`, `hasUsageError`, `isUsageVisible`, `isUsageReady`, `refreshUsage`, `resetUsage` | You are rendering the Upmind-usage panel — today, its refusal state |

**The two concerns keep separate members on purpose.** The usage read is gated on the Upmind host context and the four tile reads are not, so a shared `isLoading`, `hasError` or `isEmpty` would be wrong the moment the usage half is gated off: a spinner that can never resolve, or a `409` refusal reported as a tile failure. Only `isAvailable` and `destroy` are shared, because one services instance and one scope back both halves.

It always reads the **calling client's own** data. There is no capability here to read another client's stats, and no staff-facing path — the underlying `api/stats` and `api/clients/upmind_usage` endpoints are called on the client path only, never `api/admin/...`.

> **🧪 For Testers:** `useStats` supports the client's own (`self`) scope only. The scope matrix declares `SELF` alone, so a `.for()` context is a compile-time error for every actor — there is no cell where a different identity is addressable.

> **👩‍💻 For Developers:** The usage block's success response (a `200` with real usage numbers) has never been captured against any account available to this build. `useStats` ships the request and the refusal handling only — see [gotchas.md](./gotchas.md) before building anything that assumes a populated usage panel.

## Quick Start

```typescript
import { ScopeActorTypes, useStats } from "@upmind-automation/headless";

const stats = useStats().as(ScopeActorTypes.CLIENT);

// The four stat tiles
await stats.useActions().isReady();
const { totalOrders, totalInvoices, unpaidInvoices, activeTickets } =
  stats.useContext().data.value;

// The Upmind-usage block — proven refusal path only, on its OWN members
await stats.useActions().isUsageReady();
const { isUsageVisible } = stats.useMeta(); // true only after a SUCCESSFUL read
const { usageError } = stats.useContext(); // the refusal, when the read fails
```

See [Usage](./usage.md) for the complete API reference.

## Features

| Feature | Status | Notes |
| --- | --- | --- |
| Total orders / invoices / unpaid invoices tiles | ✅ | Currency-summed counts, fixed to the `ALL` currency |
| Active support tickets tile | ✅ | No currency dimension; hidden when the brand disables the support system |
| Loading / error / empty state for the tiles | ✅ | `isLoading`, `hasError`, `isEmpty` |
| Loading / error / visibility state for the usage block | ✅ | `isLoadingUsage`, `hasUsageError`, `isUsageVisible` — never folded into the tiles' flags |
| Refresh / reset, per concern | ✅ | `refresh` / `reset` for the tiles, `refreshUsage` / `resetUsage` for the usage read |
| Upmind-usage refusal read | ✅ | The request and its `409` handling are proven |
| Upmind-usage success read (the eleven usage figures) | ⏳ | A **signed parity drop**, not a missing implementation: no account with a recordable success response exists — see [gotchas.md](./gotchas.md) |

## Key Concepts

### One composable, one identity seam, two gates

The tiles and the usage block share the same client-identity resolution and the same addressability predicate (an authenticated session with a resolved client id). Whichever read fires, it resolves the same target client — from the active session, never from a caller-supplied id.

They do **not** share a gate. The four tile reads fire on any host. The usage read carries the Upmind host-context gate (a hostname allowlist read from `VITE_APP_UPMIND_HOSTNAMES`) on top of the shared predicate, and never fires off that allowlist.

> **🧪 For Testers:** With no authenticated client session, NO read fires. `useMeta().isAvailable` reads `false`, and a forced `refresh()` or `refreshUsage()` rejects rather than reaching the network. On a host outside the Upmind allowlist, the four tiles still answer while the usage read never leaves — `isLoadingUsage` reads `false`, not `true`.

### Every count is either a number or absent — never a promoted zero

None of the four stat tiles collapses "no data for the window" into `0`, and none promotes a real `0` into an absent value. `useContext().data` carries `number | null` per tile; `null` means the read has not resolved a count for the window, not that the count is zero.

> **👩‍💻 For Developers:** A tile reading `0` is a real answer — genuinely nothing of that kind this window. A tile reading `null` means the platform had nothing to report for the window at all. Rendering both the same way loses that distinction.

### Actor Types

The module uses the scoped composable pattern with `.as()`, but only one arm exists:

```typescript
import { ScopeActorTypes, useStats } from "@upmind-automation/headless";

// The only addressable path — the signed-in client, acting for themself
const stats = useStats().as(ScopeActorTypes.CLIENT);

// Naming a `.for()` context is a compile-time error for every actor
```

## Documentation

| Doc | Audience | Content |
| --- | --- | --- |
| **This README** | Everyone | Overview, concepts, quick start |
| [usage.md](./usage.md) | All devs | API reference for the composable, member by member |
| [architecture.md](./architecture.md) | Internal / contributors | Data flow, the shared identity seam, dependencies |
| [gotchas.md](./gotchas.md) | All | The sharp edges — the usage-panel drop, absent-vs-zero, report-key shrinkage |
| [foundation.md](./foundation.md) | Teams building against the Upmind back end on another stack | Framework-neutral platform spec: endpoints, payloads, failure modes |
| [CHANGELOG.md](./CHANGELOG.md) | All | Change history and porting notes |
| [parity.yaml](./parity.yaml) | Internal | The machine-readable parity record against the legacy client dashboard |

## How it is proven

The behaviour is written as scenarios in `__tests__/stats.feature` and replayed from verbatim staging recordings, one folder per scenario step under `__tests__/scenarios/`. One integration test, `stats.replay.int.test.ts`, plays them through the module's step catalog (`stats.steps.ts`); `stats.traceability.test.ts` checks that every scenario and every step definition match each other.

| Proven here, from a recording | Proven by another module, recorded as moved |
| --- | --- |
| The four counts; an absent count stays absent and a real zero stays zero; the ticket count is hidden when the brand turns support off; the usage `409` hides the usage block and is reported as a refusal; a real zero does not make the account empty; nothing is available when signed out | Per-count loading, abort on destroy, refetch and readiness, the session's package limits, and the scope resolving `self` to the signed-in client — owned by the `query`, `session-store` and `scope` modules |

Pure no-network checks stay beside it in `stats.utils.test.ts`. No scenario covers the usage success read, for the reason in [gotchas.md](./gotchas.md).

## Playground

A runnable demo of the composable is available in the labs playground:

```bash
cd playgrounds/labs-nuxt
pnpm dev
```

Then navigate to the `useStats` scenario page to see the module in action — the page draws the four tiles and, below them, the usage block's proven refusal state.

**Playground location:** `playgrounds/labs-nuxt/modules/scenarios/useStats/`

> **⚠️ No pipeline runs these playground proofs.** The playground carries the scenario page rendering the real component, the scenario declaration, and the layout, route and negative-controls checks that guard the scenario directory. They all pass locally, but no automated pipeline runs the playground's test projects — a later change here can break a page or a check without any pipeline going red. Treat a local pass as true for that day only, and re-run the checks by hand before you rely on them.

> **🔧 For Contributors:** When an Upmind-context success fixture becomes available, this scenario page is where the success-state proof lands first.
