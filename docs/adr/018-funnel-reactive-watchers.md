# ADR 018: Funnel Reactive Watchers

**Date:** March 2026
**Status:** Accepted (Implemented April 2026, FE-1365)
**Authors:** Dominic da Costa
**Related:** [ADR 005: XState State Management](./005-xstate-state-management.md), [ADR 017: Funnel Navigation via State Meta](./017-funnel-navigation-via-state-meta.md)

---

## Context

The funnel machine is purely **route-driven** — it only acts when a route change triggers a RESOLVE event. But real user flows also need **state-driven** reactions. When the user logs out, when the basket becomes empty, when a basket becomes unavailable — the app must navigate somewhere.

Currently, these reactions live as ad-hoc `watch()` blocks in app-level components:

```ts
import type { ComputedRef } from 'vue'
import { watch } from 'vue'
import type { RouteLocationNormalizedLoaded, Router } from 'vue-router'

enum ROUTE {
  BASKET_EMPTY = 'basket-empty',
  BASKET_UNAVAILABLE = 'basket-unavailable',
  SESSION_END = 'session-end'
}

declare const basketMeta: ComputedRef<{
  hasProducts: boolean
  isCheckout: boolean
  isComplete: boolean
  isUnavailable: boolean
}>
declare const sessionMeta: ComputedRef<{ isAuthenticated: boolean }>
declare const routingMeta: ComputedRef<{ isResolved: boolean }>
declare const router: Router
declare const route: RouteLocationNormalizedLoaded

// App.vue — imperative watchers OUTSIDE the funnel
watch([basketMeta, sessionMeta], ([basket, session], [prevBasket, prevSession]) => {
  if (!routingMeta.value.isResolved) return

  // Logout → redirect to session-end
  if (!session.isAuthenticated && prevSession.isAuthenticated) {
    return router.push({ name: ROUTE.SESSION_END })
  }

  // Basket unavailable → redirect
  if (basket.isUnavailable && !prevBasket.isUnavailable && session.isAuthenticated) {
    return router.replace({ name: ROUTE.BASKET_UNAVAILABLE })
  }

  // Basket emptied → redirect to the empty page
  if (
    !basket.hasProducts &&
    prevBasket.hasProducts &&
    !basket.isCheckout &&
    !basket.isComplete &&
    route.meta.actionEmptyBasket
  ) {
    return router.push({ name: ROUTE.BASKET_EMPTY })
  }
})
```

### Problems

1. **Bypasses the funnel** — `router.push()` directly, not through the RESOLVE pipeline
2. **Duplicated across apps** — cart, cart-nuxt, and any future app must independently copy these watchers
3. **Manual mutual exclusion** — watchers check `routingMeta.value.isResolved` themselves
4. **Untestable in isolation** — watchers are tied to component lifecycle
5. **Race conditions** — a watcher can fire `router.push()` during funnel resolution
6. **No single source of truth** — the funnel defines SESSION_END as a state, but the watcher navigates there imperatively

### Comparisons

| System | How they handle state-driven navigation |
|--------|----------------------------------------|
| **Angular** | Services subscribe to NgRx stores and call `Router.navigate()`. |
| **Remix** | `revalidate` mechanism re-runs loaders when external state changes. |
| **AWS Step Functions** | EventBridge triggers external events that start/modify workflows. |
| **XState Invoked Callbacks** | The `session-store.sync.ts` `authSubscription` pattern already exists. |

---

## Decision

Extend the funnel architecture with a **watcher subscription mechanism**. Watchers are registered alongside funnels and trigger navigation through the funnel machine's RESOLVE pipeline.

### Pattern: XState Invoked Callback

Reuses the existing pattern from `session-store/session-store.sync.ts`:

```ts
import { useActiveSession, useSessionStore } from '@upmind-automation/headless'

export const authSubscription = (
  callback: (event: { type: string }) => void,
  onReceive: (handler: (event: unknown) => void) => void
): (() => void) => {
  const { store } = useSessionStore().useInternals()

  onReceive(() => {
    // no-op — the parent machine sends this actor no events
  })

  return store.subscribe(() => {
    const { isAuthenticated } = useActiveSession().useMeta()
    if (!isAuthenticated.value) callback({ type: 'UNAUTHENTICATED' })
  })
}
```

### Type Definitions

```ts
// routing.types.ts — as shipped
export type FunnelWatcher = {
  /** Unique identifier for this watcher (e.g. 'session-logout') */
  id: string
  /** The invoked callback. Sets up the subscription, returns its cleanup. */
  handler: FunnelWatcherHandler
}

export type FunnelWatcherHandler = () => () => void
```

### Watcher Registration

```ts
import type { FunnelWatcher } from '@upmind-automation/headless'

declare const cartFunnel: { id: string }
declare const sessionLogoutWatcher: FunnelWatcher
declare const basketUnavailableWatcher: FunnelWatcher
declare const basketEmptiedWatcher: FunnelWatcher

export function registerFunnels() {
  return {
    defaultFunnel: 'cart',
    funnels: [cartFunnel],
    watchers: [sessionLogoutWatcher, basketUnavailableWatcher, basketEmptiedWatcher]
  }
}
```

### Mutual Exclusion

```
Route change → RESOLVE → resolved: false → watcher BLOCKED
Watcher fires → navigate() → RESOLVE → resolved: false → other watchers BLOCKED
```

### Route Execution Flow

```
BEFORE: watch fires → router.push() → funnel bypassed
AFTER:  watch fires → navigate() → RESOLVE → funnel guard → awaitResolved → router.push()
```

---

## Consequences

### Positive

1. **Single source of truth** — the funnel owns ALL navigation triggers
2. **Automatic mutual exclusion** — `context.resolved` flag blocks watchers during resolution
3. **App-agnostic** — watchers registered alongside funnel configs
4. **Testable** — pure function returning cleanup
5. **Cleanup for free** — XState invoked callback pattern handles it
6. **Removes code from components** — App.vue watcher blocks deleted

### Negative

1. **No direct `route` access** — the shipped handler takes no arguments, so a watcher reads route state through `useRoutingEngine()`
2. **Array order = priority** — no explicit priority system

---

## Files Modified

| Package | File | Change |
|---------|------|--------|
| `headless` | `routing/types.ts` | Add `FunnelWatcher`, `FunnelWatcherHandler` |
| `headless` | `routing/funnel.machine.ts` | Add `watcherSubscription` invoke |
| `headless` | `routing/services.ts` | Add `watcherSubscription` service |
| `headless` | `routingEngine.machine.ts` | Store `watchers` from REGISTER |
| `cart` | `router/funnels/index.ts` | Return `watchers` |
| `cart` | `router/watchers/*.ts` | NEW — 3 watcher files |
| `cart` | `App.vue` | REMOVE watcher block |
| `cart-nuxt` | `layouts/default.vue` | REMOVE watcher block |

---

## Implementation Notes (April 2026)

Discovered during FE-1365 implementation:

### Subscribe vs Watch for XState Transitions

Vue `watch()` on computed `sessionMeta` does **not** reliably detect XState state transitions in the non-component watcher context (invoked callback). The `sessionLogout` watcher uses `subscribe()` (direct XState service subscription) instead.

```ts
import {
  useActiveSession,
  useRoutingEngine,
  useSessionStore
} from '@upmind-automation/headless'
import type { FunnelWatcher } from '@upmind-automation/headless'
import { watch } from 'vue'

enum ROUTE {
  SESSION_END = 'session-end'
}

export const sessionLogout: FunnelWatcher = {
  id: 'session-logout',
  handler: () => {
    const { meta: routingMeta, navigate } = useRoutingEngine()
    const { isAuthenticated } = useActiveSession().useMeta()
    const { store } = useSessionStore().useInternals()

    // ❌ Unreliable here — a computed watch misses transitions in the
    //    invoked-callback context.
    const stop = watch(isAuthenticated, authed => {
      if (!authed && routingMeta.value.isResolved) navigate({ name: ROUTE.SESSION_END })
    })

    // ✅ Direct store subscription — fires on every transition
    const unsubscribe = store.subscribe(() => {
      if (!isAuthenticated.value && routingMeta.value.isResolved) {
        navigate({ name: ROUTE.SESSION_END })
      }
    })

    return () => {
      stop()
      unsubscribe()
    }
  }
}
```

Basket watchers still use Vue `watch()` since they observe Vue computed refs that fire reliably.

### State Tracking Before Resolution Gate

All watchers must update tracking flags **before** the `isResolved` gate. Otherwise, transitions occurring while the funnel is unresolved are silently lost:

```ts
import type { ComputedRef } from 'vue'

declare const routingMeta: ComputedRef<{ isResolved: boolean }>
declare const isAuthenticated: boolean
declare function navigate(target: { name: string }): Promise<void>

let wasAuthenticated = true

// ✅ Track first, gate second
export function correct() {
  const didLogout = !isAuthenticated && wasAuthenticated
  wasAuthenticated = isAuthenticated // tracked BEFORE the gate

  if (!routingMeta.value.isResolved) return
  if (didLogout) navigate({ name: 'session-end' })
}

// ❌ Gate blocks tracking — transitions that happen while unresolved are lost
export function wrong() {
  if (!routingMeta.value.isResolved) return
  wasAuthenticated = isAuthenticated // never reached when unresolved
}
```

---

## Related Documents

- [ADR 005: XState State Management](./005-xstate-state-management.md)
- [ADR 017: Funnel Navigation via State Meta](./017-funnel-navigation-via-state-meta.md)
- Linear: [FE-2546](https://linear.app/upmind-automation/issue/FE-2546)
- Linear: [FE-2581](https://linear.app/upmind-automation/issue/FE-2581)
- Linear: [FE-1365](https://linear.app/upmind-automation/issue/FE-1365)
