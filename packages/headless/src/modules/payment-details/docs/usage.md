# payment-details Usage & API

## Composable Structure

Three composables, none of which share a shape:

| Composable                           | What it's for                                                                                     | Spawns its own machine?                                                                                 |
| ------------------------------------ | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `usePaymentDetail(service)`          | A view onto an **already-spawned** payment-detail actor. Every member reads or drives that actor. | No — `service` is required and is either the actor itself or a `ComputedRef` resolving to one.          |
| `usePaymentDetailAdd({ currency? })` | The standalone "store a card with nothing outstanding" flow.                                      | Yes — starts its own interpreter pinned to ADD context, then wraps it in `usePaymentDetail` internally. |
| `usePaymentDetails()`                | A flat, query-backed list of the active session's own stored methods. No machine, no actor.       | No — it is a plain TanStack Query wrapper.                                                              |

`usePaymentDetail` is never called with a bare config object the way `usePayment` is. The `PaymentDetailsArgs` that seed a capture (`client`, `currency`, `amount`, `orderId`, `orderStatus`, …) are supplied by whoever spawns the machine — `basket.utils.ts`'s `spawnPaymentDetail`, `orders`' own spawn call, or `usePaymentDetailAdd` — never by the composable's own caller.

```ts
import {
  usePaymentDetail,
  usePaymentDetailAdd,
  usePaymentDetails
} from "@upmind-automation/headless";
import type { UseActor } from "@upmind-automation/headless";
import type { ICurrency } from "@upmind-automation/types";
import type { ComputedRef } from "vue";

declare const actor: ComputedRef<UseActor | undefined>;
declare const currency: ICurrency;

// a lens onto an actor basket/orders already spawned
const paymentDetail = usePaymentDetail(actor);

// a standalone actor, spawned here, pinned to ADD context
const addCard = usePaymentDetailAdd({ currency });

// no actor at all — just the client's stored methods
const details = usePaymentDetails();
```

The module also exports `paymentDetailsMachine` for a parent machine to `invoke` or `spawn`. See [architecture.md](./architecture.md).

## `usePaymentDetail(service)`

### Arguments

```ts
import type { UseActor, UsePaymentDetail } from "@upmind-automation/headless";
import type { ComputedRef } from "vue";
import type { ActorRef } from "xstate";

declare function usePaymentDetail(
  service: ActorRef<any, any> | ComputedRef<UseActor | undefined>
): UsePaymentDetail;
```

`service` is the spawned payment-detail actor (or a computed ref resolving to one) — never a config object. The context that actor was spawned with is `PaymentDetailsContext`, whose input shape is `PaymentDetailsArgs`:

```ts
import type {
  IAddress,
  IClient,
  ICurrency,
  IOrder
} from "@upmind-automation/types";

type PaymentDetailsArgs = {
  orderId?: IOrder["id"]; // required for PAY context
  orderStatus?: IOrder["status"]["code"]; // required for PAY context
  client: IClient; // whose payment details these are
  currency: ICurrency;
  address?: IAddress;
  amount?: number; // required for PAY context, defaults to 0 for ADD
  paidAmount?: number; // >0 disables "pay later" — this is a settlement/retry
  amountPartial?: number; // a client-chosen part-payment amount
  amountWallet?: number; // a client-chosen wallet contribution
};
```

`orderId` and `orderStatus` are load-bearing for PAY context — without both the machine's pre-flight check (`isPayable`) never passes and it never leaves `checking`.

### State

```ts
import { usePaymentDetail } from "@upmind-automation/headless";
import type { UseActor } from "@upmind-automation/headless";
import type { ComputedRef } from "vue";

declare const actor: ComputedRef<UseActor | undefined>;

const {
  state, // computed(() => actor.value?.state.value.toStrings())
  isReady, // () => Promise<boolean>
  meta, // computed — see Meta below
  errors, // the machine's ResponseError, if any
  validationErrors // ErrorObject[] — the ajv-shaped validation detail
} = usePaymentDetail(actor);
```

`isReady()` polls until the actor exists, then waits for it to leave `subscribing`/`loading`/`checking` — resolving `true` once it reaches `available`, `false` if it lands in `unavailable` or `error`. Its `waitFor` has `timeout: Infinity`; a machine stuck mid-transition hangs the promise forever rather than rejecting.

### Meta (State Flags)

`meta` is one `computed`, so read through `.value`.

**What the machine is doing:**

| Flag            | True when                                                                                                                   |
| --------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `isLoading`     | No actor yet, or it's `loading` / `restoring` / `finalising`, or a refresh is in flight.                                    |
| `isAvailable`   | The actor exists and is `available` / `processing`, or is refreshing.                                                       |
| `isProcessing`  | `checking` / `processing` / `finalising` / `restoring`, or refreshing.                                                      |
| `isRefreshing`  | Gateways already loaded but the machine is re-loading, or re-checking against a model that isn't payable/has no amount yet. |
| `isValid`       | The spawned gateway actor (if any) is `available.valid`; otherwise the machine itself is.                                   |
| `isComplete`    | The order is free with nothing to capture, or the machine reached `processed`/`complete`.                                   |
| `isUnavailable` | No gateway actor, or it is `unavailable`.                                                                                   |

**What the payment data says:**

| Flag                       | True when                                                                                                            |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `isPayContext`             | `ctx === GatewayContext.PAY`.                                                                                        |
| `isFree`                   | The model amount is falsy (always `false` in ADD context).                                                           |
| `isPayLater`               | The client chose `PaymentType.PAY_LATER`.                                                                            |
| `isPayOffline`             | Pay-later, an unsupported gateway, an unavailable gateway actor, or the chosen gateway is `OFFLINE`/`BANK_TRANSFER`. |
| `isSettlement`             | PAY context with a non-zero `paidAmount` — a retry or renewal top-up, not a first payment.                           |
| `needsPayment`             | A payable amount not fully covered by wallet, OR a free order the brand still wants a method captured for.           |
| `hasAccountCredit`         | The client holds spendable credit and the order isn't free.                                                          |
| `hasSelectedPaymentMethod` | A stored method id sits on the model (never true in ADD context).                                                    |
| `hasSelectedGateway`       | The gateway actor (`gatewayHelper`) has been spawned.                                                                |
| `canMakePartialPayment`    | PAY context and `PARTIAL_PAYMENT` is one of the allowed payment types.                                               |

**What's on offer:**

| Flag                           | True when                                                                                          |
| ------------------------------ | -------------------------------------------------------------------------------------------------- |
| `hasGateways`                  | The (filtered) gateway list isn't empty.                                                           |
| `hasStoredPaymentMethods`      | The (filtered) stored-method list isn't empty.                                                     |
| `hasSingleGateway`             | Exactly one gateway is offered and pay-later isn't also an option — the UI can auto-select it.     |
| `hasUnsupportedPaymentMethods` | Some of the client's raw stored methods were filtered out because their gateway no longer matches. |

**UI visibility (data + machine state combined):**

| Flag                       | True when                                                                                                                  |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `showPaymentSection`       | The actor is available, and (the order isn't free, or this isn't PAY context, or the brand still wants a method captured). |
| `showGatewaySelection`     | Payment is needed, gateways exist, none is picked yet, and it isn't the "free + has stored methods" case.                  |
| `showStoredPaymentMethods` | Payment is needed, stored methods exist, no gateway is picked, and the actor is available.                                 |
| `showPaymentActions`       | No payment is needed, or a non-display-only gateway/method is picked, or refreshing with stored methods on hand.           |

**Misc:** `hasErrors` (any machine error), `isDirty` (the model isn't empty).

### Context (Computed Values)

```ts
import { usePaymentDetail } from "@upmind-automation/headless";
import type { UseActor } from "@upmind-automation/headless";
import type { ComputedRef } from "vue";

declare const actor: ComputedRef<UseActor | undefined>;

const {
  context, // the full PaymentDetailsContext
  gateways, // IBrandGateway[] — the filtered, brand-curated list
  gateway, // the spawned gateway actor (payment-gateways), or undefined
  storedPaymentMethods, // PaymentDetail[] — filtered to the current currency/gateway set
  accountCredit, // AccountCredit — owned / credit / total, each { value, amount }
  amount, // the outstanding amount the machine was given
  amountsFormatted, // { amount, outstanding, wallet } — locale-formatted strings
  currency,
  address,
  model, // PaymentDetailModel — the form's current value
  clickwrap // the brand's clickwrap disclaimer, from config — not part of the model
} = usePaymentDetail(actor);
```

The final `PaymentDetailData` payload — the one `payment` submits — is **not** its own top-level ref. It lives at `context.value.paymentDetail`, set once a stored method is chosen or a gateway capture completes.

### Schema (Form Definitions)

```ts
import { usePaymentDetail } from "@upmind-automation/headless";
import type { UseActor } from "@upmind-automation/headless";
import type { ComputedRef } from "vue";

declare const actor: ComputedRef<UseActor | undefined>;

const {
  schema, // JsonSchema — the WHOLE form for the active context (PAY or ADD)
  uischema, // UISchemaElement — its layout

  // four narrower pairs, each isolating one control for a UI that renders
  // the amount, the wallet toggle, the stored-method picker and the gateway
  // picker as separate components rather than one JSONForms tree
  schemaAmount,
  uischemaAmount,
  schemaAmountCredit,
  uischemaAmountCredit,
  schemaStoredPaymentMethods,
  uischemaStoredPaymentMethods,
  schemaGateways,
  uischemaGateways
} = usePaymentDetail(actor);
```

`schema`/`uischema` regenerate whenever `lookups`, `amount` or `model` change — every `gateway_id` / `payment_details_id` enum is rebuilt off the currently-offered lists, so a stale schema never lets a client submit a method that just dropped out.

### Actions

```ts
import { usePaymentDetail } from "@upmind-automation/headless";
import type { UseActor } from "@upmind-automation/headless";
import type { ComputedRef } from "vue";

declare const actor: ComputedRef<UseActor | undefined>;

const {
  input, // (value: PaymentDetailModel) => void — raw SET, no diffing
  setAmount, // (value: number) => void — sets a PARTIAL_PAYMENT amount
  resetPartialAmount, // () => void — clears the partial amount back to the full balance
  setAmountCredit, // (value: number) => void — sets the wallet contribution
  setGateway, // (value: string | null) => void — picks a fresh gateway
  setStoredPaymentMethod, // (value: string) => void — picks a method already on file
  useStoredPayment, // (model: PaymentDetailModel) => void — hands the machine a complete stored-method selection directly
  update, // (value?: PaymentDetailModel) => Promise<void> — submit for PAY context
  add, // () => Promise<void> — submit for ADD context
  clear, // () => void — resets the model and tears down the gateway actor
  render, // (container: HTMLElement) => void — mount the gateway's inline challenge
  cancelChallenge // () => void — abandon the in-flight challenge
} = usePaymentDetail(actor);
```

`setGateway` and `setStoredPaymentMethod` are mutually exclusive by construction — each sends a `SET` carrying only its own field, and the machine's own parsing step (`payment-details.services.ts`'s `parse`) strips whichever one the client didn't pick.

`update()` and `add()` both wait (up to 60s) for the machine to settle and reject with a `DetailedError` if it lands in `error`. `update()` is PAY context's submit; `add()` is ADD context's — calling the wrong one for the active context is a no-op, since the machine only wires `PAY`/`ADD` events on the branch that matches.

`render`/`cancelChallenge` forward to the spawned **gateway** actor (`payment-gateways`) for a capture-time SDK render — e.g. mounting Stripe Elements while a card is being tokenised. This is a different challenge to the one the sibling `payment` module renders after `POST /payments` — see [architecture.md](./architecture.md).

## `usePaymentDetailAdd({ currency? })`

```ts
import { usePaymentDetailAdd } from "@upmind-automation/headless";
import type { ICurrency } from "@upmind-automation/types";

declare const myCurrency: ICurrency;

const addCard = usePaymentDetailAdd({ currency: myCurrency });
```

If no `currency` is supplied it falls back to the brand's default currency; with neither available it throws a `DetailedError` immediately (`error.currency_not_available`) rather than spawning a machine with no currency to fetch gateways against.

It re-exports a subset of `usePaymentDetail`'s surface — `state`, `isReady`, `meta`, `context`, `errors`, `gateway`, `gateways`, `currency`, `address`, `model`, `schema`, `schemaGateways`, `uischema`, `uischemaGateways`, `validationErrors`, `storedPaymentMethods`, `cancelChallenge`, `clear`, `input`, `render`, `setGateway`, `add` — deliberately excluding the PAY-only members (`update`, `setAmount`, `setAmountCredit`, `setStoredPaymentMethod`, `useStoredPayment`, the amount/wallet schema pairs, `clickwrap`).

It adds one member of its own:

```ts
import type { ICurrency } from "@upmind-automation/types";

/** The one member `usePaymentDetailAdd` adds on top of the re-exported subset. */
interface UsePaymentDetailAddExtras {
  refresh(newCurrency: ICurrency): void;
}
```

Sends a `REFRESH` only when the currency actually changed — a same-currency call is a no-op, so a caller does not need to guard the call itself.

There is no `stop()` / `destroy()`. The interpreter it starts keeps running until the enclosing page or component is torn down.

## `usePaymentDetails()`

The flat list — no machine, no `PaymentDetailsArgs`, no currency/country filter. It reads every active stored method the **current session's own client** holds.

```ts
import { usePaymentDetails } from "@upmind-automation/headless";

const {
  isReady, // awaits the session settling, then the list query — see below
  meta, // { isLoading, hasError, isEmpty, isAvailable: true }
  data, // PaymentDetail[] — the full unfiltered list
  error,
  getOne, // (id) => PaymentDetail | undefined
  findOne, // (mapping) => PaymentDetail | undefined — matched against name
  default: getDefault, // () => PaymentDetail | undefined — the client's default method
  refresh // () => void — refetch
} = usePaymentDetails();
```

This is the list a "My Payment Methods" management page reads — it is not currency- or country-filtered the way the capture flow's `storedPaymentMethods` is, because there is no amount in play to filter against.

`isReady()` first awaits the active session's own `isReady()` — the same "settle the session before trusting its client id" order `useContracts` uses — and only then waits on the list query, resolving `true` once it has fetched with no error, `false` once it has fetched WITH an error, or once the session settles with no addressable client at all. There is no timeout on the query wait; a caller that awaits it gets a genuine settle signal rather than a fixed-delay guess.

## Lifecycle

`usePaymentDetail` never spawns or stops the actor it's given — that lifecycle belongs entirely to whoever called `spawn()`. `basket` and `orders` stop the actor when their own machine resets or completes; a consumer of `usePaymentDetail` never calls `clear()` expecting the actor itself to go away — `clear()` only resets the model and tears down the spawned gateway actor, not the payment-detail actor hosting it.

`usePaymentDetailAdd` starts its own interpreter and never stops it — see above.

The machine subscribes to the session on entry and does not touch the network until authenticated. If the session ends mid-flow, it returns to `subscribing` and clears the model, the schema and any in-flight error.

## Vue Component Integration

The real consumer (`packages/client-vue/src/modules/payment/components/PaymentDetails.vue`) receives its `UsePaymentDetail` instance via Vue's `provide`/`inject` rather than calling a composable inline — the checkout/order page that owns the spawn provides it once, and every payment sub-component injects it:

```vue
<script setup lang="ts">
import { inject } from "vue";
import type { UsePaymentDetail } from "@upmind-automation/headless";

const paymentDetail = inject<UsePaymentDetail>("usePaymentDetail");
if (!paymentDetail) throw new Error("usePaymentDetail not provided");

const {
  meta,
  model,
  storedPaymentMethods,
  schemaStoredPaymentMethods,
  uischemaStoredPaymentMethods,
  setStoredPaymentMethod,
  setGateway
} = paymentDetail;
</script>

<template>
  <div v-if="meta.showStoredPaymentMethods">
    <!-- a JSONForms renderer bound to schemaStoredPaymentMethods -->
  </div>

  <div v-if="meta.showGatewaySelection">
    <!-- a JSONForms renderer bound to schemaGateways -->
  </div>
</template>
```

## Schema-Driven Form Integration

Unlike the sibling `payment` module (which renders no form of its own), payment-details is schema-driven throughout. `schema`/`uischema` are JSONForms definitions (`@jsonforms/core`), and every uischema control carries an `i18n` key rather than hardcoded copy — the real form components (`StoredPaymentMethods.vue`, `PaymentGateways.vue`, `AccountCredit.vue`, `PaymentAmount.vue` in `client-vue`) each bind to one of the four narrower schema/uischema pairs rather than the combined `schema`/`uischema`, so each control can be its own component without re-deriving the enum lists itself.
