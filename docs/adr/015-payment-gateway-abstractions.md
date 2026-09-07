# ADR 015: Payment Gateway Abstractions

**Date:** January 2024 (Retroactive)
**Status:** Accepted
**Authors:** Upmind Engineering Team

---

## Context

The platform integrates with multiple payment providers:

1. Stripe (cards, wallets)
2. Braintree (cards, PayPal)
3. RazorPay (India)
4. MercadoPago (Latin America)
5. OpenPay (Mexico)

Each gateway has different:

- SDKs and initialization patterns
- Tokenization flows
- 3D Secure / challenge handling
- Error formats

---

## Decision

Create an **abstraction layer** where each gateway implements a common pattern via XState machines and service files.

---

## Architecture

```
modules/payment-gateways/
├── gateway.machine.ts              # Base machine pattern (factory by name)
├── payment-gateways.services.ts    # Common gateway services
├── payment-gateways.types.ts
│
├── stripe/
│   ├── services.ts                 # Stripe SDK integration
│   ├── actions.ts
│   └── types.ts
│
├── braintree/
│   ├── services.ts
│   └── types.ts
│
├── razorpay/ · mercadoPago/ · openPay/ · dlocal/ · nicky/
│
└── usePaymentGateway.ts            # Composable

modules/payment-details/
└── paymentDetail.machine.ts        # Orchestrator
```

---

## Common Gateway Pattern

Each gateway machine follows this structure:

```ts
import { createMachine } from '@upmind-automation/headless'
import type { AnyEventObject, ResponseError } from '@upmind-automation/headless'

type GatewayContext = {
  clientToken: string | null
  paymentMethod: string | null
  error: ResponseError | null
  challengeData?: unknown
}

export const gatewayMachine = createMachine<GatewayContext, AnyEventObject>({
  id: 'gateway',
  initial: 'initializing',
  context: {
    clientToken: null,
    paymentMethod: null,
    error: null
  },
  states: {
    initializing: {
      invoke: { src: 'initialize', onDone: 'ready', onError: 'error' }
    },
    ready: {
      on: { TOKENIZE: 'tokenizing' }
    },
    tokenizing: {
      invoke: { src: 'tokenize', onDone: 'complete', onError: 'error' }
    },
    challenging: {
      // 3D Secure / additional verification
      invoke: { src: 'handleChallenge', onDone: 'complete', onError: 'error' }
    },
    complete: { type: 'final' },
    error: {
      on: { RETRY: 'initializing' }
    }
  }
})
```

---

## Gateway Service Interface

Each gateway's `services.ts` implements:

```ts
import type { AnyEventObject } from '@upmind-automation/headless'

type GatewayContext = { clientToken: string | null; challengeData?: unknown }

declare function getClientToken(): Promise<{ clientToken: string }>
declare function loadGatewaySDK(): Promise<void>
declare const gateway: {
  tokenize: (details: unknown) => Promise<string>
  handleChallenge: (data: unknown) => Promise<unknown>
}

export default {
  // Load SDK, get the client token from the API
  initialize: async (_context: GatewayContext) => {
    const { clientToken } = await getClientToken()
    await loadGatewaySDK()
    return { clientToken }
  },

  // Tokenize payment details via the gateway SDK
  tokenize: async (_context: GatewayContext, event: AnyEventObject) => {
    const token = await gateway.tokenize(event.paymentDetails)
    return { paymentMethod: token }
  },

  // Handle 3D Secure or other challenges
  handleChallenge: async (context: GatewayContext) =>
    gateway.handleChallenge(context.challengeData)
}
```

---

## Gateway-Specific Examples

### Stripe

```ts
// gateways/stripe/services.ts — lazy-imported so the SDK is code-split out
import type { Stripe, StripeElements } from '@stripe/stripe-js'

type StripeContext = { stripe: Stripe; elements: StripeElements }

declare const STRIPE_PUBLIC_KEY: string

export default {
  initialize: async () => {
    const { loadStripe } = await import('@stripe/stripe-js')
    const stripe = await loadStripe(STRIPE_PUBLIC_KEY)
    return { stripe }
  },

  tokenize: async (context: StripeContext) => {
    const { elements, stripe } = context
    const { error, paymentMethod } = await stripe.createPaymentMethod({ elements })
    if (error) throw error
    return { paymentMethod }
  }
}
```

### Braintree

```ts
// gateways/braintree/services.ts — lazy-imported, same reason as Stripe
import type { Dropin } from 'braintree-web-drop-in'

type BraintreeContext = { clientToken: string; dropinInstance: Dropin }

export default {
  initialize: async (context: Pick<BraintreeContext, 'clientToken'>) => {
    const dropin = await import('braintree-web-drop-in')
    const instance = await dropin.default.create({
      authorization: context.clientToken,
      container: '#braintree-container'
    })
    return { dropinInstance: instance }
  },

  tokenize: async (context: BraintreeContext) => {
    const { nonce } = await context.dropinInstance.requestPaymentMethod()
    return { paymentMethod: nonce }
  }
}
```

---

## Orchestration

The parent `paymentDetail.machine` orchestrates gateway selection:

```ts
import { createMachine } from '@upmind-automation/headless'
import type { AnyEventObject, AnyStateMachine } from '@upmind-automation/headless'

type PaymentDetailContext = { gateway: string }

declare const gatewayMachines: Record<string, AnyStateMachine>

export const paymentDetailMachine = createMachine<
  PaymentDetailContext,
  AnyEventObject
>({
  id: 'paymentDetail',
  initial: 'selecting',
  context: { gateway: 'stripe' },
  states: {
    selecting: {
      on: {
        SELECT_GATEWAY: { target: 'processing', actions: 'setGateway' }
      }
    },
    processing: {
      invoke: {
        src: context => gatewayMachines[context.gateway],
        onDone: 'complete',
        onError: 'error'
      }
    },
    complete: { type: 'final' },
    error: {}
  }
})
```

---

## Composable Interface

```ts
import type { IGateway } from '@upmind-automation/types'
import { computed } from 'vue'
import type { ComputedRef } from 'vue'

declare const available: ComputedRef<IGateway[]>
declare const gatewayId: ComputedRef<string | undefined>
declare function send(event: { type: string; [key: string]: unknown }): void

export function usePaymentDetails() {
  return {
    // Available gateways for the brand
    gateways: available,

    // Selected gateway
    selectedGateway: computed(() =>
      available.value.find(gateway => gateway.id === gatewayId.value)
    ),

    // Gateway-specific component to render
    component: computed(() => gatewayId.value ?? 'UpmGatewayFallback'),

    // Actions
    selectGateway: (gateway: string) => send({ type: 'SELECT_GATEWAY', gateway }),
    tokenize: (details: unknown) => send({ type: 'TOKENIZE', details })
  }
}
```

---

## Consequences

### Positive

1. **Consistency** — all gateways follow same pattern
2. **Encapsulation** — gateway SDKs isolated to their modules
3. **Extensibility** — easy to add new gateways
4. **Testability** — each gateway independently testable
5. **State clarity** — XState shows payment flow

### Negative

1. **Abstraction overhead** — common pattern may not fit all gateways perfectly
2. **SDK dependencies** — each gateway adds bundle weight

### Neutral

1. **Complexity** — payment flows are inherently complex

---

## Related Documents

- [ADR 005: XState State Management](./005-xstate-state-management.md)
- [ADR 014: Service Layer Pattern](./014-service-layer-pattern.md)
