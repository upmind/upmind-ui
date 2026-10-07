# payment-details Gotchas

## RESOLVED: a filtered stored-method listing used to arrive keyed, not indexed

`GET /clients/{clientId}/payment_details` normally returns `data` as an array. When the platform filters rows out server-side, it does not reindex what's left — a real 13-record capture on staging came back as `data` keyed `0…5, 13…19`, an **object**, not an array, with `total: 13` beside it.

`mapPaymentDetails` (`payment-details.mappers.ts`) now reads the listing regardless of shape — an array is used as-is, a single record (an object carrying its own `id`) is wrapped, and a gap-keyed object is read with `Object.values()`:

```ts
import { has, isArray, map, values } from "lodash-es";
import type { PaymentDetail } from "@upmind-automation/headless";
import type { IPaymentDetail } from "@upmind-automation/types";

// The single-record mapper, internal to the module.
declare function mapPaymentDetail(raw: IPaymentDetail): PaymentDetail;

export function mapPaymentDetails(
  raw: IPaymentDetail | IPaymentDetail[] | Record<string, IPaymentDetail>
): PaymentDetail[] {
  const rawListings = isArray(raw)
    ? raw
    : has(raw, "id")
      ? [raw as IPaymentDetail]
      : values(raw as Record<string, IPaymentDetail>);
  return map(rawListings, mapPaymentDetail);
}
```

Before the fix, a keyed object failed `isArray`, so the whole response was wrapped as a single element and mapped as **one blank record** — a client holding thirteen stored cards was offered one empty one. Verified live on staging checkout: the API sent 13 cards, the page went from showing 0 to showing 12, with the default card preselected (see the ADD-context note below). `existing-method.spec.ts` passes both before and after.

**Any caller reading a listing this platform filters server-side should still expect either shape.** The lesson generalises beyond this one endpoint — do not assume `Array.isArray(data)` is the only shape a filtered listing can take.

## The ADD context never shows stored cards, even though the mapper now reads them

Fixing the mapper (above) makes `hasStoredPaymentMethods` turn true in the **ADD** context too — a client's real stored cards now flow through where before they silently didn't. `showStoredPaymentMethods` (`usePaymentDetail.ts`) is gated explicitly behind `isPayContext` to keep that meta flag's published contract unchanged: ADD (saving a new card) never offers to pick an existing stored one, only PAY does. A consumer that widens `showStoredPaymentMethods` to cover ADD as well is choosing new product behaviour, not restoring an old default — ADD has never shown stored cards.

## `PAY_IN_FULL` is `"stored-card"` on the wire — and it collides

```typescript
enum PaymentType {
  PAY_IN_FULL = "stored-card",
  PARTIAL_PAYMENT = "partial-payment",
  PAY_LATER = "pay-later",
  MANUAL_PAYMENT = "manual-payment"
}
```

`"stored-card"` is also a member's wire value on the separate payment-method-type enum (`PaymentMethodType.STORED_CARD`). They are unrelated enums that happen to share a string. Comparing a raw value against `"stored-card"` to detect one is not evidence it isn't the other — compare against the enum member (`PaymentType.PAY_IN_FULL`), never against the string literal.

`PaymentType` has **four** members, not three — `MANUAL_PAYMENT` exists alongside the three this module actively branches on (`PAY_IN_FULL`, `PARTIAL_PAYMENT`, `PAY_LATER`). Nothing in this module's guards (`isPayable`, `needsPayment`, `filterPaymentTypes`) currently checks for `MANUAL_PAYMENT` — a value the module doesn't itself produce, but code reading `model.type` from outside the module should not assume the set is limited to the three.

## `gateway_id` doubles as a pay-later sentinel

```ts
import { unset } from "lodash-es";
import { PaymentType } from "@upmind-automation/types";
import type { PaymentDetailModel } from "@upmind-automation/headless";

// payment-details.services.ts, parse() — `safeModel` is the schema-parsed form
// model, `amount` the outstanding balance the machine was seeded with.
declare const safeModel: PaymentDetailModel;
declare const amount: number | undefined;

// FORCE payment type if we have the gateway wet to pay later (syntactic sugar)
if (safeModel?.gateway_id == PaymentType.PAY_LATER) {
  safeModel.type = PaymentType.PAY_LATER;
  safeModel.amount = amount ?? 0;
  unset(safeModel, "gateway_id");
  unset(safeModel, "payment_details_id");
  unset(safeModel, "wallet_amount");
}
```

A `gateway_id` field carrying the literal string `"pay-later"` (`PaymentType.PAY_LATER`'s wire value) is read as "the client picked pay later", not as a real gateway id — the machine rewrites `type` and strips the field entirely. This is a code-comment-sourced trap, not a proven one: no test in this module's own suite exercises the branch, so treat it as current behaviour to code around rather than a guarantee to build new UI against.

## A fresh-gateway selection needs both halves 🧪

`mapPaymentData` needs **both** `model.gateway_id` (which gateway) **and** the gateway's own capture bag — the `data` argument, produced by that gateway's own tokenise/SDK step — to build a real gateway payload. Supplying one without the other produces a payload naming the amount and the client, and **no gateway at all**:

```ts
import type {
  PaymentDetailData,
  PaymentDetailModel,
  PaymentDetailsContext
} from "@upmind-automation/headless";
import type { SelectPaymentMethodData } from "@upmind-automation/types";

// `mapPaymentData` is module-internal (payment-details.mappers.ts); this is its
// real signature, so the call below is the call the machine makes.
declare function mapPaymentData(args: {
  clientId: PaymentDetailsContext["client"]["id"];
  data?: SelectPaymentMethodData;
  lookups: PaymentDetailsContext["lookups"];
  model: PaymentDetailModel;
  requirePaymentForFreeOrders?: boolean;
}): PaymentDetailData | undefined;

declare const clientId: string;
declare const gateway_id: string;
declare const lookups: PaymentDetailsContext["lookups"];

// model names a gateway, but no capture data was passed
mapPaymentData({
  clientId,
  model: { amount: 25, type: null, gateway_id },
  lookups,
  data: undefined
});
// → { amount, client_id, ... } — no gateway_id, nothing to charge
```

Pinned in [`payment-details.mappers.test.ts`](../__tests__/payment-details.mappers.test.ts) — "hands on no gateway when the gateway's own capture produced no fields".

## `PATCH` is refused outright — the route only accepts `PUT` 🧪

Setting a stored method as default and toggling `auto_payment` both go through the same route, and it answers `PATCH` with `405`:

```json
{
  "error": {
    "code": 405,
    "message": "The PATCH method is not supported for this route. Supported methods: GET, HEAD, PUT, DELETE."
  }
}
```

Recorded fixtures: `patch-clients-id-payment-details-id-case-set-default.json` and `-case-auto-payment.json` — both capture the `405` for a `PATCH`, not a success. The real `PUT` success shape is owed (tracked on **FE-3130**); a partial `PUT` against a real stored method on the recording client risked blanking its other fields, so it wasn't captured live.

## A cross-client read comes back `404`, not `403` 🧪

`GET /clients/{clientId}/payment_details` for a client the calling token cannot see returns `404` with `error.message = "Client not found!"` — not a `403`, and not a `200` with an empty list. Recorded in `get-clients-id-payment-details-case-not-mine.json`, proven in [`payment-details.int.test.ts`](../__tests__/payment-details.int.test.ts). Code that catches `404` generically and renders "no saved methods" is indistinguishable, from the client's screen, from "you may not see this" — treat any `404` on this endpoint as a refusal to surface, not an empty state.

## The brand-gateway list ignores `amount` 🧪

`GET /brands/{brandId}/gateways` filters on currency and country; it does **not** filter on the amount being paid. A capture at `0.20` and the same capture at `50.00` return **identical** rows — 15 in both recorded captures (`get-brands-id-gateways-active-1-amount-0-20-case-tiny-amount-client-id-country-id.json` vs `...case-pay-client-id-country-id.json`). A gateway's own per-currency minimum (Stripe's $0.50, etc.) is enforced later, at submit, not here — code that assumes a tiny amount narrows the gateway list will be surprised when a gateway that later rejects the charge is still on offer.

## `orderId` and `orderStatus` are the PAY-context minimum, not optional decoration 🧪

`PaymentDetailsArgs` marks both as optional in its type, but PAY context needs both to leave `checking` at all — `isPayable` (the pre-flight guard) checks `orderStatus` against the payable set, and with no `orderStatus` supplied the machine sits in `unavailable` forever, never reaching `loading`. Spawning a PAY-context actor with a client, a currency and an amount but no `orderId`/`orderStatus` looks like it should work and silently doesn't. ADD context is the one case that genuinely doesn't need either.

## Common Mistakes

### Confusing this module's "challenge" with `payment`'s

Both modules render something they call a challenge, and they are not the same challenge. This module's `render`/`cancelChallenge` (via `usePaymentDetail`) mount a **capture-time** SDK step — tokenising a card before anything has been charged. The sibling `payment` module's own challenge is the **post-charge** 3DS/SCA step after `POST /payments` has already run. Wiring one module's challenge handlers to the other's `meta` flags produces a form that never renders, or a redirect that fires at the wrong point in the flow.

### Calling `update()` in ADD context, or `add()` in PAY context

`update()` sends the machine's `PAY` event; `add()` sends `ADD`. The machine only wires the event that matches the active `ctx` — calling the wrong one is a silent no-op, not an error, because the event simply isn't handled in the state the machine happens to be in.

### Treating `SelectPaymentMethodData` as one flat shape

The payload `mapPaymentData` produces is a **union of seven concrete shapes** (`StoredCardData`, `GatewayCardData`, `GatewayExternalCardData`, `GatewayData`, `GatewayMobileData`, `GatewayDirectDebitData`, `GatewayExternalStoreData`), not one envelope with every field optional. Code that destructures fields off it assuming they're all always present (or always absent) is assuming a shape the type doesn't have.

## Edge Cases

### `useCalculate` dedupes equal values — by design

The composable formats three amounts (what's being paid, what's outstanding, what the credit covers) over one shared `POST /cart/calculate` call. When two or more of the three happen to be numerically equal, `useCalculate` collapses them into a single request rather than three. This is deliberate dedupe behaviour, not a bug — but it means a test (or a manual check) that drives all three amounts to the same value proves nothing about whether they're kept independent; drive them apart first.

### `usePaymentDetailAdd` exposes no `destroy()`

The interpreter it starts with `interpret(...).start()` has no corresponding stop call anywhere in the composable. It keeps running until the page or component holding it is torn down by other means.

### Forgetting `isInvoked: true` when spawning as a child

`providePaymentDetails`/`cancelPaymentDetails` only `sendParent` when `isInvoked` is `true` on the context the machine was spawned with. A parent that spawns `paymentDetailsMachine` without setting it gets a machine that reaches `complete` correctly but never tells the parent — the parent's `onDone`/event handler for `PAYMENT_DETAILS` simply never fires.

## Lifecycle Considerations

### `isReady()` waits forever on a stuck transition

Like the sibling `payment` module, `isReady()`'s `waitFor` has `timeout: Infinity`. If the machine freezes mid-transition — an unguarded action throwing, a spawned actor never settling — the promise never resolves and never rejects. A caller stuck on `await paymentDetail.isReady()` with no timeout of its own has no way to distinguish "still loading" from "will never resolve".

## Fixtures: the traps in this module's own suite

- **The replay server matches loosely**, the same as `payment`'s. `GET /clients/:clientId/payment_details` matches on the path pattern regardless of the actual id, so a recorded refusal on the same route as a recorded success has to be installed explicitly with `server.use(...)` per test rather than relied on to win by virtue of the real id in the URL.
- **The keyed-listing capture is real, not synthetic.** The 13-record, gap-keyed `data` object behind the open defect above is an actual staging response — the recording client had rows filtered out server-side at capture time. It was not hand-constructed to prove the defect; the defect was found because of it.
- **`replayCalculateByPrice` matches on request body, not route.** Because all three of this module's formatted amounts hit the same `POST /cart/calculate` route, a route-level replay would answer all three identically and the three formatted strings would agree by construction rather than by behaviour — the test helper matches on the summed `prices` in the request body instead, specifically to route around the `useCalculate` dedupe described above.

## What's owed, not yet proven

Seven of this module's 29 documented scenarios have no proving test yet — each blocked on a recording gap (a brand switch, a throwaway method to delete, an OAuth refresh leg), never on the code:

- Removing a stored method
- Making a stored method the default (the route's `405` on `PATCH` is recorded; the `PUT` success isn't)
- Turning renewal charging (`auto_payment`) on or off for a stored method
- A brand that forces card storage on every payment
- A brand that forces `auto_payment: true` on every stored method
- The last-method protection when `allow_card_removal_replacement` is off
- The signed-out read (`401` is recorded; replaying it needs the token-refresh leg recorded alongside it, which isn't)

All seven are tracked on **FE-3130**. Anything needing a real browser — the 3DS challenge, the tokenise handshake end to end, storing a card end to end, any off-site redirect — carries no scenario in this module's contract at all; that is e2e's surface, not a gap in this list.
