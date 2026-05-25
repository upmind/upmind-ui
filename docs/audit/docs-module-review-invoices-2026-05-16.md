# Invoices Foundation Doc — Review (2026-05-16)

**Module:** `invoices`
**Candidate:** `packages/headless/src/modules/invoices/docs/foundation.md`
**Standard:** `.agent/rules/docs-modules.md` (canonical)
**Prior review:** none (first audit)
**Reviewer status:** ✅ Done (shippable with light polish)

---

## Executive Summary

| Category | Score | Notes |
| --- | ---: | --- |
| Technical Accuracy | 94 | Types, fixture, and dependants verified against `IInvoice` (`packages/types/src/models/invoices.ts:57–89`) and the captured fixture. One minor framing issue: the "Deep-link / import context" sub-heading inside the type block evokes a strip-list term even though the underlying fields are genuine BE columns. |
| Completeness | 94 | All required sections present. Operations honestly narrowed to 1 BE read + 1 derived view + 3 always-on lifecycle items. State model justified by `InvoiceStatus` enum and includes every code from `packages/types/src/data/enums/invoice.ts`. Flows correctly omitted (single-request module). |
| Structure | 95 | Canonical section order respected. State model present and justified per rule. Optional sections (Side effects, Coordination, Flows) correctly omitted. Italic note covers both `meta` and `object_meta`. |
| Tone | 92 | Descriptive throughout; Lessons are uniformly problem-shaped. One mild "consumers" prescription drift in the `with` lesson ("Consumers who copy a curl…produce undefined-field bugs") — observational, not prescriptive, so still fine. |
| Actionability | 90 | An architect could rebuild a single-invoice read surface from this doc alone. Sample fixture is real and the `with` query parameter is documented inline. Only honest gap: no second fixture covering a partially-paid / refunded invoice — the lessons describe states the sample doesn't exhibit. |

**Overall: 93 / 100** (no prior — first audit)

**One-paragraph verdict.** The candidate is publishable. Scope is honestly narrow — the headless module exposes exactly one BE call (`GET /invoices/{id}`) plus three derived lifecycle behaviours and one client-side `meta` computation — and the doc reflects that without padding. The State model section is justified by the platform-defined `InvoiceStatus` enum (correctly drawn from `packages/types/src/data/enums/invoice.ts`, not from our orchestrator). Strip discipline holds: no `useInvoice`, no `isReady`, no XState/TanStack vocabulary, no `.meta` references outside the italic note. The 10 lessons are all problem-shaped and traceable to genuine platform behaviours visible in the fixture and types. Three minor polish items below — none blocking.

---

## Part 1 — Fresh Full Audit (no prior to delta against)

### Strip audit

| Pattern family | Verdict | Evidence |
| --- | --- | --- |
| Composable method names (`useX(`, `isReady(`, `getConfigValue(`, etc.) | ✅ PASS | No `useInvoice()`, `isReady()`, `mapInvoice()`, `loadInvoice()` in prose. Capabilities translated to framework-neutral names ("Read one invoice", "Derive payment state"). |
| Internal store / queryKey / persister names | ✅ PASS | No `["invoices"`-shaped query keys, no `localStoragePersister`, no `invoicesStore`. The day-long stale time mentioned in "This module's own dependencies" reads as a transport-layer behaviour, not a TanStack leak. |
| Framework terms (Vue, XState, TanStack, `useQuery`, `spawn`, scoped composable) | ✅ PASS | None. "Cached invoice fetch" (line 51) is generic, not framework-specific. |
| `.meta` content outside the italic note | ✅ PASS | Italic note at line 7 only. No `meta.cart`, no `meta.uischema`, no `i18n` overrides, no `BrandMeta`-equivalent anywhere. The `invoice_meta: unknown \| null` field inside `InvoiceContent.content` (line 347) refers to a BE-named field on the historical snapshot blob — but the blob itself is described as "consumed by PDF / email rendering, not the customer panel", so this read is borderline and acceptable. |
| Prescriptive verbs ("you should", "you must", "everyone awaits", "plan for") | ✅ PASS | None in Lessons. The closest near-miss is "Customer-area surfaces should read the top-level live fields" in Lesson 10 (line 655) — this is observational ("the live data lives here") not directive, but `should` is the strip-list verb. See Suggestion S-2 below. |
| Solution-shape suffixes ("the cleaner shape is X", "the natural separation is Y") | ✅ PASS | None present. |
| Meta-commentary about implementation ("our implementation", "we chose", "we split") | ✅ PASS | None present. |
| Producer-side orchestration ("operation queue", "pending product", "silent mode", "schema framing") | ✅ PASS | None present. |

### Section audit (canonical order)

| Section | Required? | Status | Notes |
| --- | --- | --- | --- |
| Header (`# Module: invoices`) | ✅ | ✅ Present | Line 1. |
| What it is | ✅ | ✅ Present | Lines 3–9. One paragraph + dual-key italic note + explicit sibling-handoff paragraph naming basket / payment / paymentDetails / orders. Excellent demarcation per the rule's "scope boundaries between siblings" pattern. |
| Core concepts | optional | ✅ Present, justified | Eight terms, all load-bearing for the rest of the doc (Invoice, number, Status, Payment, Balance/paid/unpaid, Consolidation, Credit/refund context, Contract linkage). |
| State model | optional | ✅ **Justifiably present** | The rule explicitly endorses state-model sections for invoices: *"an invoice that transitions between unpaid → paid → void"*. Table at lines 26–36 enumerates all nine codes from `InvoiceStatus` in `packages/types/src/data/enums/invoice.ts` with BE-driven entry triggers. No reactive-stack vocabulary leaks (no `loading`, `checking`, `refreshing`). |
| Operations | ✅ | ✅ Present | Lines 42–51. 2-cap table + 3 always-on behaviours. Honestly narrow — matches the source surface (single BE call + derived meta flags). |
| Data shape | ✅ | ✅ Present | Lines 53–350. Four type blocks: `Invoice` (the full record), `InvoiceCategory`, `InvoiceProduct` (extends `BasketProduct`), `Payment`, `InvoiceContent`. Cross-references basket for the shared `BasketProduct` shape rather than duplicating — good. |
| Dependencies | ✅ | ✅ Present | Lines 354–374. Two-row dependants table + presentation-layer row + direction-notes paragraph + transport-layer exclusion footnote. Own-dependencies list is comprehensive and names every type. |
| API endpoints | ✅ | ✅ Present | Lines 378–633. Real fixture captured at `tests/__fixtures__/recordings/get-invoices-63250798-065d-1e20-388f-8174e234e98d.json`; the `with` chain is reproduced exactly and the response body is verbatim from the fixture with `meta`/`object_meta` stripped (both were `null`/empty in the captured payload anyway — see Suggestion S-1). |
| Side effects | optional | ✅ Correctly omitted | Module produces no externally-observable side effect. |
| Coordination | optional | ✅ Correctly omitted | No cross-module coordination not already in Lessons. |
| Flows | optional | ✅ Correctly omitted | Module is a single-request read; no multi-step interactions to chart. |
| Lessons | ✅ | ✅ Present | Lines 637–655. 10 lessons, all problem-shaped, no solution-shape suffixes. |

### Content audit

#### Capabilities (Operations table)

Two-row table is correct against source. `useInvoice.ts` exposes:

1. **The query itself** (`service.loadInvoice` → `GET /invoices/{id}`) — maps to capability #1 "Read one invoice".
2. **A computed `meta` block** with `isPaid` / `isFree` / `isPartiallyPaid` / `isPending` derived from `paid_amount`, `unpaid_amount`, and the `payments[]` array — maps to capability #2 "Derive payment state".

The three always-on behaviours below the table (Readiness signal, Refresh, Invalidate) match `isReady()`, `refetch`, and `invalidate` exported from `useInvoice.ts:81–117`. The honest narrowing is correct — capabilities like "create invoice", "edit invoice", "void invoice" are correctly absent because the headless module does not expose them.

#### Data shape

- `Invoice` type block (lines 62–217) matches `IInvoice` extends `IBasket` at `packages/types/src/models/invoices.ts:57–89`. Fields beyond the typed contract that appear in the fixture (e.g. `account_id`, `pricelist_id`, `ip`, `notes`, `temp_token_id`) are included per the rule's "fixture is source of truth" guidance.
- `InvoiceProduct` block (lines 235–269) correctly references `BasketProduct` as the base and lists only the credit-tracking and contract-linkage extensions. Matches `IInvoiceProduct` at `packages/types/src/models/invoices.ts:46–55`.
- `Payment` block (lines 275–311) — fields match the captured fixture's `data.payments[0]`. `payment_method_type: null` and `payment_details: null` documented as the common case; this directly supports Lesson #6.
- `InvoiceContent` block (lines 323–349) matches `IInvoiceContent` at `packages/types/src/models/invoices.ts:19–44`. The `invoice_meta: unknown \| null` line at 347 is a BE-named field; arguably it's a `meta`-flavoured leak per the strict reading of the rule (silent strip across the doc), but it's a typed contract field rather than commentary about `meta` content. Borderline — see Suggestion S-3.

#### Dependants table

Verified against grep:

```bash
$ grep -r "from \"\.\./invoices" packages/headless/src/modules/ -l
packages/headless/src/modules/orders/order.machine.ts
packages/headless/src/modules/orders/order.types.ts
```

The graph reports `orders` as a 2-file dependant. Direction-notes paragraph (lines 363–365) correctly identifies the reverse edges (invoices imports from session/currency/client/basket/basketProduct/query) and excludes them from the dependants table. The transport / routing exclusion footnote (line 365) is per template.

The Presentation layer row (line 361) is justified — customer panel views consume the parsed invoice shape directly.

#### API endpoints

- `GET /invoices/{id}` with the full `with` chain — verbatim against `service.ts:24–43`.
- Curl uses `$API` and `$ACCESS_TOKEN` — per template.
- Sample body is the real fixture (`tests/__fixtures__/recordings/get-invoices-63250798-065d-1e20-388f-8174e234e98d.json`) with `meta`/`object_meta` stripped. Both were already `null` at top level in the captured payload, so stripping is a no-op there; the doc correctly silently drops the empty `object_meta` arrays and the per-row `meta` bags inside nested `products[].product.meta` (which carried a benefits-list cart-UI bag).
- No cross-references to internal methods.

#### Lessons

All ten problem-shaped, all traceable to platform truths:

1. **Status / paid_amount / payments[] race at write time** — observable read-during-write inconsistency.
2. **`paid_amount === 0` doesn't mean "no payments attempted"** — pending captures bypass `paid_amount`. Directly maps to the `pending: true` / `captured: 0` payment shape in `IPayment`.
3. **Embedded client/address/company/phone is frozen at conversion** — `IInvoice` extends `IBasket` and the `client` block is captured at conversion. Verifiable platform behaviour.
4. **Identifier confusion (id vs number vs contract_id vs consolidation_invoice_id vs credit_invoice_id)** — directly maps to the five identifier fields on `IInvoice`.
5. **`with` chain shapes the payload** — observable BE behaviour, mirrored in `service.ts` where the storefront uses one specific chain.
6. **`payment_details: null` is the common case** — supports the fixture (the captured payment has `payment_details: null` and `payment_method_type: null`).
7. **Three flavours of money fields** — base, formatted, converted. Matches the `_formatted` / `_converted` twin pattern across `IInvoice`.
8. **`balance` vs `unpaid_amount` diverge after consolidation/credit** — supports the doc's earlier Core-concept distinction.
9. **`invoice_draft` flicker during conversion** — supports the State-model entry trigger for `invoice_draft`.
10. **`current_data.content` is a snapshot, not a live join** — supports the `InvoiceContent` data-shape block.

No solution-shape suffixes. The closest near-miss is Lesson 1's framing ("either trust `status` alone…or compute its own truth from `paid_amount` vs `total_amount`") — this enumerates two observable strategies and their consequences without prescribing one. Acceptable per the rule's "describe problem, not solution" calibration.

---

## Top 3 priorities (severity × ease)

1. 🟡 **S-1 — Tighten the italic `meta` note.** Lines 7's note reads *"Both keys appear on the invoice record and on every embedded sub-record"* — in the captured fixture, `meta`/`object_meta` are `null` at the invoice top level and empty arrays on most embedded sub-records. The only non-empty meta in this fixture is `products[].product.meta` (a benefits bag). Suggested rewrite: *"Any `meta` or `object_meta` field returned by Upmind endpoints is UI-specific to our own client — ignore for spec purposes. `meta` appears on embedded product records (cart-UI benefits bag); `object_meta` appears as a sibling on most records; both are out of scope."* — 2-minute edit, no scope change.

2. 🟡 **S-2 — Soften the "should" in Lesson 10.** Line 655 reads *"The customer-area surfaces should read the top-level live fields"* — strict reading of the rule bans `should`. Rewrite to descriptive: *"The customer-area surfaces read the top-level live fields; the `current_data.content` blob exists so the BE can re-render the historical PDF / email view consistently after the live data changes. A consumer that reaches into `current_data.content` to render the in-app view ends up showing a stale snapshot whenever a payment lands without a re-snapshot trigger."* — 1-minute edit.

3. 🟡 **S-3 — Re-headline "Deep-link / import context" inside the type block.** Line 201's sub-heading reads *"Deep-link / import context (admin-adjacent)"*. The fields below (`import_id`, `staged_import`, `external_id`, `external_contract_id`, `duplicate_from_invoice_id`, `duplicated_with_invoice_id`, `legacy`, `delegate_related`) are genuine BE columns and belong in the type block — but the rule's strip list bans *"Deep-link / URL-parameter bag types"* and the sub-heading evokes that pattern. Rewrite the heading to *"Import / migration context (admin-adjacent)"* — fields stay, framing aligns with rule. 1-minute edit.

---

## Suggested rule / skill updates

None. The candidate's issues are all polish-grade and don't surface a repeated slip pattern across runs that would justify rule changes.

---

## Appendix A — Source-of-truth references

| Source | Path | Lines |
| --- | --- | --- |
| Module entry | `packages/headless/src/modules/invoices/useInvoice.ts` | 1–125 |
| Service / query | `packages/headless/src/modules/invoices/service.ts` | 14–67 |
| Mapper | `packages/headless/src/modules/invoices/mappers.ts` | 16–64 |
| Local types | `packages/headless/src/modules/invoices/types.ts` | 9–56 |
| Typed contracts | `packages/types/src/models/invoices.ts` | 19–153 |
| Status enum | `packages/types/src/data/enums/invoice.ts` | (referenced by doc, name verified) |
| Fixture | `tests/__fixtures__/recordings/get-invoices-63250798-065d-1e20-388f-8174e234e98d.json` | top-level `data` |
| Cross-module imports | grep `from "../invoices"` across `packages/headless/src/modules/` | `orders/order.machine.ts`, `orders/order.types.ts` |

---

## Appendix B — Verbatim evidence

### B-1. Italic meta note (S-1)

Candidate line 7:

> *Any `meta` or `object_meta` field returned by Upmind endpoints is UI-specific to our own client — ignore for spec purposes. Both keys appear on the invoice record and on every embedded sub-record (client, products, products.product, products.product.category); all are out of scope.*

Fixture verification:

- `data.meta`: `null`
- `data.object_meta`: `null`
- Non-null `meta` bag count nested: 4 (on embedded `product` records)
- Non-empty `object_meta` count nested: 0

### B-2. "Should" in Lesson 10 (S-2)

Candidate line 655:

> The customer-area surfaces should read the top-level live fields (`number`, `status`, `total_amount`, `payments[]`); the `current_data.content` blob exists so the BE can re-render the *historical* PDF / email view consistently after the live data changes.

Strip-list verb `should` flagged.

### B-3. "Deep-link" sub-heading (S-3)

Candidate line 201:

> ```ts
> // Deep-link / import context (admin-adjacent)
> import_id: string | null;
> staged_import: boolean;
> external_id: string | null;
> external_contract_id: string | null;
> duplicate_from_invoice_id: string | null;
> duplicated_with_invoice_id: string | null;
> legacy: number;
> delegate_related: boolean;
> ```

Strip-list term *"Deep-link / URL-parameter bag types"* evoked by sub-heading.

---

## Appendix C — Files reviewed

- `.agent/rules/docs-modules.md`
- `.agent/workflows/docs-module-review.md`
- `.agent/rules/docs-writing.md` (loaded via system-reminder)
- `packages/headless/src/modules/invoices/docs/foundation.md` (candidate)
- `packages/headless/src/modules/invoices/useInvoice.ts`
- `packages/headless/src/modules/invoices/service.ts`
- `packages/headless/src/modules/invoices/mappers.ts`
- `packages/headless/src/modules/invoices/types.ts`
- `packages/types/src/models/invoices.ts`
- `tests/__fixtures__/recordings/get-invoices-63250798-065d-1e20-388f-8174e234e98d.json`
- `packages/headless/src/modules/basket/docs/foundation.md` (95+ reference)
- `packages/headless/src/modules/client/docs/foundation.md` (95+ reference)
- `docs/audit/docs-module-review-client-2026-05-16.md` (tonality reference)

---

## Appendix D — Strip-audit exhaustive list

| Line | Hit | Severity | Notes |
| --- | --- | --- | --- |
| 655 | `should read the top-level live fields` | 🟡 Suggestion | Soften to descriptive. See S-2. |
| 201 (sub-heading) | `Deep-link / import context` | 🟡 Suggestion | Reword to `Import / migration context`. See S-3. |

No 🔴 critical or 🟠 warning-level strip hits.
