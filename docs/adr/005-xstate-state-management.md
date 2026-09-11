# ADR 005: XState for State Management

**Date:** January 2024 (Retroactive)
**Status:** Accepted
**Authors:** Upmind Engineering Team

---

## Context

Complex UI flows in the Upmind platform require:

1. Predictable state transitions (checkout, authentication, domain registration)
2. Side effect management (API calls, redirects, timers)
3. Parallel and nested state support
4. Visualization and debugging of state logic
5. Integration with Vue 3 reactivity

---

## Decision

Adopt **XState v4** as the primary state management solution for complex flows, paired with lightweight Vue composables for simpler state.

---

## When to Use XState

| Scenario | Use XState? | Alternative |
| -------- | ----------- | ----------- |
| Multi-step checkout flow | ✅ Yes | — |
| Authentication with 2FA | ✅ Yes | — |
| Domain registration/transfer | ✅ Yes | — |
| Simple form state | ❌ No | Vue refs/reactive |
| Feature flags | ❌ No | Vue refs |
| UI toggle (modal, drawer) | ❌ No | Vue refs |

**Rule of thumb:** Use XState when you have **3+ states** and **complex transitions** with side effects.

---

## Machine Patterns

### Singleton Machines

Long-lived, shared across the application. The example uses `paymentMachine`, the one machine the package exports:

```ts
import { interpret, InterpreterStatus, paymentMachine } from '@upmind-automation/headless'
import { useActor } from '@xstate/vue'

// Instantiate at module scope, start on first use
const service = interpret(paymentMachine, { devTools: true })

export function usePayment() {
  if (service.status === InterpreterStatus.NotStarted) service.start()

  const { send, state } = useActor(service)
  return { send, state }
}
```

**Used for:** session, basket, brand, feedback

### Instance Machines

Short-lived, created per usage:

```ts
import { interpret, paymentMachine } from '@upmind-automation/headless'
import { useActor } from '@xstate/vue'

export function usePaymentForm() {
  // Create a fresh instance each time
  const service = interpret(paymentMachine, { devTools: true })
  service.start()

  const { send, state } = useActor(service)
  return { send, state }
}
```

**Used for:** domain search, product configurator, payment form

---

## Machine Structure

### Standard States

```ts
import { createMachine } from '@upmind-automation/headless'

export const machine = createMachine({
  id: 'featureName',
  initial: 'loading',
  context: {},
  states: {
    loading: {
      invoke: {
        src: 'load',
        onDone: { target: 'available', actions: 'setData' },
        onError: { target: 'error', actions: 'setError' }
      }
    },
    available: {
      on: {
        ACTION: 'processing',
        REFRESH: 'loading'
      }
    },
    processing: {},
    error: {
      on: { RETRY: 'loading' }
    },
    complete: { type: 'final' }
  }
})
```

### Service Invocation

Async operations are invoked, not embedded:

```ts
import { createMachine, useQuery } from '@upmind-automation/headless'
import type { AnyEventObject } from '@upmind-automation/headless'

type FeatureContext = { data?: unknown }

// services.ts
async function load(_context: FeatureContext, _event: AnyEventObject) {
  const { get, useUrl } = useQuery()
  return get({
    queryKey: ['feature'],
    url: useUrl('self'),
    withAccessToken: true
  })
}

export const services = { load }

// In the machine — `src` names the service, and BOTH handbacks are wired, the
// way `order.machine.ts` and `basket.machine.ts` wire their real invocations.
export const machine = createMachine(
  {
    id: 'feature',
    initial: 'loading',
    context: {} as FeatureContext,
    states: {
      loading: {
        invoke: {
          src: 'load',
          onDone: { target: 'available', actions: 'setData' },
          onError: { target: 'error', actions: 'setError' }
        }
      },
      available: {},
      error: {}
    }
  },
  { services }
)
```

---

## Context Access Utilities

**Never access XState context directly.** Use Upmind utilities:

```ts
import { stateMatches, useContext } from '@upmind-automation/headless'
import type { UseActor } from '@upmind-automation/headless'
import type { IBasket } from '@upmind-automation/types'

declare const state: UseActor['state']

// ❌ WRONG — reaching through the raw machine state
const wrong = state.value.context.basket

// ✅ CORRECT — the reactive helpers
const basket = useContext<IBasket>(state, 'basket')
const isLoading = stateMatches(state, ['loading'])

export const reads = { basket, isLoading, wrong }
```

### Available Utilities

| Utility | Purpose |
| ------- | ------- |
| `useContext(state, key)` | Reactive context property access |
| `stateMatches(state, matches)` | Check if state matches patterns |
| `contextValue(state, key)` | One-time context value read |
| `waitFor(service, predicate)` | Await state condition |

---

## Vue Integration

### useActor Pattern

```ts
import {
  interpret,
  paymentMachine,
  stateMatches,
  useContext
} from '@upmind-automation/headless'
import type { IBasket } from '@upmind-automation/types'
import { useActor } from '@xstate/vue'
import { computed } from 'vue'

const service = interpret(paymentMachine, { devTools: true })

export function useBasket() {
  const { send, state } = useActor(service)

  // Reactive context
  const basket = useContext<IBasket>(state, 'basket')

  // Reactive meta
  const meta = computed(() => ({
    isLoading: stateMatches(state, ['loading']),
    isAvailable: stateMatches(state, ['available']),
    hasError: stateMatches(state, ['error'])
  }))

  return {
    basket,
    meta,
    addProduct: (product: { id: string }) => send({ type: 'ADD_PRODUCT', product }),
    checkout: () => send({ type: 'CHECKOUT' })
  }
}
```

### isReady Pattern

```ts
import { interpret, paymentMachine, stateMatches } from '@upmind-automation/headless'
import { waitFor } from 'xstate/lib/waitFor'

const service = interpret(paymentMachine, { devTools: true })

export async function isReady(): Promise<boolean> {
  return waitFor(service, state => stateMatches(state, ['available', 'error']), {
    timeout: Infinity
  }).then(state => !stateMatches(state, ['error']))
}
```

---

## Spawned Actors

For child machines and subscriptions:

```ts
import {
  assign,
  createMachine,
  paymentMachine,
  send,
  spawn
} from '@upmind-automation/headless'
import type { ActorRef, AnyEventObject } from '@upmind-automation/headless'

type ParentContext = { paymentActor?: ActorRef<AnyEventObject> }

export const parentMachine = createMachine(
  {
    id: 'parent',
    initial: 'idle',
    context: {} as ParentContext,
    states: {
      idle: { on: { PAY: { target: 'paying', actions: 'spawnPayment' } } },
      paying: { on: { PROCESS: { actions: 'forwardProcess' } } }
    }
  },
  {
    actions: {
      // Parent machine spawns child
      spawnPayment: assign<ParentContext>({
        paymentActor: () => spawn(paymentMachine)
      }),
      // Send to child
      forwardProcess: send(
        { type: 'PROCESS' },
        { to: (context: ParentContext) => context.paymentActor! }
      )
    }
  }
)
```

### Session Helper Pattern

The session helper uses spawned actors for authentication subscriptions:

```ts
import { useActiveSession, useSessionStore } from '@upmind-automation/headless'

// Spawned as a callback actor: `callback` emits up to the parent machine,
// `onReceive` registers a handler for events sent down to it. The raw store
// subscription is used, not a Vue watch — spawn() runs outside Vue's scope.
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

---

## Consequences

### Positive

1. **Predictable state** — explicit transitions, no impossible states
2. **Visualizable** — XState inspector shows live state
3. **Testable** — model-based testing with `@xstate/test`
4. **Side effect isolation** — services handle async, machines stay pure
5. **Shared vocabulary** — team uses state machine terminology

### Negative

1. **Learning curve** — developers must understand XState concepts
2. **Verbosity** — more code than simple refs for trivial state
3. **Bundle size** — XState adds ~15KB gzipped

### Neutral

1. **Version lock** — using XState v4 (v5 migration planned)

---

## Machines in the Codebase

| Domain | Machines |
| ------ | -------- |
| Session | `session`, `client`, `guest` |
| Commerce | `basket`, `billing`, `currency`, `promotions`, `fields` |
| Payment | `payment`, `paymentDetail`, `gateway` |
| Domain | `domain`, `dac` |
| System | `feedback`, `upload`, `recaptcha` |
| Routing | `funnel`, `routingEngine` |
| Data | `dataManager`, `recommendations` |
| Product | `product` |

---

## Inspector Integration

Development builds include XState Inspector:

```ts
import { interpret, paymentMachine } from '@upmind-automation/headless'

export const service = interpret(paymentMachine, { devTools: true })
```

Access via browser devtools or standalone inspector.

---

## Related Documents

- [ADR 014: Service Layer Pattern](./014-service-layer-pattern.md)
- [ADR 006: TanStack Query](./006-tanstack-query.md)
- [`.agent/rules/code-machines.md`](/.agent/rules/code-machines.md) — XState machine authoring contract
- [`.agent/rules/code-composables.md`](/.agent/rules/code-composables.md) — Composable standards (replaces DEVX.md)
- [`.agent/rules/code-composables-scoped.md`](/.agent/rules/code-composables-scoped.md) — Scoped composable patterns
