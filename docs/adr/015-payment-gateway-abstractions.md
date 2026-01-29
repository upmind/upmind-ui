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
modules/paymentDetails/
├── gateways/
│   ├── gateway.machine.ts      # Base machine pattern
│   ├── services.ts             # Common gateway services
│   │
│   ├── stripe/
│   │   ├── stripe.machine.ts   # Stripe-specific states
│   │   ├── services.ts         # Stripe SDK integration
│   │   └── types.ts
│   │
│   ├── braintree/
│   │   ├── braintree.machine.ts
│   │   ├── services.ts
│   │   └── types.ts
│   │
│   ├── razorpay/
│   │   ├── razorpay.machine.ts
│   │   ├── services.ts
│   │   └── types.ts
│   │
│   └── ... (other gateways)
│
├── paymentDetail.machine.ts    # Orchestrator
└── usePaymentDetails.ts        # Composable
```

---

## Common Gateway Pattern

Each gateway machine follows this structure:

```typescript
const gatewayMachine = createMachine({
  id: 'gateway',
  initial: 'initializing',
  context: {
    clientToken: null,
    paymentMethod: null,
    error: null,
  },
  states: {
    initializing: {
      invoke: {
        src: 'initialize',
        onDone: 'ready',
        onError: 'error',
      },
    },
    ready: {
      on: {
        TOKENIZE: 'tokenizing',
      },
    },
    tokenizing: {
      invoke: {
        src: 'tokenize',
        onDone: 'complete',
        onError: 'error',
      },
    },
    challenging: {
      // 3D Secure / additional verification
      invoke: {
        src: 'handleChallenge',
        onDone: 'complete',
        onError: 'error',
      },
    },
    complete: { type: 'final' },
    error: {
      on: { RETRY: 'initializing' },
    },
  },
})
```

---

## Gateway Service Interface

Each gateway's `services.ts` implements:

```typescript
export default {
  // Load SDK, get client token from API
  initialize: async (context) => {
    const { clientToken } = await getClientToken()
    await loadGatewaySDK()
    return { clientToken }
  },

  // Tokenize payment details via gateway SDK
  tokenize: async (context, event) => {
    const { paymentDetails } = event
    const token = await gateway.tokenize(paymentDetails)
    return { paymentMethod: token }
  },

  // Handle 3D Secure or other challenges
  handleChallenge: async (context) => {
    return await gateway.handleChallenge(context.challengeData)
  },
}
```

---

## Gateway-Specific Examples

### Stripe

```typescript
// gateways/stripe/services.ts
import { loadStripe } from '@stripe/stripe-js'

export default {
  initialize: async () => {
    const stripe = await loadStripe(STRIPE_PUBLIC_KEY)
    return { stripe }
  },

  tokenize: async (context, { data }) => {
    const { stripe, elements } = context
    const { paymentMethod, error } = await stripe.createPaymentMethod({
      elements,
    })
    if (error) throw error
    return { paymentMethod }
  },
}
```

### Braintree

```typescript
// gateways/braintree/services.ts
import dropin from 'braintree-web-drop-in'

export default {
  initialize: async (context) => {
    const instance = await dropin.create({
      authorization: context.clientToken,
      container: '#braintree-container',
    })
    return { dropinInstance: instance }
  },

  tokenize: async (context) => {
    const { dropinInstance } = context
    const { nonce } = await dropinInstance.requestPaymentMethod()
    return { paymentMethod: nonce }
  },
}
```

---

## Orchestration

The parent `paymentDetail.machine` orchestrates gateway selection:

```typescript
const paymentDetailMachine = createMachine({
  id: 'paymentDetail',
  initial: 'selecting',
  states: {
    selecting: {
      on: {
        SELECT_GATEWAY: {
          target: 'processing',
          actions: 'setGateway',
        },
      },
    },
    processing: {
      invoke: {
        src: (context) => gatewayMachines[context.gateway],
        onDone: 'complete',
        onError: 'error',
      },
    },
    complete: { type: 'final' },
    error: {},
  },
})
```

---

## Composable Interface

```typescript
function usePaymentDetails() {
  return {
    // Available gateways for brand
    gateways: computed(() => ...),

    // Selected gateway
    selectedGateway: computed(() => ...),

    // Gateway-specific component to render
    component: computed(() => ...),

    // Actions
    selectGateway: (gateway) => send({ type: 'SELECT_GATEWAY', gateway }),
    tokenize: (details) => send({ type: 'TOKENIZE', details }),
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
