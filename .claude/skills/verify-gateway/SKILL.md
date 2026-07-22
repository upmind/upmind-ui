---
name: verify-gateway
description: Step-by-step walkthrough of the payment gateway verification playbook
---

# Verify Gateway

Interactively walk through the [Payment Gateway Verification Playbook](../../../packages/headless/src/modules/paymentDetails/docs/GATEWAY_VERIFICATION_PLAYBOOK.md) one phase at a time.

## When to Use

- Integrating a new payment gateway
- Re-verifying a gateway after significant changes
- Onboarding someone to the gateway verification process

## Prerequisites

- Gateway is integrated in the codebase (frontend + backend)
- Sandbox/test environment is available
- Access to the gateway provider's test dashboard
- Test card numbers or credentials from the provider's docs

---

## Steps

### 1. Read the Playbook

Read the full playbook document to understand the structure:

```bash
cat packages/headless/src/modules/paymentDetails/docs/GATEWAY_VERIFICATION_PLAYBOOK.md
```

Also review the gateway types reference:

```bash
cat packages/headless/src/modules/paymentDetails/GATEWAYS.md
```

### 2. Identify the Gateway

Ask the user:

- **Which gateway** are we verifying? (name and code, e.g., "Stripe" / `STRIPE`)
- **What type** is it? (Card, Bank Transfer, Direct Debit, Offline, Mobile, Awaiting Client)
- **What integration pattern?** (SDK, Redirect, or Manual)
- **Does it support 3DS?**
- **Can it store payment methods?**
- **What currencies does it support?**
- **What's the sandbox/test dashboard URL?**
- **What's the API base URL?** (e.g., `https://sandbox.example.com/api`)
- **Brand ID** for the test brand
- **Currency ID** for the test currency
- **Client ID** for the test client (if available)

Record the answers — these fill in the Gateway Info header of the verification file and are used for API-assisted verification.

### 3. Create the Verification File

Create a dated verification file by copying the template section from the playbook:

```
docs/verifications/YYYY-MM-DD-{GATEWAY_NAME}.md
```

Place this inside `packages/headless/src/modules/paymentDetails/docs/verifications/`.

Fill in the Gateway Info table at the top with the answers from Step 2.

### 4. Phase 1 — Setup & Configuration (API-Assisted)

First, fetch the gateway data from the API to auto-verify configuration. Ask the user for the API base URL, then run:

```bash
# Fetch all active gateways for the brand
curl -s "${API_BASE}/brands/${BRAND_ID}/gateways?limit=0&filter[active]=1&with=gateway.gateway_provider,gateway.card_types&filter[gateway.currencies.id]=${CURRENCY_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" | jq '.'
```

From the response, **automatically verify:**

1. ✅ **Gateway exists** — Find the gateway by code/provider in the response
2. ✅ **Payment type** — Check `gateway.payment_type` matches expected value
3. ✅ **Provider** — Check `gateway.gateway_provider` name is correct
4. ✅ **Card types** — Check `gateway.card_types` are populated (for card gateways)
5. ✅ **Currencies** — Check the gateway appears when filtered by the test currency

Also fetch brand config to verify payment settings:

```bash
# Fetch payment-related brand config
curl -s "${API_BASE}/config/brand/values?keys=billing.gateway.force_card_storage,billing.gateway.force_auto_payment_for_stored_details,billing.gateway.client_allow_partial_payments,invoices.common.is_available_pay_later" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" | jq '.'
```

From this, verify:
6. ✅ **Force card storage** — matches expected (`canStore` / `mustStore`)
7. ✅ **Partial payments** — enabled if needed for testing
8. ✅ **Pay later** — enabled/disabled as expected

**Manual checks** (ask the user):
9. **Backend config** — "Are API keys set correctly in sandbox/test mode?"
10. **Webhooks** — "Are webhook/callback URLs registered with the gateway provider?"
11. **SDK loading** — (if SDK-based) "Does the gateway SDK script load correctly?"

Record results: ✅ Pass, ❌ Fail (with note), or ⏭️ N/A.

**If any fail:** Stop and resolve before continuing. Configuration issues will cascade.

### 5. Phase 2 — Basic Payment (Happy Path)

This is the most critical phase. Walk through:

1. **Make a payment** — Ask: "Have you completed a full payment using this gateway?"
2. **Frontend state** — Ask: "Does the frontend show a success state?"
3. **Backend verification** — After the user provides the order ID, fetch from API:

```bash
# Verify payment exists and amounts match
curl -s "${API_BASE}/order/${ORDER_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" | jq '{ status: .status.code, total: .total, paid: .paid_amount, currency: .currency.code }'
```

   Auto-verify from response:

- ✅ Payment record exists
- ✅ Payment status is `paid` / `completed`
- ✅ Amount matches what was submitted
- ✅ Currency is correct

   Display results to user and ask them to confirm.

1. **Gateway dashboard** — Ask the user to check the provider's dashboard (manual):
   - "Does the payment appear on the gateway dashboard?"
   - "Does the amount match the backend?" (show the backend amount for comparison)
   - "Does the currency match?"
   - "Does the transaction ID match?"
2. **Order status** — Ask:
   - "Did the order status transition correctly?"
   - "Was an invoice generated?"
   - "Does the invoice amount match?"

**Critical:** If amounts don't match across frontend → backend → gateway dashboard, this is a **blocker**. Do not proceed.

### 6. Phase 3 — Payment Types & Methods

Based on the gateway's capabilities, selectively walk through:

**For ALL gateways:**

- New payment method flow
- Form validation (invalid inputs)

**If `canStore`:**

- Verify method was stored after payment
- Verify stored method details (last 4, type, expiry)
- Pay with stored method
- Verify currency filtering

**If Redirect:**

- Redirect to external → return URL → success
- Cancel on external → cancel URL → recovery

**If SDK:**

- Embedded form renders
- Tokenisation is client-side
- SDK errors displayed to user

**If other types (wallet, bank transfer, mobile):**

- Walk through the specific flow

### 7. Phase 4 — 3D Secure

**Skip if 3DS is not supported** — mark all items N/A.

If supported, walk through:

1. "Use a test card that triggers 3DS — does the challenge appear?"
2. "Complete the 3DS challenge — does payment succeed?"
3. "Check the backend — does it show 3DS success (not just frontend)?"
4. "Fail the 3DS challenge — does payment fail gracefully? Can you retry?"
5. "Close/cancel the 3DS window — does the frontend recover? No phantom payment in backend?"

### 8. Phase 5 — Partial Payments & Amounts

Walk through:

1. **Partial payment** — "Pay less than total → is the partial recorded correctly?"
2. **Balance check** — "Does the backend show correct paid vs total amounts?"
3. **Complete payment** — "Pay the remainder → does order go to fully paid?"
4. **Wallet split** (if applicable) — "Pay with wallet + gateway → are both portions correct?"
5. **Gateway dashboard** — "Does the dashboard show only the gateway portion?"
6. **Zero amount** — "If fully covered by wallet, is a gateway call avoided?"
7. **Decimal precision** — "Test $49.99 — any rounding errors across systems?"

### 9. Phase 6 — Reconciliation Cross-Checks

Ask the user to fill in the reconciliation table from a test transaction:

| Check | Frontend | Backend | Gateway Dashboard | Match? |
|-------|----------|---------|-------------------|--------|
| Amount | ? | ? | ? | ? |
| Currency | ? | ? | ? | ? |
| Transaction ID | ? | ? | ? | ? |
| Status | ? | ? | ? | ? |
| Timestamp | ? | ? | ? | ? |

**All must match.** If any don't, this is a blocker.

Also ask:

- "Was the webhook/callback received and processed?"
- "If redirect: did the return URL contain the correct transaction reference?"

### 10. Phase 7 — Error Handling

Walk through each error scenario:

1. "Declined card — clear error? Can retry?"
2. "Insufficient funds — appropriate error?"
3. "Double-click pay — only one payment created?"
4. "Network error — state recovers? No double charge?"
5. "Browser back button — no orphaned transaction?"
6. "Session expiry during payment — handled?"
7. "Very small amount — minimum threshold respected?"

### 11. Phase 8 — Stored Payment Methods

**Skip if `canStore` is false.**

1. "Method stored after payment?"
2. "Details correct (last 4, type, expiry)?"
3. "Can pay with stored method?"
4. "Can delete stored method?"
5. "Auto-payment flag correct?"
6. "Methods filtered by currency?"

### 12. Phase 9 — Fixture Generation

Capture real API responses from the verification testing for use as test fixtures.

Guide the user to save responses from each test scenario:

```bash
# Gateway config fixture
curl -s "${API_BASE}/brands/${BRAND_ID}/gateways?limit=0&filter[active]=1&with=gateway.gateway_provider,gateway.card_types&filter[gateway.currencies.id]=${CURRENCY_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" | jq '.' > tests/fixtures/recordings/get-brands-gateways-${GATEWAY_CODE}.json

# Successful payment response
# (capture this from browser DevTools Network tab during a successful payment)

# Payment details (stored methods) fixture
curl -s "${API_BASE}/clients/${CLIENT_ID}/payment_details?limit=0&brand_id=${BRAND_ID}&active=true&filter[gateway.currencies.id]=${CURRENCY_ID}&with=gateway,client" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" | jq '.' > tests/fixtures/recordings/get-payment-details-${GATEWAY_CODE}.json

# Order after payment fixture
curl -s "${API_BASE}/order/${ORDER_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" | jq '.' > tests/fixtures/recordings/get-order-paid-${GATEWAY_CODE}.json
```

Walk through the sanitisation checklist:

1. "Have you removed real API keys/tokens from all fixtures?"
2. "Have you anonymised PII (names, emails, addresses)?"
3. "Did you keep amounts, currencies, and status codes intact?"
4. "Have you updated `tests/fixtures/recordings/_index.json`?"

Also remind the user to capture from browser DevTools:

- Payment submission request/response (successful)
- Payment submission request/response (declined)
- 3DS challenge trigger response (if applicable)
- Redirect response (if applicable)

### 13. Phase 10 — Final Sign-Off

Present the summary table:

| Phase | Status |
|-------|--------|
| 1. Setup & Configuration | ? |
| 2. Basic Payment | ? |
| 3. Payment Types & Methods | ? |
| 4. 3D Secure | ? |
| 5. Partial Payments | ? |
| 6. Reconciliation | ? |
| 7. Error Handling | ? |
| 8. Stored Methods | ? |
| 9. Fixtures | ? |

Ask the user:

1. "Are there any gateway-specific quirks or known limitations to document?"
2. "What should the QA team focus on?"
3. "Any notes for the handoff?"

Update the verification file with the final results, sign-off name, and date.

### 14. Commit the Verification

```bash
git add packages/headless/src/modules/paymentDetails/docs/verifications/
git add tests/fixtures/recordings/
git commit -m "docs: add gateway verification and fixtures for {GATEWAY_NAME}"
```

## Output

After completing the workflow, the user will have:

1. A **completed verification file** in `docs/verifications/` with all phases checked
2. A **clear handoff** for the QA team
3. **Confidence** that the gateway is ready for full testing

## Tips

- Don't rush through phases — each check exists because something has gone wrong before
- Phase 2 (Basic Payment) is the foundation — if this fails, everything else will too
- The reconciliation table (Phase 6) catches the sneakiest bugs — amounts that are "close" but not exact
- Keep notes as you go — gateway quirks are valuable for future integrations
- If any phase has failures, fix and re-verify before moving to the next phase
