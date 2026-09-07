# Gotchas — Routing Module

## 1. Vue `watch()` Misses Session Transitions in Non-Component Context

**Problem:** Vue `watch()` on a computed ref (like the session's `isAuthenticated`) may not fire for every session transition when the watcher runs inside a funnel machine's invoked callback (non-component context).

**Symptoms:** Logout on `/basket/:bid` doesn't redirect. The watcher never sees the authenticated → unauthenticated edge.

**Fix:** Subscribe to the session store's own logout event instead of diffing a ref:

```typescript
import {
  useActiveSession,
  useRoutingEngine
} from "@upmind-automation/headless";
import { watch } from "vue";

enum ROUTE {
  SESSION_END = "session-end"
}

const { navigate } = useRoutingEngine();
const { isAuthenticated } = useActiveSession().useMeta();
const { onLogout } = useActiveSession().useActions();

// ❌ Unreliable in non-component context
const stop = watch(isAuthenticated, authenticated => {
  if (!authenticated) navigate({ name: ROUTE.SESSION_END });
});

// ✅ Reliable — subscribe to the session store's own logout event
const unsubscribe = onLogout(() => {
  navigate({ name: ROUTE.SESSION_END });
});
```

> **🧪 For Testers:** After any watcher change, test logout from every route type (basket, checkout, product page).

---

## 2. State Tracking Must Precede the `isResolved` Gate

**Problem:** If a transition flag such as `wasUnavailable` or `hadProducts` is updated _after_ the `isResolved` check, transitions that occur while the funnel is unresolved are silently lost.

**Symptoms:** A basket going unavailable during initial page load doesn't trigger the redirect. A basket becoming empty during the auth flow is missed.

**Fix:** Always update tracking flags before the gate:

```typescript
import {
  useActiveSession,
  useBasket,
  useRoutingEngine
} from "@upmind-automation/headless";
import { watch } from "vue";

enum ROUTE {
  BASKET_UNAVAILABLE = "basket-unavailable"
}

const { meta: routingMeta, navigate } = useRoutingEngine();
const { meta: basketMeta } = useBasket();
const { isAuthenticated } = useActiveSession().useMeta();

let wasUnavailable = basketMeta.value.isUnavailable;

// ✅ Track first, gate second
watch(basketMeta, ({ isUnavailable }) => {
  const becameUnavailable =
    isUnavailable && !wasUnavailable && isAuthenticated.value;
  wasUnavailable = isUnavailable; // ← before gate
  if (!routingMeta.value.isResolved) return;
  if (becameUnavailable) navigate({ name: ROUTE.BASKET_UNAVAILABLE });
});

// ❌ Gate blocks tracking
watch(basketMeta, ({ isUnavailable }) => {
  if (!routingMeta.value.isResolved) return;
  wasUnavailable = isUnavailable; // ← never reached when unresolved
});
```

---

## 3. An `extends` Override Owns the Whole State Node

**Problem:** Declaring a state key in a funnel that `extends` another replaces the base's node wholesale — it does not deep-merge. Parts you omit are gone, not inherited.

**Symptoms:** A `NEXT` transition, an `entry` action, or a `meta.prev` that "worked in the base funnel" silently stops working in the variant.

**Fix:** Restate every part of the node you still want, or omit the key entirely to inherit it untouched:

```typescript
import type { FunnelProps } from "@upmind-automation/headless";

enum ROUTE {
  BASKET = "basket",
  CHECKOUT = "checkout",
  ORDER = "order",
  SESSION = "session"
}

// ❌ Loses the base node's `meta`, `entry` and `on.NEXT`
const lossy = <FunnelProps>{
  id: "one-page",
  extends: "cart",
  states: {
    [ROUTE.CHECKOUT]: {
      invoke: {
        src: "guardCheckout",
        onError: [{ target: ROUTE.SESSION, cond: "isSession" }]
      }
    }
  }
};

// ✅ Restates the whole node
const complete = <FunnelProps>{
  id: "one-page",
  extends: "cart",
  states: {
    [ROUTE.CHECKOUT]: {
      meta: { prev: ROUTE.BASKET },
      entry: ["setCurrency", "setBasket", "setBillingDefaults"],
      invoke: {
        src: "guardCheckout",
        onDone: { actions: ["setResolved"] },
        onError: [
          {
            target: ROUTE.SESSION,
            actions: ["setUnresolved", "setTargetRoute"],
            cond: "isSession"
          },
          { target: ROUTE.BASKET, actions: ["setUnresolved", "clearTarget"] }
        ]
      },
      on: { NEXT: { target: ROUTE.ORDER, actions: ["setResolved"] } }
    }
  }
};
```

Arrays are swapped, never concatenated — `invoke.onError` is an ordered "first matching `cond` wins" list, so appending the base's entries would re-add the very transitions the variant exists to remove.

> **🧪 For Testers:** After adding an `extends` override, exercise NEXT/BACK on that route in the variant funnel, not just the base.
