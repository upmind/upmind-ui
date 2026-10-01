# Invoice Machine Event Contract

This document specifies how to drive the invoice machine to every state from a test harness, without reading implementation source.

## Machine Identity

- **File:** `packages/headless/src/modules/invoices/invoice.machine.ts`
- **ID:** `invoiceManager`
- **Initial state:** `subscribing`
- **Context:** `invoiceId` is supplied by the composable via `withContext`.

---

## 1. State Inventory and Event Sequences

### 1.1 Top-Level States

| State         | ID             | Type     | Reached by                                                      |
| ------------- | -------------- | -------- | --------------------------------------------------------------- |
| `subscribing` | —              | initial  | Machine start, or `UNAUTHENTICATED` from any state              |
| `loading`     | `#loading`     | invoke   | `AUTHENTICATED` from `subscribing`, or `REFRESH` from any state |
| `available`   | `#available`   | compound | `loadLookups` resolves with an unpaid invoice                   |
| `unavailable` | `#unavailable` | terminal | `loadLookups` rejects                                           |
| `complete`    | `#complete`    | terminal | Invoice paid or free on load, or fully paid after a payment     |

### 1.2 Nested States Under `available`

| State                  | ID            | Reached by                                                                                          |
| ---------------------- | ------------- | --------------------------------------------------------------------------------------------------- |
| `available.collecting` | `#collecting` | Entry to `available`; after a payment error; after a partial payment; after every `converting` exit |
| `available.converting` | `#converting` | `SET_CURRENCY` event received while in `collecting`, when the `canChangeCurrency` guard passes      |
| `available.paying`     | `#paying`     | `PAYMENT_DETAILS` event received while in `collecting`                                              |
| `available.refreshing` | `#refreshing` | `paymentMachine` invoke completes successfully                                                      |

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
AUTHENTICATED -> (loadLookups resolves with an unpaid invoice)
```

Fixture requirement: `invoice.status.code` NOT in `["invoice_paid"]`.

**To reach `available.converting`:**

```
AUTHENTICATED -> (loadLookups resolves) -> SET_CURRENCY { data: { code } }
```

Fixture requirement: the `loadLookups` result carries `config` with `BILLING_DIFFERENT_CURRENCY_PAYMENT_ENABLED` truthy, and the invoice has `paid_amount` 0 and `unpaid_amount` above 0. Without these the `canChangeCurrency` guard fails and the event is ignored.

**To reach `available.paying`:**

```
AUTHENTICATED -> (loadLookups resolves) -> PAYMENT_DETAILS { data: paymentDetailData }
```

The `PAYMENT_DETAILS` event must carry `data` — the resolved payment detail from the child actor.

**To reach `available.refreshing`:**

```
AUTHENTICATED -> (loadLookups resolves) -> PAYMENT_DETAILS -> (paymentMachine invoke completes via onDone)
```

**To reach `complete`:**
Two paths:

1. **Free/paid on load:** `AUTHENTICATED -> (loadLookups resolves with invoice.status.code === "invoice_paid")`
2. **After payment:** `... -> PAYMENT_DETAILS -> (paymentMachine onDone) -> (refresh resolves with invoice.status.code === "invoice_paid")`

A `refresh` rejection also ends in `complete`, with `error` set.

**To reach `unavailable`:**

```
AUTHENTICATED -> (loadLookups rejects)
```

---

## 2. The `pay()` Preconditions

### 2.1 PAY Does NOT Transition to `paying`

The `PAY` event in `collecting` has **no target**. It only runs the `forwardPay` action:

```
PAY: {
  actions: ["forwardPay"]
}
```

### 2.2 The Actual Trigger Chain

1. Machine must be in `available.collecting`.
2. `paymentDetailActor` must exist in context (spawned on every entry to `collecting` by `spawnPaymentDetail`).
3. `pay()` sends `PAY` to the invoice machine.
4. The machine runs `forwardPay`, which sends `PAY` to `paymentDetailActor`.
5. The paymentDetail child processes `PAY` internally.
6. When the child reaches `complete`, its `providePaymentDetails` action runs `sendParent` with `PAYMENT_DETAILS` and `data: paymentDetail`. This needs `isInvoked === true` on the child.
7. The invoice machine receives `PAYMENT_DETAILS`.
8. It transitions `collecting -> paying`, running `persistSelections` then `setPaymentDetail`.

### 2.3 PaymentDetail Child Actor Context

The child is spawned by `spawnInvoicePaymentDetail` (`invoice.utils.ts`) with:

```typescript
{
  isInvoked: true,           // enables sendParent
  orderId: rawInvoice?.id,
  orderStatus: rawInvoice?.status.code,
  currency: rawInvoice?.payment_currency ?? rawInvoice?.currency,
  address: rawInvoice?.address,
  client: rawInvoice?.client,
  amount: rawInvoice?.unpaid_amount_converted || 0.0,
  paidAmount: rawInvoice?.paid_amount || 0.0,
  amountPartial: lastPaymentModel?.amount,
  model: lastPaymentModel ? { gateway_id, wallet_amount } : {}
}
```

The child is spawned with name `"orderPaymentDetail"` and `sync: true`.

### 2.4 Payment Child Arguments

The `paying` state invokes `paymentMachine` with id `payment` and this data:

```typescript
{
  orderId: invoice?.id,
  paymentDetail,
  currencyCode: rawInvoice?.payment_currency?.code ?? rawInvoice?.currency?.code,
  parentId: "invoiceManager"
}
```

`currencyCode` is the pay currency when one is set, else the invoice currency. The payment service sends it as `currency_code` on `POST /payments`, and uses it as the `currency_code` filter on the gateway list.

---

## 3. Pay-Currency Switch

### 3.1 The `SET_CURRENCY` Event

- **Accepted in:** `available.collecting` only. In every other state the event is ignored.
- **Payload:** `{ type: "SET_CURRENCY", data: { code } }` — `code` is a brand currency code.
- **Guard:** `canChangeCurrency` (section 4.3). When the guard fails, no transition happens and no context changes.
- **Target:** `available.converting`.

### 3.2 The `converting` State

`converting` invokes the `convertCurrency` service with the `SET_CURRENCY` event.

| Outcome | Target       | Actions                                       |
| ------- | ------------ | --------------------------------------------- |
| onDone  | `collecting` | `setPaymentCurrency`, `clearLastPaymentModel` |
| onError | `collecting` | `setConversionError`                          |

Re-entering `collecting` stops the old `paymentDetailActor` and spawns a fresh one. After `onDone` it is seeded with the new pay currency and amount. After `onError` it is seeded from the unchanged invoice.

### 3.3 The `convertCurrency` Service

- **Reads:** `event.data.code`.
- **Rejects with** `NotAuthenticatedError` when the session is not authenticated or has no active user id.
- **Rejects with** `DetailedError` ("Currency not available", `422`, origin Headless, data `{ code }`) when the code is not in the brand's currencies.
- **Request:** `GET invoices/unpaid_amount/{invoiceId}?currency_code={code}`, always fresh (`staleTime: 0`, `gcTime: 0`).
- **Resolves with:** `{ currency, unpaidAmount, unpaidAmountFormatted }`, where `currency` is the matching brand currency and the two amounts come from `unpaid_amount` and `unpaid_amount_formatted` in the response.

### 3.4 The `setPaymentCurrency` Action

Runs on `converting` onDone. It copies `rawInvoice` and sets:

| Field on the copy         | Value                   |
| ------------------------- | ----------------------- |
| `payment_currency`        | `currency`              |
| `payment_currency_id`     | `currency.id`           |
| `unpaid_amount_converted` | `unpaidAmount`          |
| `unpaid_amount_formatted` | `unpaidAmountFormatted` |

It then stores the copy as `rawInvoice`, re-maps it into `invoice`, and clears both `error` and `conversionError`. The basket is never touched. `raw.unpaid_amount` is not changed, so `summary.unpaidAmount` keeps its value; `summary.unpaidAmountConverted` and `summary.unpaidAmountFormatted` carry the converted amount.

### 3.5 The `conversionError` Context Key

- Set by `setConversionError` on `converting` onError, mapped through `mapToHeadlessError`.
- Cleared by the next successful `setPaymentCurrency`.
- Separate from `error`. A failed conversion does not set `error`, and `CANCEL` (`clearError`) does not clear `conversionError`.
- `useMeta().hasError` is true while `available` and `conversionError` is not empty.

---

## 4. Guards

### 4.1 `isFreeOrPaid`

- **Reads:** `event.data.status.code` (the raw invoice from `loadLookups`).
- **Returns true when:** the code is in `InvoiceStatusGroups.PAID`.
- **Used in:** `loading` onDone, to reach `complete`.

**Test input for TRUE:** `invoice.status.code === "invoice_paid"`.
**Test input for FALSE:** `"invoice_unpaid"` (or `invoice_overdue`, `invoice_adjusted`, and so on).

### 4.2 `isFullyPaid`

- **Reads:** `event.data.status.code` (the raw invoice from `refresh`).
- **Logic:** identical to `isFreeOrPaid`.
- **Used in:** `refreshing` onDone, to reach `complete`.

### 4.3 `canChangeCurrency`

- **Reads:** `config` and `invoice` from context.
- **Calls:** `canChangePaymentCurrency(config, invoice)` (`invoice.utils.ts`).
- **Returns true when all hold:**
  - `config[BILLING_DIFFERENT_CURRENCY_PAYMENT_ENABLED]` is truthy
  - `invoice.status` is not in `InvoiceStatusGroups.PAID`
  - `invoice.summary.paidAmount` is 0 (or unset)
  - `invoice.summary.unpaidAmount` is above 0
- **Used in:** `SET_CURRENCY` in `collecting`.

`useMeta().hasPaymentCurrencyChoice` applies the same check, and also requires `available`.

---

## 5. Services: Interceptable vs Inline

### 5.1 Named String Services (Interceptable via withConfig)

| Service Name      | Function                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------ |
| `loadLookups`     | Fetches the invoice by ID plus the brand config key `BILLING_DIFFERENT_CURRENCY_PAYMENT_ENABLED` |
| `refresh`         | Calls `loadLookups`, then invalidates the `["order", invoiceId]` and `["invoices"]` query caches |
| `convertCurrency` | Converts the unpaid amount to the requested pay currency (section 3.3)                           |
| `isAuthenticated` | Resolves when the active session is ready                                                        |

Stub with `machine.withConfig({ services: { loadLookups: mockFn } })`. `loadLookups` resolves to the raw invoice with a `config` key merged in.

### 5.2 Inline Machine References (NOT Interceptable by Name)

| Invoke ID | Machine          | Why Not Interceptable               |
| --------- | ---------------- | ----------------------------------- |
| `payment` | `paymentMachine` | Inline import, not string reference |

### 5.3 Spawned Actors (NOT Invoke Services)

| Actor                | Spawned In                  | Name                   |
| -------------------- | --------------------------- | ---------------------- |
| `authHelper`         | `setAuthHelper` action      | anonymous              |
| `paymentDetailActor` | `spawnPaymentDetail` action | `"orderPaymentDetail"` |

These are spawned with `spawn()`, not `invoke`.

---

## 6. Scenario Event Sequences

### 6.1 Full Payment

**Fixture requirement:** invoice with `status.code !== "invoice_paid"` and `unpaid_amount_converted > 0`.

```
1. AUTHENTICATED
2. (loadLookups resolves -> collecting; paymentDetailActor spawned)
3. PAY                                       // forwardPay runs
4. PAYMENT_DETAILS { data: resolvedDetail }  // from paymentDetailActor sendParent
5. (paymentMachine invoked -> complete)
6. (refresh resolves with status.code === "invoice_paid")
7. -> complete
```

### 6.2 Partial Payment Loop

```
1-4. As in 6.1
5. (paymentMachine completes)
6. (refresh resolves, invoice still unpaid)
7. -> collecting (setInvoice, clearLastPaymentModel)
8. PAY, PAYMENT_DETAILS, (paymentMachine completes)
9. (refresh resolves with status.code === "invoice_paid")
10. -> complete
```

### 6.3 Retry

```
1-4. As in 6.1
5. (paymentMachine invoke errors -> onError)
6. -> collecting (setError)
7. (paymentDetailActor re-spawned, seeded with lastPaymentModel)
8. PAY (retry), PAYMENT_DETAILS, (paymentMachine succeeds), (refresh resolves invoice_paid)
9. -> complete
```

### 6.4 Pay-Currency Switch, Then Pay

**Fixture requirement:** section 3 preconditions, and a brand currency with the target code.

```
1. AUTHENTICATED
2. (loadLookups resolves -> collecting)
3. SET_CURRENCY { data: { code: "EUR" } }
4. -> converting; (convertCurrency resolves)
5. -> collecting (setPaymentCurrency, clearLastPaymentModel; paymentDetailActor re-spawned in EUR)
6. PAY, PAYMENT_DETAILS
7. -> paying; paymentMachine invoked with currencyCode "EUR"
8. POST /payments carries currency_code "EUR"
```

### 6.5 Pay-Currency Switch Fails

```
1-3. As in 6.4
4. (convertCurrency rejects)
5. -> collecting (setConversionError; invoice and rawInvoice unchanged)
```

### 6.6 Inline Challenge

```
1-3. As in 6.1, up to paymentMachine invoked
4. paymentMachine -> challenging.render (needs payment.approval_url and a gateway renderer)
5. RENDER { data: { container, onComplete } }   // sent to payment child actor
6. CHALLENGE_RESPONSE { data }                  // sent to payment child actor
7. paymentMachine -> complete; invoice machine -> refreshing -> complete
```

`CHALLENGE_CANCELLED` sent to the payment child escalates an error. The invoice machine returns `paying -> collecting` with `error` set.

Detect the render state with `machineMatches(payment, ["challenging.render"])`, where `payment` is `useChildActor(state, "payment")`.

---

## 7. Test Harness Notes

### 7.1 The `paying` State Cannot Be Entered Directly

The only path into `paying` is `PAYMENT_DETAILS`, which originates from the spawned `paymentDetailActor`. In a harness, either:

1. Drive the real child to `complete`, or
2. Send a synthetic `PAYMENT_DETAILS` event with non-empty `data`.

### 7.2 The `paymentMachine` Is Inline

To stub its behaviour, replace `paymentMachine` at the module level before the test, or stub its internal services.

### 7.3 Auth Subscription Actor

The `authHelper` spawned in `subscribing` sends `AUTHENTICATED` / `UNAUTHENTICATED`. In tests, either mock `authSubscription` to emit `AUTHENTICATED`, or send `AUTHENTICATED` manually.

---

## 8. Quick Reference: Event -> State Mapping

| Event                   | From State    | To State        | Condition                                     |
| ----------------------- | ------------- | --------------- | --------------------------------------------- |
| `AUTHENTICATED`         | `subscribing` | `loading`       | —                                             |
| `UNAUTHENTICATED`       | any           | `subscribing`   | — (runs `clearError`)                         |
| `REFRESH`               | any           | `loading`       | — (runs `clearError`)                         |
| (loadLookups success)   | `loading`     | `complete`      | `isFreeOrPaid` guard passes                   |
| (loadLookups success)   | `loading`     | `collecting`    | `isFreeOrPaid` guard fails                    |
| (loadLookups error)     | `loading`     | `unavailable`   | —                                             |
| `PAY`                   | `collecting`  | (no transition) | runs `forwardPay` only                        |
| `CANCEL`                | `collecting`  | (no transition) | runs `clearError` only                        |
| `SET_CURRENCY`          | `collecting`  | `converting`    | `canChangeCurrency` guard passes              |
| (convertCurrency done)  | `converting`  | `collecting`    | `setPaymentCurrency`, `clearLastPaymentModel` |
| (convertCurrency error) | `converting`  | `collecting`    | `setConversionError`                          |
| `PAYMENT_DETAILS`       | `collecting`  | `paying`        | —                                             |
| (paymentMachine done)   | `paying`      | `refreshing`    | —                                             |
| (paymentMachine error)  | `paying`      | `collecting`    | `setError`                                    |
| (refresh success)       | `refreshing`  | `complete`      | `isFullyPaid` guard passes                    |
| (refresh success)       | `refreshing`  | `collecting`    | `isFullyPaid` guard fails                     |
| (refresh error)         | `refreshing`  | `complete`      | `setError`                                    |

---

## 9. Composable Flags Derived From These States

| Flag                       | Derived from                                                                                                                      |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `isProcessing`             | `available.converting`, `available.paying` or `available.refreshing`, or the paymentDetail child in `processing` or `finalising` |
| `isSettling`               | `available.refreshing` — entered only after a payment captures, so it signals that a payment landed                               |
| `hasPaymentCurrencyChoice` | `available` and the `canChangeCurrency` check                                                                                     |
| `hasError`                 | `available` and (`collecting` with `error` set, or a failed attempt, or `conversionError` set)                                    |
