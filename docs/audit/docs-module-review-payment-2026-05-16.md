# /docs-module-review — payment

- **Date**: 2026-05-16
- **Reviewer**: docs-module-review (iteration 1)
- **Candidate**: `packages/headless/src/modules/payment/docs/foundation.md`
- **Prior review**: none
- **Module**: `payment`

---

## Executive summary

| Category | Score |
| --- | --- |
| Technical accuracy | 92 |
| Completeness | 88 |
| Structure | 94 |
| Tone | 96 |
| Actionability | 92 |
| **Overall** | **92** |

**Verdict (one-line)**: **pass with trivial polish** — the doc is strip-clean, capability rows are framework-neutral, the data shape mirrors the fixture, and the flow is correctly drawn with `flowchart TD`. Two scope demarcation tightenings (capability 1 + capability 7 inputs) and one fixture-vs-doc reconciliation are the only blockers to a higher score; none of them require rule changes.

---

## Part 2: Fresh full audit

### Strip-audit findings

Greps run against the candidate for every pattern family in the rule's Strip-audit table:

| Pattern family | Result |
| --- | --- |
| Composable method names (`useX(`, `isReady(`, `getConfigValue(`, etc.) | 🟢 No hits |
| Internal store / queryKey / persister names | 🟢 No hits |
| Framework terms (`computed(`, `XState`, `TanStack`, `useQuery`, `spawn(`, scoped composable) | 🟢 No hits |
| `.meta` content outside an italic note | 🟢 No hits (and no note included — correct: fixtures show only envelope `meta: null`) |
| Prescriptive verbs ("you should", "you must", "everyone awaits", "plan for") | 🟢 No hits |
| Solution-shape suffixes ("the cleaner shape is X", "the natural separation is Y", etc.) | 🟢 No hits |
| Meta-commentary about our implementation ("our implementation", "we chose") | 🟢 No hits |

🟢 **Strip-audit: clean.** The producer has internalised the rule's no-implementation-flavour bar.

### Section audit

| Section | Status |
| --- | --- |
| Header (`# Module: payment`) | ✅ |
| What it is | ✅ |
| Core concepts | ✅ |
| State model | ✅ correctly omitted (no platform-exposed lifecycle states on payment attempts beyond the four-field tuple already described in Operations / Data shape) |
| Operations | ✅ |
| Data shape | ✅ |
| Dependencies (dependants + own dependencies) | ✅ |
| API endpoints | ✅ |
| Side effects | ✅ correctly omitted |
| Coordination | ✅ correctly omitted |
| Flows | ✅ (one flow, `flowchart TD`, `Guarantees` + `Constraints` prose lead-ins) |
| Lessons (hard-won) | ✅ |

All required sections present in canonical order. No `n/a` filler.

### Content audit

#### Capabilities (Operations)

- **Cross-checked against source exports.** `services.ts` exports `load`, `update`, `validate`, `redirect`, `render`. `usePayment.ts` exposes `pay`, `refresh`, `renderChallenge`, `completeChallenge`, `cancelChallenge`, plus `isReady` and `meta`.
  - 🟢 Capability 4 (Submit a payment) ↔ `services.update` ↔ `POST /payments`.
  - 🟢 Capability 2 (List gateways eligible) ↔ inline gateway list in `services.load`.
  - 🟢 Capability 6 (Render an inline challenge) ↔ `services.render` → `mappers.mapRenderer`.
  - 🟢 Capability 7 (Hand off to an offsite challenge) ↔ `services.redirect` → `utils.submitViaForm`.
  - 🟢 Capabilities 3 + 5 (derived, in-memory) correctly marked as "not a separate BE call".
- 🟠 **Scope leak — capability 1.** "Read an invoice with payment context" documents `GET /invoices/{invoiceId}` here, but the rule's sibling-scope guidance (Scope boundaries between sibling modules) says: *document the call once, on the chosen side; the sibling references the call by URL but does not re-document it.* The "What it is" prose already forwards the invoice record to `invoices`. Capability 1 should either:
  - (a) be reframed as "Hydrate the invoice as payment context" with a one-line note that the call itself is documented in `invoices`, and drop the curl + response section under API endpoints; or
  - (b) be removed entirely with a sentence in "What it is" naming the four fields payment keys off (`client_id`, `currency.code`, `address.country_id`, `total_amount`) and a reference to invoices' shape.
  - Severity 🟠 because the doc *also* lists "Invoice (read-side)" as a dependency — the two statements aren't quite consistent. Easy fix; high clarity gain.
- 🟡 **Capability 7 inputs incomplete.** Input column lists only "`approval_url` from a `PaymentAttempt`", but `services.redirect` *also* reads `cancel` from context and uses it to seed `window.history.replaceState` so the back button from the gateway returns to a cancel URL (see `services.ts:182`). Either add `cancel` to the inputs or note in the lessons / constraints that the cancel URL is push-state-seeded before redirect.

#### Data shape

- 🟢 `PaymentAttempt` fields (`transaction_status`, `transaction_type`, `transaction_id`, `approval_url`) match `tests/__fixtures__/recordings/post-payments.json` exactly.
- 🟢 `BrandGateway` + `Gateway` types include every field returned in `get-brands-…-gateways-2d2b5513.json` that's of interest to a rebuilder — including `gateway_settings` with its private-stub shape, `gateway_provider` expand, `card_types`, `currencies`, `next_action`, `webhook_url`, `hash`, `provider_logo`.
- 🟢 Typed contracts cross-referenced: `IGateway`, `IGatewayProvider`, `IBrandGateway`, `IGatewaySetting`, `ICardType`, `IGatewayCurrency`, `IPaymentAttempt` (lines 213–215, 234).
- 🟢 No `meta` in any TS block.
- 🟡 Fixture-vs-doc reconciliation: the documented `Gateway` type lists `auth_type: "settings" | "oauth2" | "none"`, but the typed contract (`packages/types/src/models/gateways.ts:53`) declares `is_stored: string` (not `boolean`). The fixture confirms the doc's `boolean` framing is correct for runtime, but it's worth a one-liner comment ("typed as `string` in `IGateway`; runtime returns boolean") to alert a rebuilder that the typed contract lags here. Optional; doc is on the right side of the rule that says "follow the fixture" when types lag.
- 🟡 `PaymentPost` lists `payment_details_id?` and a free-form `[providerField: string]: unknown` bag. Good — this matches what `services.update` actually posts (`{ invoice_id, ...paymentDetail }`). One-line addition worth considering: `card_type`, `card_num`, `card_expire_date`, `card_cvv` are mentioned in Lessons (line 421) as the keys for a one-off card flow — naming them inline as examples in the type comment would tighten the link between the data shape and the validation-error lesson.

#### Dependants

- 🟢 Graphify cross-module edges confirm the doc's table:
  - `basket/basket.machine.ts` imports from `../payment` → `basket` is a dependant. ✅
  - `orders/order.machine.ts` imports from `../payment` → `orders` is a dependant. ✅
  - `paymentDetails` does NOT import from payment (verified by grep) — correctly absent from the table.
- 🟢 Presentation-layer row present and well-scoped (gateway picker, invoice-payment page, inline-challenge mount, offsite redirect intermediate, awaiting-instructions screen).
- 🟢 `query` / `routing` exclusion footnote present and correctly worded.
- 🟢 "Reads" column uses data names ("payment attempt result", "gateway eligibility list", "chosen-gateway record"), not method names.
- 🟡 The weight column values (`2`, `2`) match the file-count edges found by grep but are not visibly derived in the doc. Optional: a footnote citing the source ("from `graphify-out/graph.json` cross-module import edges") would make the column self-explaining.

#### Own dependencies

- 🟢 List is short, factual, bullet-shaped per the rule. HTTP transport / Invoice / Brand / Payment details / Session / Shared types — every entry is a real, code-verified dependency.
- 🟡 "Invoice (read-side)" framed as a dependency but the doc also exposes capability 1 ("Read an invoice with payment context") — see the scope-leak note above. Resolving capability 1 resolves the inconsistency.

#### API endpoints

- 🟢 All three endpoints (`GET /invoices/{invoiceId}`, `GET /brands/{brandId}/gateways`, `POST /payments`) carry method + URL + role + curl + sample / fixture pointer.
- 🟢 Curls use `$API` and `$ACCESS_TOKEN`.
- 🟢 Sample bodies on `POST /payments` and the gateways list match the captured fixtures.
- 🟢 No `meta` in any sample body.
- 🟠 Same scope leak as capability 1: `GET /invoices/{invoiceId}` is documented here in full. If capability 1 is rewritten, this section should collapse to a single sentence with a fixture pointer instead of carrying its own curl + full prose.

#### Flows

- 🟢 Single flow ("Attempt a payment") with `flowchart TD`, rounded entry / terminal nodes, square action nodes, diamond branch on the response tuple, `Guarantees` + `Constraints` prose lead-ins.
- 🟢 Node labels reference BE endpoints (`GET /invoices/{invoiceId}`, `POST /payments`), not composable method names.
- 🟢 No actor / subscription / query-invalidation commentary inside the chart.
- 🟢 Branch fan-out is correctly modelled as a 4-way decision on `transaction_status + approval_url + gateway.type`.
- 🟡 The "Failure" terminal (`M`) is reached from two paths (`K -->|cancelled / error|` and `L -->|callback cancel / error|`) but there is no preceding error-shape narration in the Guarantees / Constraints lists tying back to the `error` machine state. Optional: one-line addition under Constraints — "A challenge cancel / failure surfaces an error to the caller; the invoice is unchanged but the next attempt has to re-pick the gateway."

#### Lessons

- 🟢 All eight lessons are problem-shaped, no solution-suffix ("the cleaner shape is", "the natural separation is", etc.).
- 🟢 No prescriptive verbs.
- 🟢 Each maps to an observable phenomenon:
  - Lesson 1 (five-tuple eligibility) ↔ `services.load` query params.
  - Lesson 2 (three-axis decision) ↔ `payment.machine.ts` guards `needsChallenge` + `needsInstructions`.
  - Lesson 3 (offsite severs state) ↔ `services.redirect` non-resolving promise.
  - Lesson 4 (inline-challenge support is gateway-by-gateway) ↔ `mappers.hasRenderer` → `renderers/index.ts`.
  - Lesson 5 (awaiting-client is success-shaped) ↔ `TransactionStatus.WAITING` × `GatewayTypes.AWAITING_CLIENT`.
  - Lesson 6 (private settings as id-only stubs) ↔ fixture line 53–55.
  - Lesson 7 (`payment_instructions` is markdown) — verifiable from BE behaviour.
  - Lesson 8 (validation errors keyed by `display_fields`) ↔ `Unprocessable_Entity` handling in `payment.machine.ts:271`.
- 🟢 Lesson 8 in particular is a good example of "diff between input vocabulary and resolved vocabulary" — names the provider-side field codes directly so a rebuilder can attach errors correctly.

---

## Top 3 priorities

Ordered by severity × ease.

1. **Resolve the capability-1 scope leak** (🟠, ~10 min). The invoice read is documented twice — once as capability 1, once as the `GET /invoices/{invoiceId}` endpoint, and a third time as a dependency. Per the rule, the call belongs to `invoices`; payment references it by URL but does not re-document it. Pick option (b) above: collapse capability 1 to one line in "What it is" (or fold into capability 2's "this list takes the invoice context as input"), drop the API-endpoints section for `GET /invoices/{invoiceId}` to a single-line reference + fixture pointer. Net result: 6 capabilities, 2 endpoints, no scope overlap with `invoices`.
2. **Complete capability 7 inputs** (🟡, ~2 min). Add `cancel` (from the resolved context) alongside `approval_url`. Optional: a one-liner in the Constraints list under the flow that the cancel URL is push-state-seeded before the form submits, so a back-button click lands on the cancel route the caller chose.
3. **Type-vs-fixture footnote on `Gateway.is_stored`** (🟡, ~2 min). Either add a comment to the `Gateway` block ("typed as `string` in `IGateway`; runtime returns `boolean`") or note in the Lessons that the gateway-record contract lags the runtime shape — same pattern flagged in basket / brand docs for `region_id`, `email_logo`, etc.

---

## Appendix A: Source-of-truth references

| File | Lines consulted |
| --- | --- |
| `packages/headless/src/modules/payment/usePayment.ts` | 1–185 |
| `packages/headless/src/modules/payment/services.ts` | 1–218 |
| `packages/headless/src/modules/payment/payment.machine.ts` | 1–320 |
| `packages/headless/src/modules/payment/types.ts` | 1–77 |
| `packages/headless/src/modules/payment/mappers.ts` | 1–60 |
| `packages/headless/src/modules/payment/index.ts` | 1–3 |
| `packages/types/src/models/gateways.ts` | 1–96 |
| `tests/__fixtures__/recordings/post-payments.json` | 1–22 |
| `tests/__fixtures__/recordings/get-brands-…-gateways-2d2b5513.json` | 1–100, 2300–2302 |
| `graphify-out/graph.json` (cross-module edges) | grep filtered for `modules/payment` ↔ siblings |
| `.agent/rules/docs-modules.md` | 1–411 (canonical rule) |
| `packages/headless/src/modules/basket/docs/foundation.md` | 1–120 (95+ reference) |

## Appendix B: Verbatim evidence

- Capability 1 + API endpoint duplication, lines 23 + 238–247:
  > "**Read an invoice with payment context** | `invoiceId` | The invoice record hydrated with the relations needed to attempt payment…"
  > "### `GET /invoices/{invoiceId}` — Read the invoice the payment is being attempted against."

- Capability 7 input column, line 29:
  > "Inputs: the `approval_url` from a `PaymentAttempt`"
  (missing `cancel`, per `services.ts:182`)

- `is_stored` typed as `string` in `IGateway`, candidate documents it as `boolean`:
  > Candidate line 109: `is_stored: boolean; // gateway supports stored payment details`
  > `packages/types/src/models/gateways.ts:53`: `is_stored: string;`

## Appendix C: Files reviewed

- `.agent/rules/docs-modules.md`
- `.agent/workflows/docs-module-review.md`
- `packages/headless/src/modules/payment/docs/foundation.md` (candidate)
- `packages/headless/src/modules/payment/{usePayment,services,payment.machine,types,mappers,index}.ts`
- `packages/types/src/models/gateways.ts`
- `tests/__fixtures__/recordings/post-payments.json`
- `tests/__fixtures__/recordings/get-brands-47d73824-8507-9315-e54f-81e642d59e06-gateways-2d2b5513.json`
- `graphify-out/graph.json`
- `packages/headless/src/modules/basket/docs/foundation.md` (95+ reference)

## Appendix D: Strip-audit exhaustive list

Greps run; no hits in any forbidden-pattern family. Doc is strip-clean.
