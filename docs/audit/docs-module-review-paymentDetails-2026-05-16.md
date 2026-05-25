# Module review — paymentDetails (foundation.md)

- **Date:** 2026-05-16
- **Reviewer:** Claude (docs-module-review)
- **Candidate:** `packages/headless/src/modules/paymentDetails/docs/foundation.md`
- **Prior review:** none (first review)
- **Module:** paymentDetails

---

## Executive summary

| Category | Score |
| --- | --- |
| Technical accuracy | 78 |
| Completeness | 92 |
| Structure | 90 |
| Tone | 88 |
| Actionability | 90 |
| **Overall** | **87.6 → 88** |

**Verdict:** Pass with fixes. The doc is impressively thorough — strong Operations table, rich lessons that map directly to observed problems, clean Flows section with proper `flowchart TD`. The blocker is a factual error in the sibling-scope boundary (gateway SDK lifecycle is owned by paymentDetails, not by `payment`), a few dependant-table inaccuracies vs the graph, and a small set of tone/strip slips. None require rule changes.

---

## Part 2: Fresh full audit

### Strip audit findings

🟠 **Warning — "machine" language leaks** (line 8 "Two operating modes share the same data and machine"). The candidate uses framework-neutral phrasing throughout but slips into "machine" once. Replace with "the same data and orchestration" or just "share the same lifecycle".

🟠 **Warning — solution-shape suffix in Lesson** (line 678 "Treating `data` defensively without checking the response status flattens the two cases and presents an empty list when the real answer is 'you're not allowed'."). The trailing clause prescribes the inverse solution-shape. Stop at the problem statement: "the two response shapes are distinct and conflating them silently presents an empty list".

🟡 **Suggestion — "the storefront should not render the…"** (line 605, in flow constraints). Soft prescription. Could be reworded as a constraint: "Customer-facing UI that exposes a 'save this card' checkbox under these conditions misleads the customer; the storage will happen regardless".

🟡 **Suggestion — "the caller's job is to pass it straight to the gateway's SDK"** (line 44, Operations row 5). Mild prescription; acceptable but borderline. The fact is "the response is a gateway-specific payload that the SDK consumes".

🟢 **Praise — no method names anywhere.** No `usePaymentDetail(`, `usePaymentGateway(`, `isReady(`, `getConfigValue(`. Strip discipline is otherwise tight.

🟢 **Praise — `meta` stripped consistently** from data shape and fixture sample (the candidate's italic note is placed correctly).

### Section audit (canonical order)

| Section | Status | Notes |
| --- | --- | --- |
| Header | ✅ | `# Module: paymentDetails` |
| What it is | ✅ | Strong opening; sibling-scope boundary present (but factually wrong — see Content audit). |
| Keys by lifecycle phase | ✅ | Six brand-config keys mapped to Checkout / Payment phases with clear "Relevance" descriptions. |
| Core concepts | ✅ | Seven concepts; "Pay context vs add context" and "Selected method payload" are particularly useful. |
| State model | ✅ (omitted) | Correctly omitted — paymentDetails has no platform-defined state enum. |
| Operations | ✅ | 12 capabilities, each tied to an exposed BE endpoint. Strong inputs/outputs. |
| Data shape | ✅ | Four blocks (stored method, brand gateway, wallet balance, selected-method payload, transaction outcome). Fixture-aligned. |
| Dependencies | ✅ | Both halves present; weights inaccurate vs graph (see Content audit). |
| API endpoints | ✅ | Eight endpoint blocks with curls + fixture-sourced sample responses. |
| Side effects | ✅ (omitted) | Correctly omitted. |
| Coordination | ✅ (omitted) | Correctly omitted. |
| Flows | ✅ | Two flowcharts (`Pick a stored method and pay`, `Store a card outside of a payment`). Both use `flowchart TD` with rounded/square/diamond nodes. `Guarantees` / `Constraints` rendered as prose lead-ins. |
| Lessons | ✅ | Ten lessons, each a real problem with concrete evidence. |

### Content audit

#### Operations

✅ Matches source. The 12 capabilities map cleanly to:

- `services.ts` (loadList, loadLookups, restoreOperation, endSetup)
- `gateways/services.ts` (tokenize-begin / tokenize-end)
- `usePaymentDetailAdd.ts` (Add flow)
- `usePaymentDetail.ts` (Pay flow)

No exposed capability is missing; nothing invented. Lifecycle-shaped operations (readiness/refresh/invalidate) are absent — acceptable here, since paymentDetails exposes them only via the parent machines that invoke it.

#### Data shape

✅ **Stored payment method** matches fixture at `tests/__fixtures__/recordings/get-clients-8d632507-...-payment_details-f3a1bf8d.json`. Every fixture field is present, including the "follow the fixture over typed contract" exceptions (`default`, `can_delete`, `payment_method_type`, `autopayment_blocked`, `pre_expiry_notification`, `manual`, `errors`). The cross-reference to `packages/types/src/models/paymentDetails.ts` is correct and the note about narrowness vs fixture is well-placed.

🟡 **Suggestion — `user_id` is declared twice** (lines 67 and 114) in the Stored method type block. The second declaration is in the "Audit" group; remove the duplicate or fold the audit ordering.

✅ **Brand gateway** matches fixture at `get-brands-...-gateways-*.json`. `gateway_settings` discrimination (private vs full) is captured faithfully.

✅ **Wallet balance** matches `get-wallet-balance.json` fixture shape.

✅ **Transaction outcome** matches `post-payments.json` fixture.

#### Dependants table (the bigger issue)

🔴 **Critical — `invoices` is not a dependant.** The graph (`graphify-out/graph.json`) returns zero edges where the `invoices` module imports from paymentDetails. Verification:

```
Per-module fan-in (modules importing FROM paymentDetails):
  basket:  4
  payment: 5
  orders:  4
```

The candidate lists `basket(3), payment(1), orders(1), invoices(1)`. All four weights are wrong; `invoices` row should be removed entirely.

🟠 **Warning — `payment` weight understated.** Candidate has `payment: 1`; graph has `payment: 5`. The `payment` module is the heaviest dependant (it consumes paymentDetails for the invoice-payment surface), not a thin co-traveller.

🟠 **Warning — `basket` weight understated.** Candidate has `basket: 3`; graph has `basket: 4` (`basket/useBasketPaymentDetails.ts`, `basket/utils.ts`, `basket/types.ts`, plus one virtual edge).

🟢 **Praise — Presentation-layer row is present and correctly framed** (lines 291–292) — covers payment-method management pages, checkout payment step, invoice "pay now" surface. The query/routing exclusion footnote is present.

#### Sibling-scope boundary (the headline issue)

🔴 **Critical — boundary statement reverses ownership.**

The candidate (line 5) claims:

> "The gateway abstraction itself (the per-provider SDK lifecycle — load, render, confirm, 3DS challenge) lives in the `payment` module; payment details picks up the resolved instrument and the brand's gateway list, and stops once a `payment_details_id` is selected or a transaction payload is produced."

The source contradicts this:

- `packages/headless/src/modules/paymentDetails/gateways/` contains every per-provider SDK machine (`stripe/`, `braintree/`, `card/`, `dlocal/`, `mercadoPago/`, `openPay/`, `razorpay/`) plus the generic `gateway.machine.ts`.
- `paymentDetails/paymentDetail.machine.ts` exposes a `spawnGateway` action and stores `gatewayHelper: ActorRef<any>` on context.
- `paymentDetails/gateways/README.md` explicitly states: "Gateways are spawned from the Payment details machine."
- The `payment` module is a *sibling* that wraps the **invoice-payment surface** (`POST /payments` from a settled-instrument viewpoint, plus the post-payment approval / settlement flow). It is a *consumer* of paymentDetails, not the gateway-lifecycle owner.

The actual demarcation is closer to:

> "paymentDetails owns the customer's stored instruments, the brand-gateway list, the per-provider SDK lifecycle (load / render / confirm / 3DS challenge — all spawned from this module), and the selected-method payload up to and including the `POST /payments` call for free-standing invoice payments. The basket-conversion `POST orders/{id}/convert` path lives in `basket`; the post-payment approval / settlement / webhook reconciliation lives in `payment`."

This must be rewritten — it's the doc's central scope claim and an architect reading it will misroute the per-provider SDK code.

🟠 **Warning — own-dependencies row says payment "owns the per-gateway SDK lifecycle"** (line 301). Same inversion; the SDK lifecycle is internal to paymentDetails. The legitimate forwarding to `payment` is the approval-URL / off-site-redirect *resolution* and the invoice-level post-payment surface.

🟢 **Praise — own-dependencies otherwise solid.** HTTP transport, session, brand, routing, shared types are all real.

#### API endpoints

✅ URLs and methods match the services file:

- `GET /clients/{clientId}/payment_details` — `loadList` and `loadLookups`
- `GET /brands/{brandId}/gateways` — `loadLookups`
- `GET /wallet/balance` — `loadLookups`
- `POST /cart/calculate` — `loadLookups` and `calculateSubscription`
- `POST /gateway/frontend/tokenize-begin/{gatewayId}` — gateway services
- `POST /gateway/frontend/tokenize-end/{gatewayId}` — `endSetup`
- `POST /clients/{clientId}/payment_details` — direct-card capability
- `PATCH` / `DELETE` for default / auto-payment / delete

✅ Sample bodies sourced from real fixtures.

🟡 **Suggestion — tokenise-end payload field name.** The candidate's curl (line 533) uses `client_payment_details_id`. Source confirms this (`endSetup` in `services.ts`). ✓ correct.

#### Lessons

✅ Each lesson is anchored in observable phenomena:

- "Pick-then-pay needs a gateway re-fetch" → `loadLookups` re-keying on `(brandId, clientId, currencyId, countryId, orderId)`.
- "Stored-method default isn't preserved across currency / country switches" → `find(storedPaymentMethods, "meta.isDefault")` in `services.parse`.
- "`auto_payment: true` is platform consent" → `force_auto_payment_for_stored_details` config key handling.
- "3DS / SCA redirects can land back with a stale basket" → `restoreOperation` + `useSessionStorage().get("operation")`.
- "Gateway type ≠ stored-method type ≠ payment-method-type" → `IPaymentDetail.type` vs `IPaymentDetail.payment_method_type` vs `IGateway.type`.
- "Storing on payment isn't always optional" → three-flag interaction (`store_on_payment` × `store_on_payment_force` × `force_card_storage`).
- "`wallet_amount` shifts the gateway-eligibility ground" → server-side filter is keyed on full `amount`, not `amount - wallet_amount`.
- "Listing payment methods is an authorisation surface" → `GET /clients/{clientId}/payment_details` 403 shape.
- "Deleting the last card silently changes platform behaviour" → `allow_card_removal_replacement` config key.

🟢 **Praise — "Capability descriptions vs UI flags drift"** is a genuinely original lesson that surfaces the four-truth fail-closed pattern. Strong.

🟠 **Warning — Lesson "Listing payment methods is an authorisation surface"** ends with a prescription ("Treating `data` defensively without checking the response status flattens the two cases…"). Trim to the problem only.

---

## Top 3 priorities

1. **🔴 Fix the sibling-scope boundary in "What it is" (line 5) and in the own-dependencies "Payment" bullet (line 301).** The current text reverses ownership — paymentDetails owns the per-gateway SDK lifecycle internally (`gateways/` folder, `spawnGateway`, `gatewayHelper`); `payment` is a sibling consumer for invoice-payment surfaces, not the SDK owner. (Severity: blocker, ease: medium — needs rewording one paragraph and one bullet.)

2. **🔴 Correct the Dependants table.** Drop the `invoices` row (no graph edges). Update weights to graph truth: `basket: 4`, `payment: 5`, `orders: 4`. Reorder descending by weight so `payment` is the top dependant. (Severity: blocker, ease: trivial — table rewrite.)

3. **🟠 Strip-audit cleanup pass.** Replace "share the same data and machine" (line 8) with framework-neutral phrasing; trim the trailing prescription from the "Listing payment methods is an authorisation surface" lesson (line 678); soften the "storefront should not render the checkbox" constraint (line 605); fix the duplicated `user_id` line in the stored-method type. (Severity: warning, ease: trivial — five small edits.)

---

## Appendix A: Source-of-truth references

- `packages/headless/src/modules/paymentDetails/index.ts` — exports surface
- `packages/headless/src/modules/paymentDetails/services.ts` — `loadList`, `loadLookups`, `parse`, `validate`, `restoreOperation`, `endSetup`, `calculateSubscription`
- `packages/headless/src/modules/paymentDetails/types.ts` — `PaymentDetail`, `PaymentDetailsContext`, `AccountCredit`, `PendingOperation`, `AmountKey`
- `packages/headless/src/modules/paymentDetails/paymentDetail.machine.ts` — `spawnGateway`, `gatewayHelper` actor ref
- `packages/headless/src/modules/paymentDetails/gateways/` — per-provider SDK machines (stripe/braintree/card/dlocal/mercadoPago/openPay/razorpay) + `gateway.machine.ts` + `gateways/README.md`
- `packages/headless/src/modules/payment/payment.machine.ts` — sibling invoice-payment wrapper
- `packages/types/src/models/paymentDetails.ts` — `IPaymentDetail` typed contract
- `packages/types/src/data/enums/gateway.ts` — `GatewayTypes`, `GatewayContext`, `GatewayProviderCodes`
- `tests/__fixtures__/recordings/get-clients-8d632507-...-payment_details-f3a1bf8d.json` — stored-method fixture
- `tests/__fixtures__/recordings/get-brands-...-gateways-*.json` — brand-gateway fixture
- `tests/__fixtures__/recordings/get-wallet-balance.json` — wallet fixture
- `tests/__fixtures__/recordings/post-payments.json` — payment-response fixture
- `graphify-out/graph.json` — fan-in: `{ basket: 4, payment: 5, orders: 4 }`

## Appendix B: Verbatim evidence

**🔴 Sibling-scope inversion** (foundation.md line 5):
> "The gateway abstraction itself (the per-provider SDK lifecycle — load, render, confirm, 3DS challenge) lives in the `payment` module"

Source counter-evidence (`packages/headless/src/modules/paymentDetails/gateways/README.md`):
> "Gateways are spawned from the Payment details machine."

**🔴 Dependant weight inversion** (foundation.md lines 286–289):
> `basket | 3`, `payment | 1`, `orders | 1`, `invoices | 1`

Graph truth: `basket: 4`, `payment: 5`, `orders: 4`, `invoices: 0`.

**🟠 "machine" leak** (foundation.md line 8):
> "Two operating modes share the same data and machine"

**🟠 Solution-shape suffix** (foundation.md line 678):
> "Treating `data` defensively without checking the response status flattens the two cases and presents an empty list when the real answer is 'you're not allowed'."

## Appendix C: Files reviewed

- `.agent/rules/docs-modules.md`
- `.agent/workflows/docs-module-review.md`
- `packages/headless/src/modules/paymentDetails/docs/foundation.md` (candidate)
- `packages/headless/src/modules/basket/docs/foundation.md` (reference at 95+)
- `packages/headless/src/modules/paymentDetails/index.ts`
- `packages/headless/src/modules/paymentDetails/services.ts`
- `packages/headless/src/modules/paymentDetails/types.ts`
- `packages/headless/src/modules/paymentDetails/paymentDetail.machine.ts` (grep)
- `packages/headless/src/modules/paymentDetails/usePaymentDetail.ts` (head)
- `packages/headless/src/modules/paymentDetails/gateways/README.md`
- `packages/headless/src/modules/payment/index.ts`
- `packages/headless/src/modules/payment/payment.machine.ts` (head)
- `tests/__fixtures__/recordings/get-clients-8d632507-...-payment_details-f3a1bf8d.json`
- `graphify-out/graph.json`

## Appendix D: Strip-audit exhaustive list

| Line | Issue | Severity |
| --- | --- | --- |
| 5 | "lives in the `payment` module" — factually inverts sibling scope | 🔴 |
| 8 | "share the same data and machine" — framework leak ("machine") | 🟠 |
| 44 | "the caller's job is to pass it straight to the gateway's SDK" — soft prescription | 🟡 |
| 286–289 | Dependants table: weights wrong, `invoices` row spurious | 🔴 |
| 301 | Own-deps: "Payment — sibling module that owns the per-gateway SDK lifecycle" — same inversion | 🔴 |
| 605 | "the storefront should not render the 'save this card' checkbox at all" — soft prescription | 🟡 |
| 67 + 114 | `user_id` declared twice in stored-method type block | 🟡 |
| 678 | "Treating `data` defensively without checking the response status flattens the two cases" — solution-shape suffix | 🟠 |
