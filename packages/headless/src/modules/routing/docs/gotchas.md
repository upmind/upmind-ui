# Gotchas — Routing Module

## 1. Vue `watch()` Misses XState Transitions in Non-Component Context

**Problem:** Vue `watch()` on a computed ref (like `sessionMeta`) may not fire for all XState state transitions when the watcher runs inside a funnel machine's invoked callback (non-component context).

**Symptoms:** Logout on `/basket/:bid` doesn't redirect. Watcher INIT shows `wasAuthenticated: false` even when the user is logged in.

**Fix:** Use `subscribe()` (direct XState service subscription) instead of Vue `watch()`:

```typescript
// ❌ Unreliable in non-component context
const stop = watch(sessionMeta, ({ isAuthenticated }) => { ... });

// ✅ Reliable — direct XState subscription
const { unsubscribe } = subscribe(state => {
  const isAuthenticated = stateMatches(state, "client");
  ...
});
```

> **🧪 For Testers:** After any watcher change, test logout from every route type (basket, checkout, product page).

---

## 2. State Tracking Must Precede the `isResolved` Gate

**Problem:** If `wasAuthenticated` / `wasUnavailable` / `hadProducts` is updated _after_ the `isResolved` check, transitions that occur while the funnel is unresolved are silently lost.

**Symptoms:** Logout during initial page load doesn't trigger redirect. Basket becoming empty during auth flow is missed.

**Fix:** Always update tracking flags before the gate:

```typescript
// ✅ Track first, gate second
const didLogout = !isAuthenticated && wasAuthenticated;
wasAuthenticated = isAuthenticated; // ← before gate
if (!routingMeta.value.isResolved) return;

// ❌ Gate blocks tracking
if (!routingMeta.value.isResolved) return;
wasAuthenticated = isAuthenticated; // ← never reached when unresolved
```

---

## 3. An `extends` Override Owns the Whole State Node

**Problem:** Declaring a state key in a funnel that `extends` another replaces the base's node wholesale — it does not deep-merge. Parts you omit are gone, not inherited.

**Symptoms:** A `NEXT` transition, an `entry` action, or a `meta.prev` that "worked in the base funnel" silently stops working in the variant.

**Fix:** Restate every part of the node you still want, or omit the key entirely to inherit it untouched:

```typescript
// ❌ Loses the base node's `on.NEXT` and `entry`
[ROUTE.CHECKOUT]: { invoke: { src: "guardCheckout", onError: [...] } }

// ✅ Restates the whole node
[ROUTE.CHECKOUT]: {
  meta: { prev: ROUTE.BASKET },
  entry: ["setCurrency", "setBasket"],
  invoke: { src: "guardCheckout", onError: [...] },
  on: { NEXT: { ... } }
}
```

Arrays are swapped, never concatenated — `invoke.onError` is an ordered "first matching `cond` wins" list, so appending the base's entries would re-add the very transitions the variant exists to remove.

> **🧪 For Testers:** After adding an `extends` override, exercise NEXT/BACK on that route in the variant funnel, not just the base.
