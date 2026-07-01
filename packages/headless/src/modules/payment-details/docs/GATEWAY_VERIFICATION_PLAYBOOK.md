# Payment Gateway Integration Verification Playbook

> The definitive pre-QA checklist for verifying a new payment gateway integration is production-ready.
> **Owner:** The person responsible for gateway integrations signs off before handing to QA.

---

## What Is This? (ELI5)

Think of this like a pilot's pre-flight checklist. Before a plane takes off, the pilot doesn't just start the engines and hope for the best — they go through every system methodically. This playbook is the same thing for payment gateways: a systematic check of every system before we let real money flow through it.

> **🧪 For Testers:** This playbook is run **before** you get the gateway. If you're reading this, the gateway owner has already verified everything here. Your job is deeper scenario testing — this ensures the basics are solid first.

> **👩‍💻 For Developers:** When integrating a new gateway, use this playbook as your exit criteria. Every checkbox must be ✅ or explicitly marked N/A with a reason before handoff.

---

## How to Use This Playbook

1. **Copy** the [Gateway Verification Template](#gateway-verification-template) below into a new file: `docs/verifications/YYYY-MM-DD-{GATEWAY_NAME}.md`
2. **Fill in** the Gateway Info header
3. **Work through** each phase sequentially
4. **Sign off** at the bottom when complete
5. **Handoff** — reference the completed verification in the Linear story/QA handoff

Alternatively, use the `/verify-gateway` workflow which walks you through this interactively.

---

## Gateway Types Reference

Before starting, identify your gateway type from [GATEWAYS.md](../GATEWAYS.md):

| Type                | Code | Examples                     | Key Differences                                        |
| ------------------- | ---- | ---------------------------- | ------------------------------------------------------ |
| **Card**            | `1`  | Stripe, Braintree, Adyen     | SDK or Redirect, supports 3DS, card storage            |
| **Bank Transfer**   | `2`  | Manual bank transfer         | Offline, instructions-based, no real-time confirmation |
| **Direct Debit**    | `3`  | GoCardless                   | Mandate setup, recurring-focused                       |
| **Offline**         | `5`  | Manual/offline               | No gateway interaction, manual confirmation            |
| **Mobile**          | `6`  | MoMo MTN                     | Mobile money flow                                      |
| **Awaiting Client** | `10` | BitPay, Blockonomics, DLocal | Redirect/external, async confirmation                  |

### Integration Patterns

| Pattern      | Gateways                                                 | What to Expect                            |
| ------------ | -------------------------------------------------------- | ----------------------------------------- |
| **SDK**      | Stripe, Braintree, Adyen, MercadoPago, OpenPay, RazorPay | Embedded form, client-side tokenisation   |
| **Redirect** | PayPal, Flutterwave, Paystack, PayU, Opayo, CoinGate     | Redirect to external site → return URL    |
| **Manual**   | Bank Transfer, Offline                                   | Instructions displayed, no automated flow |

---

## API-Assisted Verification

The following API endpoints can be used to **programmatically verify** gateway configuration. The `/verify-gateway` workflow uses these automatically.

### Endpoints

| What                       | Method         | Endpoint                                                                                                                                              | Notes                                                                                                                                                                       |
| -------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Brand gateways**         | `GET`          | `/api/brands/{brandId}/gateways?limit=0&filter[active]=1&with=gateway.gateway_provider,gateway.card_types&filter[gateway.currencies.id]={currencyId}` | Returns all active gateways for a brand, filtered by currency. Verifies gateway visibility, type, provider, and card types.                                                 |
| **Gateway details**        | Included above | `gateway_provider`, `card_types`, `currencies` relations                                                                                              | Verify provider name, supported card types, currency list                                                                                                                   |
| **Stored payment methods** | `GET`          | `/api/clients/{clientId}/payment_details?limit=0&brand_id={brandId}&active=true&filter[gateway.currencies.id]={currencyId}&with=gateway,client`       | Verify stored methods exist and are filtered correctly                                                                                                                      |
| **Wallet balance**         | `GET`          | `/api/wallet/balance`                                                                                                                                 | Verify account credit for wallet payment testing                                                                                                                            |
| **Brand config**           | `GET`          | `/api/config/brand/values?keys=...`                                                                                                                   | Check `billing.gateway.force_card_storage`, `billing.gateway.force_auto_payment`, `billing.gateway.client_allow_partial_payments`, `invoices.common.is_available_pay_later` |
| **Payments**               | `POST`         | `/api/payments`                                                                                                                                       | Submit a payment (verify backend records it)                                                                                                                                |
| **Order**                  | `GET`          | `/api/order/{orderId}`                                                                                                                                | Verify order status, amounts, invoice                                                                                                                                       |

### What Can Be Auto-Verified

The workflow can automatically check:

- ✅ Gateway exists in brand gateway list
- ✅ Gateway `payment_type` matches expected type
- ✅ Gateway `provider` and `gateway_provider` are correct
- ✅ `card_types` are populated (for card gateways)
- ✅ Currency is in the gateway's supported currency list
- ✅ `gateway_settings` flags (`canStore`, `mustStore`, `useFrontendImplementation`)
- ✅ Brand config flags (partial payments, pay later, force storage)
- ✅ Stored payment methods appear after a successful stored payment
- ✅ Payment record exists in backend after a transaction
- ✅ Payment amount matches submitted amount
- ✅ Order status transitions after payment

### What Requires Manual Verification

- ❌ Gateway provider's dashboard (external system)
- ❌ 3DS challenge flow (interactive UI)
- ❌ Redirect flow UX (visual/behavioral)
- ❌ SDK rendering (visual)
- ❌ Error message clarity (subjective)

---

## Gateway Verification Template

Copy everything below this line into your verification file.

---

# Gateway Verification: {GATEWAY_NAME}

| Field                          | Value                                                                      |
| ------------------------------ | -------------------------------------------------------------------------- |
| **Gateway Provider**           | {e.g., Stripe, Braintree}                                                  |
| **Gateway Code**               | {e.g., STRIPE, BRAINTREE}                                                  |
| **Payment Type**               | {Card / Bank Transfer / Direct Debit / Offline / Mobile / Awaiting Client} |
| **Integration Pattern**        | {SDK / Redirect / Manual}                                                  |
| **Supported Currencies**       | {e.g., USD, EUR, GBP}                                                      |
| **3DS Support**                | {Yes / No / N/A}                                                           |
| **Can Store Payment Methods**  | {Yes / No}                                                                 |
| **Sandbox/Test Dashboard URL** | {URL}                                                                      |
| **Test Cards/Credentials**     | {Link to provider's test docs}                                             |
| **Date**                       | {YYYY-MM-DD}                                                               |
| **Verified By**                | {Your name}                                                                |

---

## Phase 1: Setup & Configuration

> Verify the gateway is correctly configured before attempting any transactions.

- [ ] Gateway is configured in the backend with correct API keys (sandbox/test mode)
- [ ] Webhook/callback URLs are registered with the gateway provider
- [ ] Gateway appears in the frontend gateway list for the correct brand
- [ ] Gateway `payment_type` is correct (Card=1, Bank Transfer=2, etc.)
- [ ] Gateway currencies match what the provider supports
- [ ] Gateway card types are set correctly (if card-based: Visa, Mastercard, Amex, etc.)
- [ ] `gateway_settings` flags are correct:
  - [ ] `canStore` — can we save payment methods?
  - [ ] `mustStore` — must we save before paying?
  - [ ] `useFrontendImplementation` — does the frontend handle the flow (SDK)?
- [ ] Gateway-specific SDK script loads correctly (if SDK-based)

**Notes:**

> {Any setup issues or deviations noted here}

---

## Phase 2: Basic Payment — Happy Path

> The most important phase. A single, straightforward payment end-to-end.

- [ ] Complete a full payment for an order using the gateway
- [ ] Frontend shows success state after payment
- [ ] **Backend verification:**
  - [ ] Payment record exists in the backend (check admin / API)
  - [ ] Payment status is `success` / `completed`
  - [ ] Payment amount matches exactly what was submitted from the frontend
  - [ ] Payment currency is correct
  - [ ] Transaction/reference ID is stored
- [ ] **Gateway dashboard verification:**
  - [ ] Payment appears on the gateway provider's dashboard/sandbox
  - [ ] Amount on gateway dashboard matches the backend amount
  - [ ] Currency on gateway dashboard matches
  - [ ] Transaction ID matches what's stored in the backend
- [ ] **Order status verification:**
  - [ ] Order status transitions correctly (e.g., draft → paid / complete)
  - [ ] Invoice is generated
  - [ ] Invoice amount matches payment amount

**Notes:**

> {Any discrepancies or observations}

---

## Phase 3: Payment Types & Methods

> Test every payment method variant the gateway supports.

### New Payment Method

- [ ] Enter new card/payment details → pay → verify success
- [ ] Payment details form renders correctly (all fields present)
- [ ] Client-side validation works (invalid card number, expired date, etc.)

### Stored Payment Methods (if `canStore`)

- [ ] After a successful payment, verify the payment method was stored
- [ ] Stored method shows correct details (last 4 digits, card type, expiry)
- [ ] Make a second payment using the stored method → verify success
- [ ] Stored method list only shows methods for this gateway's currency

### Redirect Flow (if redirect-based)

- [ ] User is redirected to the external gateway page
- [ ] External page loads correctly with correct amount/currency
- [ ] On success: user returns to `return_url` → payment completes
- [ ] On cancel: user returns to `cancel_url` → state recovers gracefully

### SDK Flow (if SDK-based)

- [ ] Embedded form renders inside the payment area
- [ ] Card tokenisation happens client-side (card details don't hit our backend)
- [ ] Token is submitted with the payment request
- [ ] SDK error states are handled (display gateway errors to user)

### Other Methods (if applicable)

- [ ] Wallet/Account Credit: balance deduction is correct, remaining balance updated
- [ ] Bank Transfer: instructions are displayed, order status reflects "awaiting payment"
- [ ] Mobile Money: flow completes, confirmation received

**Notes:**

> {Which methods were tested, which are N/A}

---

## Phase 4: 3D Secure / Strong Authentication

> Skip this phase if the gateway doesn't support 3DS. Mark N/A.

- [ ] **3DS Challenge Triggered:**
  - [ ] Use a test card that triggers 3DS (check provider's test docs)
  - [ ] 3DS modal or redirect appears
- [ ] **3DS Success:**
  - [ ] Complete the 3DS challenge successfully
  - [ ] Payment succeeds after 3DS
  - [ ] Backend payment status reflects success (not just frontend)
  - [ ] Gateway dashboard shows 3DS-authenticated transaction
- [ ] **3DS Failure:**
  - [ ] Fail the 3DS challenge deliberately
  - [ ] Payment fails gracefully
  - [ ] User sees a clear error message
  - [ ] User can retry the payment (state resets correctly)
- [ ] **3DS Cancel/Timeout:**
  - [ ] Close the 3DS window/navigate away
  - [ ] Frontend state recovers (not stuck in loading)
  - [ ] No phantom payment created in the backend
  - [ ] User can attempt payment again

**Notes:**

> {3DS test card numbers used, any quirks}

---

## Phase 5: Partial Payments & Amount Handling

> Verify that amounts are handled correctly in all scenarios.

### Partial Payments

- [ ] Pay less than the order total → partial payment recorded
- [ ] Backend shows correct `paid_amount` vs `total_amount`
- [ ] Remaining balance is calculated correctly
- [ ] Frontend reflects the remaining balance
- [ ] Pay the remaining balance → order transitions to fully paid
- [ ] Both payments appear in the backend, amounts sum to total

### Wallet + Gateway Split

- [ ] Pay partially with wallet credit, rest with gateway
- [ ] Wallet deduction amount is correct
- [ ] Gateway charge amount is correct (total minus wallet)
- [ ] Gateway dashboard shows **only** the gateway portion
- [ ] Backend records both the wallet and gateway portions correctly

### Zero-Amount Edge Case

- [ ] If order is fully covered by wallet/credit:
  - [ ] No gateway call is made
  - [ ] Payment completes without gateway interaction
  - [ ] Order status is correct

### Amount Precision

- [ ] Verify amounts with decimals (e.g., $49.99) are handled correctly
- [ ] No rounding errors between frontend → backend → gateway
- [ ] Currency-specific decimal places are respected (e.g., JPY has 0 decimals)

**Notes:**

> {Amounts tested, any precision issues}

---

## Phase 6: Reconciliation Cross-Checks

> The **money must match** across all three systems. This is non-negotiable.

| Check                  | Frontend | Backend | Gateway Dashboard | Match? |
| ---------------------- | -------- | ------- | ----------------- | ------ |
| Payment Amount         | $        | $       | $                 | ☐      |
| Currency               |          |         |                   | ☐      |
| Transaction/Ref ID     |          |         |                   | ☐      |
| Payment Status         |          |         |                   | ☐      |
| Timestamp (reasonable) |          |         |                   | ☐      |

### Additional Reconciliation

- [ ] Webhook/callback from gateway was received and processed (check backend logs)
- [ ] If webhook failed, verify retry mechanism or manual reconciliation process
- [ ] For redirect flows: `return_url` parameters contain the correct transaction reference

**Notes:**

> {Fill in the table above with actual values from a test transaction}

---

## Phase 7: Error Handling & Edge Cases

> Things **will** go wrong. Verify the system handles it gracefully.

### Payment Failures

- [ ] **Declined card:** Clear error message, user can retry
- [ ] **Insufficient funds:** Appropriate error shown
- [ ] **Expired card:** Validation catches it before submission (or gateway returns clear error)
- [ ] **Invalid CVV:** Handled gracefully

### Network & Timing Issues

- [ ] **Network error during payment:** State recovers, no double-charge
- [ ] **Duplicate submission:** Click pay rapidly twice → only one payment created
- [ ] **Browser back button:** Navigate away during payment → no orphaned transaction
- [ ] **Page refresh during payment:** State handled (resumable or cleanly cancelled)

### Edge Cases

- [ ] **Session expiry:** Payment attempt after session timeout → redirect to login, no lost payment
- [ ] **Currency mismatch:** Attempting payment in unsupported currency → blocked with clear message
- [ ] **Very small amount:** Minimum payment threshold respected (some gateways have minimums)
- [ ] **Very large amount:** Maximum limits handled (if applicable)

**Notes:**

> {Error messages observed, any unhandled scenarios}

---

## Phase 8: Stored Payment Method Management

> Skip if `canStore` is false. Mark N/A.

- [ ] New payment method is stored after successful payment
- [ ] Stored methods list shows correct: card last-4, type, expiry, gateway
- [ ] Pay with a stored method → payment succeeds
- [ ] Delete a stored payment method → removed from list
- [ ] Auto-payment flag is set correctly when storing
- [ ] Stored methods are filtered by currency correctly
- [ ] Cannot use a stored method from a different gateway

**Notes:**

> {Any storage quirks}

---

## Phase 9: Fixture Generation

> Capture real API responses during verification to use as test fixtures. These fixtures are **essential** for unit tests and prevent hand-crafting fake data.

Fixtures should be saved to `tests/fixtures/recordings/` following the existing naming convention: `{method}-{path-segments}-{hash}.json`

### Gateway Config Fixture

- [ ] Save the `GET /api/brands/{brandId}/gateways` response for this gateway
  - Filename: `get-brands-{brandId}-gateways-{gatewayCode}.json`
  - Must include `gateway_provider`, `card_types`, and `currencies` relations
- [ ] Save the brand config response with payment-related keys
  - Filename: `get-config-brand-values-payment-{gatewayCode}.json`

### Payment Response Fixtures

- [ ] **Successful payment** — Save the `POST /api/payments` response
  - Filename: `post-payments-{gatewayCode}-success.json`
- [ ] **Failed payment** (declined card) — Save the error response
  - Filename: `post-payments-{gatewayCode}-declined.json`
- [ ] **3DS required** — Save the response that triggers 3DS (if applicable)
  - Filename: `post-payments-{gatewayCode}-3ds-required.json`
- [ ] **3DS success** — Save the post-3DS success response
  - Filename: `post-payments-{gatewayCode}-3ds-success.json`
- [ ] **Redirect response** — Save the response with redirect URL (if redirect-based)
  - Filename: `post-payments-{gatewayCode}-redirect.json`

### Stored Payment Method Fixtures

- [ ] **Payment details list** — Save `GET /api/clients/{clientId}/payment_details` with this gateway's stored methods
  - Filename: `get-payment-details-{gatewayCode}.json`
- [ ] **Wallet balance** — Save `GET /api/wallet/balance` response
  - Filename: `get-wallet-balance.json` (shared, only if not already captured)

### Order State Fixtures

- [ ] **Order after payment** — Save `GET /api/order/{orderId}` after successful payment
  - Filename: `get-order-paid-{gatewayCode}.json`
- [ ] **Order after partial payment** — Save order with partial paid status
  - Filename: `get-order-partial-{gatewayCode}.json`

### Sanitisation Checklist

- [ ] Remove real API keys/tokens from all fixtures
- [ ] Remove or anonymise PII (client names, emails, addresses)
- [ ] Replace real IDs with UUIDs that won't clash with production
- [ ] Keep amounts, currencies, and status codes intact (these are the test data)

### Index Update

- [ ] Add entries to `tests/fixtures/recordings/_index.json` for each new fixture

**Notes:**

> {List any fixtures that couldn't be captured and why}

---

## Phase 10: Final Sign-Off

### Summary

| Phase                      | Status         | Notes |
| -------------------------- | -------------- | ----- |
| 1. Setup & Configuration   | ☐ Pass / ☐ N/A |       |
| 2. Basic Payment           | ☐ Pass / ☐ N/A |       |
| 3. Payment Types & Methods | ☐ Pass / ☐ N/A |       |
| 4. 3D Secure               | ☐ Pass / ☐ N/A |       |
| 5. Partial Payments        | ☐ Pass / ☐ N/A |       |
| 6. Reconciliation          | ☐ Pass / ☐ N/A |       |
| 7. Error Handling          | ☐ Pass / ☐ N/A |       |
| 8. Stored Methods          | ☐ Pass / ☐ N/A |       |
| 9. Fixtures                | ☐ Pass / ☐ N/A |       |

### Gateway-Specific Quirks / Known Limitations

> {Document anything unusual about this gateway that QA should know about}

1. ...
2. ...

### QA Handoff Notes

> {What should the test team focus on? What's been thoroughly verified vs needs deeper testing?}

1. ...
2. ...

---

**Signed off by:** {Name}
**Date:** {YYYY-MM-DD}
**Linear Story:** {FE-XXXX}
