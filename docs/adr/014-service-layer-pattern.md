# ADR 014: Service Layer Pattern

**Date:** January 2024 (Retroactive)
**Status:** Accepted
**Authors:** Upmind Engineering Team

---

## Context

XState machines need to invoke asynchronous operations (API calls, data transformations) but:

1. Machines should remain declarative and focused on state logic
2. API calls should be testable and reusable
3. Business logic should be separated from state transitions
4. Services need access to composables (useQuery, useSession)

---

## Decision

Adopt a **service layer pattern** where each module has a dedicated `services.ts` file containing async functions invoked by XState machines.

---

## Structure

```
modules/
  basket/
    basket.machine.ts   # XState machine definition
    services.ts         # Async service functions
    types.ts            # TypeScript types
    useBasket.ts        # Composable interface
```

---

## Service File Pattern

```typescript
// modules/basket/services.ts

// --- external

// --- internal
import { useQuery } from '../..'
import { useSession } from '../session'

// --- utils
import { omitBy, isNil } from 'lodash-es'

// --- types
import type { IBasket } from '@upmind-automation/types'
import type { BasketContext } from './types'
import type { AnyEventObject } from 'xstate'

// -----------------------------------------------------------------------------

async function load(context: BasketContext, event: AnyEventObject) {
  const { get, useUrl } = useQuery()

  return get<IBasket>({
    url: useUrl('orders/current', { with: ['products', 'currency'] }),
    queryKey: ['basket', 'current'],
    withAccessToken: true,
  })
}

async function convert(context: BasketContext, event: AnyEventObject) {
  const { patch, useUrl } = useQuery()
  const { basket, paymentDetail } = context

  return patch({
    mutationKey: ['basket', basket?.id, 'convert'],
    url: useUrl(`/orders/${basket?.id}/convert`),
    data: omitBy(paymentDetail, isNil),
    withAccessToken: true,
  })
}

// -----------------------------------------------------------------------------

export default {
  load,
  convert,
  refresh: (ctx, event) => load(ctx, event),
  isAuthenticated: () => useSession().isAuthenticated(),
}
```

---

## Machine Integration

```typescript
// modules/basket/basket.machine.ts
import services from './services'

export default createMachine({
  id: 'basket',
  initial: 'loading',
  context: { basket: null, errors: null },
  states: {
    loading: {
      invoke: {
        src: 'load',  // References services.load
        onDone: { target: 'available', actions: 'setBasket' },
        onError: { target: 'error', actions: 'setErrors' },
      },
    },
    available: {
      on: {
        CHECKOUT: 'converting',
        REFRESH: { target: 'loading' },
      },
    },
    converting: {
      invoke: {
        src: 'convert',  // References services.convert
        onDone: { target: 'complete' },
        onError: { target: 'available', actions: 'setErrors' },
      },
    },
    // ...
  },
}, {
  services,  // Inject services
  actions: {
    setBasket: assign({ basket: (_, { data }) => data }),
    setErrors: assign({ errors: (_, { data }) => data }),
  },
})
```

---

## Key Principles

### 1. Services Receive Context and Event

```typescript
async function load(
  context: BasketContext,    // Current machine context
  event: AnyEventObject      // Event that triggered invocation
) {
  // Access context values
  const { basket, filters } = context

  // Access event payload
  const { id } = event.data

  return api.get(...)
}
```

### 2. Services Use Composables

```typescript
async function load(context, event) {
  // Access other composables
  const { isReady } = useBrand()
  await isReady()

  // Use query layer
  const { get, useUrl } = useQuery()
  return get({ ... })
}
```

### 3. Services Return Promises

```typescript
// Machine onDone receives resolved value
async function load() {
  return get<IBasket>({ ... })  // Resolves to IBasket
}

// In machine:
onDone: {
  target: 'available',
  actions: assign({
    basket: (_, { data }) => data  // data is IBasket
  })
}
```

### 4. Services Are Grouped by Module

Each module owns its services:

| Module | Service Functions |
| ------ | ----------------- |
| basket | load, convert, refresh, dismissWarnings |
| client/email | loadList, add, update, remove, verify |
| session/guest | authenticate, register, recover |
| domain | search, load, transfer |

---

## Service Composable Pattern

Some modules expose services as a composable for use outside machines:

```typescript
// modules/client/email/services.ts

export const useClientEmailServices = () => {
  return {
    add: async ({ model }) => { ... },
    update: async ({ id, model }) => { ... },
    ensure: async ({ model }) => { ... },
    validate: async ({ schema, model }) => { ... },
  }
}
```

---

## Consequences

### Positive

1. **Separation of concerns** — machines focus on state, services on async logic
2. **Testability** — services can be unit tested independently
3. **Reusability** — services can be called from composables too
4. **Consistency** — predictable file structure across modules
5. **Type safety** — context and event types flow through

### Negative

1. **Indirection** — must look at both machine and services files
2. **File count** — more files per module

### Neutral

1. **Learning curve** — must understand the pattern

---

## Related Documents

- [ADR 005: XState for State Management](./005-xstate-state-management.md)
- [ADR 006: TanStack Query](./006-tanstack-query.md)
- [ADR 002: Session & Service Architecture](./002-session-and-service-architecture.md)
