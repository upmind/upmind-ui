# payment Usage & API

## Composable Structure

`payment` is a **flat** composable, not a scoped one. There is no `.as(actor)`, no `.for(client, id)`, and no `useMeta()` / `useContext()` / `useActions()` split — every member sits on the returned object.

```typescript
import { usePayment } from "@upmind-automation/headless";

const {
  // state
  isReady,
  meta,
  context,
  errors,
  payment,
  // methods
  pay,
  refresh,
  renderChallenge,
  completeChallenge,
  cancelChallenge
} = usePayment({ orderId, paymentDetail });
```

> **Creating the composable starts the charge.** There is no separate "go" call. The machine subscribes to the session, loads the order and the brand's gateways, validates, and posts the charge. `pay()` re-sends `PAY` for a retry or a resumed leg — it is not the initial trigger.

The module also exports `paymentMachine` for a parent machine to `invoke`. See [architecture.md](./architecture.md).

## Arguments

```typescript
type PaymentArgs = {
  orderId: IOrder["id"]; // which order to pay
  paymentDetail: PaymentDetailData; // from payment-details
  parentId?: string; // set ONLY when invoked as a child machine
};
```

`parentId` is machine wiring, not a client input. A consumer calling `usePayment` leaves it out.

## Actions

### Take the payment

```typescript
// Retry, or resume after the customer came back from the provider.
pay();

// Re-read the order and the gateway list, then start again. Use this when the
// basket changed since the attempt began (a different amount, a new currency).
refresh({ orderId, paymentDetail });
```

`refresh` takes an optional new `PaymentArgs`; called bare it re-reads the same order.

### Complete a challenge

```typescript
// Mount the provider's own confirmation step into an element you own.
renderChallenge(containerElement);

// Report the provider's response back once the customer finishes.
completeChallenge({ paRes: "…" });

// The customer backed out. Nothing is taken.
cancelChallenge();
```

Use these only while a challenge is in flight — check `meta.value.isChallenging` first. Called at any other time they are inert: no request goes out and nothing is charged.

`renderChallenge` applies to the **inline** flow (`meta.value.isRenderingChallenge`). The **offsite** flow (`meta.value.isOffsiteChallenge`) needs nothing from you — the module submits the hand-off form itself and the browser leaves the page.

### Utility

```typescript
// Resolves once the machine is out of `subscribing` and `loading`.
// true when it got somewhere usable, false when it landed in error.
const ok: boolean = await isReady();
```

## Meta (State Flags)

```typescript
const {
  isLoading, // reading the order and the brand's gateways
  isAvailable, // anything other than loading
  isChecking, // validating the method against the order
  isValid, // validated, about to charge
  isProcessing, // the charge is with the provider
  isChallenging, // the provider wants something from the customer
  isOffsiteChallenge, // …and it is a redirect the module handles itself
  isRenderingChallenge, // …and it is an inline widget you must mount
  hasPaid, // settled
  hasFailed // refused, or the module errored
} = meta.value;
```

`meta` is a single `computed`, so read through `.value` — there is no per-flag ref.

## Context (Computed Values)

```typescript
const {
  orderId, // the order this attempt is against
  paymentDetail, // the method it was handed
  rawOrder, // the loaded IInvoice — amounts, currency, client, payment history
  gateway, // the IGateway behind the chosen method
  approval, // where to send the customer, and what to send
  cancel, // where to send them if they back out
  error // the ResponseError, when one landed
} = context.value ?? {};
```

Two members are also exposed directly, because they are the two a consumer reads most:

```typescript
payment.value?.transaction_status; // "OK" | "WAITING" | "REDIRECT" | "REJECTED" | …
errors.value?.message; // the reason the API gave
errors.value?.status; // its HTTP status
```

### `approval` is not `approval_url`

The wire gives one URL with a query string. `approval` splits it: the query string becomes `fields`, and `url` keeps only origin and path. That is deliberate — the hand-off is a form submission, and a query string left on the action would be dropped by a POST.

```typescript
// wire:     https://www.sandbox.paypal.com/cgi-bin/webscr?cmd=…&token=EC-29P…
// approval: { url: "https://www.sandbox.paypal.com/cgi-bin/webscr",
//             method: "GET",
//             fields: { cmd: "…", useraction: "commit", token: "EC-29P…" } }
```

## Lifecycle

There is no `destroy()`. One `usePayment(...)` is one attempt: it starts its own interpreter, runs to a terminal state (`complete`, `instructions`, or `error`), and is then done. To attempt again, call `refresh()` or create a new instance.

The machine spawns an auth subscription on entry and **will not touch the network until a session authenticates**. Signed out, nothing at all is attempted — not for the caller's own order and not for anyone else's. If the session ends mid-flight, the machine returns to `subscribing`.

## Vue Component Integration

```vue
<script setup lang="ts">
import { usePayment } from "@upmind-automation/headless";

const props = defineProps<{ orderId: string; paymentDetail: PaymentDetailData }>();

const { meta, errors, context, renderChallenge, cancelChallenge } = usePayment({
  orderId: props.orderId,
  paymentDetail: props.paymentDetail
});

const challenge = ref<HTMLElement | null>(null);

watch(
  () => meta.value.isRenderingChallenge,
  wants => {
    if (wants && challenge.value) renderChallenge(challenge.value);
  }
);
</script>

<template>
  <p v-if="meta.isProcessing">Taking your payment…</p>
  <p v-else-if="meta.hasPaid">Paid.</p>
  <p v-else-if="meta.hasFailed">{{ errors?.message }}</p>

  <div v-show="meta.isRenderingChallenge">
    <div ref="challenge" />
    <button @click="cancelChallenge">Cancel</button>
  </div>

  <div v-if="context?.gateway?.payment_instructions">
    {{ context.gateway.payment_instructions }}
  </div>
</template>
```

## Schema-Driven Form Integration

None. This module renders no form and exposes no schema — the payment form belongs to `payment-details`. The only DOM this module touches is the container you pass to `renderChallenge`, and the hidden hand-off form it submits and removes.
