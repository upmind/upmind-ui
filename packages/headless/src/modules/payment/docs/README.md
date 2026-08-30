# payment Module

## What Is This? (ELI5)

This module **takes the money**. Give it an order and a chosen payment method, and it charges that order — then deals with whatever the provider says back: paid, waiting on the customer, "go approve this at your bank", or refused.

It does not choose the method (that is `payment-details`), it does not own the invoice (that is `invoices`), and it has no UI of its own.

**It is a machine, not a screen.** There is no button behind it. The basket or the order machine invokes it _once it has already decided to pay_, so starting the machine **is** the instruction to charge.

## Quick Start

```typescript
import { usePayment } from "@upmind-automation/headless";

const payment = usePayment({
  orderId: invoice.id,
  paymentDetail // from payment-details
});

// The charge is already on its way. Wait for it to settle.
const ready = await payment.isReady();

if (payment.meta.value.hasPaid) {
  // settled
} else if (payment.meta.value.isOffsiteChallenge) {
  // the customer has been sent to the provider; the callback brings them back
} else if (payment.meta.value.hasFailed) {
  console.error(payment.errors.value?.message);
}
```

Inside another machine, invoke it as a child and **name yourself**:

```typescript
invoke: {
  id: "payment",
  src: paymentMachine,
  data: ({ invoice, paymentDetail }) => ({
    orderId: invoice?.id,
    paymentDetail,
    parentId: "orderManager" // without this, nothing is handed back up
  })
}
```

## Features

- Charges one order through the provider behind the chosen method.
- Waits for a live session before it attempts anything at all.
- Resolves the provider's answer into one of three next steps: settled, awaiting the customer, or a challenge.
- Hands a customer off to an offsite approval (PayPal, 3-D Secure) as a real form submission, so the provider's query string survives a POST.
- Renders an inline challenge for a provider that has its own step (MercadoPago today).
- Reports a refusal with the reason the API actually gave.

## Key Concepts

### Charging is not choosing

`payment-details` decides _how_ to pay and produces a `paymentDetail`. This module decides _nothing_ about the method — it submits what it is handed. If the method cannot be used, the API refuses and this module reports that.

### The provider's answer drives the next step

One `POST /payments` has three possible meanings, resolved from `transaction_status` plus the gateway's `type`:

| Provider says                                  | Next step                                                              |
| ---------------------------------------------- | ---------------------------------------------------------------------- |
| no `approval_url`, gateway not awaiting-client | settled                                                                |
| `WAITING` + `AWAITING_CLIENT` gateway          | show the gateway's payment instructions                                |
| any `approval_url`                             | a challenge — inline if the provider has a renderer, otherwise offsite |

### Parent or root

The machine hands two things up to a parent: a terminal error, and a taken-up payment. Both use xstate's `sendParent`, which **throws when there is no parent**. `parentId` is how the machine knows which it is — a child sets it, a root leaves it unset and reads `errors` instead.

xstate v4 gives an action no supported way to ask whether it is running as an invoked child, so the parent declares itself. See [gotchas.md](./gotchas.md).

### Actor Types

There is **no actor knob**. `usePayment` takes one argument — which order, and how to pay it. A client pays their own order; nothing here lets a member of staff take a payment on someone's behalf, and nothing lets one client reach another's order.

Whether the legacy portal allows a staff-taken payment is **unverified and owed**, not asserted as absent by design — see the provenance notes in [`__tests__/payment.feature`](../__tests__/payment.feature).

## Documentation

| Doc                                  | What it covers                                                                          |
| ------------------------------------ | --------------------------------------------------------------------------------------- |
| [foundation.md](./foundation.md)     | The portable, product-level description — capabilities, data shapes, flows. Start here. |
| [usage.md](./usage.md)               | The exposed surface, member by member, with real code.                                  |
| [architecture.md](./architecture.md) | The state machine, the services, and who depends on whom.                               |
| [gotchas.md](./gotchas.md)           | The traps — `parentId`, the double-dereference, the query-string move.                  |
| [CHANGELOG.md](./CHANGELOG.md)       | What changed and how to migrate.                                                        |

## Playground

No playground page exists for this module. It has no UI and cannot be driven without a real order and a real gateway; the closest driveable proof is the e2e checkout suite under `tests/Playwright/e2e/e2e-tests/checkout/payment-gateways/`.

The module's own behaviour is proven by its co-located suite — 55 tests across `__tests__/`, replaying fixtures recorded from real staging by `pnpm fixtures:generate payment`.
