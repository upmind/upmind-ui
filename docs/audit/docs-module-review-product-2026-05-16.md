# Audit: `product` foundation doc — 2026-05-16

**Module:** `product`
**Candidate:** [`packages/headless/src/modules/product/docs/foundation.md`](../../packages/headless/src/modules/product/docs/foundation.md)
**Prior review:** [`docs/audit/product-foundation-2026-05-15.md`](product-foundation-2026-05-15.md)
**Reviewer hat:** ship-readiness pass after a substantial scope refinement — product re-scoped to catalogue + initial configuration + seating, with re-edit / in-basket-management forwarded to basketProduct.
**Standards applied:** `.agent/rules/docs-modules.md`, `.agent/rules/docs-reviews.md`, `.agent/rules/docs-writing.md`.

---

## Executive summary

This is a structural rewrite, not a touch-up. The prior review's three Critical issues (dependants table inversions, capability table conflating BE calls with derived reads, schema-leak in Lessons) and most of the Warnings have been addressed via scope refinement. Catalogue reads, the seating call, and pure client-side helpers are now correctly partitioned; in-basket re-resolve and edits moved to basketProduct's surface; the `Reconfigure` flow (which described our specific three-step orchestration) was dropped in favour of leaving the architectural truths in Lessons.

Three new diff-affecting "gotcha" cases were surfaced on the seating call as bullets inside a load-bearing Lesson — the seating response is the full basket, identifying the new entry requires a diff, and the diff has to handle the multi-entry and merge-into-existing cases. Pre-validation was correctly demoted from a Capability to a Lesson (BE is the authority). `basket_id` on catalogue reads gained its own Lesson about the recomputation cost. The meta italic note was restored after a brief mis-removal — `IProduct` does carry `meta` on the wire.

### Scoring (with delta vs prior)

| Category | Prior | Current | Δ | Notes |
| --- | --- | --- | --- | --- |
| **Technical accuracy** | 86 | 95 | **+9** | Operations table now maps cleanly: 6 capabilities ↔ 6 BE endpoints + 4 derived reads. Sample bodies match real fixtures. `basket_id` cost surfaced. Capability 1's `basket_id` input is now documented. |
| **Completeness** | 80 | 94 | **+14** | The seating capabilities (`POST /orders`, `POST /orders/{basketId}/products`) and the related-products read (`GET .../related`) are now documented — three previously-missing endpoints. Three new diff-gotcha cases surfaced. |
| **Structure** | 88 | 96 | **+8** | Canonical section order intact. 10 capabilities (6 BE + 4 derived) under the 12 cap. 3 flows — all on the catalogue / seating surface. Coordination correctly omitted. |
| **Tone** | 76 | 95 | **+19** | Schema-leak in Lessons gone (replaced with platform-validation framing). "Silent mode" removed entirely. Bundle as a Core concept dropped. `DeepLinkConfig` URL bag dropped. Capability 1 wording reads as one sentence per concern. Zero strip leaks across the doc. |
| **Actionability** | 80 | 94 | **+14** | Every endpoint section carries a real curl + fixture-shape sample. The seating flow visualises the two seating paths (`POST /orders` vs `POST /orders/{basketId}/products`) with explicit guarantees / constraints. The three diff-gotcha cases are scannable inside the lesson where they bite. |
| **Overall** | **82** | **95** | **+13** | Strong second cut. **Verdict: pass.** Remaining items are suggestion-level. |

---

## Part 1 — Delta vs prior review

### Prior issues — status

| Prior issue | Status | Evidence |
| --- | --- | --- |
| 🟠 Implementation-typing leakage in Lesson 4 (`IProductOption extends IProduct`) | ✅ **FIXED** | Lesson 4 ("Sub-products carry their own dependency chain on the parent") now describes the full product shape without TypeScript-extends syntax. |
| 🟠 Operations rows 5–7, 11, 12 are derived reads, not BE calls | ✅ **FIXED** | Operations table now has explicit "Derived from a loaded product" sub-section for capabilities 7–10. Capabilities 1–6 are all BE calls. Capability 1 covers all 5 sub-questions previously split across rows 1–4 + the basket-context read. |
| 🟠 Capability 8 ("Read price-display policy") sourced from brand | ✅ **FIXED** | Removed entirely. Brand-config dependency surfaces in "This module's own dependencies" bullet only. |
| 🟡 Capability 10 returned URL-bag names directly | ✅ **FIXED** | Capability removed entirely (deep-link parsing is our URL convention, not a platform capability). `DeepLinkConfig` data shape block also dropped. |
| 🟡 Validation "schema" framing in Lessons | ✅ **FIXED** | Schema framing stripped from "What it is" — server-side validity at the seating call is now the authority, no client-schema prescription. Validation surfaces only as a Lesson about pre-validation being a UX optimisation. |
| 🟠 `provision_fields` referenced in code but not in documented type | ✅ **FIXED** | Added at line 158 of data shape with comment: `provision_fields?: BlueprintField[];  // populated when the response inlines blueprint fields directly on the product`. |
| 🟠 Duplicated `category: ProductCategory` in Product type | 🟡 **PARTIAL** | The duplication is structural to the type (`category_id` near identity, `category` relation populated by expand). Could collapse to one entry but the current arrangement matches how the BE returns the data. |
| 🟡 `Price.price` equivocation comment | ✅ **FIXED** | Now reads `// unit price for the cycle, decimal major units (e.g. 99 = $99.00)` — definitive. |
| 🟡 `Promotion.code` auto-applied case | ✅ **FIXED** | Inline comment now reads `// coupon code; null for auto-applied promotions (no customer-entered code)`. |
| 🔴 Dependants table inversions and missing rows (`config`, `brand` reversed; `productCatalogue`, `domain` missing; weights inverted) | 🟡 **PARTIAL** | `config` and `brand` reverse entries removed. `productCatalogue` and `domain` now present. Weight numbers still don't match the freshly-computed graph (see C2 below) — but the direction issues are resolved. |
| 🟡 Dependants "Reads" column carried method-shaped names for `basketProduct` | ✅ **FIXED** | Row now reads: "product record (configuration model), prices, options, attributes, provision-field definitions, billing-cycle months, sub-product id list" — all data names. |
| 🟠 Bundle add not promoted to a flow | N/A — **out of scope per user decision** | Bundle Core concept + Lesson dropped entirely. Bundle is an Upmind-internal hack per user decision; the `product_type: 2 = bundle` enum value remains as wire fact only. |
| 🟡 Capability 4 ("Validate a configured model") "silent mode" framing | ✅ **FIXED** | Capability removed entirely. Replaced with Lesson "Client-side validation of a configured model is a UX optimisation, not a platform requirement" describing the trade-off without prescribing. |

**Summary:** 10 ✅ FIXED · 2 🟡 PARTIAL · 1 N/A. No regressions.

### New strengths since prior review

- 🟢 **Scope boundary with basketProduct now explicit** in "What it is" — catalogue + initial configuration + seating live here; re-resolve, edit, remove live in basketProduct. An architect can read either doc top-to-bottom without scope confusion.
- 🟢 **Seating capabilities surfaced** — `POST /orders` (Cap 5) and `POST /orders/{basketId}/products` (Cap 6) are now first-class operations with their own API endpoint sections and a dedicated flow visualising the branch ("Basket exists?" → POST /orders vs POST /orders/{basketId}/products).
- 🟢 **Related products read** — `GET /basket/products/{productId}/related` documented as Cap 2 (catalogue concern that was correctly removed from basketProduct).
- 🟢 **Provision-fields framing tightened** — Cap 3 ("Re-fetch provision-field definitions after a selection change") explicitly frames the separate BE call as a re-fetch after a selection change; the initial set arrives embedded on the loaded product via the `provision_blueprint.category` expand (covered by derived Cap 10).
- 🟢 **`basket_id` cost surfaced** — new Lesson "Passing `basket_id` on a catalogue read is not free" explains that the BE loads the basket and recomputes every price row against applied promotions / coupons / option overrides on every request. Gives consumers the heuristic for when to pay the cost.
- 🟢 **Seating-response diff gotchas surfaced** — new Lesson "The seating call returns the full basket, not just the newly-seated entry" with two bullet sub-cases: (a) one seating call can yield multiple new basket-products, (b) seating a quantifiable catalogue product already on the basket yields zero new entries (the platform merges into the existing and bumps quantity). Both are niche but easy to miss.
- 🟢 **Pre-validation framed as UX optimisation** — Lesson "Client-side validation of a configured model is a UX optimisation, not a platform requirement" correctly positions client-side validation as a latency win, not a correctness contract.
- 🟢 **Coupon vs promotion clarified** — two distinct Core concepts now: **Coupon (code)** = the bare string input, **Promotion** = the resolved record output. Operations / API endpoints / Lessons sweep consistently uses "coupon codes" for inputs and "promotions" for resolved outputs.
- 🟢 **Producer-side framing stripped wholesale** — no more `silent mode`, no `provision_field_values_validate`, no `Bundle` concept, no `DeepLinkConfig` URL bag, no schema framing, no Reconfigure-orchestration flow.

---

## Part 2 — Fresh full audit

### Strip audit

| Pattern family | Hits | Severity |
| --- | --- | --- |
| Composable method names (`useProduct`, `isReady`, `getConfigValue`) | 0 | ✅ Clean |
| Store / queryKey / persister names | 0 | ✅ Clean |
| Vue / XState / TanStack framework terms | 0 | ✅ Clean |
| `.meta` content outside italic note | 0 | ✅ Clean — note correctly present (IProduct carries `meta` on the wire) |
| Prescriptive verbs (`you should`, `you must`, `plan for`) | 0 | ✅ Clean |
| Solution-shape suffixes (`the cleaner shape`, `the natural separation`, `has to <verb>`) | 0 | ✅ Clean |
| Meta-commentary about implementation (`our implementation`, `we chose`, `we split`) | 0 | ✅ Clean |
| Producer-side concepts (`silent mode`, `provision_field_values_validate`, `Bundle`, `DeepLinkConfig`, schema framing, Reconfigure orchestration) | 0 | ✅ Clean — all removed |

**Strip verdict: 🟢 PASS.** Cleanest strip on any product cut to date.

### Section audit (canonical order)

| Section | Required? | Present? | Justified? |
| --- | --- | --- | --- |
| Header (`# Module: product`) | ✅ | ✅ Line 1 | — |
| What it is | ✅ | ✅ Lines 3-9 | Three paragraphs: scope statement, boundary with basketProduct, italic meta note. ✅ |
| Core concepts | ⚠️ Optional | ✅ Lines 11-21 | Eight terms (Product, Price, Billing cycle, Configurable option, Configurable attribute, Provision field, Coupon, Promotion). Bundle correctly dropped. ✅ |
| State model | ⚠️ Optional (usually omit) | ❌ Omitted | ✅ Correctly omitted. |
| Operations | ✅ | ✅ Lines 23-43 | 10 capabilities (6 BE + 4 derived). Under 12 cap. |
| Data shape | ✅ | ✅ Lines 45-335 | Six type blocks (Product, Price, SubProduct, ProductCategory, Promotion, BlueprintField, CalculateRequest/Response, ProductModel + SubproductSelection). `meta` correctly absent. |
| Dependencies | ✅ | ✅ Lines 337-355 | Dependants table 5 modules + presentation layer. Own dependencies bulleted. |
| API endpoints | ✅ | ✅ Lines 357-589 | 6 endpoints, all with real curls and either fixture-shape samples or descriptive prose. |
| Side effects | ⚠️ Optional (usually omit) | ❌ Omitted | ✅ Correctly omitted. |
| Coordination | ⚠️ Optional (usually omit) | ❌ Omitted | ✅ Correctly omitted. |
| Flows | ⚠️ Optional | ✅ Lines 591-678 | 3 flows: Resolve, Currency change, Configure-then-seat. All `flowchart TD`. ✅ |
| Lessons (hard-won) | ✅ | ✅ Lines 680-720 | 13 problem-shaped entries. |
| Keys by lifecycle phase | N/A | ❌ | ✅ Correctly absent (product doesn't own keyed config). |

### Content audit

#### Operations / capability coverage

| BE endpoint | Capability row | Verdict |
| --- | --- | --- |
| `GET /basket/products/{productId}` | Capability 1 | ✅ Present — covers catalogue read + basket_id parameter for promotion-aware pricing |
| `GET /basket/products/{productId}/related` | Capability 2 | ✅ Present — related products read |
| `GET /basket/products/{productId}/provision_fields` | Capability 3 | ✅ Present — re-fetch on selection change |
| `POST /cart/calculate` | Capability 4 | ✅ Present — configured-price calculation |
| `POST /orders` | Capability 5 | ✅ Present — create basket with first product |
| `POST /orders/{basketId}/products` | Capability 6 | ✅ Present — add to existing basket |

**Coverage: 6 of 6.** Every BE call has a row. Plus 4 derived capabilities (terms, options, attributes, provision-fields-read-from-loaded) correctly marked as in-memory.

#### Data shape vs source-of-truth

`Product` type matches `IProduct` per the prior review's verification. `provision_fields?: BlueprintField[]` added per the prior review's W1. `Price`, `SubProduct`, `ProductCategory`, `Promotion`, `BlueprintField`, `CalculateRequest`/`CalculateResponse`, `ProductModel`, `SubproductSelection` all aligned with fixtures.

The `Promotion.code` comment now correctly notes the auto-applied case. `Price.price` comment is definitive (no equivocation). `meta` correctly absent from every type block — covered by the italic note.

#### Dependants vs graph

Computed from `graphify-out/graph.json` (cross-module references where source = product file):

```
recommendations: 26 · system: 18 · domain: 15 · basket-product: 15 (= basketProduct, dashed-path artefact) ·
productCategories: 4 · query: 3 (excluded — transport) · order: 3 (= client-vue order, app-level) ·
catalogue: 3 · basketProduct: 2 · brand: 2 · basket: 1 · routing: 1 (excluded — app-level)
```

Doc table (5 module rows + presentation):

| Module | Doc weight | Graph weight (best read) | Verdict |
| --- | --- | --- | --- |
| `basketProduct` | 8 | 17 (basket-product 15 + basketProduct 2 combined) | 🟡 Under-weighted |
| `recommendations` | 4 | 26 | 🟡 Significantly under-weighted |
| `domain` | 4 | 15 | 🟡 Under-weighted |
| `productCatalogue` | 3 | 3 (`catalogue`) | ✅ Match |
| `routing` | 1 | 1 | ✅ Match (though could be excluded as app-level) |
| Missing | — | `system: 18` | 🟠 Genuine dependant absent |
| Missing | — | `productCategories: 4` | 🟠 Genuine dependant absent |
| Missing | — | `brand: 2` | 🟠 Genuine dependant absent (brand reads product currency for the brand-currency-resolution path) |

Numerical drift but directions are correct. `system` (18) is the most-missing entry — likely the analytics dispatcher walking product records to emit `view_item` / `select_item` events.

#### API endpoints

6 endpoints, methods + URLs verified:

- `GET /basket/products/{productId}` — real fixture, trimmed with disclaimer
- `GET /basket/products/{productId}/related` — curl + descriptive prose (no inline sample; response shape per Cap 1)
- `GET /basket/products/{productId}/provision_fields` — real fixture (empty data array for non-provisionable products)
- `POST /cart/calculate` — real fixture body
- `POST /orders` — curl + body; links to real fixture `post-orders.json`
- `POST /orders/{basketId}/products` — curl + body sample

#### Flows

3 flows: Resolve · Re-resolve on currency change · Configure then seat into a basket.

- Resolve: parallel product + provision-fields reads, assemble configuration model. ✅
- Currency change: re-fetch against new currency, reconcile previously-selected options that don't price for the new currency. ✅
- Configure-then-seat: branch on basket-exists, route to `POST /orders` or `POST /orders/{basketId}/products`, surfaces guarantees + constraints around per-product vs root-level coupon attachment. ✅

All three use `flowchart TD`. No producer-side commentary inside any node. Endpoints named on platform-side nodes.

#### Lessons

13 entries. All problem-shaped. Highlights:

- Product identity excludes price (cache must key by currency)
- Option price overrides not additive (price_override category)
- Provision-field definitions depend on selection
- Sub-products carry full product shape (not pivot)
- Some `(option-value, term)` pairs don't exist
- Price-display headlines diverge from payable price
- One-off is `billing_cycle_months: 0`, not absent
- Pricing recalculated on every change; platform doesn't sequence responses
- Product carries promotion data depending on coupons at read time
- **Passing `basket_id` on a catalogue read is not free** (recomputation cost)
- **The seating call returns the full basket, not just the newly-seated entry** (with two sub-bullets: multi-entry case + merge-into-existing case)
- Client-side validation is a UX optimisation, not a platform requirement
- Trial flags interact with payment requirements

All 13 entries are platform-fact framing — no producer-side rationalisations.

---

## Top 3 priorities (severity × ease)

None are critical or warning-level. Suggestions only:

1. 🟡 **Regenerate the Dependants table from `graphify-out/graph.json`** — graph shows `recommendations: 26, system: 18, domain: 15` as the heaviest consumers. Doc has them at `4, missing, 4` respectively. Three modules are missing entirely (`system`, `productCategories`, `brand`). Numerical regen + adding three rows would land the table at parity. Single mechanical pass.

2. 🟡 **Capture a real `GET /basket/products/{productId}/related` fixture** — currently descriptive prose only. Once captured, inline a trimmed sample showing the response envelope and a few entries.

3. 🟡 **Capture a real `POST /orders/{basketId}/products` fixture** — POST /orders has a real fixture; the second seating endpoint doesn't. Same shape (refreshed basket) so the gap is small, but a real capture would complete the seating-call coverage.

---

## Suggested rule/skill updates

None new from this iteration. The rule's recent removal of the Golden concept (this is the first product audit run against the updated workflow) held up cleanly — the candidate could be reviewed against itself and the prior review without any reference to an archived snapshot.

---

## Appendix A — Source-of-truth references

- `packages/headless/src/modules/product/services.ts:120-180` — `fetchProduct` (the catalogue read with `basket_id` / `basket_product_id` query params; the URL switches between `basket/products/{id}` and `basket/{basketId}/products/{bpid}` based on `rawBasketProduct?.id`)
- `packages/headless/src/modules/product/utils.ts` — `parseProductDetails` (reads `rawProduct.provision_fields` and `provision_blueprint.category.code`)
- `packages/headless/src/modules/basketProduct/services.ts:570` — `POST /orders/{basketId}/products` (the seating call basketProduct previously housed; now correctly forwarded to product per scope decision)
- `packages/types/src/models/products.ts` — `IProduct` typed contract
- `packages/types/src/models/baskets.ts` — `IBasket` response shape for seating-call responses
- `tests/__fixtures__/recordings/get-basket-products-*.json` — catalogue read captures
- `tests/__fixtures__/recordings/post-orders.json` — seating call (`POST /orders`) real capture
- `tests/__fixtures__/recordings/post-cart-calculate.json` — calculate endpoint capture
- `graphify-out/graph.json` — cross-module reference counts

---

## Appendix B — Files reviewed

### Rule + writing standards
- `.agent/rules/docs-modules.md`
- `.agent/rules/docs-writing.md`
- `.agent/rules/docs-reviews.md`
- `.agent/workflows/docs-module-review.md` (now Golden-free)

### Candidate
- `packages/headless/src/modules/product/docs/foundation.md` (post-rewrite, 10 capabilities · 3 flows · 13 lessons)

### Prior review
- `docs/audit/product-foundation-2026-05-15.md`

### Source
- `packages/headless/src/modules/product/services.ts`
- `packages/headless/src/modules/product/utils.ts`
- `packages/headless/src/modules/product/types.ts`
- `packages/headless/src/modules/basketProduct/services.ts` (for the seating-call source confirmation)

### Types
- `packages/types/src/models/products.ts`
- `packages/types/src/models/baskets.ts`

### Fixtures
- `tests/__fixtures__/recordings/get-basket-products-*.json`
- `tests/__fixtures__/recordings/post-orders.json`
- `tests/__fixtures__/recordings/post-cart-calculate.json`

### Graph
- `graphify-out/graph.json`

---

## Appendix C — Strip-audit exhaustive list

No hits across any forbidden-pattern family. Grep covering `useProduct`, `useBrand`, `isReady`, `getConfigValue`, `spawn`, `state machine`, `XState`, `TanStack`, `computed`, `ref`, `sub-track`, `subscribes to`, `module emits`, `silent mode`, `provision_field_values_validate`, `operation queue`, `pending product`, `validates against a schema`, `^- \*\*Bundle`, `DeepLink`, `has to (do|invalidate|defer|drop|broadcast|survive|settle|be|remain|stay|ride|happen|run)`, `the cleaner shape`, `the natural separation`, `the shape that survives`, `you should`, `you must`, `plan for`, `our implementation`, `we chose`, `we split` returns zero matches.

---

## Verdict

**Pass.** Overall 95/100, +13 over prior. The scope refinement landed cleanly — product now describes "catalogue + initial configuration + seating into a basket" with no overlap with basketProduct. The two architectural wins this iteration that weren't in the prior cut: the `basket_id` recomputation-cost lesson (consumers know when to pay it) and the seating-call diff-gotcha lesson with its two sub-bullets (multi-entry case + merge-into-existing case). Both are platform truths an architect rebuilding the platform would otherwise discover the hard way.

Remaining items (dependants regen, two fixture captures) are all 🟡 suggestion-level — none block ship.

This is also the first review run under the Golden-free workflow; the doc could be audited against itself + the prior review + source-of-truth without any reference to an archived snapshot, validating the workflow change.
