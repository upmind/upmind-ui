# stats Usage & API

## Composable Structure

`useStats` is ONE composable carrying TWO concerns, in the usual four-layer shape:

```typescript
import { ScopeActorTypes, useStats } from "@upmind-automation/headless";

const stats = useStats().as(ScopeActorTypes.CLIENT);

const context = stats.useContext(); // The published data
const meta = stats.useMeta(); // State flags
const actions = stats.useActions(); // Lifecycle
const internals = stats.useInternals(); // Debug: raw query access
```

It accepts no `.for()` context — naming one is a compile-time error for every actor, including `staff`.

**Read the member table below by its column: TILES, USAGE or SHARED.** The usage read is gated on the Upmind host context and the four tile reads are not, so their flags are never merged. A shared `isLoading` would hold a spinner that can never resolve on a non-Upmind host, and a shared `hasError` would report a `409` refusal as a tile failure.

## Context

```typescript
import { ScopeActorTypes, useStats } from "@upmind-automation/headless";

const stats = useStats().as(ScopeActorTypes.CLIENT);

const { data, error, usageError } = stats.useContext();
```

| Value | Concern | Type | Description |
| --- | --- | --- | --- |
| `data.totalOrders` / `.totalInvoices` / `.unpaidInvoices` / `.activeTickets` | TILES | `number \| null` | The four published counts. `null` per tile means no data for the window — never coalesced to `0` |
| `data.usage` | USAGE | `undefined` | The usage data itself is a signed parity drop — this stays `undefined` on every reachable branch today |
| `error` | TILES | `ResponseError \| undefined` | The first failed tile's captured error, read-only |
| `usageError` | USAGE | `ResponseError \| undefined` | The usage read's captured error — the recorded `409` refusal, on every reachable branch |

## Meta

```typescript
import { ScopeActorTypes, useStats } from "@upmind-automation/headless";

const stats = useStats().as(ScopeActorTypes.CLIENT);

const {
  // TILES
  isLoadingTotalOrders,
  isLoadingTotalInvoices,
  isLoadingUnpaidInvoices,
  isLoadingActiveTickets,
  isLoading,
  hasError,
  isEmpty,
  isVisible,
  hasVisibilityError,
  // USAGE
  isLoadingUsage,
  hasUsageError,
  isUsageVisible,
  // SHARED
  isAvailable
} = stats.useMeta();
```

| Flag | Concern | Description |
| --- | --- | --- |
| `isLoadingTotalOrders` … `isLoadingActiveTickets` | TILES | That one tile read is loading or has not completed its first fetch |
| `isLoading` | TILES | Any of the four tile reads is loading or has not completed its first fetch. The usage read is NOT in this aggregate |
| `hasError` | TILES | Any of the four tile reads failed |
| `isEmpty` | TILES | None of the four tiles has resolved a number, and none has failed. A real `0` is a number, so it reads `false`; a failed read reads `false` too. Only the four tile reads feed it, never the usage read |
| `isVisible` | TILES | The active-tickets tile should be shown — `false` only when the brand has explicitly disabled the support system |
| `hasVisibilityError` | TILES | The brand-config read behind `isVisible` failed — `isVisible` still reads `true` in this case (fails open) |
| `isLoadingUsage` | USAGE | The usage read is loading or has not completed its first fetch, AND the host is an Upmind one. Off the allowlist it reads `false`, because nothing will load |
| `hasUsageError` | USAGE | The usage read failed |
| `isUsageVisible` | USAGE | `true` only after a **successful, settled** usage read — a refusal, an unsettled read and a gated-off read all read `false` |
| `isAvailable` | SHARED | The session is authenticated and a client id resolved — the same predicate every request gate reads |

## Actions

```typescript
import { ScopeActorTypes, useStats } from "@upmind-automation/headless";

const stats = useStats().as(ScopeActorTypes.CLIENT);

const {
  // TILES
  isReady,
  refresh,
  reset,
  // USAGE
  isUsageReady,
  refreshUsage,
  resetUsage,
  // SHARED
  destroy
} = stats.useActions();
```

```typescript
import { ScopeActorTypes, useStats } from "@upmind-automation/headless";

const stats = useStats().as(ScopeActorTypes.CLIENT);
const {
  isReady,
  refresh,
  reset,
  isUsageReady,
  refreshUsage,
  resetUsage,
  destroy
} = stats.useActions();

// TILES — resolves once all four tiles have settled their first fetch.
// Resolves `false` if the session settles without an addressable client — always SETTLES.
await isReady();

// TILES — forces a fresh re-read of all four tiles.
// Throws if the session cannot address a client.
await refresh();

// TILES — drops the cached counts for this scope.
reset();

// USAGE — resolves once the usage read has settled. A 409 refusal still counts as
// "settled" and resolves `false`. Off the Upmind allowlist it returns `false`
// immediately rather than waiting for a fetch that never fires.
await isUsageReady();

// USAGE — forces a fresh re-read of the usage block.
// Throws if the session cannot address a client.
await refreshUsage();

// USAGE — drops the usage read's cached data.
resetUsage();

// SHARED — removes this scoped instance from the registry.
destroy();
```

## Internals

```typescript
import { ScopeActorTypes, useStats } from "@upmind-automation/headless";

const stats = useStats().as(ScopeActorTypes.CLIENT);

const { actorScope, queries, usageQuery } = stats.useInternals();
// queries:    { totalOrders, totalInvoices, unpaidInvoices, activeTickets } — TILES
// usageQuery: the raw query object backing the host-gated usage read — USAGE
```

## Vue Component Integration

```vue
<template>
  <div v-if="isLoading">Loading...</div>
  <div v-else-if="hasError">Something went wrong.</div>
  <dl v-else>
    <dt>Total orders</dt>
    <dd>{{ data.totalOrders ?? "—" }}</dd>
    <dt>Total invoices</dt>
    <dd>{{ data.totalInvoices ?? "—" }}</dd>
    <dt>Unpaid invoices</dt>
    <dd>{{ data.unpaidInvoices ?? "—" }}</dd>
    <dt v-if="isVisible">Active tickets</dt>
    <dd v-if="isVisible">{{ data.activeTickets ?? "—" }}</dd>
  </dl>

  <!-- The usage block reads its OWN flags, never the tiles' -->
  <div v-if="isLoadingUsage">Loading usage...</div>
  <div v-else-if="isUsageVisible">
    <!-- Not reachable with any account this module has been proven against —
         no success layout exists to render yet. -->
  </div>
  <div v-else>
    <!-- The refusal, or a host outside the Upmind allowlist — the only
         reachable states today. -->
    {{ usageError?.message ?? "No usage block on this host." }}
  </div>
</template>

<script setup>
const stats = useStats().as(ScopeActorTypes.CLIENT);
const { data, usageError } = stats.useContext();
const { isLoading, hasError, isVisible, isLoadingUsage, isUsageVisible } =
  stats.useMeta();
</script>
```

## Lifecycle

```typescript
import { onUnmounted } from "vue";
import { ScopeActorTypes, useStats } from "@upmind-automation/headless";

const stats = useStats().as(ScopeActorTypes.CLIENT);

// Wait for all four tiles to settle their first fetch
await stats.useActions().isReady();

// The usage half settles on its own clock
await stats.useActions().isUsageReady();

// Clean up when done (stops the reads and removes the instance from the registry)
onUnmounted(() => stats.useActions().destroy());
```
