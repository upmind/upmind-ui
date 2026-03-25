# ADR 018: Funnel Reactive Watchers

**Date:** March 2026
**Status:** Proposed
**Authors:** Dominic da Costa
**Related:** [ADR 005: XState State Management](./005-xstate-state-management.md), [ADR 017: Funnel Navigation via State Meta](./017-funnel-navigation-via-state-meta.md)

---

## Context

The funnel machine is purely **route-driven** — it only acts when a route change triggers a RESOLVE event. But real user flows also need **state-driven** reactions. When the user logs out, when the basket becomes empty, when a basket becomes unavailable — the app must navigate somewhere.

Currently, these reactions live as ad-hoc `watch()` blocks in app-level components:

```typescript
// App.vue — imperative watchers OUTSIDE the funnel
watch([basketMeta, sessionMeta], ([basket, session], [prevBasket, prevSession]) => {
  if (!routingMeta.value.isResolved) return;

  // Logout → redirect to session-end
  if (!session.isAuthenticated && prevSession.isAuthenticated) {
    return router.push({ name: ROUTE.SESSION_END });
  }

  // Basket unavailable → redirect
  if (basket.isUnavailable && !prevBasket.isUnavailable && session.isAuthenticated) {
    return router.replace({ name: ROUTE.BASKET_UNAVAILABLE });
  }

  // Basket emptied → redirect to empty page
  if (!basket.hasProducts && prevBasket.hasProducts && !basket.isCheckout && !basket.isComplete) {
    if (route.meta.actionEmptyBasket) return router.push({ name: ROUTE.BASKET_EMPTY });
  }
});
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
| **XState Invoked Callbacks** | The `session/helper.ts` `authSubscription` pattern already exists. |

---

## Decision

Extend the funnel architecture with a **watcher subscription mechanism**. Watchers are registered alongside funnels and trigger navigation through the funnel machine's RESOLVE pipeline.

### Pattern: XState Invoked Callback

Reuses the existing pattern from `session/helper.ts`:

```typescript
export const authSubscription = async (callback, onReceive) => {
  const { subscribe } = useSession();
  const subscription = subscribe(state => {
    if (stateMatches(state, ['expired'])) {
      callback({ type: 'UNAUTHENTICATED' });
    }
  });
  return () => subscription.unsubscribe();
};
```

### Type Definitions

```typescript
export type FunnelWatcher = {
  id: string;
  description?: string;
  subscribe: FunnelWatcherSubscribe;
};

export type FunnelWatcherSubscribe = (
  navigate: (target: FunnelTarget) => Promise<void>,
  context: () => FunnelContext
) => () => void;
```

### Watcher Registration

```typescript
export function registerFunnels() {
  return {
    defaultFunnel: "cart",
    funnels: [cartFunnel],
    watchers: [
      sessionLogoutWatcher,
      basketUnavailableWatcher,
      basketEmptiedWatcher
    ]
  };
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

1. **No direct `route` access** — watchers use `context.currentRoute?.meta`
2. **Array order = priority** — no explicit priority system

---

## Files Modified

| Package | File | Change |
|---------|------|--------|
| `headless` | `routing/types.ts` | Add `FunnelWatcher`, `FunnelWatcherSubscribe` |
| `headless` | `routing/funnel.machine.ts` | Add `watcherSubscription` invoke |
| `headless` | `routing/services.ts` | Add `watcherSubscription` service |
| `headless` | `routingEngine.machine.ts` | Store `watchers` from REGISTER |
| `cart` | `router/funnels/index.ts` | Return `watchers` |
| `cart` | `router/watchers/*.ts` | NEW — 3 watcher files |
| `cart` | `App.vue` | REMOVE watcher block |
| `cart-nuxt` | `layouts/default.vue` | REMOVE watcher block |

---

## Related Documents

- [ADR 005: XState State Management](./005-xstate-state-management.md)
- [ADR 017: Funnel Navigation via State Meta](./017-funnel-navigation-via-state-meta.md)
- Linear: [FE-2546](https://linear.app/upmind-automation/issue/FE-2546)
- Linear: [FE-2581](https://linear.app/upmind-automation/issue/FE-2581)
