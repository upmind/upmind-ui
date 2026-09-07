# Changelog

All notable changes to the `payment` module are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

This release makes `payment` usable as a **root** machine as well as an invoked child, and lands the module's first test suite. Both fixes came out of that suite; neither changes how `basket` or `orders` drive the module.

### Added

- **A recorded-fixture corpus and the module's full colocated test set** — 55 tests across unit and integration, replaying responses captured from real staging. Function coverage went from 0% to 82.35%, statements to 79.38%, branches to 86.79%.
- **`payment.fixtures.ts`, a re-runnable generator.** `pnpm fixtures:generate payment` seeds its own payable order (`POST /api/orders` with `category_slug: "new_contract"`, then `PATCH /orders/{id}/convert`) before capturing, because every invoice on the recording client is Cancelled or Paid. It asks each of the brand's automatic gateways in turn rather than naming a provider, and drops any capture that fails rather than saving it under a success name.
- **A real recorded `POST /payments` success** — PayPal's `transaction_status: "REDIRECT"` with a live sandbox `approval_url`. The whole offsite-challenge leg is now proven on it: the charge goes out, the redirect lands in `payment`, the approval reaches the caller with its query string moved into form fields, and the hand-off form is submitted.
- **`PaymentArgs.parentId`** — the id of the machine that invoked this one. Set it when invoking `paymentMachine` as a child; leave it unset at a root. See [gotchas.md](./gotchas.md#sendparent-throws-at-a-root-and-takes-the-transition-with-it-).
- **A colocated `.feature` specification** — 18 scenarios covering the client-self cell and every denied cell, with a two-way traceability ratchet: a scenario with neither a proving test nor a recorded deferral fails the suite, and a deferral that acquires a proof fails it too.
- **A negative control for the `parentId` guard** (`payment.escalation.test.ts`) proving both of its answers, so removing the guard turns the suite red rather than silently re-freezing the machine.

### Changed

- **`escalateError` and `providePayment` now only fire when `parentId` is set.** Both are `sendParent` underneath. A child that passes `parentId` behaves exactly as before; a root no longer throws. `order.machine` passes `parentId: "orderManager"` and `basket.machine` passes `basketManager`, both from their existing `invoke.data` mappers — no change to their behaviour.
- **The foundation doc's two fixture citations** now point at the module's own recorded captures under `__tests__/fixtures/`. They previously pointed into `tests/fixtures/recordings/`, a directory that does not exist in the tree.

### Fixed

- **`context` was permanently `undefined`.** `useContext(state, "context")` dereferences `context` twice, so every consumer binding to it read nothing — no order, no amount, no gateway. Now `useContext(state)`.
- **`payment` was not a reactive reference at all.** It was built with `contextValue(context, "payment")`, passing a `ComputedRef` where a state was expected, so `payment.value` threw. Now `useContext(state, "payment")`.
- **A root interpretation froze instead of finishing.** `providePayment`'s unguarded `sendParent` aborted the `processing → processed` transition on every successful charge, so the payment was never stored and the three-way fork was never reached. `escalateError` did the same to the failure path, leaving `hasFailed` false, `errors` empty, and `isReady()` — whose `waitFor` has `timeout: Infinity` — hanging forever on a refused charge.

### Deferred

- **A cleared payment (`transaction_status: OK`) has no fixture**, and `AC-4` is the single entry in the traceability deferral list. A settled charge against a real gateway moves real money, so the generator refuses to capture one; a gateway-sandbox completion through the app-driven recorder is what closes it.
- **`renderers/mercadoPago.ts` sits at 0% functions.** It needs the MercadoPago SDK in a real browser, and the recording brand configures no MercadoPago gateway, so no fixture can reach it. Swapping a provider code to enter that arm would fabricate journey data. Either enable a MercadoPago gateway on the recording brand, or cover the renderer in e2e.

## Migration Guide

### Invoking `paymentMachine` from a new parent machine

Pass `parentId` from your `invoke.data`, or nothing is handed back up:

```ts
import { createMachine } from "xstate";
import { paymentMachine } from "@upmind-automation/headless";
import type {
  PaymentArgs,
  PaymentDetailData
} from "@upmind-automation/headless";
import type { IInvoice } from "@upmind-automation/types";

type MyContext = {
  invoice?: IInvoice;
  paymentDetail?: PaymentDetailData;
};

createMachine({
  id: "myMachineId",
  initial: "paying",
  context: {} as MyContext,
  states: {
    paying: {
      invoke: {
        id: "payment",
        src: paymentMachine,
        data: ({ invoice, paymentDetail }: MyContext) => {
          return {
            orderId: invoice?.id,
            paymentDetail,
            parentId: "myMachineId" // required for PAYMENT and escalated errors
          } as PaymentArgs;
        },
        onDone: { target: "paid" }, // receives the payment attempt
        onError: { target: "failed" } // receives the escalated ResponseError
      }
    },
    paid: {},
    failed: {}
  }
});
```

Existing parents (`basket`, `orders`) are already updated. Without `parentId` the machine runs correctly but stays silent: its `onDone` data still arrives, while the `PAYMENT` event and the escalated error do not.

### Reading `context` or `payment` from `usePayment`

If you worked around either member being undefined — reading the order off your own state, or from `rawOrder` via a second path — both now work as documented and the workaround can go:

```ts
import type { UsePayment } from "@upmind-automation/headless";

// from `const handle = usePayment({ orderId, paymentDetail })`
declare const handle: UsePayment;
const { context, payment } = handle;

// Both reads were permanently undefined before; they carry data now. Neither
// signature changed — `context` is still optional until the machine has one.
context.value?.orderId;
payment.value?.transaction_status;
```

No signature changed, so nothing breaks; the members simply carry data now.
