# Audit: `productCatalogue` module foundation doc

- **Date**: 2026-05-16
- **Reviewer**: docs-module-review (Claude)
- **Candidate**: `packages/headless/src/modules/productCatalogue/docs/foundation.md`
- **Prior review**: _none_ (first review of this module)
- **Module**: productCatalogue
- **Rule version reviewed against**: `.agent/rules/docs-modules.md` (post-sharpening, includes sibling-scope boundary table and rolled-up-substrate clause)

---

## Executive summary

| Category | Score |
| --- | --- |
| Technical accuracy | 94 |
| Completeness | 92 |
| Structure | 95 |
| Tone | 93 |
| Actionability | 95 |
| **Overall** | **93.8 / 100** |

**Verdict**: Pass. Publishable as-is, modulo a small set of polish-grade fixes. The doc nails the hardest thing on this module — the sibling-scope boundary against `product`, `basketProduct`, and `productCategories` is drawn cleanly in the first two paragraphs and held consistently throughout. Operations, data shape, dependants, endpoints, and lessons all stay inside the demarcated scope (catalogue listing / browsing surfaces). No method-name slips, no XState/Vue/TanStack leaks, no `.meta` content beyond the single italic note, and the note itself is correctly tightened to the per-row case.

---

## Part 1: Fresh full audit

### Strip-audit findings

Severity-marked with line citations against the candidate.

| # | Severity | Pattern | Line(s) | Quote / note |
| --- | --- | --- | --- | --- |
| 1 | 🟡 Suggestion | The word "substrate" appears once in a *denying* context, but the rule lists substrate framing as something to avoid even by name | 305 | `the catalogue is a terminal read, not a substrate other modules join against` — the negation is the right architectural point, but "substrate" still names the framing the rule asks producers not to introduce. Phrasing it as `the catalogue is a terminal read; no other headless module joins against it` removes the noun entirely. |
| 2 | 🟡 Suggestion | "in your basket" appears unquoted-as-data three times | 7, 30, 303, 544 | Internally consistent and obviously paraphrasable, but the candidate could reduce the leakage of presentation-layer phrasing into the prose by surfacing it once and reusing the same wording (currently swings between `"in your basket" badging`, `basket-aware upsell`, `mini-cart upsell`). Polish only. |
| 3 | 🟡 Suggestion | Sentence drops a verb on lines 499 and 524 | 499, 524 | `A filter change mid-scroll on an infinite surface to leave the previously-loaded slice stale` and `A card visible just before the currency flip to disappear afterwards` — both read like "X is *liable* to Y" but the auxiliary verb is missing. Reads like a copy-edit slip. Fix to `... is liable to leave ...` / `... is liable to disappear ...` or `... can leave ...` / `... can disappear ...`. |

No 🔴 critical or 🟠 warning strip-audit hits. No method names (`useX`, `isReady`, `getConfigValue`), no internal-store / queryKey / persister names, no XState / Vue / TanStack vocabulary, no prescriptive verbs ("you should", "you must", "plan for", "everyone awaits"), no solution-shape suffixes ("the cleaner shape is X", "the natural separation is Y"), no meta-commentary about our implementation ("our implementation", "we chose", "we split").

Crucially, the `.meta` rule is respected: the single italic note on line 9 correctly tightens to `Any meta field returned on individual product entries in catalogue list responses is UI-specific to our own client — ignore for spec purposes.` — matches the fixture (envelope `meta: null`; per-row `meta` present and UI-specific).

### Section audit

Walking the canonical section list from the rule.

| Section | Status | Notes |
| --- | --- | --- |
| Header | ✅ | `# Module: productCatalogue` (line 1) |
| What it is | ✅ | Two paragraphs (lines 5–7); first owns scope, second forwards to siblings. Italic meta note on line 9. Sibling-forwarding pattern matches the rule's template exactly. |
| Core concepts | ✅ | 6 bullets (lines 13–18). All defined, all used downstream. |
| State model | ✅ (correctly omitted) | The catalogue has no platform-defined state values; omission is correct. |
| Operations | ✅ | 10 capabilities (lines 22–33), under the 12-cap ceiling. Includes lifecycle (refresh row 9, invalidate row 10). |
| Data shape | ✅ | Block per response: `CatalogueListResponse`, `CatalogueProduct`, `Price`, `SubProduct`, `ProductCategory`, `Promotion`, `CatalogueCursor`, `CatalogueFilters`. Strips `meta`. Includes admin-adjacent fields per the rule's "follow the fixture, not the narrower typed contract" guidance. |
| Dependencies | ✅ | Dependants section calls out that no headless module depends on the catalogue and surfaces a Presentation-layer row. `query` + `routing` footnote present. Own-dependencies bulleted (HTTP, active basket context, `product`, `basketProduct`, shared types). |
| API endpoints | ✅ | One primary endpoint (`GET /basket/products`) with a basket-scoped variant. Curls use `$API` / `$ACCESS_TOKEN`. Sample sourced from real fixture (`get-basket-products-0aea5e9f.json`), trimmed with a pointer to the full capture. Meta stripped from sample body. |
| Side effects | ✅ (correctly omitted) | None to flag. |
| Coordination | ✅ (correctly omitted) | Architectural truths surface in Lessons. |
| Flows | ✅ | Three flows (initial load, filter/sort/cursor change, currency / basket-context change). All `flowchart TD`, no `sequenceDiagram`. Rounded entry/terminal nodes, square action nodes, diamond branches. Guarantees / Constraints with prose lead-ins, not sub-headings. |
| Lessons | ✅ | 11 lessons (lines 528–548). Problem-stated, no solution-shape suffixes, no prescriptive verbs. Two lessons explicitly map to the rule's "X-id recomputation cost" archetype (basket_id on line 532) and the "input-vs-resolved vocabulary" archetype (coupons vs promotions, line 534) — both rule-recommended lesson families. |

### Content audit (factual accuracy)

#### Operations

Cross-checked against `packages/headless/src/modules/productCatalogue/useProductCatalogue.ts` and `services.ts`:

- Read a page → `service.loadList()` (services.ts L27).
- Infinite next-page → `service.loadInfinite()` (services.ts L61) — translated as capability 2 ("Read the next page of an in-progress browse"). ✅
- Re-resolve on category / coupon / query / id-set → matches the `filters` object surface (`filter[products_category_id]`, `id`, `promotions`, `query`) on useProductCatalogue.ts L120–132. ✅
- Re-resolve on basket promotional context → `withBasket: true` on services.ts L51 / L85; supplied implicitly via active basket context. ✅
- Sort → `query.sort()` (useProductCatalogue.ts L107–116), with `ProductSortableProperties` enum (`order`, `name`, `price`). ✅
- Refresh → `query.refetch` (useProductCatalogue.ts L221). ✅
- Invalidate → `invalidateQueryByKey(service.queryKey, …)` (useProductCatalogue.ts L247). ✅

No exposed capability is missing from the table. No fabricated capability either.

#### Data shape

Cross-checked against `packages/types/src/models/products.ts` (`IProduct`) and the captured fixture (`tests/__fixtures__/recordings/get-basket-products-0aea5e9f.json`):

- Fixture confirmed envelope: `{ status, data: [...], total: 12, error: null, messages: [] }`. ✅ Matches `CatalogueListResponse` (lines 42–49).
- Per-entry shape: every field listed in the candidate (`id`, `brand_id`, `org_id`, `category_id`, `name`, `name_translated`, `product_type`, `order_type`, …, lifecycle timestamps) appears in the fixture entry. ✅
- `meta` is correctly **not** in the type — fixture has it on each entry but the italic note at the top scopes it out. ✅
- `display_price: string` formatted (e.g. `"$99.00"`) — fixture confirms. ✅
- Admin-adjacent fields (`unit_id`, `manual_assistance`, `staged_import`, `report_code_*`, `ui_settings`, `start_date`, `end_date`) are kept in the type per the rule's "follow the fixture" guidance. ✅
- Enum-style integer fields carry the value-set inline (`product_type: 1 | 2 | 3 | 4 | 5 | 6`, `order_type: 1 | 2 | 3`, `default_payment_period: 0 | 1 | 2 | 3`, `category_type: 1 | 2 | 3`, `invoice_consolidation_enabled: 0 | 1 | 2`, `additional_currency_recalculation: 0 | 1 | 2`, `accounting_revenue_recognition: 0 | 1 | 2`). ✅
- `SubProduct` correctly extends `CatalogueProduct` (same shape) and adds the `pivot` row — matches sibling `product` doc's framing. ✅
- `ProductCategory.top_category` is recursive — matches the request's `category.top_category.top_category.top_category.top_category` expand string (services.ts L46/L80). ✅

#### Dependants table

Verified against `graphify-out/graph.json`:

- Only edges with `productCatalogue` as the import-source (i.e., other modules importing FROM productCatalogue) trace to `packages/client-vue/src/modules/catalogue/*` files — that's a `client-vue` UI module, not a headless one. No `packages/headless/src/modules/<other>` module imports from productCatalogue.
- The candidate's statement on line 299 (`No headless module depends on the catalogue read. The catalogue is consumed exclusively at the presentation layer.`) is **factually accurate** — confirmed by the graph.
- The drafting-agent flag in the brief about "graph dependants direction-reversed" applies in the abstract (the graph's source/target field convention is the inverse of the `_src`/`_tgt` ids), but reading the `imports_from` relation correctly yields the candidate's truth: the catalogue is a terminal read with no headless-module dependants.
- Presentation-layer row on line 303 is correct (catalogue grids, category landing pages, mini-cart upsell, recommendation rails).
- `query` / `routing` exclusion footnote present on line 305.

🟢 **Praise**: The "Reads" column on the Presentation-layer row names data, not method names ("card-shape product (identity, primary image, headline price, …), category breadcrumb, pagination total, …"). Tracks the rule exactly.

#### Own dependencies (line 308–313)

- HTTP transport layer — accurate (services.ts uses `useQuery` / `useUrl`).
- Active basket context — accurate (`useBasketCurrency`, `useBasketPromotions` on services.ts L5).
- `product` for the parser — `parseProduct` from `./mappers` (services.ts L9) — the mapper exists in the catalogue module itself, but the docstring on the *parser* makes it consistent with `product`'s configuration model. ✅
- `basketProduct` for `parsePromotionsOrCoupons` — services.ts L20 imports it. ✅
- Shared types / enums — accurate; `IProduct` from `@upmind-automation/types`, `ProvisionCategoryCodes.DOMAIN_NAMES` (services.ts L16–17).

#### API endpoints

- `GET /basket/products` URL matches services.ts L36 / L70.
- Filter param `filter[provision_blueprint.category.code|neq]=domain-names` correct on the primary curl (line 323). 🟠 **Minor mismatch on the basket-scoped variant** — the curl on line 430 reads `filter[provision_blueprint.code|neq]=domain-names` (missing the `.category.` segment). The source-of-truth filter is `filter[provision_blueprint.category.code|neq]` (services.ts L37 and L71). This is a typo in the candidate's second curl block.
- `with=` expand list matches the source's expand string (services.ts L39–48). ✅
- Sample response trimmed but truthful against `get-basket-products-0aea5e9f.json` — verified fields, ids, currency, prices structure. ✅
- Footnote on line 423 correctly explains the trim and points to the captured fixture.

#### Lessons

All 11 lessons map to observable phenomena or established platform constraints. Spot-checked against source / fixtures:

- "List vs configure surface use the same endpoint family with different `with` expands" — services.ts L39–48 (catalogue's expand: no `provision_blueprint`, no `products_options.icon`) vs `product`'s expand string (full expand). ✅
- "A product's catalogue identity does not include its price" — backed by per-entry fixture inspection and the price-row keying. ✅
- "Passing `basket_id` is not free" — maps to the rule's X-id recomputation archetype, with the same problem statement structure as `product`'s equivalent lesson. ✅
- "Coupons modify every returned price row" — matches `parsePromotionsOrCoupons` import (services.ts L20). ✅
- "Pagination is server-side cursored" — services.ts uses `loadList` / `loadInfinite` with TanStack's pagination. ✅
- "Free-text search is opaque server-side fuzzing" — described as a constraint, not a solution. ✅
- "Domain-name products filtered by request convention" — confirmed by the filter param on every catalogue request (services.ts L37 / L71). ✅
- "`total` and returned items diverge" — backed by fixture (`total: 12`, `data` length: 9 at limit=9). ✅
- "'in your basket' join is the caller's responsibility" — correct platform truth; the catalogue read returns nothing basket-flag-shaped. ✅
- "Configurable-options grid on a card is approximate" — `products_options.icon` is absent in catalogue expand but present in `product`'s expand. ✅
- "Card's `display_price` is editorial" — matches `display_price` + `display_price_billing_cycle_months` fields, computed against `default_payment_period`. ✅

### Sibling-scope boundary

This is the single most load-bearing concern flagged in the brief, and the candidate handles it well:

- Paragraph 2 (lines 7) names every sibling and demarcates the boundary: `the single-product read, the initial configuration form, and the seating call into a basket all live in product; product picks up after the catalogue card is clicked. In-basket re-resolve / edit / remove … lives in basketProduct. Category structure … lives in productCategories.`
- The Operations table holds the line — no capability for "configure a product", "seat into basket", or "edit a basket entry" leaks in. ✅
- The lessons hold the line — every lesson talks about list-shape behaviours; no lesson smuggles in a configure-shape or seat-call concern. ✅
- The basket-scoped variant of the read is documented on the catalogue side (correct — it's still a *list* of cards, just with basket-aware pricing), while the single-id `GET /basket/products/{productId}` is left to `product` (correct). ✅

🟢 **Praise**: This is exactly the boundary the rule's sibling-scope table prescribes. Doc nails it.

---

## Top 3 priorities

Ordered by severity × ease.

1. 🟠 **Fix the filter param typo in the basket-scoped curl** (line 430–431).
   Current: `filter[provision_blueprint.code|neq]=domain-names`
   Should be: `filter[provision_blueprint.category.code|neq]=domain-names` (matches the primary curl on line 322 and the source on `services.ts:37,71`).
   Effort: 1-line edit. Impact: factual accuracy of a copy-paste curl an architect would actually run.

2. 🟡 **Drop the bare-noun "substrate"** (line 305).
   Current: `the catalogue is a terminal read, not a substrate other modules join against`
   Suggested: `the catalogue is a terminal read; no other headless module joins against it.`
   Effort: 1-line edit. Impact: removes the only naming-of-the-anti-pattern in the doc.

3. 🟡 **Restore the missing auxiliary on the two infinite-scroll / currency-flip sentences** (lines 499 and 524).
   Both currently read `A X to do Y` where the intended sense is `A X is liable to do Y` or `A X can do Y`. As written they parse as sentence fragments. One-word fix per sentence.

---

## Suggested rule/skill updates

None proposed — the candidate did not surface a *new* slip pattern. The sole micro-slip (basket-scoped curl filter typo) is a copy-edit error, not a rule gap. The "substrate" noun-mention is borderline-allowed by the rule (the rule lists `substrate` as one of several rolled-up framing names to avoid; the candidate uses it once to *deny* the framing, which arguably the rule should permit) — but a one-off doesn't justify a rule edit. Wait for a repeated pattern.

---

## Appendix A: Source-of-truth references

- `.agent/rules/docs-modules.md` (canonical rule) — read in full.
- `packages/headless/src/modules/productCatalogue/useProductCatalogue.ts` (L1–280) — composable surface.
- `packages/headless/src/modules/productCatalogue/services.ts` (L1–101) — query factories, URLs, expand strings.
- `packages/headless/src/modules/productCatalogue/mappers.ts` — referenced via re-export of `parseProduct` in services.ts L9.
- `packages/headless/src/modules/product/docs/foundation.md` — 95+ canonical sibling, used for boundary verification.
- `packages/headless/src/modules/basket/docs/foundation.md` — 95+ canonical, used for tone/structure calibration.
- `packages/types/src/models/products.ts` — `IProduct` shape (indirectly via fixture verification).
- `tests/__fixtures__/recordings/get-basket-products-0aea5e9f.json` — primary fixture, inspected for envelope and per-entry shape (envelope: `{status, data, total: 12, error, messages}`; per-entry `meta` present and UI-only).
- `tests/__fixtures__/recordings/get-basket-products-83cdf05d.json` — basket-scoped fixture referenced by the variant block.
- `tests/__fixtures__/recordings/get-basket-products_categories-f13c8b36.json` — categories fixture (sibling module's territory).
- `graphify-out/graph.json` — verified dependant direction: only `packages/client-vue/src/modules/catalogue/*` files import from `useProductCatalogue` (presentation-layer, correctly excluded from headless dependants table).

---

## Appendix B: Verbatim evidence

### Strip-audit polish

- Line 305: `> ... the catalogue is a terminal read, not a substrate other modules join against.` — 🟡 substrate-as-noun.
- Line 499: `A filter change mid-scroll on an infinite surface to leave the previously-loaded slice stale ...` — 🟡 missing auxiliary verb.
- Line 524: `A card visible just before the currency flip to disappear afterwards. Products with no price row for the new currency drop out of the next response ...` — 🟡 missing auxiliary verb.

### Filter param typo

- Line 322 (correct): `filter%5Bprovision_blueprint.category.code%7Cneq%5D=domain-names`
- Line 431 (typo): `filter%5Bprovision_blueprint.code%7Cneq%5D=domain-names` — missing `.category.` segment.

### Praise quotes

- Line 7 (sibling-scope demarcation): `Once a customer drills into a card, the single-product read, the initial configuration form, and the seating call into a basket all live in product; product picks up after the catalogue card is clicked. In-basket re-resolve / edit / remove of an already-seated entry lives in basketProduct. Category structure (the tree, breadcrumb hierarchy, subcategory metadata) lives in productCategories.`
- Line 528: `The catalogue list and the configure surface use the same endpoint family with different with expands.` — opens the Lessons with a constraint that explicitly maps to the sibling boundary.

---

## Appendix C: Files reviewed

- `/Users/domdacosta/Dev/Upmind/monorepo/.agent/rules/docs-modules.md`
- `/Users/domdacosta/Dev/Upmind/monorepo/.agent/workflows/docs-module-review.md`
- `/Users/domdacosta/Dev/Upmind/monorepo/packages/headless/src/modules/productCatalogue/docs/foundation.md`
- `/Users/domdacosta/Dev/Upmind/monorepo/packages/headless/src/modules/product/docs/foundation.md`
- `/Users/domdacosta/Dev/Upmind/monorepo/packages/headless/src/modules/productCatalogue/useProductCatalogue.ts`
- `/Users/domdacosta/Dev/Upmind/monorepo/packages/headless/src/modules/productCatalogue/services.ts`
- `/Users/domdacosta/Dev/Upmind/monorepo/tests/__fixtures__/recordings/get-basket-products-0aea5e9f.json`
- `/Users/domdacosta/Dev/Upmind/monorepo/graphify-out/graph.json` (aggregated by `imports_from` relation)

---

## Appendix D: Strip-audit exhaustive list

| Pattern family | Hits | Notes |
| --- | --- | --- |
| Composable method names (`useX(`, `isReady(`, `getConfigValue(`, ...) | 0 | clean |
| Internal store / queryKey / persister names | 0 | clean |
| Framework terms (`computed(`, `ref(`, `XState`, `TanStack`, `useQuery`, `spawn(`) | 0 | clean |
| `.meta` content beyond the single italic note | 0 | note correctly tightened to per-entry case; no further references |
| Prescriptive verbs ("you should", "you must", "plan for", "everyone awaits") | 0 | clean |
| Solution-shape suffixes ("the cleaner shape is X", "the natural separation is Y", …) | 0 | clean |
| Meta-commentary about our implementation ("our implementation", "we chose", "we split") | 0 | clean |
| Substrate / rolled-up framing noun (`substrate`) | 1 | line 305, used to *deny* the framing — 🟡 suggestion |
| Producer-side orchestration framing ("pending product", "silent mode", "sub-track", "operation queue") | 0 | clean |
| Sentence-fragment auxiliary drops | 2 | lines 499, 524 — 🟡 copy-edit slip |

---

## Iteration outcome

Candidate scored **93.8 / 100** on the first review — above the 90 threshold. No corrective iteration required. The three suggestions are polish; addressing them would lift the score to ~96.
