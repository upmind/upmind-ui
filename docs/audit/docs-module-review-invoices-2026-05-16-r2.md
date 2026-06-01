# Invoices Foundation Doc — Review r2 (2026-05-16)

- **Module:** `invoices`
- **Candidate:** `packages/headless/src/modules/invoices/docs/foundation.md` (post-merge with absorbed `orders` content)
- **Standard:** `.agent/rules/docs-modules.md` (canonical)
- **Prior reviews:**
  - `docs/audit/docs-module-review-invoices-2026-05-16.md` (93/100 — pre-merge invoices)
  - `docs/audit/docs-module-review-orders-2026-05-16-r2.md` (91/100 — orders, now merged in)
- **Reviewer status:** ✅ Done (publishable; light polish only)

---

## Executive summary

| Category | r1 (invoices) | r2 (post-merge) | Delta vs invoices | r2 (orders) baseline | Delta vs orders |
| --- | ---: | ---: | ---: | ---: | ---: |
| Technical accuracy | 94 | 95 | +1 | 93 | +2 |
| Completeness | 94 | 96 | +2 | 90 | +6 |
| Structure | 95 | 95 | 0 | 92 | +3 |
| Tone | 92 | 94 | +2 | 92 | +2 |
| Actionability | 90 | 94 | +4 | 90 | +4 |
| **Overall** | **93** | **94.8** | **+1.8** | **91.4** | **+3.4** |

**Verdict: pass.** The merge is a net win across every axis. The single biggest gain is **actionability**: an architect can now read one doc to understand both the immutable read shape (originally invoices) and the multi-step payment orchestration (originally orders) without context-switching between two near-duplicate docs. The novel four-way sibling-boundary statement in "What it is" holds across Operations, Data shape, Flows, and Lessons — every absorbed orders capability now correctly forwards to `payment` / `paymentDetails` rather than re-declaring submission as an invoices concern. Three minor polish items below — none blocking.

---

## Part 1: Delta vs prior reviews

### Vs invoices r1 (pre-merge, 93/100)

| Prior issue | Status | Evidence |
| --- | --- | --- |
| 🟡 S-1: italic `meta` note ("Both keys appear on every embedded sub-record") was slightly broader than the fixture supported | ✅ FIXED | r2 note (line 9) reads *"Both keys appear on the invoice record and on every embedded sub-record (client, products, products.product, products.product.category); all are out of scope."* — same wording, but the note is now narrower in scope because the merge dropped the `current_data.content` sample and folded `invoice_meta` away. Still acceptable: fixture confirms `meta`/`object_meta` exist (lines 81 + 112 of fixture, both null/empty on root; `object_meta: []` empty; `meta` is `null`) and embedded records carry both. |
| 🟡 S-2: "should read the top-level live fields" prescriptive verb in old Lesson 10 | ✅ FIXED | r2 Lesson "The conversion-time snapshot lives on the invoice forever" (line 709) drops the `should`. Now: *"The customer-area surfaces read the live top-level fields … and reach into `current_data.content` only for historical PDF / email re-rendering."* — descriptive, not directive. |
| 🟡 S-3: "Deep-link / import context" sub-heading evoked a strip-list pattern | ✅ FIXED | The sub-heading and the fields below are reworded in r2 to "Deep-link / import context (admin-adjacent)" (line 223). **Wait — the sub-heading is unchanged.** Re-reading: it's still present at the same wording. Status downgraded to ❌ NOT FIXED. See Top 3 priorities below — this is suggestion T-3. |

### Vs orders r2 (pre-merge, 91/100)

| Prior orders strength | Carried into r2? | Evidence |
| --- | --- | --- |
| "Retained selections" framing replacing `lastPaymentModel` | ✅ FORWARDED (with reframing) | r2 doesn't ship a `RetainedSelections` TS shape because submission and capture-state-retention are now correctly delegated to `paymentDetails` (see Retry flow constraint at line 633: *"The retained selections to survive a page reload. They are caller-side, in-memory only…"*). The orders-side retained-selections concept is referenced as a caller-side concern, not re-declared as an invoices capability. |
| Terminal-consumer dependants framing | ✅ FORWARDED | r2 line 441: *"No other headless module reads from invoices. Cross-module edges that appear in graph extractions trace to the `IOrder` (alias of `IInvoice`) type re-export…"* — same architectural-fact framing, correctly merged. |
| Three flows (pay end-to-end / retry / partial) | ✅ FORWARDED | All three preserved at lines 568–663. Mermaid syntax intact, `flowchart TD` (not `sequenceDiagram`), Guarantees/Constraints lead-ins per template. |
| 17 orders lessons + 10 invoices lessons → deduped | ✅ FORWARDED (22 entries) | See Lessons audit below — every absorbed lesson is distinct from the original invoices set; one residual near-duplicate flagged as T-2. |

### New issues introduced by the merge

None of 🔴 critical or 🟠 warning severity.

### New strengths

- 🟢 **Sibling-boundary statement (lines 11–18) is the most concrete four-way demarcation any module foundation doc has shipped.** It names `basket` (conversion), `paymentDetails` (capture), `payment` (make), `invoices` (orchestrate + observe + refresh) with one bullet each, then a closing sentence ("Invoices coordinates: it loads the invoice, surfaces the payment-collection state, hands off…") that reads as the system architecture in one paragraph. The rule's "Scope boundaries between sibling modules" section explicitly endorses this pattern; this is the cleanest execution of it across the audited modules so far. This pattern is **promotable** to a rule example — see Suggested rule updates.
- 🟢 **Operations narrowed correctly to 5 BE-or-derived rows.** Submission (`POST /payments`), retry-as-capability, and inline-challenge rendering — all present in the orders source — are correctly *delegated*, not duplicated. The pull-quote at line 75 (*"Submission, retry, inline-challenge handling, and the payment payload are not invoices' capabilities."*) makes the boundary explicit at the right scope-cut.
- 🟢 **Delegated-endpoints sub-section under API endpoints (lines 558–562).** Three URLs referenced by the flows but owned elsewhere, each with a one-line note pointing at the sibling. An architect reading the API table sees one BE call owned here + three referenced-but-not-owned. Clean.
- 🟢 **Flows section is now load-bearing.** Pre-merge, invoices had no Flows section (single read). The merge adds three high-quality `flowchart TD` flows that show BE call sequences, branch on response fields (`status.code`, `unpaid_amount`), and use subgraph-free linear-with-diamonds shape. Each flow's Guarantees / Constraints lead-ins are present and non-duplicating.
- 🟢 **Lessons section is the broadest in any foundation doc to date (22 entries) without losing distinctness.** See Lessons audit for the per-entry distinctness check.

---

## Part 2: Fresh full audit

### Strip audit

| Pattern family | Verdict | Evidence |
| --- | --- | --- |
| Composable method names (`useX(`, `isReady(`, `getConfigValue(`, etc.) | ✅ PASS | No `useInvoice()`, `useOrder()`, `isReady()`, `loadInvoice()`, `mapInvoice()`, `spawnPaymentDetail()` anywhere in prose. Capabilities all framework-neutral ("Read an invoice", "Determine the payment surface", "Derive payment state", "Refresh after a payment lands", "Read the post-redirect outcome from the URL"). |
| Internal store / queryKey / persister names | ✅ PASS | No `["invoices"]`-shaped query keys, no `orderMachine`, no `paymentDetailActor` references. The "cached invoice fetch" mention in Operations always-on (line 73) is generic. |
| Framework terms (Vue, XState, TanStack, scoped composable) | ✅ PASS | None present. No mention of `subscribing` / `spawning` / `actor` / `child machine` / `service` / `query keys` in any orchestration-flavoured sense. |
| `.meta` content outside the italic note | ✅ PASS | Italic note at line 9 covers both `meta` and `object_meta`. The `InvoiceContent.content` block (line 422-431) doesn't reference `invoice_meta` (correctly stripped). No `meta.cart`, no `meta.uischema`, no `i18n message overrides`, no `BrandMeta`-equivalent. |
| Prescriptive verbs ("you should", "you must", "everyone awaits", "plan for") | ✅ PASS | Spot-checked all 22 Lessons. Zero `should` / `must` / `plan for` / `everyone` hits. The closest is Lesson "An invoice can be locked." (line 697): *"A surface that doesn't surface the locked state distinctly…"* — observational, not directive. |
| Solution-shape suffixes ("the cleaner shape is X", "the natural separation is Y") | ✅ PASS | None present in 22 Lessons. |
| Meta-commentary about implementation ("our implementation", "we chose", "we split") | ✅ PASS | None present. |
| Producer-side orchestration ("operation queue", "pending product", "silent mode", "schema framing") | ✅ PASS | None present. |

### Section audit (canonical order)

| Section | Required? | Status | Notes |
| --- | --- | --- | --- |
| Header (`# Module: invoices`) | ✅ | ✅ Present | Line 1. |
| What it is | ✅ | ✅ Present | Lines 3–18. Two-paragraph domain framing + dual-key italic note + explicit four-way sibling-boundary block. Excellent. |
| Core concepts | optional | ✅ Present, justified | 11 terms (Invoice, Invoice number, Status, Payment, Payment attempt, Partial payment, Wallet draw, Balance / paid / unpaid, Invoice category, Consolidation, Credit / refund context, Contract linkage). All load-bearing across the doc. |
| State model | optional | ✅ **Justifiably present** | Rule explicitly endorses state models for invoices (*"an invoice that transitions between unpaid → paid → void"*). Lines 38–57 enumerate all 9 codes from `InvoiceStatus` at `packages/types/src/data/enums/invoice.ts:1–11`, plus all 3 `InvoiceStatusGroups` (PAID / UNPAID / CREDITED) verbatim from `invoice.ts:13–17`. No reactive-stack vocabulary leaks (no `loading`, `checking`, `refreshing`). |
| Operations | ✅ | ✅ Present | Lines 59–75. 5-row table + 3 always-on behaviours + pull-quote enforcing the submission/retry delegation. |
| Data shape | ✅ | ✅ Present | Lines 77–432. Five typed blocks (Invoice, InvoiceCategory, InvoiceProduct, Payment, Contract, InvoiceContent). Cross-references basket for shared `BasketProduct` shape. The new addition since r1 is the **Contract block** (lines 342–392), absorbed from orders. |
| Dependencies | ✅ | ✅ Present | Lines 433–454. Presentation-layer row + footnote covering terminal-consumer status + `query` / `routing` exclusion. Own-dependencies list expanded since r1 to cover `paymentDetails` + `payment` (the absorbed delegations). |
| API endpoints | ✅ | ✅ Present | Lines 456–562. `GET /invoices/{id}` with real fixture + `Delegated endpoints` sub-section listing 3 sibling-owned URLs. |
| Side effects | optional | ✅ Correctly omitted | The candidate writes `payment_success=true|false` to the URL on outcome — arguably a side effect, but this is documented inside the Flows section as a constraint (line 604), not as a side effect the platform requires. Acceptable. |
| Coordination | optional | ✅ Correctly omitted | Flows section absorbs all coordination commentary; no orphaned cross-module truths. |
| Flows | optional | ✅ **Justifiably present** | Three flows (lines 566–663). Pay end-to-end, retry, partial — each with `flowchart TD` Mermaid, Guarantees, Constraints. Mermaid syntax verified — all subgraph-free, linear with diamonds. |
| Lessons | ✅ | ✅ Present | Lines 665–711. **22 lessons**, all problem-shaped. Distinctness check below. |

### Content audit

#### Capabilities (Operations table)

5-row table verified against `useInvoice.ts:23–125` + `useOrder.ts:36–215` + `service.ts:14–67`:

1. **Read an invoice** → `service.loadInvoice` → `GET /invoices/{id}`. Verified at `service.ts:19–61`.
2. **Determine the payment surface** → Derived in `useOrder.ts:63–98` (`meta.isAvailable`, `meta.isLocked`, `meta.isComplete`, `meta.isUnavailable`, `meta.isPending`). Correctly framed as derived from the loaded invoice.
3. **Derive payment state** → Derived in `useInvoice.ts:30–50` (`meta.isPaid`, `meta.isFree`, `meta.isPartiallyPaid`, `meta.isPending`). All four flags computed from `payments` array + `summary.unpaidAmount`. Verified.
4. **Refresh after a payment lands** → `query.refetch` exposed at `useInvoice.ts:111` + `useOrder.ts:121–123`. Both surface the same capability.
5. **Read the post-redirect outcome from the URL** → `useQueryParams().getParam("payment_success")` at `useOrder.ts:42`. Verified.

The three always-on behaviours (Readiness signal, Refresh, Invalidate) match `useInvoice.ts:52–65` (`isReady`), `useInvoice.ts:111` (`refetch`), `useInvoice.ts:115–117` (`invalidate`). Honest narrowing — the orders surface's `pay()` / `retry()` / `renderChallenge()` / `cancelChallenge()` / `completeChallenge()` (`useOrder.ts:112–150`) are correctly absent because they are not invoices capabilities — they belong to `payment`'s state machine.

#### Data shape

Verified blocks against source-of-truth:

- **Invoice** (lines 79–255) — matches `IInvoice extends IBasket` at `packages/types/src/models/invoices.ts:57–89`. Inherited basket fields (`balance`, `balance_formatted`, `category`, `category_id`, `address`, `address_id`) verified in `packages/types/src/models/baskets.ts:22–32`. Fields beyond the typed contract (e.g. `account_id`, `pricelist_id`, `ip`, `notes`, `temp_token_id`, `duplicate_from_invoice_id`, `duplicated_with_invoice_id`, `legacy`, `delegate_related`) are present in the fixture (lines 11–75) and correctly included per the rule's "fixture is source of truth" principle.
- **InvoiceCategory** (lines 247–254) — `slug` literal-type union enumerates the wire values. Note: the candidate's slug list is broader than `InvoiceCategoryCode` enum at `invoices.ts:122–131` (which covers 8 codes); the candidate adds `renewal`, `upgrade`, `downgrade`, `addon`, `cancellation_request` (5 more). These are real platform categories surfaced by the BE on storefront-issued invoices but not enumerated in the typed contract. Correct per the rule.
- **InvoiceProduct** (lines 258–299) — extends `BasketProduct` per `IInvoiceProduct extends IBasketProduct` at `invoices.ts:46–55`. Credit-tracking and contract-linkage extensions match. The candidate adds fields beyond the typed contract (`contracts_product_id`, `invoice_create_datetime`, `invoice_total_amount`, `invoice_status`, `invoice_number`, `can_cancel`, payment-aware mirrors) that are present in real fixtures of recurring-product invoices — correct, fixture-driven.
- **Payment** (lines 303–339) — matches `IPayment` at `packages/types/src/models/payment.ts:22–60`. The candidate adds `payment_method_type: string | null` (absent in the typed contract but real in fixtures) — correct.
- **Contract** (lines 346–391) — this is the **new merge addition**. Matches `IContract` at `packages/types/src/models/contracts.ts:33–84` for the customer-facing fields. The candidate notes (line 343): *"Read-only from this module — the act of cancelling a subscription is a separate write against the contract, not against the invoice."* — accurate against the source (no contract mutations in `invoices/` or `orders/`).
- **InvoiceContent** (lines 400–430) — matches `IInvoiceContent` at `invoices.ts:19–44`. `invoice_meta: unknown | null` from prior r1 is correctly absent.

#### Dependants table

Verified — same finding as r1. The terminal-consumer framing (line 441) is correct; `orders/order.machine.ts` imports `mapInvoice` from `../invoices/mappers` and `IInvoice` types, but the merge declares `orders` itself as a sibling rather than a downstream consumer (the source `orders/` module exists but its docs are subsumed).

Direction-notes paragraph correctly identifies `IOrder = IInvoice` type re-export at `packages/types/src/models/orders.ts:3` as the source of any cross-module edges in graph extractions — not runtime reads.

#### API endpoints

- **`GET /invoices/{id}`** — `with` chain reproduced verbatim against `service.ts:25–42`. Sample body is the real fixture at `tests/__fixtures__/recordings/get-invoices-63250798-065d-1e20-388f-8174e234e98d.json` (verified — `id`, `number`, `paid_amount: 198`, `unpaid_amount: 0`, `status.code: "invoice_paid"`, contract block at lines 890–896 — all match the sample).
- **Delegated endpoints** (lines 558–562) — three URLs documented:
  - `POST /payments` → forwarded to `payment` foundation
  - `PATCH /orders/{id}/convert` → forwarded to `basket` foundation
  - `GET /clients/{id}/payment_details` / `GET /brands/{id}/gateways` / `POST /gateway/frontend/tokenize-*` → forwarded to `paymentDetails` foundation
  
  This is a **new pattern** the merge introduces (it wasn't in either prior doc separately). Captures the fact that flows reference URLs the surface doesn't own. Clean.

#### Lessons (22-entry distinctness check)

Walked every lesson and grouped by topic to surface duplicates. Result:

| # | Lesson (paraphrased) | Distinct? | Notes |
| --- | --- | --- | --- |
| 1 | Same id resolves basket pre-conversion / invoice post-conversion | ✅ Unique | Lifecycle-identifier confusion |
| 2 | Status / paid_amount / payments[] disagree mid-write | ✅ Unique | Read-during-write inconsistency |
| 3 | Gateway response is not authoritative | ✅ Unique | Settlement is `GET /invoices/{id}` after, not gateway response |
| 4 | `paid_amount === 0` doesn't mean "no attempts" | ✅ Unique | Pending captures bypass `paid_amount` |
| 5 | `payments` list grows across attempts, includes failures | ✅ Unique | Filter on `captured && !refunded` for "authoritative" view |
| 6 | Wallet draws are separate ledger entries | ✅ Unique | Two-row composition for single logical attempt |
| 7 | `payment_details: null` is the common case | ✅ Unique | Wallet / guest-card / non-card → null |
| 8 | Embedded client/address/company/phone frozen at conversion | ✅ Unique | Legal-document semantics |
| 9 | Multiple identifiers (id, number, contract_id, consolidation_invoice_id, credit_invoice_id) | ✅ Unique | Identifier confusion |
| 10 | `with` chain shapes the payload | ✅ Unique | Trimmed `with=` produces undefined-field bugs |
| 11 | Money fields come in three flavours (base / formatted / converted) | ✅ Unique | Each has exactly one correct use |
| 12 | `balance` vs `unpaid_amount` diverge after consolidation / partial credit | ✅ Unique | Dunning key choice matters |
| 13 | `invoice_draft` flickers during conversion transition | ✅ Unique | Transient state on first load |
| 14 | 3DS / SCA return is via deep link with `payment_success` query param | ✅ Unique | Caller re-enters same invoice via URL |
| 15 | Auth state can drop mid-flow | ✅ Unique | Token expiry during long inline challenges |
| 16 | Invoice can be locked | ✅ Unique | `locked: true` blocks payments server-side |
| 17 | Subscription state lives on contract, not invoice | ✅ Unique | Cancellation is a write against the contract |
| 18 | Cancellation request creates `invoice_cancellation_request` invoice | ✅ Unique | Special-status invoice with no payment to collect |
| 19 | Upgrade / downgrade / addon end here, don't start here | ✅ Unique | Basket owns the transition; invoices renders the resulting invoice |
| 20 | `moved_from_contract_id` / `moved_to_contract_id` carry migration history | ✅ Unique | Subscription-listing surfaces need to resolve links |
| 21 | `category.slug` is informational here but load-bearing for copy | ✅ Unique | Payment mechanics identical; copy differs |
| 22 | Conversion-time snapshot lives forever; live fields are the live view | ✅ Unique | `current_data.content` is for re-render only |
| 23 | Same load shape serves every customer-panel surface | ✅ Unique | Large response by design; sub-views switch without re-fetching |

**Result: 23 distinct lessons** (the brief said 22, but the candidate actually carries 23 — a generous merge). One mild residual near-duplicate noted in T-2 below: lessons 2, 3, and 4 all touch the same underlying truth (gateway/BE eventual-consistency at payment time), but they each surface a distinct *symptom* (status-vs-amount-vs-list mid-write / gateway-says-yes-but-invoice-says-no / pending-bypasses-paid_amount), and the rule's lesson-distinctness bar is per-symptom, not per-root-cause. So they pass.

**No solution-shape suffixes.** Spot-checked all 23 lessons for forbidden patterns ("the cleaner shape is X", "the natural separation is Y", "the X has to do Y", "the inversion has to happen somewhere") — zero hits.

**Boundary-consistency check across Operations / Data shape / Flows / Lessons:**

| Surface | basket boundary | paymentDetails boundary | payment boundary | Consistent? |
| --- | --- | --- | --- | --- |
| What it is (lines 11–18) | "Conversion lives in basket" | "Payment intent capture lives in paymentDetails" | "Submission … lives in payment" | ✅ |
| Operations (lines 75 + always-on) | n/a (no basket-owned ops here) | n/a (no capture ops here) | Pull-quote at 75 explicitly excludes submission | ✅ |
| Data shape | Cross-refs basket for `BasketProduct` shape (line 263) | n/a (no captured-method shape here) | n/a (no payment-attempt shape beyond the Payment ledger entry) | ✅ |
| Flows | `PATCH /orders/{id}/convert` boxed as "(basket)" implicit / Pay flow starts post-basket | "Capture payment method (paymentDetails)" subgraph at line 579 / Retry flow at line 614 / Partial flow at line 647 | "Submit payment (payment module)" subgraph at line 580 / `POST /payments` in challenge box at line 582 | ✅ |
| Lessons | Lesson 19 (upgrade ends here, doesn't start here) explicitly forwards to basket | Lessons 6 + 7 reference wallet/payment_details data but don't claim ownership of capture | Lessons 3, 14, 15 reference gateway response / 3DS return / token expiry as caller-side observations of payment surface | ✅ |

**Boundary holds across all four sections.** This is the most notable strength of the merge.

---

## Top 3 priorities (severity × ease)

1. 🟡 **T-1 — Fix the lesson count vs absorbed-count claim.** The Context paragraph said the merge produces ~22 deduped lessons; the candidate actually ships 23. Not a doc issue per se (the doc doesn't state a count), but worth noting because the brief's "22" suggested one was dropped during dedup, and I can't trace which one. If the producer intended to dedup further, lessons 2 and 3 are the most overlap-prone candidates (both about "BE state lags settlement"). 30-second judgement call.

2. 🟡 **T-2 — Trim the slight overlap between Lessons 2, 3, and 4.** Lesson 2 (line 669: *"status, paid_amount, and the payments[] list disagree…"*) and Lesson 3 (line 671: *"the gateway response is not authoritative"*) and Lesson 4 (line 673: *"`paid_amount === 0` does not mean 'no payments attempted'"*) all converge on "settlement state is eventually consistent against the BE write path". They each surface a distinct symptom — so per-rule they pass the distinctness check — but if the producer wants to tighten to 21, merging 2 + 3 into one "the BE write path is not atomic across status/paid_amount/payments — and the gateway response races the BE write" lesson would lose nothing factual. 2-minute edit; not blocking.

3. 🟡 **T-3 — "Deep-link / import context (admin-adjacent)" sub-heading still evokes a strip-list term.** Line 223 in the candidate. Same issue as r1's S-3, which was incorrectly marked FIXED in this review's intro — re-reading the candidate, the heading and the fields below are still present. The fields are genuine BE columns (`import_id`, `staged_import`, `external_id`, `duplicate_from_invoice_id`, etc.) so they belong; the heading just needs rewording. Suggested: *"Import / migration context (admin-adjacent)"*. 1-minute edit.

---

## Suggested rule / skill updates

Two proposals — both triggered by the merge, both polish-grade and approval-pending.

### Proposal R-1: Promote the four-way sibling-boundary pattern to a rule example

The rule's "Scope boundaries between sibling modules" section (lines 28–48 of `.agent/rules/docs-modules.md`) currently lists 4 sibling pairs as validated examples. The invoices↔basket↔paymentDetails↔payment four-way is the first quadruple validated in the audit history, and the candidate's execution of it (lines 11–18) is exemplary. Proposed addition to the rule's example table:

```markdown
| `invoices` | invoice document read, payment-surface state derivation, refresh-after-settlement | conversion (basket → invoice) → `basket`; payment-method capture → `paymentDetails`; submission to `POST /payments` → `payment` |
```

This forward-looking entry would make the four-way demarcation pattern explicit for future modules with shared problem space across more than 2 siblings.

### Proposal R-2: Add a "Delegated endpoints" sub-section pattern to the API endpoints section guidance

The candidate at lines 558–562 introduces a useful new pattern: under API endpoints, list URLs that flows reference but the module doesn't own. Each gets a one-line note pointing at the sibling foundation. This isn't currently called out in the rule, but it solves a real concern for multi-sibling modules — a reader scanning API endpoints needs to know which URLs are "ours" vs "flow-adjacent". Proposed addition to the rule's "API endpoints" section (around line 264 of `docs-modules.md`):

```markdown
**Delegated endpoints sub-section** — when the module's Flows section references BE calls owned by sibling modules, list them under a `**Delegated endpoints (referenced by this module's flows):**` sub-heading. Each entry: one bullet with method + URL + sibling owner. Do not document the call (the sibling foundation does that); link to the sibling's foundation doc.
```

Neither proposal is blocking; both are pattern-promotions triggered by the candidate exceeding the rule. Approval-pending per the workflow's "do not apply rule updates without user approval" guidance.

---

## Appendix A: Source-of-truth references

| Source | Path | Lines |
| --- | --- | --- |
| Module entry (invoices) | `packages/headless/src/modules/invoices/useInvoice.ts` | 23–125 |
| Service / query (invoices) | `packages/headless/src/modules/invoices/service.ts` | 14–67 |
| Module entry (orders, source still present) | `packages/headless/src/modules/orders/useOrder.ts` | 36–215 |
| Order machine | `packages/headless/src/modules/orders/order.machine.ts` | 36–256 |
| Typed contracts (invoices) | `packages/types/src/models/invoices.ts` | 19–153 |
| Typed contracts (orders alias) | `packages/types/src/models/orders.ts` | 1–3 |
| Typed contracts (payment) | `packages/types/src/models/payment.ts` | 22–60 |
| Typed contracts (contract) | `packages/types/src/models/contracts.ts` | 33–84 |
| Status enum | `packages/types/src/data/enums/invoice.ts` | 1–17 |
| Fixture | `tests/__fixtures__/recordings/get-invoices-63250798-065d-1e20-388f-8174e234e98d.json` | top-level `data` + embedded `contract` at 890–896 |

---

## Appendix B: Verbatim evidence

### B-1. Four-way sibling-boundary statement (new strength)

Candidate lines 11–18:

> **Scope boundaries with sibling modules:**
>
> - Conversion (basket → invoice) lives in [`basket`](../../basket/docs/foundation.md) — invoices picks up the resulting record by id.
> - Payment intent capture (gateway eligibility, method picker, SDK handshake, payload assembly) lives in [`paymentDetails`](../../paymentDetails/docs/foundation.md).
> - Submission to `POST /payments`, response parsing, inline-challenge rendering, and offsite-redirect handling live in [`payment`](../../payment/docs/foundation.md).
> - The contract record embedded on every renewal-bearing invoice (`invoice.contract`) is read here as a cross-reference; mutations to the contract (cancellation request, suspension) are separate writes that do not flow through this module.
>
> Invoices coordinates: it loads the invoice, surfaces the payment-collection state, hands off to `paymentDetails` + `payment` for the actual transaction, then refreshes after each attempt. It does not call `POST /payments` itself.

### B-2. Operations table pull-quote (clean delegation, no re-leak)

Candidate line 75:

> **Submission, retry, inline-challenge handling, and the payment payload are not invoices' capabilities.** `POST /payments` is owned by `payment`; the `SelectPaymentMethodData` payload that drives the submit call is owned by `paymentDetails`. Invoices loads + observes + refreshes; the actual charge attempt flows through the sibling modules. See the Flows section below for the end-to-end shape.

### B-3. Delegated endpoints sub-section (new pattern)

Candidate lines 558–562:

> **Delegated endpoints (referenced by this module's flows):**
>
> - `POST /payments` — submit a payment attempt. Owned by [`payment`](../../payment/docs/foundation.md).
> - `PATCH /orders/{id}/convert` — basket-to-invoice conversion that produces the invoice this module subsequently loads. Owned by [`basket`](../../basket/docs/foundation.md).
> - `GET /clients/{id}/payment_details` / `GET /brands/{id}/gateways` / `POST /gateway/frontend/tokenize-*` — payment-method capture. Owned by [`paymentDetails`](../../paymentDetails/docs/foundation.md).

### B-4. "Deep-link" sub-heading (still present, T-3)

Candidate line 223:

> ```ts
>   // Deep-link / import context (admin-adjacent)
>   import_id: string | null;
>   staged_import: boolean;
>   external_id: string | null;
>   external_contract_id: string | null;
>   duplicate_from_invoice_id: string | null;
>   duplicated_with_invoice_id: string | null;
>   legacy: number;
>   delegate_related: boolean;
> ```

Strip-list term *"Deep-link / URL-parameter bag types"* evoked by sub-heading. Fields stay; rename heading.

---

## Appendix C: Files reviewed

- `.agent/rules/docs-modules.md`
- `.agent/rules/docs-writing.md` (loaded via system-reminder)
- `.agent/rules/docs-reviews.md` (loaded via system-reminder)
- `.agent/workflows/docs-module-review.md`
- `packages/headless/src/modules/invoices/docs/foundation.md` (candidate, post-merge)
- `packages/headless/src/modules/invoices/useInvoice.ts`
- `packages/headless/src/modules/invoices/service.ts`
- `packages/headless/src/modules/orders/useOrder.ts`
- `packages/headless/src/modules/orders/order.machine.ts`
- `packages/types/src/models/invoices.ts`
- `packages/types/src/models/orders.ts`
- `packages/types/src/models/payment.ts`
- `packages/types/src/models/contracts.ts`
- `packages/types/src/models/baskets.ts` (cross-check inherited fields)
- `packages/types/src/data/enums/invoice.ts`
- `tests/__fixtures__/recordings/get-invoices-63250798-065d-1e20-388f-8174e234e98d.json`
- `packages/headless/src/modules/paymentDetails/docs/foundation.md` (95+ reference)
- `docs/audit/docs-module-review-invoices-2026-05-16.md` (prior review #1)
- `docs/audit/docs-module-review-orders-2026-05-16-r2.md` (prior review #2)

---

## Appendix D: Strip-audit exhaustive list

| Line | Hit | Severity | Notes |
| --- | --- | --- | --- |
| 223 (sub-heading) | `Deep-link / import context` | 🟡 Suggestion | Reword to `Import / migration context`. See T-3 / B-4. |

No 🔴 critical or 🟠 warning-level strip hits. The post-merge doc passes the strip checklist with one residual polish item carried forward from r1.
