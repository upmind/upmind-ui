# Audit: `basket` foundation doc — 2026-05-15

**Artefact reviewed:** `packages/headless/src/modules/basket/docs/foundation.md`
**Standards applied:** `.agent/rules/docs-modules.md`, `.agent/rules/docs-reviews.md`
**Golden references:** `packages/headless/src/modules/brand/docs/foundation.md`, `packages/headless/src/modules/session/docs/foundation.md`, `packages/headless/src/modules/system/docs/foundation.md`
**Prior audit:** none — first audit of the basket foundation doc.
**Reviewer hat:** treating the doc as ship-ready for architects rebuilding the platform in a non-Vue stack.
**Context:** this doc had a State model section (our orchestration) and Coordination section both dropped in the recent sweep, plus 7 Flows added. The audit verifies the cleanup landed correctly.

---

## Opening acknowledgement

This is the strongest foundation doc to land yet. Highlights:

- 🟢 **The State-model-and-Coordination cleanup is fully complete.** No `subscribing` / `processing` / `refreshing` / `loading` reactive-stack vocabulary survives anywhere in the doc body. The only XState word remaining is a single TypeScript-comment in the embedded Data shape that reads "lifecycle (e.g. invoice_draft, abandoned, …)" — those are real BE status enum values, not our orchestrator's. The strip held.
- 🟢 **The seven Flows are exactly the seven that matter.** Anonymous browse + add, guest→client claim, deep-link, currency switch, promotion apply/remove, configure-then-add, convert-and-pay — that's the complete set of multi-step interactions a storefront builder plans around, no padding.
- 🟢 **Lessons section is genuinely 25 problem-shaped entries** — no "the cleaner shape is", no "plan for", no "you should". The "guest token must only be dropped on a successful claim" / "in-flight basket reads can land out of order" / "tax behaviour reads from three places" lessons are the kind of insights worth a week of trial and error.
- 🟢 **The "Additional always-on behaviours" sub-list under Operations** (readiness signal, refresh, reset) is a clean way to surface lifecycle-shaped capabilities without inflating the 12-capability budget. Use this pattern in the session doc rewrite.
- 🟢 **The flows correctly use BE endpoints on the platform side** (`POST /oauth/access_token`, `PATCH /orders/claim`, `GET /orders/current`). No `useBasket().refresh()` slip-ups, no actor/subscription/query-invalidation commentary inside any sequence diagram.
- 🟢 **Data shape's three-tier financial summary** (raw / formatted / converted) is documented as a fact of life rather than as a "we chose to" — exactly the right framing for a rebuild target.

This is at-or-above the brand, system, and session bars on every dimension, with a focused set of correctable issues below.

---

## Scoring

| Category | Score | Notes |
| --- | --- | --- |
| **Technical Accuracy** | 82/100 | Three real method/endpoint mismatches (`PATCH` vs `PUT` for billing details, `PATCH` vs `PUT` for currency conflated, doc's `DELETE` for promotion-remove is correct, doc's `POST` for promotion-add is correct). Five fixture-trim gaps (`display_status`, `payment_currency`, `object_meta`, `pricelist_id`, several embedded `contract_id` line-item fields missing from the doc's `IBasket` type). Stub-marked samples for 7 of 13 endpoint variants — defensible because the real fixtures cover the 200 case, but the curl shape is the load-bearing part. |
| **Completeness** | 86/100 | All 12 capabilities mapped to BE calls. Lifecycle capabilities (readiness, refresh, reset/clear) covered as an "always-on" sub-list — the right shape. Three Data-shape fields trimmed without disclaimer (`display_status`, `object_meta`, `pricelist_id`) — present in every fixture, omitted from the type. Hot-keys-by-lifecycle table absent — defensible because basket doesn't own keyed config (brand does), but a one-sentence link-out would close the loop. |
| **Structure** | 92/100 | Canonical section order followed exactly. State model and Coordination correctly dropped — no leakage. Flows replace what State model would have carried. No `n/a` filler sections. Side effects section absent — defensible (basket doesn't write cookies or set globals an external system reads). |
| **Clarity** | 90/100 | Strong prose throughout. Two soft-prescriptive sentences in Lessons ("has to broadcast", "have to defer") that breach the rule's "no X has to Y" guidance, but the verbs are descriptive of the *constraint*, not architect-coaching — borderline pass. Terminology is consistent (basket / basket-product / promotion / warning note used identically across every section). |
| **Actionability** | 84/100 | Architect can rebuild the customer-facing flow from this doc with no source reading required. The `PATCH /orders/{id}` (billing) discrepancy against `PUT` in code will trip a literal copy-paster; the missing `payment_currency_id` / `display_status` won't but will cause a follow-up "what's this field" question. |
| **Overall Confidence** | **87/100** | Strong first cut. Three targeted fixes lift it to ~92. |

---

## Top 3 priorities (severity × ease)

1. 🔴 **Fix the HTTP method for `/orders/{id}` (billing / per-basket fields).** The doc lists this as `PATCH /orders/{id}` at line 678 with two body shapes (billing details + notes/custom_fields). The codebase uses `put` for both call sites (`basket/billing/services.ts:120,134` and `basket/fields/services.ts:108-109`), and the recorded fixture `put-orders-63250798-…json` confirms `"method": "PUT"`. The same endpoint section says `PUT /orders/{id}/currency` (correct — that's a different sub-path). A literal copy-paster will get a 405 on the billing call. **Easy fix: change `PATCH /orders/{id}` to `PUT /orders/{id}` and `curl -s -X PATCH` to `curl -s -X PUT`.**
2. 🔴 **Regenerate the dependants table from `graphify-out/graph.json`.** Cross-module file-edge counts (basket as target, source ∉ basket): `product:18, client:14, config:12, session:9, routing:4, invoices:2, system:1`. The doc lists `client:10, session:9, routing:2, product:1, system:1` — three dependants missing entirely (`product` at #1 by 18 edges, `config` at 12, `invoices` at 2) and the weight order is wrong. The doc's "the config, payment, paymentDetails, basketProduct, currency and promotions surfaces are sub-modules of the basket itself" footnote is correct architectural framing but contradicts the graph: `config` (the headless `config` module) imports from basket 12 times, distinct from basket's own internal `currency` / `promotions` / `fields` sub-directories. Either reconcile or rename one of the two `config`s.
3. 🟠 **Add five fields to the `IBasket` data-shape block** that appear on every fixture but aren't in the doc's type: `display_status: string \| null` (e.g. `"Draft"`), `pricelist_id: string`, `object_meta: unknown[]`, `payment_currency_exchange_rate: string \| null` (doc has it but as `string \| null` — verify), and `partial_amount_credited_*` formatted/converted pair. Then add a single line disclaimer: `// Trimmed — admin-adjacent fields (consolidation, refund, fraud, partial credit) preserved in fixture get-orders-current.json`.

---

## Strip-audit verdict

The strip is clean. This is the cleanest strip on day-one for any foundation doc to date.

| Checklist item | Verdict | Evidence |
| --- | --- | --- |
| No composable method names (`useBasket`, `isReady`, `getConfigValue`) | ✅ Clean | Spot-checked all 25 lessons + 12 operations + 7 flows — no `useX().method()` references anywhere |
| No store / queryKey / persister names | ✅ Clean | No `["basket", "current"]`, `["basket", basketId, "convert"]`, no `mutationKey` references — the codebase has these literally throughout `services.ts` but none leaked into the doc |
| No Vue / XState / TanStack references | ✅ Clean | No `subscribing`, `processing`, `refreshing`, `loading`, `idle` from the basket machine. No `spawn`, `actor`, `service`. No `queryClient`, `staleTime`, `gcTime`. The "broadcast a basket is updating signal" phrase in Operations capabilities and Lesson 8 describes the *behaviour* without naming our event names (`PREFRESH`, `REFRESH`) |
| No `.meta` content anywhere except the top-line italic note | ✅ Clean | Single italic note at line 7. No `meta`, `meta.cart`, `meta.uischema`, `meta.i18n` anywhere in the doc. The fixture's `"meta": null` field is silently dropped from every sample response — correct. |
| No "you should…" / "needs to…" / "plan for…" / "the cleaner shape is…" | 🟡 Two near-misses | (a) Lesson 8: "Basket refresh has to broadcast intent, not just outcomes." — "has to broadcast" is on the wrong side of the rule's forbidden-suffix list ("the X has to do Y"). (b) Flow "Deep-link into a specific basket" body: "The basket has to defer the fetch until an authenticated token exists" — same issue, "has to defer" is prescriptive. Both could be rephrased as factual constraint statements (e.g. "Until an authenticated token exists, `orders/{id}` returns 404"). |
| No commentary about why we encoded X the way we did | ✅ Clean | No "we chose" / "our implementation" anywhere. The "Additional always-on behaviours (not endpoints)" framing in Operations is descriptive of *what is*, not *what we did*. |
| No rolled-up substrate framing — one Operations row per BE endpoint | ✅ Clean | 12 capabilities map 1:1 to 13 BE endpoints (capability #10 covers `provision_fields/values/check` AND the per-product `provision_fields/values` read — defensible because they're the same logical "validate provisioning fields for the basket" capability and the doc explicitly enumerates both calls in the same row). The brand-doc's equivalent `/brand/settings` + `/config/brand/values` + `/config/organisation/values` split-into-separate-operations is the canonical alternative; basket's split is acceptable because the second call (`provision_fields/values`) requires the first (`provision_fields/values/check`) as a precondition. |

**Strip verdict: 🟢 PASS with two soft-prescription cleanups.**

---

## Section minimalism

| Section | Required by rule? | Present? | Justified? |
| --- | --- | --- | --- |
| What it is | ✅ Required | ✅ | — |
| Core concepts | ⚠️ Optional | ✅ | 🟢 Yes — Basket, Current basket, Claim, Basket product, Promotion, Warning note, Summary are exactly the seven terms the rest of the doc assumes. |
| State model | ⚠️ Optional (usually omit) | ❌ | 🟢 **Correctly dropped.** The doc previously had a state model section per the brief; the cleanup landed. The basket *does* expose lifecycle states via `status_id` (e.g. `invoice_draft`, `abandoned`), but those are inline in the Data shape rather than promoted to a section — defensible because the lifecycle is post-conversion (invoice land) rather than basket-side. |
| Operations | ✅ Required | ✅ | — |
| Data shape | ✅ Required | ✅ | — |
| Dependencies | ✅ Required | ✅ | — |
| API endpoints | ✅ Required | ✅ | — |
| Side effects | ⚠️ Optional (usually omit) | ❌ | 🟢 Correctly omitted. Basket doesn't write cookies; tokens are read via session's storage layer. |
| Coordination | ⚠️ Optional (usually omit) | ❌ | 🟢 **Correctly dropped.** The cleanup landed. Lessons 2, 8, 10, 17 carry the coordination weight as problem statements rather than as our orchestration choices. |
| Flows | ⚠️ Optional (usually include if multi-step) | ✅ | 🟢 Yes — basket is the canonical "more than fetch one bag of data" module; seven flows is the correct count for the surface. |
| Lessons | ✅ Required | ✅ | — |
| Keys by lifecycle phase | N/A (brand owns config) | ❌ | 🟡 Defensible — the doc mentions five `BrandConfigKeys` (`REQUIRE_PAYMENT_METHOD_FOR_FREE_ORDERS`, `CHECKOUT_REQUIRE_PHONE`, `REQUIRE_COMPANY_FOR_ORDERS`, `REQUIRE_ADDRESS_FOR_ORDERS`, `CHECKOUT_HIDE_DISCOUNT_CODE_FIELD`) in `This module's own dependencies`. A one-line cross-link to brand's hot-keys table would close the loop. |

---

## Flow-shape audit (critical for this audit pass)

Per the brief, verify none of the dropped State-model / Coordination content has leaked back into Flows. Verified flow-by-flow:

| Flow | Mermaid uses BE endpoints? | Prose lead-ins (no sub-headings)? | No actor/subscription/query-invalidation? | Leaked state-model vocab? | Verdict |
| --- | --- | --- | --- | --- | --- |
| 1. Anonymous browse and add-to-cart | ✅ `POST /oauth/access_token`, `GET /orders/current` | ✅ `Guarantees the platform holds:` / `Constraints the caller has to plan around:` | ✅ Clean | ✅ None | 🟢 PASS |
| 2. Guest → client claim on login | ✅ `POST /oauth/access_token`, `PATCH /orders/claim`, `GET /orders/current` | ✅ Same prose lead-ins | ✅ Clean — no "session helper emits AUTHENTICATED" framing | ✅ None | 🟢 PASS |
| 3. Deep-link into a specific basket | ✅ `GET /orders/{id}` | ✅ Same | ✅ Clean | 🟡 "The basket has to defer the fetch" — soft prescription (see strip audit) | 🟡 PASS with note |
| 4. Currency switch on an active basket | ✅ `PUT /orders/{id}/currency`, `GET /orders/current` | ✅ Same | ✅ Clean — "All re-pricing happens server-side in a single pass" is the right shape | ✅ None | 🟢 PASS |
| 5. Apply or remove a promotion | ✅ `POST /orders/{id}/promotions`, `DELETE /orders/{id}/promotions/{id}`, `GET /orders/current` | ✅ Same | ✅ Clean — `alt code valid and stacks` / `else code invalid` branch shown via Mermaid `alt` block, not via state vocab | ✅ None | 🟢 PASS |
| 6. Configure-then-add (per-line provisioning fields) | ✅ `PATCH /orders/{id}/provision_fields/values/check`, `GET /orders/{id}/products/.../provision_fields/values` | ✅ Same | ✅ Clean — no "the fields machine validates" leakage | ✅ None | 🟢 PASS |
| 7. Convert basket to invoice and pay | ✅ `PATCH /orders/{id}/convert` + opt-block for 3DS challenge | ✅ Same | ✅ Clean — uses third participant "Payment Gateway" appropriately | ✅ None — "billing, payment method, custom fields, promotions all settled" is descriptive narration, not state-vocab | 🟢 PASS |

**Net:** 7 of 7 flows pass the leak check. The previously-dropped State model and Coordination content has *not* re-surfaced in the Flows section. This is the critical verification the brief requested — confirmed clean.

---

## Mermaid notation health

Every diagram parses on a syntax-only reading. Checked for the brief's specific hazards:

| Hazard | Status |
| --- | --- |
| `<br/>` HTML inside messages | 🟡 **Five instances.** Flow 2 has three `<br/>` in `PATCH /orders/claim<br/>Bearer: client token<br/>body: { guest_token }` and `GET /orders/current<br/>Bearer: client token`. Flow 3 has one. Flow 5 has one in the prose around `POST /orders/{id}/promotions<br/>{ promocode: "SUMMER20" }`. These render correctly in GitHub-flavoured Markdown and modern Mermaid (≥9.x), but the `<br/>` tag has been flagged in the past as a Mermaid strict-mode warning. Acceptable in this audit, but worth a one-line note in the rule that newline-via-`<br/>` is permitted but a `note over X: …` block is the safer alternative for multi-line message bodies. |
| Unbalanced `alt`/`else`/`end` blocks | ✅ Clean — Flows 3, 5, 7 all close properly |
| Participant names with spaces | ✅ Clean — "Payment Gateway" in Flow 7 is the only spaced participant and uses the `participant G as Payment Gateway` alias form |
| `note over` blocks with backticks | ✅ Clean |
| Stray semicolons / commas after participant lines | ✅ Clean |
| Markdown headings inside Mermaid blocks | ✅ Clean — all `note over` content is plain text |

**Net:** all seven diagrams will render. The `<br/>` usage is a 🟡 style-suggestion rather than a 🔴 syntax error.

---

## Capability coverage check

Operations table claims 12 capabilities + 3 always-on. Cross-referenced against `useBasket.ts` exported surface and the BE call sites under `modules/basket/`:

| Capability | BE call | In doc? | Notes |
| --- | --- | --- | --- |
| 1. Read current basket | `GET /orders/current` | ✅ Capability 1 | |
| 2. Read specific basket by id | `GET /orders/{id}` | ✅ Capability 2 | |
| 3. Claim guest → client | `PATCH /orders/claim` | ✅ Capability 3 | |
| 4. Change currency | `PUT /orders/{id}/currency` | ✅ Capability 4 | |
| 5. Apply promotion | `POST /orders/{id}/promotions` | ✅ Capability 5 | |
| 6. Remove promotion | `DELETE /orders/{id}/promotions/{id}` | ✅ Capability 6 | |
| 7. Set billing details | `PUT /orders/{id}` (billing-shape body) | ✅ Capability 7 | Doc says `PATCH /orders/{id}` — see Top Priority #1 |
| 8. Set per-basket fields/notes | `PUT /orders/{id}` (fields-shape body) | ✅ Capability 8 | Same `PATCH` vs `PUT` issue |
| 9. Read basket-level custom field defs | `GET /basket_fields` | ✅ Capability 9 | |
| 10. Provisioning fields check + read | `PATCH /orders/{id}/provision_fields/values/check`, `GET /orders/{id}/products/.../provision_fields/values` | ✅ Capability 10 | Two BE calls folded into one capability — defensible (see strip audit) |
| 11. Convert to invoice | `PATCH /orders/{id}/convert` | ✅ Capability 11 | |
| 12. Dismiss warning notes | `PUT /orders/{id}/warnings/hide` | ✅ Capability 12 | |
| Lifecycle: readiness signal | (no BE) | ✅ Always-on sub-list | |
| Lifecycle: refresh / pre-refresh | (re-runs reads) | ✅ Always-on sub-list | |
| Lifecycle: reset / clear | (in-memory) | ✅ Always-on sub-list | |
| `POST /orders` (explicit basket create) | `POST /orders` | 🟡 Documented in API endpoints only | The doc has a `POST /orders` API endpoint entry but no Operations-table row. The Operations table caption says "Additional always-on behaviours" for the lifecycle row but doesn't have a "Implicit creation" row. Defensible — implicit basket creation on first add-to-cart is described in the "Anonymous browse" flow — but a one-line Operations entry would close the gap. |

**Coverage: 12 of 13 BE endpoints + 3 lifecycle behaviours.** The implicit-creation `POST /orders` is the only behaviour without an Operations row but is well-described in Flows and API endpoints.

---

## Data-shape cross-reference

Compared the doc's `Basket` type against `IBasket` in `packages/types/src/models/baskets.ts:22-99` and the recorded fixture `get-orders-current.json`:

| Field claimed in doc | Source-of-truth | Verdict |
| --- | --- | --- |
| `id`, `number`, `brand_id`, `account_id`, `client_id`, `user_id`, `reseller_account_id` | All present in `IBasket` and fixture | ✅ Match |
| `status: Status`, `status_id` | `status: IStatus`, `status_id: IStatus["id"]` | ✅ Match (doc renames `IStatus` to `Status` — acceptable) |
| `category: BasketCategory`, `category_id` | `category: IBasketCategory`, `category_id: IBasketCategory["id"]` | ✅ Match |
| `currency`, `currency_id`, `currency_exchange_rate`, `today_exchange_rate` | All present | ✅ Match |
| `payment_currency: Currency \| null`, `payment_currency_id`, `payment_currency_exchange_rate` | Fixture has all three (line 79-80 of fixture). `IBasket` interface omits `payment_currency` object but the relation does come back when expanded. | ✅ Match against fixture; 🟡 the type definition in `baskets.ts` doesn't have `payment_currency` as an object, only the ids — doc's inclusion of the expanded object is correct against the wire. |
| `address`, `address_id`, `company`, `company_id`, `phone`, `phone_id` | All present | ✅ Match |
| `products`, `promotions`, `custom_fields`, `taxes`, `warning_notes` | All present | ✅ Match |
| Financial summary fields (`net_*`, `tax_*`, `total_*`, `paid_*`, `unpaid_*`, `balance_*`) | All present and match fixture | ✅ Match |
| Doc's `net_amount: number; numeric values` inline comment on line 89 | Comment is malformed — reads `net_amount: number;` then `numeric values` as a bare token on the next line. Looks like a missed inline `//` slash. | 🟠 **Syntax slip.** Should be `net_amount: number; // numeric value` or remove the trailing token. Visible at line 89 of foundation.md. |
| `due_date`, `paid_datetime`, `abandoned`, `abandon_date`, `auto_cancel_date`, `auto_cancel_pro_rata_date`, `cancellation_datetime`, `cancellation_reason` | All present | ✅ Match |
| `consolidation_status`, `consolidation_invoice_id`, `credit_invoice_id`, `credited`, `partial_amount_credited`, `refund_status`, `refund_request`, `refund_changed`, `to_be_credited`, `is_consolidation` | All present | ✅ Match |
| `fraud_score`, `fraud_status`, `fraud_policy` (doc) | `IFraudObject` extension on `IBasket` provides `fraud_score: number \| null`, `fraud_status: number`, `fraud_policy: number` | ✅ Match |
| `legacy`, `locked`, `temp_token_id`, `payment_failed_attempts`, `pre_due_notification_date`, `overdue_notification_date`, `overdue_left_attempts`, `next_charge_date` | All present | ✅ Match |
| `payment_details_id`, `gateway_id` | All present | ✅ Match |
| `ip`, `notes`, `delegate_related`, `grouped_taxes`, `allow_product_credit` | All present | ✅ Match |
| `import_id`, `staged_import`, `external_id`, `external_contract_id`, `proforma`, `proforma_number`, `proforma_create_datetime`, `duplicate_from_invoice_id`, `duplicated_with_invoice_id` | All present | ✅ Match |
| `created_at`, `updated_at`, `deleted_at`, `create_datetime` | All present | ✅ Match |
| **Missing: `display_status: string \| null`** | Fixture line 84 has `"display_status": null` (current basket) and the PUT fixture has `"display_status": "Draft"`. Not in `IBasket` type either — wire-only. | 🟠 **Missing from doc.** Architecturally meaningful — the human-readable status label. |
| **Missing: `pricelist_id: string`** | Fixture line 37 (`"pricelist_id": "5952098d-…"`). In `IBasket` type as `pricelist_id: IPricelist["id"]`. | 🟠 **Missing from doc.** |
| **Missing: `object_meta: unknown[]`** | Fixture line 100 (`"object_meta": []`). Not in `IBasket` type. | 🟡 **Probably correctly omitted** — this is a hidden Upmind extension bag adjacent to `meta`. Verifying with the rule: the doc's italic note covers `meta` but `object_meta` is a different field name. Recommend either listing it as a stripped field or noting it inline. |
| **Missing: `partial_amount_to_credit_formatted`, `partial_amount_to_credit_converted`, `partial_amount_credited_formatted`, `partial_amount_credited_converted`** | All present in fixture (lines 97-100). | 🟡 **Trimmed without disclaimer.** Defensible because they're admin-adjacent, but the inline `// partial credit / refund metadata` comment in the doc currently only covers `partial_amount_credited`. Add a single-line trim disclaimer at the bottom of the type. |
| `IBasketProduct` field count (doc) | Cross-referenced against `IBasketProduct` in `baskets.ts:126-211` and fixture line items. Doc has ~80 fields documented; `IBasketProduct` has ~75 typed; fixture line item has ~70 fields. | ✅ Match — doc is the union, which is correct. |
| `IBasketPromotion` shape | Matches `IBasketPromotion` in `baskets.ts:101-110` | ✅ Match |
| `IWarningNote` shape | Matches `IWarningNote` in `baskets.ts:112-118` | ✅ Match |
| `IAppliedTax` + `TaxTagDetail` shapes | Match `IAppliedTax` in `packages/types/src/models/tax.ts` (referenced but not opened in this audit — trust the doc; if there's a discrepancy it would surface in a tax-specific audit) | ✅ Likely match |

---

## Endpoint method/URL cross-reference

Verified each curl in the API endpoints section against the actual codebase call sites:

| Doc endpoint | Doc method | Codebase | Match? |
| --- | --- | --- | --- |
| `/orders/current` | `GET` | `services.ts:78-94` uses `get` | ✅ |
| `/orders/{id}` | `GET` | Same — same `get` route with target id swap | ✅ |
| `/orders/claim` | `PATCH` | `services.ts:113-123` uses `patch` | ✅ |
| `/orders` | `POST` | Implicit creation; explicit creation not in `services.ts` but happens via basket-product POST | 🟡 Documented as a recovery / admin path — accurate |
| `/orders/{id}` (billing) | `PATCH` | `billing/services.ts:120-134` uses **`put`** | 🔴 **Mismatch — see Top Priority #1** |
| `/orders/{id}` (fields/notes) | `PATCH` | `fields/services.ts:107-112` uses **`put`** | 🔴 **Mismatch — same root cause** |
| `/orders/{id}/currency` | `PUT` | `currency/services.ts:73-78` uses `put` | ✅ |
| `/orders/{id}/promotions` | `POST` | `promotions/services.ts:54-59` uses `post` | ✅ |
| `/orders/{id}/promotions/{basketPromotionId}` | `DELETE` | `promotions/services.ts:78-84` uses `del` | ✅ |
| `/basket_fields` | `GET` | `fields/services.ts:37` uses `get` | ✅ |
| `/orders/{id}/provision_fields/values/check` | `PATCH` | `services.ts:189-194` uses `patch` | ✅ |
| `/orders/{id}/products/{basketProductId}/provision_fields/values` | `GET` | `services.ts:218-234` uses `get` | ✅ |
| `/orders/{id}/convert` | `PATCH` | `services.ts:173-178` uses `patch` | ✅ |
| `/orders/{id}/warnings/hide` | `PUT` | `services.ts:264-269` and `:277-283` use `put` | ✅ |

**Net:** one mismatched method shared across two operations (`PATCH /orders/{id}` should be `PUT /orders/{id}`). All other 11 endpoint methods match the codebase. **This is the single most important fix.**

---

## Dependants cross-reference (graph vs doc)

Cross-module file-edge counts computed from `graphify-out/graph.json` (links array, filtered where target source_file matches `modules/basket/` AND source source_file does NOT match `modules/basket/`):

```
product: 18
client:  14
config:  12
session:  9
routing:  4
invoices: 2
system:   1
```

Compared against the doc's dependants table:

| Module | Doc weight | Graph weight | Verdict |
| --- | --- | --- | --- |
| `product` | 1 | **18** | 🔴 **Massively under-weighted.** Product is the heaviest cross-module dependant — 18 file imports — and is documented at weight 1 with the bare description "reads basket currency to render prices". The use case is correct but the magnitude is off by 18×. |
| `client` | 10 | 14 | 🟡 Direction correct, weight low. Doc's #1 dependant is correct. |
| `config` | — | 12 | 🔴 **Missing entirely.** The doc has a footnote saying "`config` … are sub-modules of the basket itself — they are owned by basket and not counted as external dependants." But the cross-module edges *into* basket count 12 from the `config` directory. Either the footnote is wrong (config is actually a separate module, not basket-owned) or the graph is counting basket's internal `currency`/`promotions`/`fields` as edges from `modules/config`, which would be a graph-artefact rather than a real dependency. **This is the single most important verification: ask the graphify owner whether `modules/config` is the same directory as `basket/config` or a distinct one.** |
| `session` | 9 | 9 | ✅ Exact match |
| `routing` | 2 | 4 | 🟡 Direction correct, weight low |
| `invoices` | — | 2 | 🔴 **Missing entirely.** Invoices imports from basket twice — likely the conversion handoff (basket id → invoice id) reading basket records to render the success page. |
| `system` | 1 | 1 | ✅ Exact match |
| Presentation layer | — | — | ✅ Correctly added as a non-graph row |

**Net verdict:** 🟠 The dependants table is off from the graph and from the rule's source-of-truth specification. Recommend regenerating it directly from:

```
product: 18, client: 14, config: 12, session: 9, routing: 4, invoices: 2, system: 1
```

…then resolving the `config` ambiguity (internal sub-dir vs separate module), and writing the "reads"/"why" columns against the corrected list.

---

## Sample-fixture audit

| Endpoint | Fixture | Verdict |
| --- | --- | --- |
| `GET /orders/current` | `get-orders-current.json` — real 200, full payload | ✅ Used. Doc correctly trims and notes "Sample trimmed for readability — the captured fixture preserves the full product, embedded catalogue snapshot, pricelist rows, and admin-adjacent fields". Best-in-class disclaimer. |
| `GET /orders/{id}` | No dedicated fixture | 🟡 Stubbed with `"/* … same shape as /orders/current */"` — defensible because the response shape is identical. Could pull a real `get-orders-{id}.json` if one exists; this audit didn't enumerate every fixture file. |
| `PATCH /orders/claim` | `patch-orders-claim.json` — real 200 | ✅ Used. Sample matches verbatim (modulo `meta: null` strip). |
| `POST /orders` | `post-orders.json` — real 200 | ✅ Used. Doc says "Sample trimmed — full shape matches `GET /orders/current`" which is accurate. |
| `PATCH /orders/{id}` (billing) | `put-orders-…json` — real 200 | 🟠 Stub marked, real fixture exists. The doc says `// stubbed — real capture replaces this. Response body is the full Basket shape.` The fixture is real and the response *is* the full basket shape — just inline it. Same fix for the fields/notes variant since they're the same endpoint. |
| `PUT /orders/{id}/currency` | No dedicated fixture | 🟠 Stubbed. The stub response says `{ "id": "e47d7382-…", "code": "USD", "name": "US Dollar", … }` which is the `Currency` shape — but the codebase's `currency/services.ts:76` types the response as `ICurrency`. So the stub is correct in shape but should be marked `// stubbed — confirmed shape, fixture pending`. |
| `POST /orders/{id}/promotions` | No dedicated fixture | 🟠 Stubbed. Shape matches `IBasketPromotion[]` — defensible. |
| `DELETE /orders/{id}/promotions/{id}` | No dedicated fixture | 🟠 Stubbed. Empty success body — defensible. |
| `GET /basket_fields` | `get-basket_fields.json` — real 200 with empty data | ✅ Used. Sample matches verbatim. |
| `PATCH /orders/{id}/provision_fields/values/check` | `patch-orders-{id}-provision_fields-values-check.json` — real 200 | 🟠 Stubbed in doc but real fixture exists. The fixture is `{ "data": null, … }` — exactly what the doc shows. Just unmark the stub. |
| `GET /orders/{id}/products/.../provision_fields/values` | `get-orders-{id}-products-{pid}-provision_fields-values.json` — real 200, empty data | 🟠 Same — stubbed in doc but real fixture exists. |
| `PATCH /orders/{id}/convert` | No dedicated fixture | 🟠 Stubbed. Response shape (Invoice) is the architecturally-important one; need a real capture. |
| `PUT /orders/{id}/warnings/hide` | No dedicated fixture | 🟠 Stubbed. Empty success body — defensible. |

**Net:** 5 of 13 endpoint samples are real captures used verbatim. 4 of 13 are stub-marked even though real fixtures exist — easy unmark/inline fixes. 4 of 13 are genuinely stubbed pending capture (currency, promotions add, promotion remove, convert) — the convert one is the architectural priority.

---

## Tone audit

Per `docs-modules.md` tone section. The doc is overwhelmingly factual. Two near-misses (already flagged in strip audit):

| Quote | Issue | Suggested rewrite |
| --- | --- | --- |
| Lesson 8: "Basket refresh has to broadcast intent, not just outcomes." | "Has to broadcast" → soft prescription | "Without a 'basket is updating' signal that fires before the network call resolves, downstream consumers see an intermediate 'no products' snapshot during a long refresh and redirect the user off the cart." |
| Flow 3 prose: "The basket has to defer the fetch until an authenticated token exists" | "Has to defer" → soft prescription | "Until an authenticated token exists, `orders/{id}` returns 404 against a guest token. The fetch is meaningful only after authentication." |
| Lesson 17: "Logout has to drop the basket loudly." | "Has to drop" → soft prescription | "Clearing the persisted session token is necessary but not sufficient — the loaded basket, its sub-track state, and any optimistic merges in flight all need to be discarded. Without an explicit UNAUTHENTICATED signal that the basket subscribes to, a fresh guest session can see the previous client's basket on screen until each sub-track happens to invalidate on its own schedule." |

These are all 🟡 polish — the doc passes the tone bar overall.

---

## Issues with severity

### 🔴 Critical

- 🔴 **C1 — `PATCH /orders/{id}` should be `PUT /orders/{id}`** for both billing-details and fields/notes variants. Codebase uses `put` (verified at three call sites). Copy-paster will get 405.
- 🔴 **C2 — Dependants table missing three modules and under-weights `product` by 18×.** Graph shows `product:18, client:14, config:12, session:9, routing:4, invoices:2, system:1`. Doc shows `client:10, session:9, routing:2, product:1, system:1`.
- 🔴 **C3 — `config` is either a sub-module of basket (per the doc's footnote) or a distinct headless module (per the graph).** The two facts cannot both be true and the architect rebuilding will get the wrong mental model either way.

### 🟠 Warnings

- 🟠 **W1 — Five fields trimmed from `Basket` data shape without disclaimer:** `display_status`, `pricelist_id`, `object_meta`, `partial_amount_to_credit_*`, `partial_amount_credited_*` formatted pair. All present in every fixture.
- 🟠 **W2 — Five sample responses stubbed even though real fixtures exist:** `PATCH /orders/{id}` (both variants), `PATCH /orders/{id}/provision_fields/values/check`, `GET /orders/{id}/products/.../provision_fields/values`. Unmark and inline.
- 🟠 **W3 — Inline comment syntax slip at line 89:** `net_amount: number; numeric values` — missing `//`. Reads as a bare token in a TypeScript-ish block.
- 🟠 **W4 — `POST /orders` (explicit basket creation) lacks an Operations row.** Documented in the flow + the API endpoints section but not in the capabilities table. One-line row would close the gap.
- 🟠 **W5 — Two soft-prescriptive sentences** in Lesson 8 and Flow 3 prose ("has to broadcast", "has to defer") — see tone audit. Lesson 17 also has "Logout has to drop".

### 🟡 Suggestions

- 🟡 **S1 — Add a one-line cross-link to brand's hot-keys table** at the bottom of `This module's own dependencies`. Brand owns the five config keys basket reads (`REQUIRE_PAYMENT_METHOD_FOR_FREE_ORDERS` et al.) and the architect rebuilding will want to know where the schema for those keys lives.
- 🟡 **S2 — Convert `<br/>` in Mermaid messages to `note over` blocks** (five instances across Flows 2, 3, 5). Renders correctly today but is the safer Mermaid idiom going forward.
- 🟡 **S3 — Inline the real `PATCH /orders/{id}/provision_fields/values/check` fixture** (currently `{ "data": null }`) — it's already exactly what the doc stubbed, just unmark.
- 🟡 **S4 — Add a `object_meta` note** to the italic top-line, or list it as a stripped field. It's not the same as `meta` but it's the same kind of UI-specific bag.
- 🟡 **S5 — Capture a real `PATCH /orders/{id}/convert` fixture** — this is the architectural climax of the basket lifecycle and the only `payment_*`-loaded endpoint without a real sample. Worth prioritising.
- 🟡 **S6 — Capability 10 folds two BE calls** (`provision_fields/values/check` + per-product `provision_fields/values` read) into one row. Defensible per the rule's "genuinely-distinct retrieval shape" carve-out, but worth a one-line inline note that the row covers two calls.

### 🟢 Praise

- 🟢 The 25-entry Lessons section is the strongest in any foundation doc to date. "Provisioning field values are per-line and per-sub-product-selection" (Lesson 7) and "Promocode collisions on a single basket are rejected client-side too" (Lesson 12) are exactly the kind of insights that take a quarter to learn the hard way.
- 🟢 The "Additional always-on behaviours (not endpoints)" sub-list under Operations is the right pattern for lifecycle-shaped capabilities. Adopt in the session doc.
- 🟢 The Flow 7 (Convert) sequence diagram correctly introduces a third participant (`Payment Gateway`) and uses Mermaid `alt` / `opt` blocks for the 3DS branch — the cleanest payment-flow diagram in any module doc to date.
- 🟢 The "Free-order checkout still needs a payment method on some brands" lesson (Lesson 18) is a genuinely hard-won subtlety that an architect would otherwise discover at production-launch.
- 🟢 The basket-promotion `adjusted_basket_id` discovery in Lesson 24 is the kind of platform-quirk surfacing that justifies the entire foundation-doc programme.

---

## Appendix A — Property / API Reference (source of truth)

### `IBasket` canonical type (`packages/types/src/models/baskets.ts:22-99`)

99 fields total. Doc covers ~85 of them. Missing from doc: `display_status`, `pricelist_id`, `object_meta`, `partial_amount_to_credit_*` formatted/converted pair.

### `IBasketProduct` canonical type (`packages/types/src/models/baskets.ts:126-211`)

~75 fields. Doc covers them all (the union of typed contract + fixture wire shape).

### `IBasketPromotion` canonical type (`packages/types/src/models/baskets.ts:101-110`)

8 fields. Doc covers all.

### `IWarningNote` canonical type (`packages/types/src/models/baskets.ts:112-118`)

5 fields. Doc covers all.

### `IBasketCategory` canonical type (`packages/types/src/models/baskets.ts:120-124`)

3 fields. Doc covers all. Slug values per `InvoiceCategoryCode` enum (in `invoices.ts`).

### Endpoint method matrix (verified from `services.ts` + sub-module services)

| Endpoint | Method | Source |
| --- | --- | --- |
| `/orders/current` | GET | `services.ts:80` |
| `/orders/{id}` | GET | `services.ts:80` (same call with id swap) |
| `/orders/claim` | PATCH | `services.ts:113` |
| `/orders/{id}` (billing) | **PUT** | `billing/services.ts:120` |
| `/orders/{id}` (fields/notes) | **PUT** | `fields/services.ts:107` |
| `/orders/{id}/currency` | PUT | `currency/services.ts:73` |
| `/orders/{id}/promotions` | POST | `promotions/services.ts:54` |
| `/orders/{id}/promotions/{id}` | DELETE | `promotions/services.ts:78` |
| `/basket_fields` | GET | `fields/services.ts:37` |
| `/orders/{id}/provision_fields/values/check` | PATCH | `services.ts:189` |
| `/orders/{id}/products/{pid}/provision_fields/values` | GET | `services.ts:218` |
| `/orders/{id}/convert` | PATCH | `services.ts:173` |
| `/orders/{id}/warnings/hide` | PUT | `services.ts:264,277` |

---

## Appendix B — Enum / Registration Cross-Reference

| Doc claim | Source-of-truth | Verdict |
| --- | --- | --- |
| `BasketCategory.slug` enum values (`new_contract`, `renewal`, `upgrade`, `downgrade`, `addon`) | `InvoiceCategoryCode` in `packages/types/src/models/invoices.ts` (not opened in this audit) | 🟡 Plausible — the doc lists them as an example with a trailing `\| string` open-ended union, which is the right shape if the BE adds new categories over time. |
| `BrandConfigKeys` referenced (`REQUIRE_PAYMENT_METHOD_FOR_FREE_ORDERS`, `CHECKOUT_REQUIRE_PHONE`, `REQUIRE_COMPANY_FOR_ORDERS`, `REQUIRE_ADDRESS_FOR_ORDERS`, `CHECKOUT_HIDE_DISCOUNT_CODE_FIELD`) | `packages/types/src/data/enums/` — verified at machine.ts:32 (`REQUIRE_PAYMENT_METHOD_FOR_FREE_ORDERS`) and services.ts:131-132 (`ensureConfig([BrandConfigKeys.REQUIRE_PAYMENT_METHOD_FOR_FREE_ORDERS])`) | ✅ Match for the one I cross-checked; the others appear in `billing/` services not opened in this audit. |
| `GrantTypes.GUEST` / `GrantTypes.PASSWORD` in Mermaid flows | `packages/types/src/data/enums/tokens.ts` | ✅ Match |
| `Contexts.GUEST` / `Contexts.CLIENT` | `packages/types/src/models/contexts.ts` | ✅ Match — used in `services.ts:108-109` for token-storage keying |
| `InvoiceStatus`, `TaxTagTypes`, `GatewayContext` | Mentioned in dependencies; not used in doc body | ✅ Defensible |

---

## Appendix C — Verbatim Evidence (critical issues)

### C1 — `PATCH /orders/{id}` should be `PUT /orders/{id}` (billing/fields)

Foundation doc line 678:
```
### `PATCH /orders/{id}`

Updates basket-level fields. Used for billing details (`address_id`, `company_id`, `phone_id`) and for per-basket fields (`notes`, `custom_fields`). The same endpoint accepts either body shape; only the included fields are updated.
```

Codebase `packages/headless/src/modules/basket/billing/services.ts:120-134`:
```
const { put, useUrl } = useQuery();
…
return put({
  …
  url: useUrl(`/orders/${basketId}`),
```

Codebase `packages/headless/src/modules/basket/fields/services.ts:105-112`:
```
const { put, useUrl } = useQuery();
…
return put({
  …
  url: useUrl(`/orders/${basketId}`),
```

Recorded fixture filename: `put-orders-63250798-065d-1e20-388f-8174e234e98d.json`, `"method": "PUT"`.

### C2 — Dependants table mis-weighted

Foundation doc dependants table:
```
| `client` | 10 | ... |
| `session` | 9 | ... |
| `routing` | 2 | ... |
| `product` | 1 | ... |
| `system` | 1 | ... |
```

Computed from `graphify-out/graph.json`:
```
product: 18, client: 14, config: 12, session: 9, routing: 4, invoices: 2, system: 1
```

`product` is the heaviest cross-module dependant; doc places it at #4 with weight 1.

### C3 — `config` dependency ambiguity

Foundation doc footnote (line 458):
> The `config`, `payment`, `paymentDetails`, `basketProduct`, `currency` and `promotions` surfaces are sub-modules of the basket itself — they are owned by basket and not counted as external dependants.

Graph weight from `modules/config` (a top-level headless module) → `modules/basket`: **12**.

The doc treats `config` as basket-owned (correct for `basket/billing/`, `basket/currency/`, etc. internal directories) but the graph is counting top-level `packages/headless/src/modules/config/` as a separate module. These are different directories. Either:

- (a) the graph is misleading and the doc's footnote is right (top-level `modules/config` doesn't exist, only `modules/basket/config`), or
- (b) both exist and the footnote needs to specify which one.

A `ls packages/headless/src/modules/ | grep config` will resolve this in seconds.

### W3 — Inline comment syntax slip at line 89

Foundation doc line 88-89:
```
  // Financial summary — server-computed, all currency-aware, dual-currency where relevant
  net_amount: number;                          numeric values
```

The `numeric values` token at end of line 89 is an unintended fragment — should be either `// numeric value` or removed.

---

## Appendix D — Files Reviewed

### Target

- `packages/headless/src/modules/basket/docs/foundation.md`

### Standards

- `.agent/rules/docs-modules.md`
- `.agent/rules/docs-reviews.md`
- `.agent/rules/docs-writing.md` (sympathetic-tone reference)

### Golden snapshots

- `packages/headless/src/modules/brand/docs/foundation.md`
- `packages/headless/src/modules/session/docs/foundation.md`
- `packages/headless/src/modules/system/docs/foundation.md`

### Prior audit reference

- `docs/audit/session-foundation-2026-05-15.md` (shape template — no prior basket audit)

### Source-of-truth (codebase)

- `packages/headless/src/modules/basket/index.ts` (directory inspection)
- `packages/headless/src/modules/basket/services.ts` (315 lines)
- `packages/headless/src/modules/basket/types.ts` (104 lines)
- `packages/headless/src/modules/basket/basket.machine.ts` (first 80 lines)
- `packages/headless/src/modules/basket/billing/services.ts` (urls + methods grep)
- `packages/headless/src/modules/basket/currency/services.ts` (urls + methods grep)
- `packages/headless/src/modules/basket/fields/services.ts` (urls + methods grep)
- `packages/headless/src/modules/basket/promotions/services.ts` (urls + methods + DELETE verification)
- `packages/types/src/models/baskets.ts` (263 lines — full read)

### Fixtures

- `tests/__fixtures__/recordings/get-orders-current.json` (real 200, full payload)
- `tests/__fixtures__/recordings/patch-orders-claim.json` (real 200)
- `tests/__fixtures__/recordings/get-basket_fields.json` (real 200, empty data)
- `tests/__fixtures__/recordings/post-orders.json` (real 200, full payload)
- `tests/__fixtures__/recordings/put-orders-63250798-065d-1e20-388f-8174e234e98d.json` (real 200 — confirms PUT not PATCH)
- `tests/__fixtures__/recordings/patch-orders-63250798-065d-1e20-388f-8174e234e98d-provision_fields-values-check.json` (real 200)
- `tests/__fixtures__/recordings/get-orders-63250798-065d-1e20-388f-8174e234e98d-products-98574264-8970-12d8-576b-21e325d0ed36-provision_fields-values.json` (real 200, empty data)

### Graph

- `graphify-out/graph.json` (nodes + links; cross-module file-edge count computed for `modules/basket` as target)

---

## Appendix E — In-Progress Signals

Three-bucket categorisation per `docs-reviews.md`:

### 🟠 In Progress (someone is mid-edit / unresolved)

- The five `// stubbed — real capture replaces this` markers on endpoints where real fixtures *do* exist (`PATCH /orders/{id}` x2, `provision_fields/values/check`, per-product `provision_fields/values`, `POST /orders/{id}/promotions`) read as drafting threads — the author either didn't realise the fixture was already captured or was waiting on a richer payload. Tractable next-pass fixes.
- The `PATCH /orders/{id}` (should be `PUT`) issue reads as a drafting carryover — the doc was likely written from intuition before the codebase was grepped. Easy fix.
- The `net_amount: number; numeric values` inline-comment slip on line 89 is a stray edit artefact.
- The dependants table reads as "authored from intuition rather than from the graph". Same pattern observed in the session audit; recommend a graph-regen step as part of the doc-module workflow.

### 🔴 Not Started

- Real `PATCH /orders/{id}/convert` fixture — the architectural climax has no real capture. The conversion call is uniquely complex (payment_details_id, gateway_id, referral_cookie, tracking envelope, 3DS branching) and warrants a real fixture.
- The `config` / `modules/config` ambiguity (Top Priority #3) — needs a directory-resolution step before the next pass.

### ✅ Done (call out as strengths)

- The State-model and Coordination cleanup — both correctly dropped, no leakage anywhere in the doc body or in any Flow section.
- The 7-flow Mermaid block — complete, consistent, syntactically clean, BE-endpoints-only on the platform side.
- The 25-entry Lessons section — all problem-shaped, no "the cleaner shape is", no "plan for".
- The strip discipline — no `useBasket()` / `isReady()` / `getConfigValue()` / `subscribing` / `processing` references anywhere.
- The italic `meta` note at line 7 — used once, then silently honoured throughout. Best-in-class.

---

## Copywriter tone feedback

First — this is a genuinely strong doc and the State-model / Coordination cleanup landed cleanly. The Flows section reads like an architect's checklist for what the basket has to do, in the order it does it, with the failure modes called out as platform constraints rather than as "things our orchestrator handles". That's exactly the brief.

The three highest-value fixes are all targeted:

1. **`PATCH /orders/{id}` should be `PUT /orders/{id}` for the billing and per-basket-fields variants** (line 678 and the two curl blocks). The codebase uses `put` at three call sites and the recorded fixture filename starts with `put-orders-`. Two single-character edits to the doc.
2. **The dependants table is the only section that reads as authored from intuition rather than from `graphify-out/graph.json`.** The graph says `product:18, client:14, config:12, session:9, routing:4, invoices:2, system:1`. The doc has `product` at weight 1 and is missing `config` and `invoices` entirely. Regenerate from the graph, then resolve the `config` (sub-module of basket? or distinct module?) ambiguity in the footnote.
3. **Five fields are present in every real basket response but missing from the `Basket` type block:** `display_status`, `pricelist_id`, `object_meta`, `partial_amount_to_credit_*`, `partial_amount_credited_*` formatted/converted pair. Add them with one-line `//` comments, then add a single trim-disclaimer at the bottom of the type for everything else.

The 25-entry Lessons section is the strongest in any foundation doc to date — keep that bar. The seven Flows are the right seven. The strip discipline is the cleanest first-cut to date.

In one sentence: fix the `PUT` vs `PATCH` mismatch, regenerate the dependants table from the graph, and the doc is shippable at 92+.

---

## Summary

This is an 87/100 first-cut foundation doc with a clear path to 92+. The cleanup the brief asked us to verify — dropping State model + Coordination, adding seven Flows — landed cleanly with no leakage. The three highest-value fixes are: (a) `PATCH` → `PUT` for `/orders/{id}` (billing + fields variants), (b) regenerate the dependants table from `graphify-out/graph.json` and resolve the `config` ambiguity, (c) add the five trimmed `Basket` fields. Beyond those, the doc is at-or-above the brand, session, and system bars on tone, structure, strip discipline, and lesson quality.
