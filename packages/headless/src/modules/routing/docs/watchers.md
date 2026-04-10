# Funnel Watchers

Watchers are reactive subscriptions that monitor application state and trigger navigation when conditions change. They run as **invoked callbacks** inside the funnel machine's `available` state.

## How Watchers Work

Think of watchers as **smoke detectors** — they sit quietly monitoring conditions, and sound the alarm (navigate) when something changes.

1. Funnel enters `available` → all watchers start
2. Watchers subscribe to reactive sources (session, basket)
3. When a condition is met → watcher calls `navigate()`
4. Funnel exits `available` → all watchers are cleaned up

## Watcher Interface

```typescript
type FunnelWatcher = {
  /** Unique identifier for debugging */
  id: string;
  /** Setup function — returns cleanup function */
  handler: FunnelWatcherHandler;
};

type FunnelWatcherHandler = () => () => void;
```

## Available Watchers

### `session-logout`

Detects when a user logs out and redirects to `SESSION_END`.

**Key implementation detail:** Uses `subscribe()` (direct XState service subscription) instead of Vue `watch()` because the watcher runs in a non-component context where Vue's reactivity may not detect all state transitions.

```typescript
const { subscribe, meta: sessionMeta } = useSession();

let wasAuthenticated = sessionMeta.value.isAuthenticated;

const { unsubscribe } = subscribe(state => {
  const isAuthenticated = stateMatches(state, "client");
  const didLogout = !isAuthenticated && wasAuthenticated;
  wasAuthenticated = isAuthenticated;

  if (!didLogout) return;

  if (routingMeta.value.isResolved) {
    navigate({ name: ROUTE.SESSION_END });
  } else {
    // Await resolution then navigate
    const stop = watch(routingMeta, ({ isResolved }) => {
      if (!isResolved) return;
      stop();
      navigate({ name: ROUTE.SESSION_END });
    });
  }
});

return unsubscribe;
```

> **🧪 For Testers:** Log in on `/basket/:bid`, then log out. Verify you are redirected to the session end page — not stuck on the basket or shown a login overlay.

### `basket-unavailable`

Detects when a basket becomes unavailable (e.g., expired, deleted) and redirects to `BASKET_UNAVAILABLE`.

**State tracking before gate:** The `wasUnavailable` flag is updated *before* the `isResolved` check. This ensures the transition is captured even when the funnel is still resolving.

```typescript
const stop = watch(basketMeta, ({ isUnavailable }) => {
  const becameUnavailable =
    isUnavailable && !wasUnavailable && sessionMeta.value.isAuthenticated;
  wasUnavailable = isUnavailable;

  if (!routingMeta.value.isResolved) return;
  if (becameUnavailable) navigate({ name: ROUTE.BASKET_UNAVAILABLE });
});
```

> **🧪 For Testers:** While on the basket page, delete or expire the basket from the admin. Verify the user is redirected to the unavailable page.

### `basket-empty`

Detects when a basket loses all its products and redirects to `BASKET_EMPTY`.

```typescript
const stop = watch(basketMeta, ({ hasProducts, isUnavailable, isCheckout, isComplete }) => {
  const becameEmpty =
    !isUnavailable && !hasProducts && hadProducts && !isCheckout && !isComplete;
  hadProducts = hasProducts;

  if (!routingMeta.value.isResolved) return;
  if (becameEmpty) navigate({ name: ROUTE.BASKET_EMPTY });
});
```

> **🧪 For Testers:** Add a product to the basket, then remove it. Verify you're redirected to the empty basket page.

## Registering Watchers

Watchers are registered per-funnel in the app's funnel configuration:

```typescript
// apps/cart/src/router/funnels/cart.ts
export default createFunnelConfig({
  id: "cart",
  watchers: [sessionLogout, basketUnavailable, basketEmpty],
  states: { ... }
});
```

## Critical Patterns

### State Tracking Before `isResolved` Gate

All watchers must track their state transition flags **before** checking `isResolved`. Otherwise, transitions that occur while the funnel is resolving are silently lost.

```typescript
// ✅ CORRECT — track state first, then gate
const becameEmpty = !hasProducts && hadProducts;
hadProducts = hasProducts;          // ← tracked before gate
if (!routingMeta.value.isResolved) return;
if (becameEmpty) navigate(...);

// ❌ WRONG — state update after gate skips unresolved transitions
if (!routingMeta.value.isResolved) return;  // ← gate blocks tracking
const becameEmpty = !hasProducts && hadProducts;
hadProducts = hasProducts;          // ← never reached when unresolved
```

### Subscribe vs Watch

Use `subscribe()` when Vue's `watch()` doesn't reliably fire in the watcher context:

| Method | Use When |
|--------|----------|
| `subscribe()` | Monitoring XState service transitions (e.g., session machine) |
| `watch()` | Monitoring Vue computed refs (e.g., basket meta) |
