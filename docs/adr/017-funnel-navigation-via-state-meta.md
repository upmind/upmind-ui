# ADR 017: Funnel Navigation via State Meta

**Date:** March 2026
**Status:** Proposed
**Authors:** Dominic da Costa
**Related:** [ADR 005: XState State Management](./005-xstate-state-management.md), [ADR 007: Headless Architecture](./007-headless-architecture.md)

---

## Context

The funnel machine (`funnel.machine.ts`) guards route access and manages navigation between steps. Currently, every state node in a funnel config manually declares its NEXT and BACK targets:

```ts
import { assign } from '@upmind-automation/headless'

enum ROUTE {
  BASKET = 'basket',
  CATALOGUE = 'catalogue',
  RECOMMENDATIONS = 'recommendations'
}

export const states = {
  [ROUTE.CATALOGUE]: {
    invoke: {
      src: 'guardCatalogue',
      onDone: { actions: ['setResolved'] },
      onError: { target: ROUTE.BASKET, actions: ['setUnresolved', 'clearTarget'] }
    },
    on: {
      NEXT: {
        target: ROUTE.RECOMMENDATIONS,
        actions: [assign({ targetRoute: { name: ROUTE.RECOMMENDATIONS } })]
      },
      BACK: {
        target: ROUTE.BASKET,
        actions: [assign({ targetRoute: { name: ROUTE.BASKET } })]
      }
    }
  }
}
```

### Problems

1. **Repetition** — the `assign({ targetRoute: { name: X } })` pattern is repeated ~40 times across the cart funnel alone
2. **Fragility** — inserting a state between two existing ones requires updating both neighbours' NEXT/BACK targets
3. **Inconsistency** — some states declare NEXT/BACK, some don't, some override with inline assigns
4. **No progress model** — the funnel can't answer "what step am I on?" or "how far along am I?" because states have no concept of position in a flow
5. **NEXT/BACK handlers at funnel level silently hang** — when a state doesn't handle NEXT, the funnel-level handler sets `resolved: false` and `awaitResolved` waits forever with no timeout
6. **`setResolving` conflates two concerns** — clearing `resolved` AND clearing `targetRoute`, forcing states to work around it

### Comparisons

| System | How they solve it |
|--------|------------------|
| **Shopify Checkout** | Steps are an ordered enum (`contact_information → shipping_method → payment_method`). Progress is computed from position. |
| **Formkit Multi-Step** | Steps array with auto-computed `previous()` / `next()`. Steps can be conditionally included/excluded. |
| **AWS Step Functions** | Each state declares `Next` explicitly, with first-class `Choice` states for conditional branching. |
| **Wizard libraries** | Expose `currentStep`, `totalSteps`, `progress`, `isFirst`, `isLast`, `canGoNext`, `canGoBack` as first-class concepts. |

---

## Decision

Use **XState's `meta` property** on state nodes to declare navigation relationships and step metadata. The funnel factory (`useFunnelMachine`) reads `meta` at machine creation time and auto-generates NEXT/BACK event handlers for states that declare them.

### Why `meta`?

- `meta` is a **first-class XState v4 feature** — not a custom property
- `meta` is designed for "static metadata associated with a state node" (XState docs)
- `meta` is accessible at runtime via `state.meta`, aggregated from all active state nodes, keyed by state ID
- `meta` shows up in **XState Inspector/state charts** — making navigation relationships visible
- `meta` survives the **XState v5 migration** (renamed to `state.getMeta()`)

### State Node Meta Schema

```ts
// routing.types.ts — as shipped
export type FunnelMetaTarget = { target: string; cond?: string }

export type FunnelStateMeta = {
  /** Route name (or conditional targets) for NEXT navigation. */
  next?: string | FunnelMetaTarget[]
  /** Route name (or conditional targets) for BACK navigation. */
  prev?: string | FunnelMetaTarget[]
  /** Step position for progress tracking (1-indexed). */
  step?: number
  /** Human-readable label for breadcrumbs / progress indicators. */
  label?: string
  /** Whether this state is a decision node (no UI). */
  decision?: boolean
}
```

### Funnel Config With Meta

```ts
import { assign } from '@upmind-automation/headless'

enum ROUTE {
  BASKET = 'basket',
  CATALOGUE = 'catalogue',
  RECOMMENDATIONS = 'recommendations'
}

// Before: 40+ explicit NEXT/BACK handlers
export const before = {
  [ROUTE.CATALOGUE]: {
    invoke: {
      src: 'guardCatalogue',
      onDone: { actions: ['setResolved'] },
      onError: { target: ROUTE.BASKET, actions: ['setUnresolved', 'clearTarget'] }
    },
    on: {
      NEXT: {
        target: ROUTE.RECOMMENDATIONS,
        actions: [assign({ targetRoute: { name: ROUTE.RECOMMENDATIONS } })]
      },
      BACK: {
        target: ROUTE.BASKET,
        actions: [assign({ targetRoute: { name: ROUTE.BASKET } })]
      }
    }
  }
}

// After: meta declares navigation, the factory generates the handlers
export const after = {
  [ROUTE.CATALOGUE]: {
    meta: { next: ROUTE.RECOMMENDATIONS, prev: ROUTE.BASKET, step: 1, label: 'Catalogue' },
    entry: ['setCurrency', 'setBasket'],
    invoke: {
      src: 'guardCatalogue',
      onDone: { actions: ['setResolved'] },
      onError: { target: ROUTE.BASKET, actions: ['setUnresolved', 'clearTarget'] }
    }
  }
}
```

### Factory Changes

`useFunnelMachine` reads `meta.next` and `meta.prev` from each state node at creation time and generates NEXT/BACK handlers:

```ts
import { assign } from '@upmind-automation/headless'
import type { FunnelContext, FunnelStateMeta } from '@upmind-automation/headless'
import { isEmpty, isString, map, mapValues } from 'lodash-es'

type StateNodeShape = {
  meta?: FunnelStateMeta
  on?: Record<string, unknown>
  [key: string]: unknown
}

declare const states: Record<string, StateNodeShape>

// funnel.machine.ts — the factory wires NEXT/BACK from meta, supporting both
// `meta: { next: "route" }` and `meta: { next: [{ target, cond }] }`.
export const enrichedStates = mapValues(states, (config: StateNodeShape) => {
  const meta = config.meta
  if (!meta) return config

  const metaHandlers: Record<string, unknown> = {}

  const toHandler = (target: string | FunnelMetaTargetList) =>
    isString(target)
      ? {
          target,
          actions: [
            assign({
              targetRoute: ({ targetRoute }: FunnelContext) => ({
                ...targetRoute,
                name: target
              })
            })
          ]
        }
      : map(target, entry => ({
          target: entry.target,
          actions: [
            assign({
              targetRoute: ({ targetRoute }: FunnelContext) => ({
                ...targetRoute,
                name: entry.target
              })
            })
          ],
          ...(entry.cond ? { cond: entry.cond } : {})
        }))

  if (meta.next) metaHandlers.NEXT = toHandler(meta.next)
  if (meta.prev) metaHandlers.BACK = toHandler(meta.prev)

  if (isEmpty(metaHandlers)) return config

  return {
    ...config,
    on: {
      ...metaHandlers, // meta-derived handlers (defaults)
      ...config.on // explicit handlers override meta
    }
  }
})

type FunnelMetaTargetList = Exclude<FunnelStateMeta['next'], string | undefined>
```

### Override Semantics

**Explicit `on.NEXT/BACK` always wins over meta-derived handlers.** This means:

1. Simple linear states just declare `meta: { next, prev }` — zero boilerplate
2. States with **conditional NEXT** (e.g. BASKET → BILLING or CHECKOUT) still declare explicit `on.NEXT` with guards — the meta handler is overridden
3. States with **custom actions on NEXT** (e.g. CHECKOUT → ORDER with params) still declare explicit `on.NEXT`
4. Gradual migration — old explicit handlers keep working, meta is additive

### Progress Tracking

When states declare `step`, the factory can compute progress:

```ts
import type { FunnelStateMeta } from '@upmind-automation/headless'
import { filter, map, size } from 'lodash-es'
import { computed } from 'vue'
import type { ComputedRef } from 'vue'

declare const states: Record<string, { meta?: FunnelStateMeta }>
declare const currentStateMeta: ComputedRef<FunnelStateMeta | undefined>
declare const resolved: boolean

// Computed in useRoutingEngine or useRouting
const steps = filter(
  map(states, config => config.meta),
  meta => meta?.step !== undefined
)
const totalSteps = size(steps)

export const meta = computed(() => ({
  currentStep: currentStateMeta.value?.step,
  totalSteps,
  progress: currentStateMeta.value?.step
    ? currentStateMeta.value.step / totalSteps
    : 0,
  isFirst: currentStateMeta.value?.step === 1,
  isLast: currentStateMeta.value?.step === totalSteps,
  canGoNext: !!currentStateMeta.value?.next && resolved,
  canGoBack: !!currentStateMeta.value?.prev
}))
```

### Funnel-Level NEXT/BACK Fallback

With meta, the funnel-level NEXT/BACK handlers can have a sensible default instead of silently hanging:

```ts
// funnel.machine.ts — the funnel-level fallback, shown in its `on` block.
// A meta-derived handler is merged into the state's own `on`, so this only
// fires for a state with NO meta.next AND NO explicit on.NEXT.
export const funnelLevelEvents = {
  NEXT: {
    actions: ['setResolving']
  },
  BACK: {
    actions: ['setResolving']
  }
}
```

---

## Consequences

### Positive

1. **~40 fewer lines of boilerplate** per funnel config — NEXT/BACK handlers are declared as data, not code
2. **Progress tracking becomes possible** — `step`, `label`, `isFirst`, `isLast` are first-class
3. **Navigation is inspectable** — `meta` shows in XState devtools, making the flow visible
4. **Safer refactoring** — insert a state by updating only its neighbours' `meta`, not their event handlers
5. **Gradual adoption** — existing explicit handlers keep working, meta is purely additive
6. **FE-2581 endpoint states** benefit — overlay routes are identified through the `overlays` module rather than meta flags; the `isEndpoint` / `overlayId` fields sketched here were not shipped on `FunnelStateMeta`

### Negative

1. **Two ways to declare NEXT/BACK** — during migration, some states use meta, some use explicit handlers. Need clear guidance on when to use which.
2. **Meta is static** — can't compute NEXT dynamically based on context. States with conditional NEXT still need explicit handlers.
3. **Progress assumes linearity** — `step` numbering implies a linear flow. Branching flows need a different progress model.

### Neutral

1. **XState v5 compatible** — `meta` becomes `state.getMeta()` but the concept is identical
2. **No changes to FunnelProps type** — `meta` is already part of `StateNodeConfig`

---

## Migration Plan

### Phase 1: Factory Support (Non-Breaking)

Add meta reading to `useFunnelMachine`. No changes to existing funnel configs. All existing tests pass.

### Phase 2: Cart Funnel Migration

Migrate `cart.ts` states one-by-one:
- Start with simple linear states (CATALOGUE, RECOMMENDATIONS, BASKET_EMPTY)
- Leave complex states (CHECKOUT, SESSION_LOGIN) with explicit handlers
- Add `step` and `label` to primary flow states

### Phase 3: Progress Composable

Expose `meta.currentStep`, `meta.totalSteps`, `meta.progress` from `useRoutingEngine`. UI can render progress bars, breadcrumbs.

### Phase 4: `setResolving` Fix

Separate `setResolving` into two actions:
- `setUnresolved` — only sets `resolved: false`
- `clearTarget` — only clears `targetRoute`

States choose which they need. Existing `setResolving` remains for backward compatibility but is deprecated.

---

## Related Documents

- [ADR 005: XState State Management](./005-xstate-state-management.md)
- [ADR 007: Headless Architecture](./007-headless-architecture.md)
- [ADR 018: Funnel Reactive Watchers](./018-funnel-reactive-watchers.md)
- Linear: FE-2581 (Funnel Overlay Route Guarding)
- Linear: FE-2546 (Add Reactive Watchers to Funnel Routing Architecture)
