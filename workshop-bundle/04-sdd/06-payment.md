# SDD 06 — Payment (Stripe 3DS happy path)

## Goal

A signed-in client lands on the payment page with a basket that already carries billing details. They pick a payment method — a card already on file, or a fresh card entered into a Stripe inline form that runs the 3DS challenge in-browser — and submit. The `POST /payments` call returns a success-branch response (`OK`, `WAITING`, or `AWAITING_CLIENT`); the feature resolves the branch, converts the basket to an invoice (if the platform hasn't already), and routes to confirmation. At the end the user sees the confirmation page; the system holds an invoice id in `invoice_paid` (or `invoice_unpaid` with a `pending: true` payment row if the platform is still settling).

## Depends on

- Feature 5 (Checkout) — basket envelope has billing details (`address_id`, `company_id`, `phone_id`) attached.
- Feature 4 (Basket) — basket id, basket currency, basket country (the country derived from feature 5's bound address).
- Feature 1 (Auth) — authenticated client token. Payment is not anonymous; a guest token cannot stand up a stored-card list or read `/self`.

## Modules consumed

- `paymentDetails` (capture surface) — see [02-module-foundations/paymentDetails.md](../02-module-foundations/paymentDetails.md)
- `payment` (make surface) — see [02-module-foundations/payment.md](../02-module-foundations/payment.md)
- `basket` (conversion + reads) — see [02-module-foundations/basket.md](../02-module-foundations/basket.md)
- `invoices` (post-conversion read + refresh) — see [02-module-foundations/invoices.md](../02-module-foundations/invoices.md)

## Reads (before generating any code)

- `06-initiator/generic.md` — sections 9 (validation checklist), 10 (operating principles, especially **#7: capture-vs-make split — don't blur it**, and the note that `WAITING` / `AWAITING_CLIENT` are not errors)
- `03-foundations-chapter.md` — full (especially **§4 error model — `200 + WAITING` is NOT an error**; §1.4 retry policy on POSTs)
- `02-module-foundations/paymentDetails.md` — full (capture surface: stored-method list, gateway list, Stripe SDK handshake, `SelectPaymentMethodData` payload)
- `02-module-foundations/payment.md` — full (make surface: `POST /payments`, the `transaction_status × approval_url × gateway.type` decision)
- `02-module-foundations/basket.md` — full (capability 10: `PATCH /orders/{id}/convert`; the basket conversion may carry the payment-method payload directly)
- `02-module-foundations/invoices.md` — full (capabilities 1, 4: read + refresh after a payment lands)

## What this feature does

1. **Mount the payment page.** Read the basket from the basket store (set in feature 4, billing-hydrated in feature 5). Pull `basket.id`, `basket.currency.code`, `basket.client_id`, and the country id from the basket's bound billing address. Without those four, do not fire any reads.
2. **List brand-eligible gateways.** Issue `GET /brands/{brandId}/gateways` with **all four eligibility filters** — not just `basket_id`:

   ```
   GET /api/brands/{brandId}/gateways
     ?basket_id={basketId}
     &invoice_id={basketId}        # SAME UUID as basket_id — platform validates both
     &currency_code={basket.currency.code}
     &country_code={basket.address.country.code}
     &active=true
     &with=gateway.gateway_provider,gateway.card_types
     &order=order
     &lang=en
   ```

   **`basket_id` alone is not enough.** The single-filter shortcut returns gateways that *exist* in the brand's gateway list but may not be *eligible* for this basket. Selecting one of those produces:
   - `409 — Currency not supported by gateway` on `PATCH /orders/{id}/convert`, OR
   - `422 — This gateway does not support automatic payments` on `POST /payments`.

   All four filters together produce a list every entry of which is genuinely usable for this basket. The `?invoice_id` parameter accepts the same UUID as `basket_id` (basket.id === invoice.id even pre-convert for eligibility purposes — the platform is forgiving on this one). Without it the eligibility check is weaker.

   **Render into the gateway picker preserving server-side `order`.** See paymentDetails.md, capability 2.

   > **Filter the response for automatic-payment capability.** Not every returned gateway accepts `POST /payments` — offline, manual, direct-debit, awaiting-client-wire-transfer gateways DO appear in the response (when otherwise eligible) but **reject `POST /payments` with `422 — This gateway does not support automatic payments`**. The flow for these is convert-only: convert the basket, render the gateway's `payment_instructions` markdown, the customer pays out-of-band, an admin reconciles.
   >
   > Filter the eligibility list down to automatic-payment gateways before showing the picker. The exact flag name is **not pinned** in the current bundle (multiple variants observed: `is_offline`, `is_manual`, `allow_automatic_payment`, `supports_automatic_payment`, `automatic_payment`). Until the next bundle update pins the canonical flag, **check all of them + a name-based fallback**:
   >
   > ```ts
   > function supportsAutomaticPayment(g: BrandGateway): boolean {
   >   const gw = g.gateway;
   >   // True if any explicit "supports" flag says yes, false if any explicit "offline/manual" flag says yes
   >   if (gw.supports_automatic_payment === true) return true;
   >   if (gw.allow_automatic_payment === true) return true;
   >   if (gw.automatic_payment === true) return true;
   >   if (gw.is_offline === true || gw.is_manual === true) return false;
   >   // Name-based fallback (last resort, brand-data may differ):
   >   const name = (gw.name ?? "").toLowerCase();
   >   if (/offline|manual|bank.transfer|wire|cheque|cash/.test(name)) return false;
   >   return true; // default: assume it does
   > }
   > ```
   >
   > Two distinct UI paths: **automatic-payment gateways** → standard picker, `POST /payments`. **Non-automatic gateways** → display them in a separate "pay out of band" section (if surfaced at all for the prototype), and on selection, run **convert only** then route to confirmation with the `payment_instructions` rendered. The prototype's spine builds the automatic path; the second path is acknowledged but not wired by default.
3. **List the client's stored payment methods.** Issue `GET /clients/{clientId}/payment_details?limit=0&brand_id={brandId}&country_id={countryId}&currency_code={currency}&active=true&with=gateway,client&order=-default,id&lang=en`. The default-first ordering means the first row is the implicit pick.
4. **Render the picker.** Two-column or two-tab layout — stored cards (if any), and a "use a new card" entry that mounts the Stripe gateway tile from step 2's response.
5. **User picks a method.** Two branches:
   - **Stored-card branch.** User selects a card. No SDK handshake runs — the method is already tokenised on the gateway side. Skip to step 8.
   - **New-card branch.** Continue to step 6.
6. **Initialise Stripe.js.** Load `https://js.stripe.com/v3/` with the publishable key from the Stripe gateway row's `gateway_settings` (look for `field === "publicKey"`). Mount a Card Element into the page.

   > **Stripe Card Element gotchas — pinned from a workshop run:**
   >
   > - **Pass `hidePostalCode: true` when mounting the Card Element.** The classic Card Element defaults to US-style ZIP capture and there's no way to feed it a country at create time (only the newer Payment Element accepts country). Since this feature collects the full address in feature 5, hide the postal code on the Card Element and pass the address explicitly on `createPaymentMethod` (next step).
   > - **The classic Card Element does NOT accept default country / address at create time.** Only the newer Payment Element does. If the team's brand needs country-aware postal-code rendering (e.g. UK-formatted postcode vs US ZIP) at element creation, swap to Payment Element. The workshop's default path uses Card Element + hidden postal code + `billing_details` on `createPaymentMethod` — simpler, works for the Stripe 3DS happy path.

   The Stripe SDK runs entirely client-side here — there is no Upmind API call yet. (Note: the Upmind platform also exposes a `POST /gateway/frontend/tokenize-begin/{gatewayId}` endpoint for SDK gateways that need server-issued payloads like setup intents; for the workshop's Stripe inline happy path, the Card Element + publishable key shortcut is sufficient. If the team's brand uses Stripe PaymentIntents in a setup-intent flow, switch to tokenize-begin per paymentDetails.md capability 5.)
7. **User enters card and presses Pay.** Stripe SDK runs `createPaymentMethod` (or `confirmCardSetup` for setup-intent flow). **Pass `billing_details` explicitly** carrying the user's full address from feature 5 — name, email, and `address: { line1, line2, city, state, postal_code, country }`:

   ```js
   stripe.createPaymentMethod({
     type: "card",
     card: cardElement,
     billing_details: {
       name: client.actor.fullname,
       email: client.actor.email,
       address: {
         line1: address.line1,
         line2: address.line2 ?? "",
         city: address.city,
         state: address.region?.name ?? "",
         postal_code: address.postcode,
         country: address.country.code,  // ISO-3166-1 alpha-2 (e.g. "GB")
       },
     },
   })
   ```

   This satisfies Stripe's address-verification requirements without exposing the postal-code input on the Card Element (which we hid in step 6). On a 3DS-required card, the SDK presents the challenge UI inline; user completes it; SDK resolves with a `payment_method_id` (or equivalent token). On Stripe SDK error (invalid card, declined by Stripe), surface as a Stripe-side error — not an `AppError` — and let the user retry. The SDK is the boundary between the user and the gateway; this is the only step the Upmind API doesn't see.
8. **Assemble the `SelectPaymentMethodData` payload.** This is the capture-vs-make boundary (operating principle #7). The payload shape is:

   ```ts
   {
     type: "pay_in_full",        // PaymentType — pay-in-full for the prototype
     amount: basket.total_amount,
     invoice_id: basket.id,      // SAME UUID — basket.id === invoice.id post-convert (see step 11)
     gateway_id?: string,        // new-card branch — uuid of the chosen gateway from step 2's list
     payment_method_id?: string, // Stripe new-card branch — TOP-LEVEL alongside the payload, from Stripe SDK's createPaymentMethod
     payment_details_id?: string,// stored-card branch — id of the chosen client_payment_details row
     // wallet_amount: OMIT ENTIRELY for full-amount payment. Sending `wallet_amount: 0` is REJECTED with 422.
     //   The field is required only when actually splitting payment between wallet + gateway. For pay-in-full,
     //   the field's absence is the platform's "no wallet draw" signal, not a literal zero.
   }
   ```

   Exactly one of `gateway_id` or `payment_details_id` is populated. `payment_method_id` rides alongside `gateway_id` for the Stripe new-card branch (the Stripe SDK's `createPaymentMethod` resolves it). The capture half ends here.

   > **DO NOT send `wallet_amount: 0`.** The platform returns `422 — wallet_amount must be non-zero when present` if zero is sent. For pay-in-full, omit the field. This is the second known overloaded-`0` sentinel in the platform (the first is `unit_quantity` / `min_order_quantity` where `0` means "no constraint" — see operating principle 8). Same trap, opposite direction: those want `|| 1` fallback to coerce away from zero; this one wants the field absent entirely.

9. **Submit the payment.** `POST /payments` with the payload plus `invoice_id` (see step 11 — the invoice id may need to be produced via conversion first depending on the basket-to-invoice path). The foundations layer attaches the bearer; currency is implicit in the invoice. Request body shape pinned from the captured v2 fixture (`tests/fixtures/recordings/post-payments.json`):

   ```jsonc
   {
     "invoice_id": "<invoice-uuid>",
     "gateway_id": "<gateway-uuid>",
     "client_id": "<client-uuid>",
     "amount": 198,
     "return_url": "?success=<urlencoded-success>&failed=<urlencoded-failed>",
     "cancel_url": "<gateway-cancel-landing>",
     "store_on_payment": false,
     "store_on_payment_auto_payment": false,

     // Stored-card branch — pay with an existing method
     "payment_details_id": "<stored-method-uuid>"

     // OR new-card branch (Stripe inline) — nested object, NOT flat top-level keys
     // "payment_method_addition": {
     //   "payment_method_id": "pm_1TYp...",     // from stripe.createPaymentMethod()
     //   "payment_method_type": "card"
     // }
   }
   ```

   > **Pinned from a real Stripe inline capture:**
   >
   > - `client_id` and `amount` are on the body — not derived from the bearer or the invoice. Send both.
   > - **`payment_method_addition` is a nested object**, not flat top-level provider fields. The Stripe SDK's `payment_method_id` rides under `payment_method_addition.payment_method_id`, paired with `payment_method_type: "card"`.
   > - **`return_url` carries nested success / failed callbacks** as a URL-encoded query string: `?success=<urlencoded>&failed=<urlencoded>`. Both targets are needed for the 3DS hand-off result.
   > - `store_on_payment` + `store_on_payment_auto_payment` are explicit. Send them; don't rely on defaults. When the brand's `force_card_storage` is on, set `store_on_payment: true`.
   > - `amount` is in the invoice currency's major units (e.g. `198` = $198.00 for USD) — match the basket envelope's `total_amount` field. Not minor units.

10. **Resolve the response.** The response is a `PaymentAttempt` (see payment.md data shape). Three success branches (all return HTTP 200 with `status: "ok"`):
    - `transaction_status: "OK"` + `approval_url: null` → paid, immediate. Go to step 12.
    - `transaction_status: "WAITING"` + `approval_url: null` (Stripe inline 3DS happy path: the SDK already cleared the challenge, the back end may still be settling) → poll the invoice. Go to step 11a.
    - `transaction_status: "WAITING"` with `gateway.type === AWAITING_CLIENT` → render the gateway's `payment_instructions` (markdown) and navigate to confirmation; the back end will reconcile asynchronously. (Out of scope for the Stripe happy path; mentioned for completeness — see Edge cases.)

    A failure response (`REJECTED`, `CANCELLED`, `ERROR`, or a 422 with `error.data` field errors) surfaces as an `AppError` — see Edge cases.

11. **Convert the basket → invoice (if needed) and poll on `WAITING`.**

    > **Critical facts pinned from a workshop run, do not re-litigate:**
    >
    > - **`basket.id === invoice.id` post-convert.** The same UUID. After `PATCH /orders/{basketId}/convert` returns successfully, the basket has become an invoice in the platform — same id, different lifecycle state. The `invoice_id` you send on `POST /payments` is literally `basket.id` from before the convert call. Cross-ref: basket.md "The basket id changes on conversion" lesson — the *URL fragment* the customer sees may change but the underlying UUID does not.
    > - **Convert response shape: `envelope.data` IS the invoice.** Not `{ invoice: <Invoice> }`. A naive typing of `data: { invoice: Invoice }` blows up silently (the property doesn't exist), `POST /payments` never fires from the right id, and the user reports "convert worked but no payment". Type the convert response as `envelope: EnvelopedResponse<Invoice>` and read the invoice directly off `envelope.data`.
    > - **Convert is NOT idempotent — it is single-use per basket.** A second call to `PATCH /orders/{basketId}/convert` against an already-converted basket (now an invoice) returns 4xx (typically `409` or `422` with `"already converted"` style message). Cause: the user clicked Pay, payment failed for some reason, they click Pay again; the storefront fires convert again. On retry, **read the recorded invoice id from state and skip convert entirely** — go straight to `POST /payments` with the already-known invoice id. Detection rule: catch the convert 4xx, inspect `error.message` for "already converted" / "already an invoice", and treat as a soft-success — the invoice already exists.

    - **Conversion:** `PATCH /orders/{basketId}/convert` accepts the resolved payment-method payload on its body (basket.md capability 10 + `ConvertBody` shape) and returns the resulting invoice (flat, on `envelope.data`). There are two paths the team must confirm against basket.md on first build:
      - **Path A — conversion-then-pay:** call `PATCH /orders/{basketId}/convert` first with the resolved payment payload, take the returned `invoice.id`, then `POST /payments` against that invoice.
      - **Path B — pay-then-convert:** if the platform converts implicitly on `POST /payments` (some brand configs do this when the basket has no prior invoice), the response carries the new invoice id without a separate convert call.

      Build for Path A (explicit convert) unless basket.md says otherwise for the workshop brand. It is the more reliable shape; the implicit path is an optimisation, not a guarantee.

    - **a. Poll on `WAITING`:** re-issue `GET /invoices/{invoiceId}?with=brand,taxes,client,gateway,products,promotions,payments` every 2 seconds for up to ~30 seconds. Terminate the poll on `status === "invoice_paid"` (success) or when `payments[]` shows a captured (non-`pending`) payment row. Cap the poll — see Edge cases.

12. **Navigate to confirmation.** Once the invoice is paid (or `WAITING` resolves), route to `/confirmation/{invoiceId}` (feature 7's surface). If the poll cap is hit and the invoice is still settling, route anyway with a "payment is processing" hint — feature 7 will re-read the invoice and render the appropriate state.

13. **Walk the team through validation.** Run the validation checklist below. Commit on green.

## Data shapes (feature-scoped)

View-models the feature assembles from the module-foundation types. Full platform types live in paymentDetails.md and payment.md.

```ts
// Page state — what the payment page renders
type PaymentPageViewModel = {
  status: "idle" | "submitting" | "awaiting" | "paid" | "failed";
  gateways: GatewayOption[];           // mapped from BrandGateway[] in paymentDetails.md
  storedCards: StoredCard[];           // mapped from IPaymentDetail[] in paymentDetails.md
  selected: PaymentSelection | null;
  invoiceId: string | null;            // populated after conversion in step 11
  error?: AppError;                    // foundations-layer normalised error
};

type GatewayOption = {
  id: string;                          // brand-gateway id
  gatewayId: string;                   // gateway id (used in SelectPaymentMethodData.gateway_id)
  name: string;                        // gateway.name_translated
  provider: string;                    // GatewayProviderCodes — drives SDK routing
  type: number;                        // GatewayTypes enum — 1 = CARD for Stripe
  publishableKey?: string;             // from gateway_settings where field === "publicKey"
  supportedCardTypes: string[];        // card_types[].code
};

type StoredCard = {
  id: string;                          // payment_details_id
  brand: string;                       // card_type — "visa", "mastercard"
  last4: string;                       // card_last4
  expiry: string;                      // card_expire_date — "12/2028"
  isDefault: boolean;                  // default
};

type PaymentSelection =
  | { mode: "stored"; paymentDetailsId: string; gatewayId: string }
  | { mode: "new"; gatewayId: string; stripeMaterial: { paymentMethodId: string } };

// The capture/make boundary payload — owned by paymentDetails, consumed by payment.
// Defined in full at paymentDetails.md ("Selected method payload — SelectPaymentMethodData").
type SelectPaymentMethodData = {
  type: "pay_in_full" | "partial_payment" | "pay_later";
  amount: number;
  wallet_amount?: number;
  gateway_id?: string;
  payment_details_id?: string;
};

// The make-half response — owned by payment.
// Defined in full at payment.md ("PaymentAttempt").
type PaymentAttempt = {
  transaction_status: "OK" | "WAITING" | "REJECTED" | "CANCELLED" | "ERROR";
  transaction_type: number;
  transaction_id: string | null;
  approval_url: { url: string; method: "GET" | "POST"; fields: Record<string, string> } | null;
};
```

## API calls (in execution order)

| Step | Method | Endpoint | Purpose | Fixture |
| --- | --- | --- | --- | --- |
| 2 | GET | `/brands/{brandId}/gateways?basket_id={basketId}&active=true&with=gateway.gateway_provider,gateway.card_types&order=order&lang=en` | List filtered gateways (currency + country derived from basket) | `07-references/recordings/get-brands-{brandId}-gateways-{hash}.json` |
| 3 | GET | `/clients/{clientId}/payment_details?limit=0&brand_id={brandId}&country_id={countryId}&currency_code={currency}&active=true&with=gateway,client&order=-default,id&lang=en` | Stored cards on file (default first) | `07-references/recordings/get-clients-{clientId}-payment_details-{hash}.json` |
| 7 | — | (Stripe SDK client-side — no Upmind API hit) | Stripe.js Card Element + 3DS challenge; produces `payment_method_id` | Not a fixture |
| 11 (Path A) | PATCH | `/orders/{basketId}/convert` | Convert basket → invoice with the resolved payment payload; returns the invoice | `07-references/recordings/patch-orders-{basketId}-convert.json` |
| 9 | POST | `/payments` | Submit the `SelectPaymentMethodData` payload against the invoice | `07-references/recordings/post-payments.json` |
| 11a | GET | `/invoices/{invoiceId}?with=brand,taxes,client,gateway,products,promotions,payments` | Poll the invoice while `transaction_status === "WAITING"` | `07-references/recordings/get-invoices-{invoiceId}.json` |

> Path A orders the calls as: 2 → 3 → 7 → 11 (convert) → 9 (POST /payments against invoice) → 11a (poll if `WAITING`). Some brand configs may submit the payload to `PATCH .../convert` and skip the separate `POST /payments` if conversion alone settles the invoice — confirm against basket.md before building.

## Edge cases

- **`WAITING` / `AWAITING_CLIENT` are NOT errors.** This is operating principle #7 and §4.4 of foundations.md, in two voices, because it is the most-violated rule in the codebase. A `200` response with `status: "ok"` and `transaction_status: "WAITING"` is a platform-defined **success branch**, not an error. The foundations layer must pass it straight through; the feature decides what to do with it (poll, render instructions, or treat as complete).
- **The decision off `POST /payments` is three-axis**, not one. `transaction_status × approval_url × gateway.type` — see payment.md "The next step is a three-axis decision". Flatten any axis and the feature will treat a challenge as complete or a complete attempt as awaiting.
- **3DS challenge in inline Stripe is SDK-resolved client-side.** The Upmind back end never sees the challenge directly. By the time `POST /payments` fires, the `payment_method_id` riding on the body has already cleared 3DS. If `approval_url` comes back populated for Stripe inline, that's a redirect-shaped fallback path — not the happy path; surface as an error for the prototype and re-route the team to the foundation doc.
- **Stored-card flow does not run Stripe.js.** It is a `SelectPaymentMethodData` referencing `payment_details_id`, no SDK handshake. The Stripe SDK only loads on the new-card branch.
- **The `basket_id` filter shortcut** on `GET /brands/{brandId}/gateways` derives currency + country from the basket in one parameter. Use the shortcut for the prototype — it is simpler than passing `currency_code` + `country_id` separately and the back end resolves both from the basket's authoritative record.
- **`payment_instructions` on AWAITING_CLIENT gateways is markdown.** If a brand has a bank-transfer gateway in its eligibility list and the user picks it, the response will be `WAITING` and the gateway's `payment_instructions` must be rendered as markdown (not plain text). Out of scope for the Stripe happy path; mentioned because the workshop brand may surface it.
- **Polling forever is a bug.** Cap the invoice poll at ~30 seconds (15 attempts at 2s each). If the invoice hasn't reached `invoice_paid` by then, surface "payment is processing, check your invoices panel" and navigate to confirmation. The platform will reconcile asynchronously; the user does not need to wait synchronously.
- **Stripe SDK errors are separate from `AppError`.** A card declined client-side by Stripe (invalid number, CVV mismatch) never hits the Upmind API. Surface as a Stripe-specific message ("card not accepted by Stripe") and let the user retry the Card Element. Do not normalise it through the `AppError` shape — the categorisation does not fit.
- **Payment fails (declined by gateway, server-side).** `POST /payments` returns `status: "error"` (a real envelope error) or `transaction_status: "REJECTED"` / `"ERROR"` (a wire-success failure). Surface inline; let the user retry with a different method. Out of scope for the SDD checklist as a full retry UX — mention to the team.
- **Capture-vs-make boundary** (operating principle #7). paymentDetails-scoped code ends at the `SelectPaymentMethodData` payload. payment-scoped code starts from it. `POST /payments` is payment's surface; the Stripe SDK + gateway picker is paymentDetails's. Do not put `POST /payments` logic in paymentDetails or gateway picking in payment. The two surfaces share the payload and nothing else.
- **Wallet partial-pay is out of scope.** `wallet_amount: 0` for the prototype. The wallet capability is real (paymentDetails.md capability 3) but not built — the workshop spine is single-payment, full-amount.
- **Offsite redirect gateways are out of scope.** PayPal, hosted-fields gateways, and any provider whose `POST /payments` returns an `approval_url` requiring a full-page redirect are documented in payment.md but not built. The prototype builds inline Stripe only (branch 1 of the three capture flow branches paymentDetails.md describes).
- **The gateway list can go stale.** paymentDetails.md "The gateway list needs re-fetching when the amount, currency, or country changes". If the user navigates back to checkout, edits the address, then returns to payment, re-fetch the gateway list. For the prototype's linear flow this won't fire, but if the team adds a "back to checkout" link, the re-fetch is required.
- **The invoice id is not stable across the basket→invoice transition** *for the URL the customer sees*, but per basket.md is the same UUID server-side (`63250798-…` example in basket.md flows). Use the invoice id returned by `PATCH .../convert` (Path A) or by `POST /payments` (Path B) as the canonical id from step 11 onwards.
- **`billing.gateway.force_card_storage` — when set, every successful payment stores the card automatically.** Read this brand-config key during bootstrap (already in SDD 02's `BRAND_CONFIG_KEYS`). When `true`, the BE persists the captured card as a `client_payment_details` row alongside running the payment — **no opt-in UI**, no "save my card" checkbox, no user choice. The card just appears in the panel's stored-cards list after the payment lands. Confirm with the team that this aligns with their brand's intent before suppressing any "save card" affordance the UI might otherwise render. Cross-ref: [paymentDetails.md](../02-module-foundations/paymentDetails.md) keyed-config row.
- **`billing.gateway.force_auto_payment_for_stored_details` — when set, stored cards auto-renew without user interaction.** Read during bootstrap. When `true`, the renewal cycle uses the client's default stored card automatically — the panel's "pay now" CTA on `invoice_unpaid` rows may not fire if the platform has already auto-charged. Surfaces as "this invoice was auto-paid" in the panel.
- **`billing.gateway.allow_card_removal_replacement` — when `false`, the panel's stored-card delete is brand-blocked.** Read during bootstrap. When this key is `false`, deleting a client's only / default stored card is rejected server-side (the platform requires payment-on-file for active subscriptions). The panel's "delete card" affordance (SDD 07) must check this key and surface a disabled state with explanation rather than calling DELETE and watching it fail.
- **Free orders + `billing.gateway.force_card_storage`.** A basket with `total_amount: 0` would normally skip payment entirely — but when `force_card_storage` is `true`, the brand still requires a card on file before the free order can convert. The payment flow runs in card-capture mode against a zero-amount basket: the SDK handshake happens, `SelectPaymentMethodData` is assembled, but `POST /payments` carries `amount: 0`. The gateway may either skip the actual charge (Stripe SetupIntent shape — captures the method without charging) or run a $0 auth. Either way, the stored card appears in the panel afterwards and the invoice transitions to `invoice_paid` without a real payment row. A storefront that hard-codes "if total === 0 then skip payment entirely" breaks on every brand with this key on. Cross-ref: basket.md lesson "Free-order checkout still needs a payment method on some brands".

## Validation checklist

- [ ] Payment page lists gateways filtered to the basket's currency + country (use the `basket_id` shortcut on `GET /brands/{brandId}/gateways`)
- [ ] If the signed-in client has a stored card, it appears in the picker; default card sorted first
- [ ] New-card path: Stripe Card Element mounts; Stripe test card `4000 0027 6000 3184` triggers the 3DS challenge inline; user completes the challenge in-browser; SDK resolves with a `payment_method_id`
- [ ] `POST /payments` returns `transaction_status: "OK"` (immediate paid) or `transaction_status: "WAITING"` (settling) — both treated as success branches by the foundations layer
- [ ] `WAITING` branch: invoice poll runs against `GET /invoices/{invoiceId}`, resolves to `invoice_paid` within ~10 seconds on staging
- [ ] Successful payment produces an invoice id; basket is converted (Path A: `PATCH /orders/{basketId}/convert` returns the invoice; Path B: `POST /payments` returns it implicitly — verify which path the workshop brand uses against basket.md)
- [ ] **Card-storage policy honoured.** If `brand.config["billing.gateway.force_card_storage"] === true`, every successful payment automatically populates a `client_payment_details` row on the client — verify by navigating to `/panel/payment-methods` immediately after the test payment and confirming the just-used card appears. If the key is `false`, no stored card is created (the payment landed but the card wasn't kept).
- [ ] **Free order + force_card_storage.** If the test brand has `force_card_storage: true` and the basket total is `0` (e.g. a 100%-discount promotion), the payment surface still mounts the SDK / picker and runs a capture (SetupIntent / $0 auth depending on gateway). The invoice transitions to `invoice_paid` and a stored card appears. A storefront that skips payment for $0 baskets misses the card capture.
- [ ] Capture-vs-make boundary respected: gateway picker + Stripe SDK handshake live in paymentDetails-scoped code; `POST /payments` + response handling live in payment-scoped code; the only thing they share is the `SelectPaymentMethodData` payload
- [ ] `AWAITING_CLIENT` (if encountered against a non-Stripe gateway in the brand's list) is handled as success-pending, not as error; gateway `payment_instructions` would render as markdown if surfaced
- [ ] Navigation to `/confirmation/{invoiceId}` (feature 7) happens only on terminal paid state OR on poll cap with a "processing" hint
- [ ] No `meta` field on any response is read for routing (operating principle is gone, but verify nothing slipped in)
- [ ] Stored-card path: no Stripe SDK loads; the `SelectPaymentMethodData` payload carries `payment_details_id` only, no `gateway_id`-with-fields shape

## Notes for the agent

- This feature is the **load-bearing one** for the workshop spine. Get it right and the prototype is credible end-to-end; get it wrong and the team will spend the rest of day 2 here.
- **Operating principle #7 (capture vs make) is the most-missed.** Keep paymentDetails-scoped code separate from payment-scoped code. The `SelectPaymentMethodData` payload is the boundary. When you find yourself writing `POST /payments` inside a `paymentDetails`-named file, stop.
- **`WAITING` is success, not error.** Foundations layer should already pass `200 + WAITING` through unchanged (foundations.md §4.4); this feature is the consumer that polls. If you see `WAITING` getting normalised into an `AppError`, fix the foundations layer — do not work around it here.
- Inline Stripe 3DS happy path uses Stripe's standard 3DS-required test card **`4000 0027 6000 3184`**. The Card Element will challenge it inline. The test card may differ on the team's brand if they're using a custom Stripe sandbox — confirm in the Kickoff.
- **DO NOT implement** redirect gateways, express sheets (Apple/Google Pay), or hosted-fields. paymentDetails.md "Capture a payment intent" flow describes the three capture branches; only branch 1 (inline SDK) is in scope for the prototype.
- **DO NOT implement** the wallet partial-pay or pay-later path. `wallet_amount: 0` and `type: "pay_in_full"` for every submission.
- **Failure-retry UX is out of scope.** If a payment fails (Stripe declines or `POST /payments` returns `REJECTED`), surface the error inline and let the user click "try again" — re-render the picker, no special re-entry flow. If the team has time after the spine settles, this is a good extension.
- **Conversion path:** before building, confirm against basket.md whether `POST /payments` auto-converts the basket or whether `PATCH /orders/{basketId}/convert` is needed manually. Build Path A (explicit convert) by default — it is the more reliable shape and the basket-foundation flow documents it as the canonical conversion call. If Path B (implicit convert on `POST /payments`) is documented for the workshop brand, switch.
- **READ THE BRAND CARD-STORAGE KEYS during bootstrap (feature 2) and honour them here.** `billing.gateway.force_card_storage`, `billing.gateway.force_auto_payment_for_stored_details`, and `billing.gateway.allow_card_removal_replacement` shape the payment UX significantly — no "save card?" checkbox when force-storage is on, no manual "pay now" when auto-pay is on, no delete affordance when removal is disallowed. The brand's intent is encoded in these keys; the storefront's behaviour must read them, not invent a default. The agent that built a previous workshop missed this entirely — the brand requires card storage, the prototype shipped without surfacing the captured card in the panel, and the next purchase had to re-enter the card. **Verify in your build by:** (a) reading the keys from the cached brand-config bag at payment-page mount; (b) wiring `force_card_storage` to suppress any "remember my card" UI you might otherwise render; (c) writing a guard in SDD 07's delete-card flow that consults `allow_card_removal_replacement` before rendering the delete button.
- **The `SelectPaymentMethodData` payload is the contract.** paymentDetails-scoped code produces it; payment-scoped code consumes it. If those two surfaces need to share anything else (a callback, a context object, a side-channel), something is wrong — surface to the team.

## Open questions — status

Some questions resolved through workshop runs; others still need pinning.

### ✅ Resolved (do not re-litigate)

1. **Stripe `payment_method_id` body placement on `POST /payments`** → **top-level** alongside the SelectPaymentMethodData payload. Verified against staging in a workshop run.
2. **`PATCH /orders/{basketId}/convert` body shape** → accepts the raw SelectPaymentMethodData payload; **`envelope.data` IS the invoice directly**, not nested under `{ invoice }`. Verified.
3. **Stripe publishable key path** → `gateway_settings[].field === "publicKey"` is correct on the workshop's staging Stripe gateway. Alternative field names not encountered.

### ⏳ Still open — verify against staging on next run

1. **SetupIntent vs PaymentMethod for inline Stripe.** Default `stripe.createPaymentMethod()` works for the workshop's Stripe happy path. Switch to SetupIntent flow (`POST /gateway/frontend/tokenize-begin/{gatewayId}`) only if the brand's Stripe configuration requires it (some brands force SetupIntent for stored-card capture).
2. **Q14 — canonical gateway-capability flag name.** The "supports automatic payments" flag has multiple possible names on `BrandGateway.gateway` (`is_offline`, `is_manual`, `allow_automatic_payment`, `supports_automatic_payment`, `automatic_payment` — see step 2's `supportsAutomaticPayment` predicate). Bundle should pin one once observed empirically. Until then, the permissive predicate covers all variants + a name-based fallback.
3. **Q15 — Payment Element vs Card Element.** The workshop default uses classic Card Element + `hidePostalCode: true` + `billing_details` on `createPaymentMethod`. If a brand needs country-aware postal-code rendering at element-creation time (UK-formatted postcode vs US ZIP), swap to Payment Element. Bundle could note when the swap is worthwhile.

### Out of scope (acknowledged, not built)

- Offline / manual / awaiting-client gateway happy paths (step 2 documents detection + the "convert-only, no POST /payments" branch; full UX is not built)
- SetupIntent flow for new-card capture
- Wallet partial-pay
- Apple Pay / Google Pay express sheets

When any open item is resolved against staging, update this SDD in place, capture a v2 fixture per [`fixture-format.md`](../references/fixture-format.md), and update `payment.md` / `paymentDetails.md` foundation docs to match.
