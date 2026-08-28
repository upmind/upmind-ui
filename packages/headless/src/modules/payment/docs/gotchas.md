# payment Gotchas

## `sendParent` throws at a root, and takes the transition with it 🧪

The machine hands two things up to a parent — a taken-up payment (`providePayment`) and a terminal error (`escalateError`). Both are `sendParent` underneath, and `sendParent` **throws when there is no parent**.

The throw does not surface as an error state. It aborts the transition the action belongs to, so the machine stays in the state it was trying to leave:

```
Unable to send event to child '#_parent' from service 'PaymentManager'.
```

Unguarded, the success path froze in `processing` — the payment was never stored, the fork was never reached, and `isReady()` (whose `waitFor` has `timeout: Infinity`) never settled. The failure path froze in `loading` the same way, so `hasFailed` stayed `false` and `errors` stayed empty on a refused charge.

Both are now guarded by `PaymentArgs.parentId`:

```ts
providePayment: choose([
  {
    cond: ({ parentId }) => Boolean(parentId),
    actions: sendParent(({ payment }) => ({ type: "PAYMENT", data: payment }))
  }
]);
```

**If you add a third hand-up, guard it the same way.** xstate v4 gives an action no supported way to ask whether it is running as an invoked child, so the parent declares itself — `order.machine` passes `parentId: "orderManager"`, `basket.machine` passes `basketManager`.

Proven both ways by [`payment.escalation.test.ts`](../__tests__/payment.escalation.test.ts): unset `parentId` reaches `error` cleanly, a `parentId` with no real parent above does not. Remove either guard and that file or the offsite-challenge test goes red.

## `useContext(state, "context")` dereferences twice 🧪

`useContext(stateLike, prop)` already reaches into `context` before applying `prop`. Passing `"context"` therefore asks for `state.context.context`, which does not exist — the ref reads `undefined` forever, and every consumer binding to it gets nothing.

```ts
// WRONG — permanently undefined
const context = useContext<PaymentContext>(state, "context");

// RIGHT
const context = useContext<PaymentContext>(state);
```

The same call also needs a **state**, not a ref. `contextValue(someComputedRef, "payment")` returns a plain `undefined` rather than a ref, so `payment.value` throws:

```ts
// WRONG — not a ref at all
const payment = contextValue<PaymentContext["payment"]>(context, "payment");

// RIGHT
const payment = useContext<PaymentContext["payment"]>(state, "payment");
```

Both shipped in this module and were caught only when a test read the order back off `context`. [`payment.surface.test.ts`](../__tests__/payment.surface.test.ts) now asserts every advertised member is a live callable or ref, and that `context` really carries the order.

## `approval` is not the wire's `approval_url` 🧪

The provider returns one URL with its query string attached. `mapApproval` splits it: the query string becomes `fields`, and `url` keeps only origin and path.

```
wire:     https://www.sandbox.paypal.com/cgi-bin/webscr?cmd=…&token=EC-29P…
approval: url    = https://www.sandbox.paypal.com/cgi-bin/webscr
          fields = { cmd: "…", useraction: "commit", token: "EC-29P…" }
```

That is deliberate, not a bug. The hand-off is a real form submission (`submitViaForm`), and a query string left on the form's `action` survives a GET but is **dropped by a POST** — so the params have to become hidden inputs. Assert against the split, never against the raw URL. Pinned in [`payment.mappers.test.ts`](../__tests__/payment.mappers.test.ts) against a recorded PayPal response.

## Creating the composable charges the order

There is no button and no separate "go" call. `usePayment({ orderId, paymentDetail })` starts the machine, and the machine charges. `pay()` re-sends `PAY` for a retry or a resumed leg — it is **not** the initial trigger.

Do not instantiate this module to render a summary, read an amount, or inspect a gateway. Read the invoice through `invoices` and the gateway through `payment-details` instead.

## Common Mistakes

### Reordering the `processed` fork

`processed` evaluates three guarded branches in order: `needsChallenge`, then `needsInstructions`, then the fallthrough to `complete`. A response that is both `WAITING` and carries an `approval_url` must go to `challenging`. Swap the first two and those payments silently route to an instructions screen the customer cannot complete.

The branch also sits behind `after: { wait }` (`useTime().WAIT`). Dropping the delay changes when the fork is evaluated relative to the context assign that feeds its guards.

### Calling a challenge method when no challenge is in flight

`renderChallenge`, `completeChallenge` and `cancelChallenge` are inert outside `challenging` — no request goes out and nothing is charged, but nothing happens either. Gate them on `meta.value.isChallenging`, and pick the right one: `isRenderingChallenge` needs your container, `isOffsiteChallenge` needs nothing from you at all.

### Expecting a `destroy()`

There isn't one. One `usePayment(...)` is one attempt. Call `refresh()` to try again, or create a new instance.

## Edge Cases

### A manual gateway will not take an automatic payment

Offline and BankTransfer gateways reject `POST /payments` outright:

```json
{ "gateway_id": ["This gateway does not support automatic payments"] }
```

A manual gateway may not reach this module at all. `payment-details`' `mapPaymentData` returns `undefined` for a pay-later method (`isPayLater` → `type === PaymentType.PAY_LATER`), so no payload is produced and the order is placed through `PATCH /orders/{id}/convert` instead — the checkout e2e spec records exactly that for Offline (`tests/Playwright/e2e/e2e-tests/checkout/payment-gateways/offline-payment.spec.ts`). Whether every manual gateway maps to pay-later is `payment-details`' business, not verified here. Either way: do not reach for a manual gateway when you want a chargeable path, in production or in a fixture capture.

### A cancelled or settled order refuses with a 409

```json
{ "code": 409, "message": "Operation not allowed due to invoice status: Cancelled" }
```

Payability is a function of **status**, not just of an outstanding amount. An order can owe £60 and still be unchargeable.

### An order the caller cannot see

`GET /invoices/{id}` returns 404 and the machine stops — no charge is posted. One client's payment never reaches another client's order.

### The session ends mid-attempt

`UNAUTHENTICATED` is handled at the machine root, from any state, and returns to `subscribing` with the error cleared. A payment does not outlive the sign-in it started under.

## Lifecycle Considerations

### Wait for Ready State

`isReady()` resolves once the machine is out of `subscribing` and `loading` — `true` when it reached something usable, `false` when it landed in `error`. Its `waitFor` has `timeout: Infinity`, so **any** frozen transition upstream leaves the caller hanging forever rather than rejecting. That is what made the unguarded `sendParent` so hard to spot; treat a never-settling `isReady()` as a signal to look for an aborted transition, not a slow network.

### Fixtures: the traps in this module's own suite

Two authoring traps, both of which produced a false finding before they were understood:

- **The replay server matches loosely.** `/api/invoices/:id` matches on the path pattern, so a recorded 200 is served for a request to a *different* id. To exercise a 404, install it explicitly with `server.use(...)` from the recorded fixture — do not rely on the id in the URL selecting it.
- **The recording client has no payable order.** Every invoice on it is Cancelled or Paid, so `payment.fixtures.ts` **seeds its own** (`POST /api/orders` with `category_slug: "new_contract"`, then `PATCH /orders/{id}/convert`) before capturing. That is what makes `pnpm fixtures:generate payment` re-runnable.

The generator also never captures a *settled* charge — a successful `POST /payments` against a real gateway moves real money. It asks each of the brand's automatic gateways in turn and keeps the first success, which today is PayPal's `REDIRECT`. A cleared payment (`transaction_status: OK`) still has no fixture and is the one scenario the suite defers.
