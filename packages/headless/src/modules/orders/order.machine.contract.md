# Order Machine Event Contract

This document specifies how to drive the order machine to every state from a test harness, without reading implementation source.

## Machine Identity

- **File:** `packages/headless/src/modules/orders/order.machine.ts`
- **ID:** `orderManager`
- **Initial state:** `subscribing`

---

## 1. State Inventory and Event Sequences

### 1.1 Top-Level States

| State | ID | Type | Reached by |
|-------|-----|------|------------|
| `subscribing` | — | initial | Machine start, or `UNAUTHENTICATED` from any state |
| `loading` | `#loading` | invoke | `AUTHENTICATED` from `subscribing`, or `REFRESH` from any state |
| `available` | `#available` | compound | `loadLookups` service succeeds with unpaid invoice |
| `unavailable` | `#unavailable` | terminal | `loadLookups` service rejects |
| `complete` | `#complete` | terminal | Invoice fully paid or free |

### 1.2 Nested States Under `available`

| State | ID | Reached by |
|-------|-----|------------|
| `available.collecting` | `#collecting` | Entry to `available`; or after payment error; or after partial payment |
| `available.paying` | `#paying` | `PAYMENT_DETAILS` event received while in `collecting` |
| `available.refreshing` | `#refreshing` | `paymentMachine` invoke completes successfully |

### 1.3 Complete Event Sequences (Cold Start)

**To reach `subscribing`:**
```
(machine start)
```

**To reach `loading`:**
```
AUTHENTICATED
```

**To reach `available.collecting`:**
```
AUTHENTICATED -> (loadLookups succeeds with unpaid invoice)
```
Fixture requirement: `invoice.status.code` NOT in `["invoice_paid"]`

**To reach `available.paying`:**
```
AUTHENTICATED -> (loadLookups succeeds) -> PAYMENT_DETAILS { data: paymentDetailData }
```
The `PAYMENT_DETAILS` event must carry `data` — the resolved payment detail from the child actor.

**To reach `available.refreshing`:**
```
AUTHENTICATED -> (loadLookups succeeds) -> PAYMENT_DETAILS -> (paymentMachine invoke completes via onDone)
```

**To reach `complete`:**
Two paths:
1. **Free/paid on load:** `AUTHENTICATED -> (loadLookups succeeds with invoice.status.code === "invoice_paid")`
2. **After payment:** `... -> PAYMENT_DETAILS -> (paymentMachine onDone) -> (refresh service returns invoice.status.code === "invoice_paid")`

**To reach `unavailable`:**
```
AUTHENTICATED -> (loadLookups rejects)
```
Fixture requirement: Service throws an error.

---

## 2. The `pay()` Preconditions

### 2.1 PAY Does NOT Transition to `paying`

The `PAY` event in `collecting` state (order.machine.ts line 86-89) has **no target**. It only runs the `forwardPay` action:

```
PAY: {
  actions: ["forwardPay"]
}
```

### 2.2 The Actual Trigger Chain

1. Machine must be in `available.collecting` state.
2. `paymentDetailActor` must exist in context (spawned on entry to `collecting` via `spawnPaymentDetail` action, line 209-215).
3. `pay()` sends `PAY` to order machine.
4. Order machine runs `forwardPay` action (line 228-230) which does:
   ```typescript
   forwardPay: ({ paymentDetailActor }: OrderContext) => {
     paymentDetailActor?.send({ type: "PAY" });
   }
   ```
5. The paymentDetail child machine processes `PAY` internally.
6. When paymentDetail reaches its `complete` state (payment-detail.machine.ts line 301-309), it runs `providePaymentDetails` action (line 610-619):
   ```typescript
   providePaymentDetails: pure(
     ({ isInvoked, paymentDetail }: PaymentDetailsContext) => {
       if (!isInvoked) return [];
       return [
         sendParent(() => ({
           type: "PAYMENT_DETAILS",
           data: paymentDetail
         }))
       ];
     }
   )
   ```
7. Order machine receives `PAYMENT_DETAILS` event.
8. Order machine transitions `collecting -> paying` (line 79-84).

### 2.3 Preconditions Summary

For `pay()` to result in `paying` state:

| Precondition | Why | Line Reference |
|--------------|-----|----------------|
| State is `available.collecting` | `PAY` event handler exists only here | order.machine.ts:86-89 |
| `paymentDetailActor` exists | `forwardPay` sends to this actor | order.machine.ts:228-230 |
| `paymentDetailActor.context.isInvoked === true` | Required for `sendParent` to fire | payment-detail.machine.ts:611 |
| paymentDetail machine reaches `valid` state | `PAY` event handler exists there | payment-detail.machine.ts:183-199 |
| paymentDetail machine transitions through `processing -> complete` | Only `complete` state runs `providePaymentDetails` | payment-detail.machine.ts:301-309 |

### 2.4 PaymentDetail Child Actor Context

The child is spawned via `spawnOrderPaymentDetail` (order.utils.ts line 21-45) with:
```typescript
{
  isInvoked: true,           // CRITICAL: enables sendParent
  orderId: rawInvoice?.id,
  orderStatus: rawInvoice?.status.code,
  currency: rawInvoice?.currency,
  address: rawInvoice?.address,
  client: rawInvoice?.client,
  amount: rawInvoice?.unpaid_amount_converted || 0.0,
  paidAmount: rawInvoice?.paid_amount || 0.0,
  amountPartial: lastPaymentModel?.amount,
  model: lastPaymentModel ? { gateway_id, wallet_amount } : {}
}
```

---

## 3. Services: Interceptable vs Inline

### 3.1 Named String Services (Interceptable via withConfig)

| Service Name | Function | File Reference |
|--------------|----------|----------------|
| `loadLookups` | Fetches invoice by ID | order.services.ts line 15-55 |
| `refresh` | Alias for loadLookups | order.services.ts line 59 |

These can be stubbed via `machine.withConfig({ services: { loadLookups: mockFn } })`.

### 3.2 Inline Machine References (NOT Interceptable by Name)

| Invoke ID | Machine | Why Not Interceptable | Line Reference |
|-----------|---------|----------------------|----------------|
| `payment` | `paymentMachine` | Inline import, not string reference | order.machine.ts:98 |

The `paying` state invokes `paymentMachine` directly:
```typescript
invoke: {
  id: "payment",
  src: paymentMachine,  // <- inline machine, not string
  ...
}
```

**To stub paymentMachine:** Replace the entire machine via `withConfig({ ... })` before interpretation, or control its services internally.

### 3.3 Spawned Actors (NOT Invoke Services)

| Actor | Spawned In | Name | Line Reference |
|-------|-----------|------|----------------|
| `authHelper` | `setAuthHelper` action | anonymous | order.machine.ts:168-171 |
| `paymentDetailActor` | `spawnPaymentDetail` action | `"orderPaymentDetail"` | order.machine.ts:209-215, order.utils.ts:43 |

These are spawned via `spawn()`, not `invoke`. They persist across state transitions.

---

## 4. Guards

### 4.1 `isFreeOrPaid`

- **Location:** order.machine.ts line 234-237
- **Reads:** `event.data.status.code` (the raw IInvoice from loadLookups)
- **Returns true when:** `invoice.status.code` is in `InvoiceStatusGroups.PAID`
- **PAID group contains:** `["invoice_paid"]` only (types/src/data/enums/invoice.ts line 14)
- **Used in:** `loading` state onDone transition to `complete`

**Test input for TRUE:** Fixture with `invoice.status.code === "invoice_paid"`
**Test input for FALSE:** Fixture with `invoice.status.code === "invoice_unpaid"` (or `invoice_overdue`, `invoice_adjusted`, etc.)

### 4.2 `isFullyPaid`

- **Location:** order.machine.ts line 239-242
- **Reads:** `event.data.status.code` (the raw IInvoice from refresh)
- **Returns true when:** `invoice.status.code` is in `InvoiceStatusGroups.PAID`
- **Identical logic to `isFreeOrPaid`**
- **Used in:** `refreshing` state onDone transition to `complete`

---

## 5. Scenario Event Sequences

### 5.1 @order-pay (Full Payment)

**Fixture requirement:** Invoice with `status.code !== "invoice_paid"` and `unpaid_amount_converted > 0`.

**Sequence:**
```
1. AUTHENTICATED
2. (loadLookups succeeds -> collecting)
3. Machine spawns paymentDetailActor
4. PAY                                    // forwardPay runs
5. (paymentDetailActor processes PAY internally)
6. PAYMENT_DETAILS { data: resolvedDetail } // from paymentDetailActor sendParent
7. (paymentMachine invoked -> processing -> complete)
8. (refresh service succeeds with status.code === "invoice_paid")
9. -> complete state
```

**Invoice status.code needed:**
- Initial load: `"invoice_unpaid"` or `"invoice_overdue"`
- After refresh: `"invoice_paid"`

### 5.2 @order-pay-partial

**Fixture requirement:** Invoice with partial payment possible.

**Sequence:**
```
1. AUTHENTICATED
2. (loadLookups succeeds -> collecting)
3. PAY
4. PAYMENT_DETAILS { data: partialPaymentDetail }
5. (paymentMachine completes)
6. (refresh returns invoice still unpaid)
7. -> collecting (partial loop, clearLastPaymentModel runs)
8. PAY (again for remainder)
9. PAYMENT_DETAILS
10. (paymentMachine completes)
11. (refresh returns status.code === "invoice_paid")
12. -> complete
```

**Invoice status.code needed:**
- After first payment refresh: `"invoice_unpaid"` (balance remaining)
- After second payment refresh: `"invoice_paid"`

### 5.3 @order-pay-wallet

Same as @order-pay. Wallet usage is internal to paymentDetailActor. The order machine does not distinguish wallet vs card. The `paymentDetail.wallet_amount` field in the `PAYMENT_DETAILS` data indicates wallet was used.

### 5.4 @order-retry

**Fixture requirement:** First payment attempt fails (paymentMachine rejects).

**Sequence:**
```
1. AUTHENTICATED
2. (loadLookups succeeds -> collecting)
3. PAY
4. PAYMENT_DETAILS
5. (paymentMachine invoke errors -> onError, line 110-113)
6. -> collecting (with error set via setError action)
7. (paymentDetailActor re-spawned on collecting entry, line 78-79)
8. PAY (retry)
9. PAYMENT_DETAILS
10. (paymentMachine succeeds)
11. (refresh returns invoice_paid)
12. -> complete
```

**Key mechanism:** On `paying -> collecting` transition via onError, the `clearPaymentDetailActor` and `spawnPaymentDetail` actions run on collecting entry (line 78-79), giving a fresh child actor pre-seeded with `lastPaymentModel`.

### 5.5 @order-challenge-render

**Fixture requirement:** Payment requires inline 3DS challenge.

**Sequence:**
```
1-6. Same as @order-pay up through paymentMachine invoked
7. paymentMachine -> processed -> challenging.determining -> challenging.render.waiting
   (requires payment.approval_url set AND hasRenderer guard true)
8. RENDER { data: { container, onComplete } }    // sent to payment child actor
9. paymentMachine -> challenging.render.rendering -> idle
10. CHALLENGE_RESPONSE { data: ... }             // sent to payment child actor
11. paymentMachine -> complete
12. Order machine refreshing -> complete
```

**How to detect render state:** `machineMatches(payment, ["challenging.render"])` where `payment` is the child actor ref from `useChildActor(state, "payment")` (useOrder.ts line 52).

**PaymentMachine guards involved:**
- `needsChallenge`: `!isEmpty(payment?.approval_url)` (payment.machine.ts line 296-297)
- `hasRenderer`: checks if gateway provider has a renderer (payment.machine.ts line 300-303)

### 5.6 @order-challenge-complete

Same as @order-challenge-render. The `CHALLENGE_RESPONSE` event completes the challenge:
```
CHALLENGE_RESPONSE { data: responseData }  // to payment actor
```
Transitions paymentMachine from `challenging.render.*` or `challenging.offsite` to `complete` (payment.machine.ts line 185-187, 150-152).

### 5.7 @order-challenge-cancel

**Sequence:**
```
1-8. Same as @order-challenge-render up through render.waiting or render.idle
9. CHALLENGE_CANCELLED                          // sent to payment child actor
10. paymentMachine -> error (escalates to parent via escalateError, line 280-287)
11. Order machine paying -> collecting (onError, line 110-113)
```

---

## 6. Unreachable States / Test Harness Limitations

### 6.1 The `paying` State Cannot Be Entered Directly

There is no event the test harness can send to order machine that transitions directly to `paying`. The only path is through `PAYMENT_DETAILS`, which must originate from the spawned `paymentDetailActor` via `sendParent`.

**Workaround for tests:**
1. Stub `loadLookups` to return a valid invoice fixture.
2. Let machine spawn the real paymentDetailActor.
3. Either:
   - Drive the paymentDetailActor to completion, or
   - Inject a synthetic `PAYMENT_DETAILS` event (bypasses the spawn chain).

### 6.2 The `paymentMachine` Is Inline (Not Stubbed by Name)

The paymentMachine invoke at line 98 is an inline reference:
```typescript
src: paymentMachine,
```

To stub its behavior, either:
1. Replace `paymentMachine` at the module level before the test, or
2. Stub its internal services (`load`, `validate`, `update`, `redirect`, `render`).

### 6.3 Auth Subscription Actor

The `authHelper` spawned in `subscribing` listens for auth changes and sends `AUTHENTICATED`/`UNAUTHENTICATED`. In tests, either:
1. Mock `authSubscription` to emit `AUTHENTICATED` immediately, or
2. Manually send `AUTHENTICATED` to the machine after start.

### 6.4 States That ARE Reachable

All states in the machine are reachable in a test harness, given proper fixture and event orchestration. No state is genuinely unreachable.

---

## 7. Quick Reference: Event -> State Mapping

| Event | From State | To State | Condition |
|-------|------------|----------|-----------|
| `AUTHENTICATED` | `subscribing` | `loading` | — |
| `UNAUTHENTICATED` | any | `subscribing` | — |
| `REFRESH` | any | `loading` | — |
| (loadLookups success) | `loading` | `complete` | `isFreeOrPaid` guard passes |
| (loadLookups success) | `loading` | `collecting` | `isFreeOrPaid` guard fails |
| (loadLookups error) | `loading` | `unavailable` | — |
| `PAY` | `collecting` | (no transition) | runs `forwardPay` only |
| `CANCEL` | `collecting` | (no transition) | runs `clearError` only |
| `PAYMENT_DETAILS` | `collecting` | `paying` | — |
| (paymentMachine done) | `paying` | `refreshing` | — |
| (paymentMachine error) | `paying` | `collecting` | — |
| (refresh success) | `refreshing` | `complete` | `isFullyPaid` guard passes |
| (refresh success) | `refreshing` | `collecting` | `isFullyPaid` guard fails |
| (refresh error) | `refreshing` | `complete` | — |

---

## 8. Summary: Why `pay()` Appears Non-Functional

The prover's blocker: "Calling order.pay() does not result in paymentMachine invocation."

**Root cause:** `PAY` is forwarded to the child actor, not consumed by the order machine. The order machine waits for `PAYMENT_DETAILS` from that child. If the child is not properly configured (missing `isInvoked: true`, not reaching `valid` state, services failing), it never sends `PAYMENT_DETAILS`, and the order machine stays in `collecting`.

**To make `pay()` functional in tests:**
1. Ensure `loadLookups` returns a valid invoice fixture.
2. Ensure the paymentDetailActor child reaches a state where it can process `PAY`.
3. The paymentDetailActor must have `isInvoked: true` in context (set by `spawnOrderPaymentDetail`).
4. The paymentDetailActor's internal services (`loadLookups`, `parse`, `validate`) must succeed.
5. The paymentDetailActor must reach `valid` state, receive `PAY`, transition through `processing` to `complete`.
6. Only then does `providePaymentDetails` send `PAYMENT_DETAILS` to the parent.

The `PAYMENT_DETAILS` event is the trigger. Without it, `paying` is never entered.

---

## 9. Coverage Gap Analysis

### 9.1 order.services.ts:24-25 — NotAuthenticatedError throw

**Location:** Lines 23-25:
```typescript
if (!isAuthenticated.value || !activeUser.value?.id) {
  throw new NotAuthenticatedError();
}
```

**Reachability via machine event surface:** UNREACHABLE.

The machine reaches `loading` (which invokes `loadLookups`) only after receiving `AUTHENTICATED` from the `authHelper` actor (line 41). The `authSubscription` sends `AUTHENTICATED` only when the session is already authenticated. The machine guards the service call — `loadLookups` is never invoked while unauthenticated.

**Reachability from outside:** The function is exported via the `services` default export (line 57-61) but is marked `@internal` (line 1) and is not in the barrel. A unit test CAN call `loadLookups` directly with a mock context where `isAuthenticated.value === false`, bypassing the machine. Through the machine's public event surface, this branch is unreachable.

### 9.2 useOrder.ts:129 — renderChallenge closing brace

**Location:** Line 124-129:
```typescript
function renderChallenge(container: HTMLElement): void {
  payment.value?.send({
    type: "RENDER",
    data: { container, onComplete: completeChallenge }
  });
}
```

**Consumer call:** `renderChallenge(containerElement)`

**Preconditions:**
- Machine state: `available.paying` with paymentMachine in `challenging.render.waiting`
- `meta.isRenderingChallenge === true` (computed from `machineMatches(payment, ["challenging.render"])`)
- Container element must be mounted

### 9.3 useOrder.ts:137-138 — completeChallenge body

**Location:** Lines 136-138:
```typescript
function completeChallenge(data?: Record<string, unknown>): void {
  payment.value?.send({ type: "CHALLENGE_RESPONSE", data });
}
```

**Consumer call:** `completeChallenge(responseData)` or `completeChallenge()` (data optional)

**Preconditions:**
- Machine state: `available.paying` with paymentMachine in `challenging.render.*` or `challenging.offsite`
- Typically called as the `onComplete` callback passed to `renderChallenge`

### 9.4 useOrder.ts:148 — onUnmounted stopService

**Location:** Lines 147-149:
```typescript
onUnmounted(() => {
  stopService(service);
});
```

**Trigger:** Vue component lifecycle — the composable's host component unmounts.

**Preconditions:**
- The composable must be mounted in a Vue component context
- The component must then unmount (e.g., navigation away, conditional rendering)
- Integration tests using `@vue/test-utils` mount/unmount can reach this

### 9.5 order.machine.ts:201-205 — persistSelections non-empty data

**Location:** Lines 200-206:
```typescript
if (isEmpty(data)) return undefined;
return {
  gateway_id: get(data, "gateway_id"),
  wallet_amount: get(data, "wallet_amount"),
  amount: get(data, "amount")
} as LastPaymentModel;
```

**Trigger:** `PAYMENT_DETAILS` event in `collecting` state (line 82: `actions: ["persistSelections", "setPaymentDetail"]`)

**Preconditions:**
- `PAYMENT_DETAILS` event must carry non-empty `data` (i.e., `data` has at least one key)
- The paymentDetailActor must have resolved a payment detail with gateway_id, wallet_amount, or amount

### 9.6 order.machine.ts:222-223 — clearPaymentDetailActor stopService branch

**Location:** Lines 220-225:
```typescript
clearPaymentDetailActor: assign({
  paymentDetailActor: ({ paymentDetailActor }: OrderContext) => {
    if (paymentDetailActor && !isStoppedService(paymentDetailActor)) {
      stopService(paymentDetailActor);  // line 222
    }
    return undefined;
  }
})
```

**Trigger:** Entry to `collecting` state (line 78: `entry: ["clearPaymentDetailActor", "spawnPaymentDetail"]`)

**Preconditions for line 222 (stopService call):**
- `paymentDetailActor` must exist in context (truthy)
- `isStoppedService(paymentDetailActor)` must return false (actor not yet stopped)
- This happens on RETRY or PARTIAL payment loop — transitioning `paying -> collecting` via onError or refresh-with-balance-remaining, the previous actor is still alive

### 9.7 order.utils.ts:37-40 — lastPaymentModel truthy branch

**Location:** Lines 36-41:
```typescript
model: lastPaymentModel
  ? {
      gateway_id: lastPaymentModel.gateway_id,
      wallet_amount: lastPaymentModel.wallet_amount
    }
  : {}
```

**Trigger:** `spawnOrderPaymentDetail(rawInvoice, lastPaymentModel)` called with truthy `lastPaymentModel`

**Preconditions:**
- Retry or partial payment loop — `paying -> collecting` transition via onError or refresh returning unpaid invoice
- `persistSelections` must have run on a previous `PAYMENT_DETAILS` event with non-empty data
- Machine context `lastPaymentModel` is populated from that prior payment attempt

### 9.8 index.ts and order.types.ts — Non-Executable Files

**index.ts (2 lines):**
```typescript
export * from "./useOrder";
export * from "./order.types";
```
This is a re-export barrel. It contains zero executable statements. Function coverage is not measurable — these are module-level re-exports evaluated at import time, not callable functions.

**order.types.ts (52 lines):**
Contains only `import type`, `type` definitions, and JSDoc comments. Zero functions exist. Function coverage is not applicable.

**Verdict:** Both files report 0% function coverage because they contain zero functions. They cannot contribute to function coverage. If the 80% floor is measured across all module files including these, exclude them from the denominator or accept they drag the average by design.
