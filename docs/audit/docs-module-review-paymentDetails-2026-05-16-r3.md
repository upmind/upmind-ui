# Module review — paymentDetails (foundation.md) — r3

- **Date:** 2026-05-16
- **Reviewer:** Claude (docs-module-review)
- **Candidate:** `packages/headless/src/modules/paymentDetails/docs/foundation.md`
- **Prior reviews:**
  - `docs/audit/docs-module-review-paymentDetails-2026-05-16.md` (r1 — 87.6/100)
  - `docs/audit/docs-module-review-paymentDetails-2026-05-16-r2.md` (r2 — 93/100)
- **Module:** paymentDetails

---

## Executive summary

| Category | r1 | r2 | r3 | Δ vs r2 |
| --- | --- | --- | --- | --- |
| Technical accuracy | 78 | 94 | 94 | 0 |
| Completeness | 92 | 94 | 92 | -2 |
| Structure | 90 | 92 | 94 | +2 |
| Tone | 88 | 93 | 95 | +2 |
| Actionability | 90 | 92 | 94 | +2 |
| **Overall** | **87.6** | **93** | **93.8** | **+0.8** |

**Verdict:** Pass. The capture-vs-make split lands beautifully in "What it is" and Flow 1. The boundary is now articulated as a *payload* (`SelectPaymentMethodData`), not a vague handoff. The forward-reference to payment's "Attempt a payment" flow is exactly the right shape. The doc loses 2 points on completeness because Operation 8 ("Pay an outstanding invoice…") and the "Submit a payment" API endpoint section now describe make-side behaviour that the rewritten scope explicitly forwards to `payment` — they should either move out or be reframed as "the payload the sibling consumes". Everything else is polish.

---

## Part 1: Delta vs r2

### Status of r2 items

| r2 issue | Status | Evidence |
| --- | --- | --- |
| 🟡 Operations row 5 wording ("opaque to this layer") | 🟡 PARTIAL | Line 46 still reads "opaque to this layer — it is the payload the gateway's SDK consumes verbatim". Polish only; not blocking. |
| 🟡 Flows could cross-reference each other | ✅ FIXED | Flow 1's terminal block forward-references payment's "Attempt a payment" flow (lines 614). |
| 🟡 Lesson title parallelism | ❌ NOT FIXED | Mixed-shape titles still present ("Pick-then-pay…", "Capability descriptions vs UI flags drift…", "Storing on payment isn't always optional…"). Non-blocking. |

### New strengths (r3)

🟢 **Capture-vs-make framing is exemplary.** Lines 5–7 articulate the split crisply: paymentDetails *captures*, payment *makes*, boundary is the `SelectPaymentMethodData` payload. The pattern matches the sibling-scope-boundary template in `.agent/rules/docs-modules.md` lines 32–47 verbatim — one paragraph of what this module owns, one sentence forwarding adjacent concerns.

🟢 **Flow 1 rename + trim.** "Capture a payment intent" (was "Pick a stored method and pay") is now scope-accurate. The diagram terminates at "Payload ready — hand off to payment" with three branched capture styles (inline SDK / redirect pre-pay / express sheet / stored). No `POST /payments` node, no `transaction_status` fork. This is the right shape.

🟢 **Capture-time vs payment-time redirect distinction.** Line 603 in the Guarantees list calls out that PayPal SETUP / Klarna preflight are *capture-time* redirects that exchange the user's authorisation for a token bundled into the payload, distinct from 3DS / offsite-charge redirects which fire post-submit and belong to payment. This is a non-obvious mental-model split the doc surfaces clearly.

🟢 **Forward reference is well-shaped.** Lines 614 ("Submit + post-submit outcome branches live in `payment`…") cite the sibling's named flow ("Attempt a payment") rather than vaguely gesturing at it.

### New issues (r3)

🟠 **Op 8 + "Submit a payment" endpoint section straddle the boundary.** The rewritten "What it is" says the boundary is the `SelectPaymentMethodData` payload — paymentDetails builds it, `payment` submits it. But Operation 8 (lines 49) is "Pay an outstanding invoice with a selected method", inputs and outputs are framed as the *submit* call (`POST /payments`, `transaction_status`, `approval_url`), and the API endpoints section at lines 541–569 documents the full `/api/payments` curl + response shape. Two options:

1. **Reframe as payload-construction.** Op 8 becomes "Build the payment-submission payload" — inputs unchanged, output is `SelectPaymentMethodData` (the payload), and a footnote points to payment's docs for the submit + response. Remove the "Submit a payment" curl + sample from API endpoints (or reframe it as the payload the sibling submits, with a cross-reference).
2. **Move to payment.** Drop Op 8 entirely and remove the API endpoint section; payment's doc owns it.

Either option restores scope discipline. Currently the doc says "we don't own this" in prose and then documents it as an operation + endpoint anyway.

🟠 **Data shape `IPaymentResponse` is make-side.** Lines 269–279 define the `POST /payments` response type. By the capture/make split, this is `payment`'s shape — paymentDetails consumes it only when it surfaces redirect URLs back to the user, which the doc says is *also* payment's job. Either:

- Drop the type entirely (it belongs in payment's data-shape section), or
- Keep only the fields paymentDetails genuinely reads at the boundary (none, if the doc is consistent — payment owns the response).

🟡 **"Pay context" definition mentions `POST /payments`.** Line 33 says pay-context routes "through either the pay endpoint (`POST /payments`) or the tokenise-end endpoint". Reframe as "produces a `SelectPaymentMethodData` payload for `POST /payments` (in payment) or routes to tokenise-end (here)". The capture/make split lets the pay-mode definition stop at "produces the payload".

🟡 **`wallet_amount` lesson references the submit-step failure.** Lines 676–678 say "the back-end charge call is the one that rejects" — accurate but make-side. Keep the lesson (the *capture* problem is real: caller can offer a gateway the residue won't support) and reframe the failure mode as "the payload is built against a gateway that will be rejected at submit" without naming the submit-step failure mechanism.

🟡 **Dependants table "Why" column for `payment`** (line 287) reads "consumes the same `GatewayTypes` / `GatewayContext` enums and the `SelectPaymentMethodData` payload to drive `POST /payments` against a specific invoice and reconcile the off-site-redirect approval URL." Accurate as a *forward* description but mentions reconcile, which is payment's internal concern, not what payment reads from paymentDetails. Trim to "consumes the `SelectPaymentMethodData` payload and `GatewayTypes` / `GatewayContext` enums."

---

## Part 2: Fresh full audit

### Strip audit findings

🟢 No composable method names. No XState / Vue / TanStack vocabulary. No "machine" / "spawn" leaks. No `our implementation` / `we chose`. No prescriptive "you should" / "everyone awaits". `.meta` note appears exactly once (line 57) and meta content is absent from data shape, fixtures, lessons.

No new strip violations.

### Section audit

| Section | Status |
| --- | --- |
| Header | ✅ |
| What it is + capture/make demarcation | ✅ (exemplary) |
| Keys by lifecycle phase | ✅ |
| Core concepts | ⚠️ (line 33 still mentions `POST /payments` as a pay-context routing — see 🟡 above) |
| State model | ✅ (correctly omitted) |
| Operations | ⚠️ (Op 8 is make-side — see 🟠 above) |
| Data shape | ⚠️ (`IPaymentResponse` is make-side — see 🟠 above) |
| Dependencies (dependants + own) | ✅ |
| API endpoints | ⚠️ ("Submit a payment" section is make-side — see 🟠 above) |
| Side effects | ✅ (correctly omitted) |
| Coordination | ✅ (correctly omitted) |
| Flows | ✅ (Flow 1 trim is exemplary; Flow 2 unchanged and still correct) |
| Lessons | ⚠️ (one bullet leaks into submit-step failure — see 🟡 above) |

### Content audit

#### Operations — ⚠️

12 capabilities, 11 anchored cleanly to capture-side BE calls. Op 8 is the outlier — it documents the submit call that the rewritten scope forwards to `payment`. The other 11 collectively cover: list stored methods, list eligible gateways, read wallet, format amount, tokenise-begin, tokenise-end, direct create, delete, default, toggle auto-pay, resume after redirect. That's a complete capture surface.

#### Data shape — ⚠️

`StoredPaymentMethod`, `BrandGateway`, `WalletBalance`, `SelectPaymentMethodData` are all on-scope. `PaymentResponse` is the make-side outlier (lines 269–279). Otherwise: fixture-aligned, typed-contract narrowness flagged at line 125, no `meta`.

#### Dependants table — ✅ (with minor polish op on `payment` row's "Why")

Matches r2. `payment: 5`, `basket: 4`, `orders: 4`. Presentation row present. Query/routing exclusion footnote present.

#### API endpoints — ⚠️

Seven of eight blocks are capture-scope (list stored methods, raw-card create, PATCH defaults / auto-pay, DELETE, gateway list, wallet balance, calculate, tokenise-begin / tokenise-end). The "Submit a payment" block at lines 541–569 is the make-side outlier.

#### Lessons — ✅ (one bullet straddles)

Ten lessons, problem-shaped, source-anchored. The `wallet_amount` lesson nudges into submit-time failure language but the underlying problem is capture-scoped (caller picks a gateway that the residue will fail against). Trim language, keep the lesson.

#### Flows — ✅

Flow 1 ("Capture a payment intent") and Flow 2 ("Store a card outside of a payment (Add mode)") are both scope-accurate. Flow 1 terminates at "Payload ready — hand off to payment" with the forward reference; Flow 2 ends at "Method stored". No `POST /payments` nodes, no `transaction_status` branches, no `approval_url` decision tree.

---

## Top 3 priorities

Ordered by severity × ease:

1. 🟠 **Resolve the Op 8 + "Submit a payment" boundary slip.** Either reframe Op 8 + the API endpoint section as payload-construction (preferred — keeps the curl visible for architects) or move them entirely to `payment`. Pick one and remove the inconsistency between "we forward to payment" prose and "here's how to submit" documentation.
2. 🟠 **Drop or trim `IPaymentResponse` from Data shape.** If the doc keeps the submit-payload framing (option 1 above), the response type belongs in `payment`'s data-shape section, not here. Currently it implies paymentDetails parses the submit response.
3. 🟡 **Trim line 33 ("Pay context vs add context") to stop at payload.** "Routes the final operation through either the pay endpoint (`POST /payments`) or the tokenise-end endpoint" should become "produces a `SelectPaymentMethodData` payload (submitted by `payment` to `POST /payments`) or routes to tokenise-end (here)". Same polish on the `wallet_amount` lesson and the `payment` dependant-row "Why" column.

None of these block. The doc is shippable at 93.8.

---

## Verdict on capture/make split

**Holds at the macro level, leaks at the micro level.** "What it is", Flow 1, the forward reference, and the redirect distinction are all exemplary. Operation 8, the `IPaymentResponse` type, the "Submit a payment" API block, and a handful of prose mentions still document the make side. Fixing those four spots would put the doc at ~95.

One-line: **the framing nails the split; a final scope-pass to evict the four make-side artefacts will land it cleanly.**

---

## Appendix A: Source-of-truth references

- `packages/headless/src/modules/paymentDetails/` — module source
- `packages/headless/src/modules/payment/docs/foundation.md` — sibling foundation, lines 1–20 confirm the mirror "make vs capture" framing
- `packages/types/src/models/paymentDetails.ts` — `IPaymentDetail` typed contract
- `packages/types/src/data/enums/gateway.ts` — `GatewayTypes` enum
- `.agent/rules/docs-modules.md` lines 28–47 — sibling-scope boundary pattern
- `.agent/workflows/docs-module-review.md` — review workflow

## Appendix B: Verbatim evidence

**Boundary articulation, exemplary** (lines 5–7):
> "Payment details **captures** the payment intent … produces the selected-method payload (`SelectPaymentMethodData`) that downstream calls submit. … **Capture vs make.** Payment details *captures* the intent; the sibling `payment` module *makes* the payment asynchronously via the back end. The boundary is the `SelectPaymentMethodData` payload."

**Make-side leak in Operations** (line 49):
> "**Pay an outstanding invoice with a selected method** | `invoice_id`, `type`, `amount`, … | A transaction record with `transaction_status` … and either an `approval_url` … or a `transaction_id`. `POST /payments`."

**Make-side leak in Data shape** (lines 269–279):
> "### Transaction outcome — `IPaymentResponse` … `transaction_status: "OK" | "PENDING_CONFIRMATION" | "FAILED" | "CANCELLED" | string`; `approval_url: string | null`; `transaction_id: string | null`."

**Make-side leak in API endpoints** (lines 541–569):
> "### Submit a payment … `curl -s -X POST "$API/api/payments" …` … `"transaction_status": "OK", "transaction_type": 21, "approval_url": null, "transaction_id": null` … `transaction_status: "PENDING_CONFIRMATION"` accompanies a populated `approval_url` — the caller redirects the client there."

**Forward reference, exemplary** (line 614):
> "**Submit + post-submit outcome branches live in `payment`.** This flow ends at "payload ready". Submission via `POST /payments` and the response decision tree — immediate completion, inline 3DS / SDK-rendered challenge … or offsite redirect with positive/negative callback handling — are the sibling `payment` module's surface. See payment's **"Attempt a payment"** flow."

**Capture-time vs payment-time redirect distinction** (line 603):
> "Capture-time redirects (PayPal SETUP, Klarna preflight) are distinct from payment-time redirects: capture-time redirects exchange the user's authorisation for a token that's bundled into the payload; payment-time redirects (3DS, offsite charge) happen *after* `POST /payments` and are payment's surface."

## Appendix C: Files reviewed

- `packages/headless/src/modules/paymentDetails/docs/foundation.md` (candidate)
- `packages/headless/src/modules/payment/docs/foundation.md` (sibling — boundary check)
- `docs/audit/docs-module-review-paymentDetails-2026-05-16.md` (r1)
- `docs/audit/docs-module-review-paymentDetails-2026-05-16-r2.md` (r2)
- `.agent/rules/docs-modules.md`
- `.agent/workflows/docs-module-review.md`

## Appendix D: Strip-audit exhaustive list

| Line | Issue | Severity |
| --- | --- | --- |
| (none) | All r2 strip findings remain clear; no new strip violations introduced | — |
