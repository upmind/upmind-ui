# payment-details Module

## What Is This? (ELI5)

Think of payment details as the wallet drawer at checkout: it shows every card already saved to the account, works out which payment providers the brand will accept for this exact bill, and lets a shopper spend some account credit before reaching for a card at all. It never rings up the sale — it hands the wallet's chosen contents to `payment`, the module that actually takes the money.

It also runs a second, unrelated errand: storing a card with nothing to pay for at all — the "add a payment method" page a client visits outside of any purchase.

**Capture, not charge.** This module decides _how_ an amount will be paid and builds the payload that says so. Charging that payload is `payment`'s job — see its own docs for what happens once the payload is handed over.

## Quick Start

Most callers never spawn this module directly — `basket` and `orders` already spawn it as a child machine and hand back a lens onto it:

```typescript
import { useBasketPaymentDetails } from "@upmind-automation/headless";

const paymentDetail = useBasketPaymentDetails();

await paymentDetail.isReady();

if (paymentDetail.meta.value.showStoredPaymentMethods) {
  paymentDetail.setStoredPaymentMethod(
    paymentDetail.storedPaymentMethods.value[0].id
  );
}
```

Storing a card with nothing outstanding — the standalone "add a card" flow — spawns its own machine instead:

```typescript
import { usePaymentDetailAdd } from "@upmind-automation/headless";

const addCard = usePaymentDetailAdd({ currency });

await addCard.isReady();

addCard.setGateway(addCard.gateways.value?.[0]?.gateway_id ?? null);
await addCard.add(); // begins the gateway's SDK / redirect capture
```

Reading a client's saved methods with no capture in progress at all — a "My Payment Methods" page — uses a third, unrelated composable:

```typescript
import { usePaymentDetails } from "@upmind-automation/headless";

const details = usePaymentDetails();

await details.isReady();
const cards = details.data.value; // the client's stored methods, default first
```

## Features

- Lists a client's stored payment methods, default one first.
- Works out which of the brand's gateways will actually take this payment, by currency and country.
- Offers the client's account credit as a payment source, netted off the amount before any gateway is asked.
- Produces the one payload (`PaymentDetailData`) the `payment` module submits.
- Runs a second, self-contained flow to store a card with nothing outstanding.
- Spawns and drives the right per-gateway SDK / redirect lifecycle — via the sibling `payment-gateways` module — for whichever gateway is chosen.
- Recomputes methods, gateways and the form itself whenever the amount, currency, client or country changes mid-basket.
- Resumes a pending "add a card" capture after an off-site redirect (3DS / SCA).

## Key Concepts

### Capturing is not charging

`payment-details` decides _how_ to pay and produces a payload. It never calls `POST /payments` itself — that's the sibling `payment` module, which takes the payload this module built and submits it.

### Two contexts, one machine

**PAY context** — there is an outstanding amount; the client picks a stored method or a fresh gateway, and the machine produces the `PaymentDetailData` payload `payment` will submit. **ADD context** — nothing is outstanding; the client is storing a method for later, and the machine produces a new stored-method id instead. The same machine, the same lookups and the same schema layer serve both — only the active `ctx` differs.

### Actor Types

There is no actor knob. `usePaymentDetail` and `usePaymentDetailAdd` take the client they act for as a plain caller-supplied argument (`PaymentDetailsArgs.client`) — there is no `.as('client')` / `.as('staff')` split and no scope matrix. Whatever code spawns the machine (`basket`, `orders`, or a staff-facing order page) decides which client's data loads; the selection this module hands back always names that same client, never whoever holds the active session — proven in `payment-details.mappers.test.ts`.

`usePaymentDetails()` — the plain list — is the one exception worth knowing: it always reads the _active session's own_ client. There is no client argument to override it.

### Stored method or gateway, never both

A capture names exactly one instrument: `payment_details_id` for a method already on file, or `gateway_id` for a fresh one — never both on the same model, and the machine clears whichever one the client didn't pick.

## Documentation

| Doc                                  | What it covers                                                                           |
| ------------------------------------ | ---------------------------------------------------------------------------------------- |
| [foundation.md](./foundation.md)     | The portable, product-level description — capabilities, data shapes, flows. Start here.  |
| [usage.md](./usage.md)               | The three composables and the machine's surface, member by member, with real code.       |
| [architecture.md](./architecture.md) | The state machine, the services, the schema layer, and who depends on whom.              |
| [gotchas.md](./gotchas.md)           | The traps — the keyed listing, the wire-value collision, the two-halves gateway payload. |
| [CHANGELOG.md](./CHANGELOG.md)       | What changed and how to migrate.                                                         |

## Playground

The ADD flow has a page at `playgrounds/labs/src/pages/paymentDetailAdd/`. The PAY flow has none — driving it needs a spawning parent actor (`basket` or `orders`); the closest driveable proof is the e2e checkout suite under `tests/Playwright/e2e/e2e-tests/checkout/payment-gateways/`.

The module's own behaviour is proven by its co-located suite — 76 tests across `__tests__/`, replaying fixtures recorded from real staging by `pnpm fixtures:generate payment-details`. Seven of the module's 29 documented scenarios are recorded as owed rather than proven — see [gotchas.md](./gotchas.md) for what's blocked and why.
