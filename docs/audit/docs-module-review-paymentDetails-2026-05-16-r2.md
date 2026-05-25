# Module review — paymentDetails (foundation.md) — r2

- **Date:** 2026-05-16
- **Reviewer:** Claude (docs-module-review)
- **Candidate:** `packages/headless/src/modules/paymentDetails/docs/foundation.md`
- **Prior review:** `docs-module-review-paymentDetails-2026-05-16.md` (87.6 / 100)
- **Module:** paymentDetails

---

## Executive summary

| Category | Score | Δ vs r1 |
| --- | --- | --- |
| Technical accuracy | 94 | +16 |
| Completeness | 94 | +2 |
| Structure | 92 | +2 |
| Tone | 93 | +5 |
| Actionability | 92 | +2 |
| **Overall** | **93** | **+5.4** |

**Verdict:** Pass. All three top-priority fixes from r1 landed cleanly. The sibling-scope boundary now points the right direction, the dependants table reflects graph truth, and the strip slips are gone. Remaining items are polish-level (🟡) and do not block.

---

## Part 1: Delta vs prior review

| r1 issue | Status | Evidence |
| --- | --- | --- |
| 🔴 Sibling-scope inversion ("gateway abstraction lives in `payment`") | ✅ FIXED | Line 5 now: "the per-provider SDK lifecycle (load, render, confirm, 3DS challenge — all owned here)"; "post-payment approval-URL handoff, settlement reconciliation, and gateway-callback surface live in sibling `payment`". |
| 🔴 Dependants table: `invoices` spurious; weights wrong | ✅ FIXED | Table now: `payment: 5`, `basket: 4`, `orders: 4`. `invoices` row removed. Ordered descending. |
| 🔴 Own-deps: "Payment owns per-gateway SDK lifecycle" | ✅ FIXED | Now: "sibling module that owns the post-`POST /payments` reconciliation surface … picks up from `PENDING_CONFIRMATION`". |
| 🟠 "share the same data and machine" | ✅ FIXED | Now: "share the same data and lifecycle". |
| 🟠 Solution-shape suffix in auth-surface lesson | ✅ FIXED | Now: "The two responses share `data` semantics but not status, and conflating them silently presents an empty list when the platform is signalling forbidden access." |
| 🟡 "storefront should not render the checkbox" | ✅ FIXED | Now: "the card is stored regardless of any UI-level preference". |
| 🟡 Duplicated `user_id` in stored-method type | ✅ FIXED | Removed from Audit group. |
| 🟡 "caller's job to pass it straight to the gateway's SDK" (op 5) | ✅ FIXED | Now: "consumed verbatim by the gateway's own SDK — this layer does not interpret it." |

### New issues since r1

🟡 **Suggestion — minor weight verification.** Graph fan-in to paymentDetails counts cross-module edges, and the `payment: 5` count includes both headless `payment` module edges and a few client-vue `payment/components/*.vue` references. The candidate's value of 5 matches the headless-only fan-in; this is fine, but the Presentation-layer row already covers the client-vue side, so no double-counting.

🟡 **Suggestion — Operations row 5 wording.** "Output shape varies per provider and is opaque to this layer — it is the payload the gateway's SDK consumes verbatim." Reads slightly clunky; minor polish opportunity.

### New strengths

🟢 The rewritten "What it is" paragraph now does what the rule asks: one paragraph on what this module owns, one sentence forwarding adjacent concerns to siblings (`basket` for conversion, `payment` for post-`POST /payments` reconciliation), and explicit handoff point ("stops once a transaction has been submitted").

🟢 The dependants table is now properly weighted-descending and matches the graph exactly. The "Why" column for `payment` (5) accurately captures the *consumer* relationship: payment consumes the `SelectPaymentMethodData` payload + transaction outcome.

🟢 The own-dependencies bullet on `Payment` reads cleanly as a forwarding contract ("emits the settled instrument and the transaction outcome; the sibling picks up from `PENDING_CONFIRMATION`") — this is the kind of crisp handoff statement the rule's sibling-scope-boundary section asks for.

---

## Part 2: Fresh full audit

### Strip audit findings (after fixes)

🟢 No method names from our composables.
🟢 No XState / Vue / TanStack vocabulary.
🟢 No "machine" or "spawn" leaks.
🟢 `.meta` stripped from data shape and fixture sample (single italic note retained).
🟢 No "our implementation", no "we chose".
🟢 No solution-shape suffixes on Lessons.

### Section audit

| Section | Status |
| --- | --- |
| Header | ✅ |
| What it is + sibling-scope demarcation | ✅ |
| Keys by lifecycle phase | ✅ |
| Core concepts | ✅ |
| State model | ✅ (correctly omitted) |
| Operations (12 capabilities) | ✅ |
| Data shape (5 blocks) | ✅ |
| Dependencies (dependants + own) | ✅ |
| API endpoints (8 blocks) | ✅ |
| Side effects | ✅ (correctly omitted) |
| Coordination | ✅ (correctly omitted) |
| Flows (2 charts) | ✅ |
| Lessons (10) | ✅ |

### Content audit

#### Operations — ✅
12 capabilities, every one anchored to a source-exposed BE call. Lifecycle (readiness/refresh) intentionally absent since paymentDetails is invoked by parent machines that expose those.

#### Data shape — ✅
Fixture-aligned. Typed-contract narrowness flagged. Duplicate `user_id` removed in r2.

#### Dependants — ✅
Matches graph. Presentation-layer row covers UI surfaces. Query/routing exclusion footnote present.

#### Sibling-scope boundary — ✅
Now factually correct: paymentDetails owns the per-gateway SDK lifecycle (per `gateways/` folder and `spawnGateway` in the machine); `basket` owns the conversion endpoint; `payment` owns post-`POST /payments` reconciliation.

#### API endpoints — ✅
All eight blocks have URLs + methods matching source services and curl bodies sourced from fixtures.

#### Lessons — ✅
Ten lessons, each problem-shaped, each anchored to source/observable behaviour.

---

## Top 3 priorities

The doc is now ≥ 90. Remaining items are polish only:

1. 🟡 (polish) Operations row 5 wording — slight clunkiness in the "opaque to this layer" clause; could read "Output shape is gateway-specific; this layer treats it as an opaque pass-through to the gateway's SDK."
2. 🟡 (polish) The flows could optionally cross-reference each other ("the same `tokenize-begin → SDK → tokenise-end` handshake described in Flow 2 also runs inside Flow 1 when the caller picks a fresh gateway") — currently each flow reads in isolation, which is fine.
3. 🟡 (polish) Lesson titles could carry minor parallelism — five start with a concrete noun ("Pick-then-pay", "Stored-method default", "wallet_amount"), the rest open with abstract framing ("Capability descriptions vs UI flags drift").

None of these affect the score.

---

## Appendix A: Source-of-truth references

Same as r1.

## Appendix B: Verbatim evidence (fixes verified)

**Sibling scope, fixed** (line 5):
> "the per-provider SDK lifecycle (load, render, confirm, 3DS challenge — all owned here) from instrument selection through to the `POST /payments` settlement call. The basket-conversion path (`PATCH /orders/{id}/convert`) is owned by `basket`; the post-payment approval-URL handoff, settlement reconciliation, and gateway-callback surface live in sibling `payment`."

**Dependants table, fixed**:
> `payment | 5`, `basket | 4`, `orders | 4`

**Own-deps Payment bullet, fixed**:
> "sibling module that owns the post-`POST /payments` reconciliation surface … emits the settled instrument and the transaction outcome; the sibling picks up from `PENDING_CONFIRMATION`."

## Appendix C: Files reviewed

Same as r1.

## Appendix D: Strip-audit exhaustive list

| Line | Issue | Severity |
| --- | --- | --- |
| (none) | All r1 strip issues cleared | — |
