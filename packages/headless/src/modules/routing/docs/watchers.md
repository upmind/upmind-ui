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

**Key implementation detail:** Subscribes to the session store's own logout event via `useActiveSession().useActions().onLogout()` rather than a Vue `watch()` on session meta. The watcher runs in a non-component context, where a `watch()` on a computed ref may not fire for every session transition; `onLogout` is a direct store subscription and always does.

```typescript
import {
  useActiveSession,
  useRoutingEngine
} from "@upmind-automation/headless";
import { watch } from "vue";
import type { FunnelWatcher } from "@upmind-automation/headless";

// The app owns its route-name enum.
enum ROUTE {
  SESSION_END = "session-end"
}

export const sessionLogout: FunnelWatcher = {
  id: "session-logout",
  handler: () => {
    const { meta: routingMeta, navigate } = useRoutingEngine();
    const { onLogout } = useActiveSession().useActions();

    const unsubscribe = onLogout(() => {
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
  }
};
```

> **🧪 For Testers:** Log in on `/basket/:bid`, then log out. Verify you are redirected to the session end page — not stuck on the basket or shown a login overlay.

### `basket-unavailable`

Detects when a basket becomes unavailable (e.g., expired, deleted) and redirects to `BASKET_UNAVAILABLE`.

**State tracking before gate:** The `wasUnavailable` flag is updated _before_ the `isResolved` check. This ensures the transition is captured even when the funnel is still resolving.

```typescript
import {
  useActiveSession,
  useBasket,
  useRoutingEngine
} from "@upmind-automation/headless";
import { watch } from "vue";
import type { FunnelWatcher } from "@upmind-automation/headless";

enum ROUTE {
  BASKET_UNAVAILABLE = "basket-unavailable"
}

export const basketUnavailable: FunnelWatcher = {
  id: "basket-unavailable",
  handler: () => {
    const { meta: routingMeta, navigate } = useRoutingEngine();
    const { meta: basketMeta } = useBasket();
    const { isAuthenticated } = useActiveSession().useMeta();

    let wasUnavailable = basketMeta.value.isUnavailable;

    const stop = watch(basketMeta, ({ isUnavailable }) => {
      const becameUnavailable =
        isUnavailable && !wasUnavailable && isAuthenticated.value;
      wasUnavailable = isUnavailable;

      if (!routingMeta.value.isResolved) return;
      if (becameUnavailable) navigate({ name: ROUTE.BASKET_UNAVAILABLE });
    });

    return stop;
  }
};
```

> **🧪 For Testers:** While on the basket page, delete or expire the basket from the admin. Verify the user is redirected to the unavailable page.

### `basket-empty`

Detects when a basket loses all its products and redirects to `BASKET_EMPTY`. `isLoading` is part of the condition: a basket mid-load reports no products, and firing on that would redirect away from a basket that is about to arrive.

```typescript
import { useBasket, useRoutingEngine } from "@upmind-automation/headless";
import { watch } from "vue";
import type { FunnelWatcher } from "@upmind-automation/headless";

enum ROUTE {
  BASKET_EMPTY = "basket-empty"
}

export const basketEmpty: FunnelWatcher = {
  id: "basket-empty",
  handler: () => {
    const { meta: routingMeta, navigate } = useRoutingEngine();
    const { meta: basketMeta } = useBasket();

    let hadProducts = basketMeta.value.hasProducts;

    const stop = watch(
      basketMeta,
      ({ hasProducts, isLoading, isUnavailable, isCheckout, isComplete }) => {
        const becameEmpty =
          !isLoading &&
          !isUnavailable &&
          !hasProducts &&
          hadProducts &&
          !isCheckout &&
          !isComplete;
        hadProducts = hasProducts;

        if (!routingMeta.value.isResolved) return;
        if (becameEmpty) navigate({ name: ROUTE.BASKET_EMPTY });
      }
    );

    return stop;
  }
};
```

> **🧪 For Testers:** Add a product to the basket, then remove it. Verify you're redirected to the empty basket page.

## Registering Watchers

Watchers are registered **once, engine-wide** on the `register()` call — not per funnel. `FunnelProps` has no `watchers` key; the engine holds the list in its own context and passes it into whichever funnel is active, so every funnel gets the same set.

```typescript
import { useRoutingEngine } from "@upmind-automation/headless";
import type { FunnelProps, FunnelWatcher } from "@upmind-automation/headless";

declare const cart: FunnelProps;
declare const sessionLogout: FunnelWatcher;
declare const basketUnavailable: FunnelWatcher;
declare const basketEmpty: FunnelWatcher;

useRoutingEngine().register({
  defaultFunnel: "cart",
  funnels: { cart },
  watchers: [sessionLogout, basketUnavailable, basketEmpty]
});
```

## Critical Patterns

### State Tracking Before `isResolved` Gate

All watchers must track their state transition flags **before** checking `isResolved`. Otherwise, transitions that occur while the funnel is resolving are silently lost.

```typescript
import { useBasket, useRoutingEngine } from "@upmind-automation/headless";
import { watch } from "vue";

enum ROUTE {
  BASKET_EMPTY = "basket-empty"
}

const { meta: routingMeta, navigate } = useRoutingEngine();
const { meta: basketMeta } = useBasket();

let hadProducts = basketMeta.value.hasProducts;

// ✅ CORRECT — track state first, then gate
watch(basketMeta, ({ hasProducts }) => {
  const becameEmpty = !hasProducts && hadProducts;
  hadProducts = hasProducts; // ← tracked before gate
  if (!routingMeta.value.isResolved) return;
  if (becameEmpty) navigate({ name: ROUTE.BASKET_EMPTY });
});

// ❌ WRONG — state update after gate skips unresolved transitions
watch(basketMeta, ({ hasProducts }) => {
  if (!routingMeta.value.isResolved) return; // ← gate blocks tracking
  const becameEmpty = !hasProducts && hadProducts;
  hadProducts = hasProducts; // ← never reached when unresolved
  if (becameEmpty) navigate({ name: ROUTE.BASKET_EMPTY });
});
```

### Store Subscription vs Watch

Use a direct store subscription when Vue's `watch()` doesn't reliably fire in the watcher context:

| Method       | Use When                                                                      |
| ------------ | ----------------------------------------------------------------------------- |
| `onLogout()` | Monitoring a discrete session event (logout) from a non-component context     |
| `watch()`    | Monitoring Vue computed refs (e.g. basket meta), where a transition is a diff |
