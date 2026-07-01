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

Long-lived, shared across the application:

```typescript
// Instantiate at module scope, start on first use
const service = interpret(basketMachine, { devTools: true })

export function useBasket() {
  // Start if not already running
  if (service.status !== InterpreterStatus.Running) {
    service.start()
  }

  const { state } = useActor(service)
  // ...
}
```

**Used for:** session, basket, brand, feedback

### Instance Machines

Short-lived, created per usage:

```typescript
export function useDomain() {
  // Create fresh instance each time
  const service = interpret(domainMachine, { devTools: true })
  service.start()

  const { state, send } = useActor(service)
  // ...
}
```

**Used for:** domain search, product configurator, payment form

---

## Machine Structure

### Standard States

```typescript
const machine = createMachine({
  id: 'featureName',
  initial: 'loading',
  context: { /* initial context */ },
  states: {
    loading: {
      invoke: {
        src: 'load',
        onDone: { target: 'available', actions: 'setData' },
        onError: { target: 'error', actions: 'setError' },
      },
    },
    available: {
      on: {
        ACTION: 'processing',
        REFRESH: 'loading',
      },
    },
    processing: { /* ... */ },
    error: {
      on: { RETRY: 'loading' },
    },
    complete: { type: 'final' },
  },
})
```

### Service Invocation

Async operations are invoked, not embedded:

```typescript
// In machine
invoke: {
  src: 'load',  // References services.load
  onDone: { target: 'available', actions: 'setData' },
  onError: { target: 'error' },
}

// services.ts
async function load(context, event) {
  return useQuery().get({ url: '...', withAccessToken: true })
}

export default { load }
```

---

## Context Access Utilities

**Never access XState context directly.** Use Upmind utilities:

```typescript
// ❌ WRONG
const value = state.value.context.basket

// ✅ CORRECT
import { useContext, stateMatches, contextValue } from '@/utils'

const basket = useContext(state, 'basket')
const isLoading = stateMatches(state, ['loading'])
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

```typescript
import { useActor } from '@xstate/vue'

export function useBasket() {
  const { state, send } = useActor(service)

  // Reactive context
  const basket = useContext<IBasket>(state, 'basket')

  // Reactive meta
  const meta = computed(() => ({
    isLoading: stateMatches(state, ['loading']),
    isAvailable: stateMatches(state, ['available']),
    hasError: stateMatches(state, ['error']),
  }))

  return {
    basket,
    meta,
    addProduct: (product) => send({ type: 'ADD_PRODUCT', product }),
    checkout: () => send({ type: 'CHECKOUT' }),
  }
}
```

### isReady Pattern

```typescript
async function isReady(): Promise<boolean> {
  return waitFor(
    service,
    state => stateMatches(state, ['available', 'error']),
    { timeout: Infinity }
  ).then(state => {
    if (stateMatches(state, ['error'])) return false
    return true
  })
}
```

---

## Spawned Actors

For child machines and subscriptions:

```typescript
// Parent machine spawns child
actions: {
  spawnPayment: assign({
    paymentActor: () => spawn(paymentMachine),
  }),
}

// Send to child
send({ type: 'PROCESS' }, { to: context.paymentActor })
```

### Session Helper Pattern

The session helper uses spawned actors for authentication subscriptions:

```typescript
export const authSubscription = async (callback, onReceive) => {
  const { subscribe } = useSession()

  const subscription = subscribe(state => {
    if (stateMatches(state, ['expired'])) {
      callback({ type: 'UNAUTHENTICATED' })
    }
    // ...
  })

  return () => subscription.unsubscribe()
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

```typescript
const service = interpret(machine, { devTools: true })
```

Access via browser devtools or standalone inspector.

---

## Related Documents

- [ADR 014: Service Layer Pattern](./014-service-layer-pattern.md)
- [ADR 006: TanStack Query](./006-tanstack-query.md)
- [`.agent/rules/code-machines.md`](/.agent/rules/code-machines.md) — XState machine authoring contract
- [`.agent/rules/code-composables.md`](/.agent/rules/code-composables.md) — Composable standards (replaces DEVX.md)
- [`.agent/rules/code-composables-scoped.md`](/.agent/rules/code-composables-scoped.md) — Scoped composable patterns
