# payment-gateways Gotchas

Edge cases, known issues, and things to watch out for.

> **🧪 For Testers:** focus on the test scenarios marked with 🧪 below — each names the `@AC-*` id it maps to in `__tests__/payment-gateways.feature`.

---

## `render()`'s returned promise resolves before the draw actually finishes 🧪

`usePaymentGateway`'s `render(container)` sends the `RENDER` event and then chains a further wait for the gateway to leave `rendering` — but that inner wait is never returned. The outer promise settles as soon as the gateway is confirmed ready to accept a draw request, not once the draw has actually completed.

```typescript
// ❌ Wrong — assumes the form is mounted once render() resolves
await gateway.render(container);
attachFocusListener(container.querySelector("input")); // may run before anything exists in the DOM

// ✅ Correct — poll the gateway's own state instead of trusting the promise
await gateway.render(container);
await waitUntil(() => gateway.meta.value.isAvailable);
attachFocusListener(container.querySelector("input"));
```

**Test scenario (AC-D1):** spawn a gateway in `rendering` carrying a provider SDK handle, call `render()` with a real container, and assert the `RENDER` event fires — the module's own unit suite has to poll the send-spy for up to 500ms rather than await the returned promise, because the promise alone proves nothing about the draw's completion. Filed on **FE-3130**.

---

## Nicky has no recorded fixtures — this brand never unlocks it 🧪

Nicky is wired into the shared machine and proven at the unit layer (schema/model generation), but the fixture generator's live sweep of 37 currency/country combinations against the recording brand found **zero** where Nicky appears in the gateway list. It has no recorded integration fixtures and no captured `tokenize-begin`/`tokenize-end` shape — unlike the other five custom providers, which each have both.

```typescript
// ❌ Wrong — assumes every named provider has integration-level fixture proof
// Nicky's schema/model unit tests exist; its tokenize-begin/-end shapes do not.

// ✅ Correct — treat Nicky as unit-proven only until a brand that unlocks it
//    is found and its captures are recorded
```

**Test scenario:** the fixture generator (`payment-gateways.fixtures.ts`) sweeps the same currency/country pair for every custom provider and throws rather than inventing a body when a provider never appears in the list — Nicky is the one provider that throw fires for on every sweep run to date. Filed on **FE-3130**.

---

## The fixture generator mints a real stored-method record on every run 🧪

`payment-gateways.fixtures.ts` calls `tokenize-begin` for real against the recording brand to capture each of the six unlockable providers' setup payloads. `tokenize-begin` is a `POST` that reserves a genuine `client_payment_details` record on the back end — there is no dry-run mode. Every run of the generator leaves six orphaned records behind on the recording client; nothing in the generator tears them down.

```typescript
// ❌ Wrong — re-running the generator repeatedly "just to be safe"
// pnpm fixtures:generate payment-gateways   (run 1: 6 orphans)
// pnpm fixtures:generate payment-gateways   (run 2: 6 more orphans)

// ✅ Correct — run it sparingly, and expect to clean up manually until the
//    teardown below lands
```

**Test scenario:** none — this is a recording-time cost, not something the module's own suite exercises. A teardown that deletes the records this generator creates is owed on **FE-3130**.

---

## Every custom provider is gated behind one currency/country pair on this brand 🧪

None of the five custom SDK/redirect providers with recorded fixtures are unlocked generally — each appears in the brand's gateway list only for one specific currency/country combination, discovered by sweeping 37 pairs live against the recording brand:

| Provider    | Currency | Country |
| ----------- | -------- | ------- |
| Stripe      | GBP      | GB      |
| RazorPay    | GBP      | GB      |
| Braintree   | EUR      | DE      |
| OpenPay     | MXN      | MX      |
| MercadoPago | COP      | CO      |
| dLocal      | ARS      | AR      |

```typescript
// ❌ Wrong — assuming a provider's fixtures are representative of every
// currency/country combination it might ever be offered under
if (currency === "USD") expectStripeInGatewayList(); // never recorded at this pair

// ✅ Correct — treat each provider's recorded shape as proven only for the
//    pair above; a different currency/country combination is unverified
```

**Test scenario:** the fixture generator resolves each provider's gateway id by requesting the brand's gateway list at exactly the pair above and failing loudly (rather than inventing a body) if the provider does not appear in it. Filed on **FE-3130**.

---

## A gateway spawned without a parent stalls at `available.valid` 🧪

Entering `available.valid` unconditionally sends a notification to a parent interpreter — it is not guarded by whether a parent exists. A gateway interpreted standalone (not spawned as a child of some other machine) reaches that internal state correctly, but the send has nowhere to land, and from the outside the gateway appears to hang rather than settle.

```typescript
// ❌ Wrong — driving a gateway with no parent context
const service = interpret(createGatewayMachine("stripe").withContext(ctx));
service.start(); // reaches available.valid internally, but looks stalled

// ✅ Correct — spawn it as a child, the way the capture module does
const parent = interpret(
  createMachine({
    /* … */ states: { hosting: { invoke: { id: "gateway", src: () => child } } }
  })
).start();
```

**Test scenario:** the module's own machine-logic suite spawns the real machine as a child of a small test harness specifically because a parentless interpreter stalls at `valid` — every logic test in that file relies on the harness supplying the parent the machine expects. Filed on **FE-3130**.

---

## Common Mistakes

### Assuming a provider's completed-output shape is the same across providers

The field bag a completed capture produces varies by provider family — a token/nonce bag, an entire third-party checkout response carried through verbatim, or raw card fields. Code that destructures a fixed set of keys off every provider's output regardless of which one ran will silently miss fields on at least one family.

### Calling `update()` in the wrong context

`update()` sends `PAY` in a PAY-context spawn and is meant to send `ADD` in an ADD-context spawn — but the machine only wires the event matching the `ctx` it was spawned with. Calling it against the wrong context is a silent no-op, not an error, because the event simply isn't handled in the state the machine happens to be in.

## Edge Cases

| Scenario                                              | Expected Behavior                                                                               | Notes                                                                  |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| A gateway's own load fails after the amount is raised | `unavailable` recovers to `loading` on `REFRESH` when the amount/currency/order/address changed | The SDK is cleared on the way out so a stale mount is never reused.    |
| A refusal carries no error payload at all             | The machine returns to `checking` rather than `error`                                           | Treated as recoverable — the provider gave nothing to show the client. |
| A gateway needs a form but is offered no container    | The fault is logged and the promise resolves; the payment is not failed                         | See [usage.md](./usage.md) for the exact contract.                     |

## What's owed, not yet proven

One of this module's 39 documented scenarios has no proving test yet:

- **A gateway whose charge minimum exceeds the amount reports itself unavailable (AC-B8).** No recorded evidence pins a per-gateway minimum-charge check anywhere in this module — the machine's own "no outstanding balance" guard is a stub that always passes. Tracked on **FE-3130**, owed in the machine or a provider's own util test.

Everything needing a live provider SDK in a real browser — the hosted-form draw itself, an off-site hand-off and return, a provider-side challenge — is e2e's surface, not a gap in this module's own contract.

## A wiring note worth flagging

The `card` provider variant captures raw card fields and stores them server-side. It is **deprecated**: the platform no longer stores card details server-side, so no production call site wires a real `GatewayProviderCodes` value to it. Its code and tests remain, and it still reaches a driveable state, but nothing routes a live gateway through it. Do not build on it. Storing a payment method now goes through a provider's own tokenise handshake — `tokenize-begin` then `tokenize-end` — which is what every other provider family uses.
