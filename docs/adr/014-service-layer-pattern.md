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
    basket.machine.ts    # XState machine definition
    basket.services.ts   # Async service functions
    basket.types.ts      # TypeScript types
    useBasket.ts         # Composable interface
```

---

## Service File Pattern

```ts
// modules/basket/basket.services.ts

// --- internal
import { useActiveSession, useQuery } from '@upmind-automation/headless'

// --- utils
import { isNil, omitBy } from 'lodash-es'

// --- types
import type { IBasket } from '@upmind-automation/types'
import type { AnyEventObject, BasketContext } from '@upmind-automation/headless'

// -----------------------------------------------------------------------------

async function load(_context: BasketContext, _event: AnyEventObject) {
  const { get, useUrl } = useQuery()

  return get<IBasket>({
    queryKey: ['basket', 'current'],
    url: useUrl('orders/current', { with: ['products', 'currency'] }),
    withAccessToken: true
  })
}

async function convert(context: BasketContext, _event: AnyEventObject) {
  const { patch, useUrl } = useQuery()
  const { basket, paymentDetail } = context

  return patch({
    data: omitBy(paymentDetail, isNil),
    mutationKey: ['basket', basket?.id, 'convert'],
    url: useUrl(`orders/${basket?.id}/convert`),
    withAccessToken: true
  })
}

// -----------------------------------------------------------------------------

export default {
  load,
  convert,
  refresh: (context: BasketContext, event: AnyEventObject) => load(context, event),
  isAuthenticated: () => useActiveSession().useActions().isReady()
}
```

---

## Machine Integration

```ts
// modules/basket/basket.machine.ts
import { assign, createMachine } from '@upmind-automation/headless'
import type { AnyEventObject, ResponseError } from '@upmind-automation/headless'
import type { IBasket } from '@upmind-automation/types'

type MachineContext = { basket: IBasket | null; errors: ResponseError | null }

declare const services: Record<
  string,
  (context: MachineContext, event: AnyEventObject) => Promise<unknown>
>

export default createMachine<MachineContext, AnyEventObject>(
  {
    id: 'basket',
    initial: 'loading',
    context: { basket: null, errors: null },
    states: {
      loading: {
        invoke: {
          src: 'load', // references services.load
          onDone: { target: 'available', actions: 'setBasket' },
          onError: { target: 'error', actions: 'setErrors' }
        }
      },
      available: {
        on: {
          CHECKOUT: 'converting',
          REFRESH: { target: 'loading' }
        }
      },
      converting: {
        invoke: {
          src: 'convert', // references services.convert
          onDone: { target: 'complete' },
          onError: { target: 'available', actions: 'setErrors' }
        }
      },
      complete: { type: 'final' },
      error: { on: { RETRY: 'loading' } }
    }
  },
  {
    services, // inject services
    actions: {
      setBasket: assign({ basket: (_context, event) => event.data }),
      setErrors: assign({ errors: (_context, event) => event.data })
    }
  }
)
```

---

## Key Principles

### 1. Services Receive Context and Event

```ts
import { useQuery } from '@upmind-automation/headless'
import type { AnyEventObject, BasketContext } from '@upmind-automation/headless'
import type { IBasket } from '@upmind-automation/types'

export async function load(
  context: BasketContext, // current machine context
  event: AnyEventObject // event that triggered the invocation
) {
  // Access context values
  const { basket } = context

  // Access the event payload
  const { id } = event.data as { id: string }

  const { get, useUrl } = useQuery()

  return get<IBasket>({
    queryKey: ['basket', id ?? basket?.id],
    url: useUrl(`orders/${id ?? basket?.id}`),
    withAccessToken: true
  })
}
```

### 2. Services Use Composables

```ts
import { useBrand, useQuery } from '@upmind-automation/headless'
import type { AnyEventObject, BasketContext } from '@upmind-automation/headless'
import type { IBasket } from '@upmind-automation/types'

export async function load(_context: BasketContext, _event: AnyEventObject) {
  // Access other composables
  const { isReady } = useBrand()
  await isReady()

  // Use the query layer
  const { get, useUrl } = useQuery()

  return get<IBasket>({
    queryKey: ['basket', 'current'],
    url: useUrl('orders/current'),
    withAccessToken: true
  })
}
```

### 3. Services Return Promises

```ts
import { assign, createMachine, useQuery } from '@upmind-automation/headless'
import type { AnyEventObject } from '@upmind-automation/headless'
import type { IBasket } from '@upmind-automation/types'

type MachineContext = { basket: IBasket | null }

// The machine's onDone receives whatever the service resolved to
async function load() {
  const { get, useUrl } = useQuery()

  return get<IBasket>({
    queryKey: ['basket', 'current'],
    url: useUrl('orders/current'),
    withAccessToken: true
  })
}

export const machine = createMachine<MachineContext, AnyEventObject>(
  {
    id: 'basket',
    initial: 'loading',
    context: { basket: null },
    states: {
      loading: {
        invoke: {
          src: 'load',
          onDone: {
            target: 'available',
            // `event.data` IS the IBasket the service resolved to
            actions: assign({ basket: (_context, event) => event.data as IBasket })
          }
        }
      },
      available: {}
    }
  },
  { services: { load } }
)
```

### 4. Services Are Grouped by Module

Each module owns its services:

| Module | Service Functions |
| ------ | ----------------- |
| basket | load, convert, refresh, dismissWarnings |
| client-email | loadList, add, update, remove, verify |
| auth | authenticate, register, recover |
| domain | search, load, transfer |

---

## Service Composable Pattern

Some modules expose services as a composable for use outside machines:

```ts
// modules/client-email/client-email.services.ts
import { useQuery } from '@upmind-automation/headless'
import type { IEmail } from '@upmind-automation/types'

type EmailModel = { id?: string; email: string | null }

export const useClientEmailServices = () => {
  const { patch, post, useUrl } = useQuery()

  const add = async ({ model }: { model: EmailModel }) =>
    post<IEmail>({
      data: model,
      mutationKey: ['client', 'emails', 'add'],
      url: useUrl('client/emails'),
      withAccessToken: true
    })

  const update = async ({ id, model }: { id: string; model: EmailModel }) =>
    patch<IEmail>({
      data: model,
      mutationKey: ['client', 'emails', 'update'],
      url: useUrl(`client/emails/${id}`),
      withAccessToken: true
    })

  return {
    add,
    update,
    ensure: async ({ model }: { model: EmailModel }) =>
      model.id ? update({ id: model.id, model }) : add({ model })
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
