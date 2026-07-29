# ADR 023: Funnel Inheritance via `extends`

**Date:** July 2026
**Status:** Accepted
**Authors:** Dominic da Costa
**Related:** [ADR 005: XState State Management](./005-xstate-state-management.md), [ADR 017: Funnel Navigation via State Meta](./017-funnel-navigation-via-state-meta.md), [ADR 018: Funnel Reactive Watchers](./018-funnel-reactive-watchers.md)

---

## Context

The routing engine invokes exactly one funnel at a time. A funnel that reaches its `complete` final state hands control back, and the engine loads the next one — the funnel it names in the completion payload, or the registered default.

That model fits **disjoint** journeys. The domains funnel owns two transitional states, resolves a product configuration, and hands back to the cart funnel; nothing is shared and nothing needs to be.

It breaks down for a **variant** — a journey identical to the standard one except for how a handful of routes behave. One-page checkout is the archetype: billing, product setup and payment render inline on a single page instead of on standalone pages. That is the whole difference. Every other route — catalogue, product, product-configure, recommendations, basket, session, order — is unchanged.

As a peer funnel, one-page had three options, all bad:

1. **Declare only the divergent states.** The funnel then owns `checkout` and nothing else. Any other route falls through `RESOLVE` to the `idle` catch-all, `isUnsupportedRoute` fires, the funnel completes, and the engine reloads the default. The variant is evicted on the first route it does not own — including on cold start, where a `?funnel=one-page` deep link is undone within the same navigation.
2. **Copy the base funnel wholesale.** ~700 lines duplicated so that four `onError` entries can differ. Every subsequent change to the cart flow has to be mirrored by hand, and nothing enforces that it is.
3. **Collapse the variant into the base.** Add an `isOnePage` guard to the divergent transitions inside the cart funnel. This keeps one funnel but mixes two journeys in one state chart, and the "which flow am I reading" question has to be answered per transition.

A fourth option was considered and rejected: **persisting the `?funnel=` query param** across navigations so the switch survives. That invents a storage mechanic to compensate for a modelling gap, and leaves the variant still unable to serve the routes it does not declare.

## Decision

**A funnel may declare `extends: '<funnelId>'`. Its config is flattened base-first before the machine factory runs.**

```typescript
export default <FunnelProps>{
  id: "one-page",
  extends: FUNNEL.CART,
  states: {
    // the all-in-one page absorbs what the stepped flow diverts away to
    [ROUTE.BILLING]: { always: [{ target: ROUTE.CHECKOUT }] },
    [ROUTE.BASKET_PRODUCTS_SETUP]: { always: [{ target: ROUTE.CHECKOUT }] },
    [ROUTE.CHECKOUT]: {
      /* the one node that genuinely diverges */
    }
  }
};
```

### Where composition happens

`prepare()` — the routing engine's funnel-selection service — is already a composition point: it layers overlay endpoint states over a funnel's own before handing the result to the factory. Inheritance is a **third layer in that existing merge**, not a new mechanism. The funnel machine, the routing engine and the registry are unchanged.

```text
funnels registry
  → extendFunnel()        flatten the extends chain, base-first
  → createEndpointNodes() overlay endpoint states
  → useFunnelMachine()    factory
```

`extendFunnel` runs first so endpoint generation sees the full inherited state set when deciding overlay eligibility. Endpoint states still spread last so `RESOLVE` evaluates app guards before endpoint guards.

### Merge semantics

| Key                               | Behaviour                                                            |
| :-------------------------------- | :------------------------------------------------------------------- |
| `states`                          | Per key. A key the variant declares **replaces the base node whole** |
| `guards` / `services` / `actions` | Per key. The variant's entry wins on a name collision                |
| `context`                         | Per key. The variant's value wins on a key collision                 |

**A declared state node is all-or-nothing.** There is no partial override: declare a state key and you own its `meta`, `entry`, `invoke` and `on` in full; omit the key and you inherit the base node untouched.

This is deliberate. A state node's transition lists are ordered decision ladders — `invoke.onError` resolves first-matching-`cond`-wins — so a deep merge would overlay them slot-by-slot and leave the base's trailing entries dangling, silently restoring the exact transitions the variant exists to remove. Concatenating is worse: the entries are distinct objects, so no uniqueness check can spot them as duplicates. Arrays are therefore swapped whole.

The cost is restatement in an overriding node. The benefit is that a node's behaviour is readable from one file.

### Where the starting funnel is chosen

Inheritance settles a second question that had no clean answer while variants were peers: **how a brand starts on one.**

There is exactly one selection point — `defaultFunnel`, at registration. `initRouter()` runs after `useBrand()`, `useSystem()` and `useSession()` have resolved, so brand config is fully available when the app's `registerFunnels()` executes; a brand-conditional starting funnel is a plain read at that moment.

```typescript
export const registerFunnels = () => ({
  defaultFunnel: getDefaultFunnel(), // reads brand config — already loaded
  funnels: { cart, "one-page": onePage, domains },
  overlays: CART_OVERLAYS,
  watchers
});
```

This only became viable with `extends`. As a peer, a one-page default was self-defeating: it would be selected correctly and then evict itself on the first route it did not declare. Inheriting the base's routes is what makes config-driven selection hold for the whole session.

`?funnel=` remains the **runtime override** — a deliberate switch away from the brand's default — not the mechanism by which the default is chosen. It needs no persistence: the engine holds `currentFunnel` across navigations, and an inheriting variant no longer evicts itself.

Rejected alternatives: branching inside a loader state (fires on one route, re-derives per navigation what is decided once per session), and handing over from `CHECKOUT_FLOW` on startup (late — the variant is absent for every route before checkout).

### Chains and failure modes

Chains nest to any depth (`express` → `one-page` → `cart`) and resolve deepest-layer-wins. `extendFunnel` is pure — it never mutates a registry entry and returns a fresh object per call, so repeated `prepare()` runs are byte-identical.

An unregistered base id or a circular chain throws a `DetailedError`, surfaced through `prepare`'s `onError`: the engine lands in `idle` with the error set, rather than blowing the stack on boot.

## Consequences

### Positive

- A variant funnel declares only its divergence. One-page dropped from a full peer funnel to three state overrides.
- Base-flow changes propagate to variants automatically; there is nothing to mirror by hand.
- A variant can serve every route the base serves, so a `?funnel=` switch survives navigation without any param-persistence mechanic — the engine's `currentFunnel` already holds across navigations, and the variant no longer evicts itself.
- No change to the funnel machine, the routing engine, or funnel registration. Funnels without `extends` return the identical object reference and are unaffected.

### Negative

- An overriding state node must restate everything it keeps. Omitting `on.NEXT` from an override silently drops that transition — the failure is quiet, which is why it is called out in the module gotchas.
- Reading a deep chain means reading every layer to know a funnel's full state set.
- The registry is now order-sensitive in one respect: a base funnel must be registered for a variant that names it to load at all.

### Neutral

- Peer funnels and inheritance coexist. Sequencing (domains → cart) still uses completion handover; inheritance is only for variants.

## Files Modified

| File                                                                   | Change                                                                 |
| :--------------------------------------------------------------------- | :--------------------------------------------------------------------- |
| `packages/headless/src/modules/routing/types.ts`                       | `FunnelProps.extends`; `FunnelContext.funnel`; `FunnelResponse.funnel` |
| `packages/headless/src/modules/routing/utils.ts`                       | `extendFunnel()` — chain flattening, cycle detection                   |
| `packages/headless/src/modules/routing/services.ts`                    | `prepare()` resolves the chain before endpoint generation              |
| `apps/cart/src/router/funnels/one-page.ts`                             | Reduced to `extends: FUNNEL.CART` plus three overrides                 |
| `packages/headless/src/modules/routing/__tests__/extendFunnel.test.ts` | Unit coverage                                                          |

## Implementation Notes

### Why the merge is not a plain `lodash.merge`

`merge` is recursive and merges arrays **by index**, which produces the dangling-trailing-entry bug described above; it also mutates its first argument, which would corrupt the base funnel's registry entry on every `prepare()`. The implementation uses `mergeWith` with a customizer that takes state nodes and arrays whole and merges everything else by key.

The customizer reads lodash's **`source`** argument, not the fourth (`object`) argument. The fourth is the destination clone being written into, so it never matches a layer's own `states` object and a check against it silently degrades to a deep merge.

### Negative controls

The unit suite was verified against two deliberate breakages, both of which must turn it red:

| Mutation                                         | Expected failures                                                      |
| :----------------------------------------------- | :--------------------------------------------------------------------- |
| Customizer keyed on `object` instead of `source` | 4 — wholesale replacement degrades to a deep merge                     |
| `isObjectLike` instead of `isArray`              | 6 — every object short-circuits, so nothing below the top level merges |

## Related Documents

- [ADR 005: XState State Management](./005-xstate-state-management.md)
- [ADR 017: Funnel Navigation via State Meta](./017-funnel-navigation-via-state-meta.md)
- [ADR 018: Funnel Reactive Watchers](./018-funnel-reactive-watchers.md)
- [Routing module architecture](../../packages/headless/src/modules/routing/docs/architecture.md)
- [Routing module gotchas](../../packages/headless/src/modules/routing/docs/gotchas.md)
