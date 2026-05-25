# Product Foundation Doc — Audit

- **Target:** `packages/headless/src/modules/product/docs/foundation.md`
- **Audit date:** 2026-05-15
- **Reviewer:** docs-module-review workflow
- **Prior audit:** none — this is a first review
- **Standards:** `.agent/rules/docs-modules.md`, `.agent/rules/docs-reviews.md`
- **Golden snapshots:** `brand`, `session`, `system` (latest revisions)

---

## Overall confidence

**81/100** — shippable with copy-editing. Strong technical depth, well-anchored to fixtures, three flows justified. The dependants table is the most fixable weak spot, plus a handful of phrasing and strip-leakage items.

| Category | Score | Rationale |
| --- | --- | --- |
| Technical Accuracy | 86/100 | Endpoints, params, samples and types match source. A few drift items (`provision_fields` array missing from `Product` type, `display_price` defaulting story slightly under-specified). |
| Completeness | 80/100 | Every observable behaviour covered. Dependants table omits two real dependants (`productCatalogue`, `domain`) and includes two reverse-flow modules (`config`, `brand`). Bundle add-flow is mentioned only in Lessons — could be a fourth flow. |
| Structure | 88/100 | All required sections present, correct order, no `n/a` filler. Flows section follows the patched rule (Mermaid + prose lead-ins). State model correctly omitted. |
| Clarity | 76/100 | Tone is mostly factual. Several `Constraints` bullets read as sentence fragments (subject-elided). One Lesson uses TypeScript-extends syntax which is implementation leakage. Operations table descriptions are dense. |
| Actionability | 80/100 | An architect rebuilding the platform can extract the contract. The 12-row Operations table conflates "read X off a record I already loaded" with "make an HTTP call" — the per-endpoint count is 3, not 12, which the rule prefers be visible. |

---

## Strip audit

Patched rule (`.agent/rules/docs-modules.md` § What To Strip).

### 🟢 Praise

- The `meta` italic note appears exactly once and `meta` is silently dropped from every data shape, sample response, and Lesson.
- No `useX()` / `isReady()` / query-key / store-name leakage in the Operations table.
- The Vue / XState / TanStack vocabulary is absent throughout — `services.ts`, `useProductConfig`, AJV, and the calculation subscription are all kept out of the spec.
- "Hard-won" lessons describe problems, not solutions. No "the cleaner shape is X" tails.
- The basket-line-scoped URL is correctly disambiguated as a distinct retrieval shape, not as an internal "actor variant".

### 🟠 Warnings

- **🟠 Implementation-typing leakage in a Lesson.** Lesson 4 reads:

  > Sub-products carry their own dependency chain on the parent. A sub-product is itself a product (`IProductOption extends IProduct`) with its own prices, …

  The phrase `IProductOption extends IProduct` is TypeScript-extends syntax that names our internal type and our extension relationship. An architect rebuilding the platform in another stack reads this as prescriptive. Replace with a framework-neutral description ("A sub-product carries the full product shape — prices, billing cycles, provision fields, clients-can-order — not just a thin pivot record").

- **🟠 Operations rows 5–7, 11, 12 read from the already-loaded product, not from a BE call.**

  Per the patched rule:
  > _When in doubt: an architect rebuilding the platform should be able to read your Operations table and see one row per HTTP call they'll need to make. If they see one row for "read all the system data", they can't._

  Rows 1–4 + 10 are calls. Rows 5 (Read terms), 6 (Read options), 7 (Read attributes), 11 (Detect non-orderable), 12 (Detect price override) all operate on an *already-loaded* product record. Row 8 (Read price-display policy) is sourced *from brand config* — it doesn't belong on product at all. Row 9 (Format a billing cycle) is a pure-utility client-side formatter.

  The rule allows lifecycle reads ("readiness, refresh, invalidate"). It does *not* explicitly allow "thin re-reads of fields on a record you already hold" as their own capabilities. Two options to fix:

  1. **Collapse rows 5–7 into capability 1** ("Load a product for configuration" — *the response carries available terms, options, attributes …"*).
  2. **Move rows 8 / 9 / 11 / 12 into a "Derived reads from a loaded product" sub-section** that explicitly marks them as in-memory computations, not BE calls.

  Either approach makes the table truthful to "one row per HTTP call you'll make".

- **🟠 Capability 8 is sourced from a different module.**

  > **Read price-display policy** | — (sourced from brand config) | …

  Brand config keys live in the brand module's surface (its foundation doc enumerates `invoices.common.display_price_type`). Documenting it as a `product` capability — even with the "sourced from brand config" parenthetical — duplicates ownership. An architect reading the brand doc and the product doc will see the same key in two Operations tables.

- **🟡 Capability 10 returns the URL-bag *names* directly.**

  `pid`, `qty`, `bcm`, `sub_pids`, `pfields`, `coupons` are the URL parameter names *our* router uses. The rule doesn't forbid this, but presenting them as the spec for deep-link shape commits the platform spec to our exact query-string vocabulary. A neutral version names the *semantic inputs* ("product id, quantity, billing-cycle months, sub-product ids, provision-field values, coupon codes") and shows the URL-bag concrete names in the data-shape block. The data shape already does this — the Operations row can defer.

### 🟡 Suggestions

- The text "[…] a single sum-and-format on the client is not enough" (capability 3) is mild implementation commentary. Reframe as "[…] when the displayed total must match the back-end's currency formatting exactly".
- The "Validation has two modes that share the same schema" Lesson uses the word *schema* — fine — but pairs it with "the same schema" which presumes there *is* one schema. The schema name itself isn't in the doc; this Lesson is a candidate for trimming or moving to a more general "Validation" framing.

---

## Operations table audit

Target: ≤ 12 capabilities, capability-shaped, ideally one row per BE endpoint plus lifecycle reads.

| # | Row | Verdict | Notes |
| --- | --- | --- | --- |
| 1 | Load a product for configuration | ✅ | Maps to `GET /basket/products/{productId}` and `GET /basket/{basketId}/products/{basketProductId}`. The "differs from list-in-catalogue" framing is useful. |
| 2 | Load provision-field definitions | ✅ | Maps to `GET /basket/products/{productId}/provision_fields`. |
| 3 | Calculate a configured price | ✅ | Maps to `POST /cart/calculate`. |
| 4 | Validate a configured model | 🟠 | This is client-side validation against the schema, not a BE call. "Silent mode" is implementation. Acceptable if reframed as "Check whether a configuration is internally consistent before submission". |
| 5 | Read available billing terms | 🟠 | In-memory read off the loaded product. Collapse into 1, or move under a "Derived reads" sub-section. |
| 6 | Read available configurable options | 🟠 | Same as 5. |
| 7 | Read available configurable attributes | 🟠 | Same as 5. |
| 8 | Read price-display policy | 🟠 | Sourced from brand. Belongs in brand doc; cross-reference here at most. |
| 9 | Format a billing cycle for display | 🟡 | Pure client-side formatter, no BE call. Either keep as a separate "Display helpers" sub-section or push to `system` (which owns billing cycle records). |
| 10 | Resolve a deep-link configuration | 🟡 | Pure client-side parse. Useful but acknowledge as client-side. |
| 11 | Detect a non-orderable configuration | 🟠 | Boolean derivation off basket-product subproducts. In-memory. |
| 12 | Detect a price override | 🟠 | Boolean derivation off options + categories. In-memory. |

**Net:** 3 BE calls + 1 validation + 2 client-side parsers/formatters + 6 in-memory derivations. The doc would be clearer if those four groups were visible at a glance.

---

## Data shape audit

Source of truth: real fixtures (`tests/__fixtures__/recordings/get-basket-products-c844b0e7.json`, `get-basket-products-47d73824-…-provision_fields.json`, `post-cart-calculate.json`) and types (`packages/types/src/models/products.ts`).

### 🟢 Praise

- Every documented field on `Product` appears in the fixture or in `IProduct`. Inline `//` comments are pragmatic (e.g. the `product_type` and `order_type` integer enum keys).
- `meta` is correctly absent from every type.
- `Price`, `SubProduct`, `ProductCategory`, `Promotion` are split into their own blocks rather than nested — easier to scan.
- The `Promotion.display_type` enum is left open with `| string` rather than forced into an exhaustive list — accurate to the response.
- The `DeepLinkConfig`, `ProductModel`, `SubproductSelection`, `CalculateRequest`, `CalculateResponse` blocks are well-shaped and concise.

### 🟠 Warnings

- **🟠 `provision_fields` is referenced in code but not in the documented type.**

  `parseProductDetails` (utils.ts line ~650 and elsewhere) reads `rawProduct.provision_fields` and `rawProduct.provision_blueprint.category.code`. The `Product` type in the doc carries `provision_blueprint` but **not** `provision_fields`. If the fixture returns a `provision_fields` array on the product record, it belongs in the data shape; if it only ever surfaces via the dedicated `/provision_fields` endpoint, the field in code is dead and worth a Lesson, not a Data-shape entry. Decision needs codebase eyes.

- **🟠 Two duplicated type blocks for `ProductCategory.category`.**

  Lines 47 and 150 of foundation.md both have `category: ProductCategory;` in the `Product` type. Once as `category_id` + `category`, then again under the relations section. Harmless but reads as a paste artefact.

### 🟡 Suggestions

- `Price.price` carries the inline comment `"// unit price for the cycle, in currency minor unit? — actually decimal major"`. The `?` is an editorial unresolved-question marker. Pick one description and drop the equivocation.
- `Promotion.code` is `string | null` per the doc — true. Worth noting that auto-applied promos *also* set `code: null`, since the Lessons block explains this elsewhere.

---

## Dependencies audit

### Dependants table

The table currently lists 10 modules plus a presentation-layer row. A code-level grep against current `monorepo` HEAD gives a different picture:

| Module | Doc weight | Code-grep import count | Verdict |
| --- | --- | --- | --- |
| `basketProduct` | 34 | 10 (file count) | ✅ Top dependant — agree with ranking, the weights differ but the relative ordering is correct. |
| `config` | 27 | 0 cross-module imports of `product` from `config/` | 🔴 Direction reversed. `config` doesn't import `product`; `product` imports `config/useConfig`. |
| `brand` | 12 | 0 cross-module imports of `product` from `brand/` | 🔴 Direction reversed. `product` imports `brand`, not vice versa. The doc itself acknowledges this ("the directional flow is brand → product, but the read appears in brand's surface because brand owns the keys") — but a dependants table is not the place for reversed entries with disclaimers. |
| `routing` | 8 | 1 file imports | ✅ Direction correct. Weight high vs grep, possibly file-fan-out. |
| `client` | 6 | 0 cross-module imports found | 🟠 Either the import is indirect (via types) or the row is aspirational. Verify. |
| `basket` | 4 | 0 direct imports of `product` from `basket/` | 🟠 Same as `client` — likely via `basketProduct`. If the flow is transitive, say so or drop the row. |
| `session` | 4 | 0 cross-module imports | 🟠 Same caveat. The "guest-customer order links carry a product id" claim is the URL surface, not a code-level import. |
| `paymentDetails` | 2 | 0 cross-module imports | 🟠 Same caveat. |
| `recommendations` | 1 | 5 cross-module imports | 🔴 Weight under-counted by 5×. |
| **MISSING** `productCatalogue` | — | 4 cross-module imports | 🔴 Genuine dependant, not in the table. |
| **MISSING** `domain` | — | 4 cross-module imports | 🔴 Genuine dependant, not in the table. |
| Presentation layer | — | — | ✅ |

**Recommendation:** rebuild the dependants table from a grep over `from "../product"` / `from '../product'` (already done above). The current table conflates **graphify import-edge counts** (which can include type-only imports and broader textual references) with **directional dependants** (modules that read product data). The result is a table that gets the top dependant right and the next nine confused.

The strict rule from the patched doc:
> "Reads" column = data names, not method names.

The "Reads" entries currently say things like "product record, prices, options, attributes, provision-field definitions, price-override detection, billing-cycle formatting, deep-link parsing" — for `basketProduct`. The first five are data names ✅. The last three are *capability names from this doc's own Operations table* — that's method-name-shaped, not data-name-shaped. Rephrase: "applied options' override flag, billing-cycle months, sub-product id list".

### Own dependencies bullet list

- **🟢 Praise:** The `Brand-derived inputs` bullet is exactly right — it names *what* product reads from brand without naming `useBrand()`, `getConfigValue`, etc.
- **🟢 Praise:** The transport-layer bullet correctly carries "cancellation of in-flight pricing calculations" — that's a real platform-level concern, not implementation.
- **🟠 Suggestion:** The "Shared types / enums" bullet enumerates `IProduct`, `IProductOption`, `IProductAttribute`, …, `PromotionDisplayTypes`. The list is accurate but exhaustive; a single sentence ("typed mirror of the API shape, plus the integer-enum keys for `product_type`, `order_type`, default-payment-period, trial actions, price display, promotion display, payment-term designation") would be tidier.

---

## API endpoints audit

Four endpoint entries.

| Endpoint | Verdict | Notes |
| --- | --- | --- |
| `GET /basket/products/{productId}` | ✅ | Curl uses `$API` / `$ACCESS_TOKEN`. Sample is trimmed-but-complete and `meta` is stripped. Trailing note flags the trim. |
| `GET /basket/{basketId}/products/{basketProductId}` | ✅ | Acknowledged as a distinct retrieval per the rule's "genuinely-distinct retrieval shape" criterion. No duplicated sample (sensible — the shape is identical). |
| `GET /basket/products/{productId}/provision_fields` | ✅ | Real fixture is empty for the cached product — doc correctly shows `[]` and notes "real captures will replace this placeholder once available". |
| `POST /cart/calculate` | ✅ | Curl + sample agree with fixture `post-cart-calculate.json`. |

🟡 **Suggestion:** the `GET /basket/{basketId}/products/{basketProductId}` entry omits a sample response. The justification ("Same response shape as `/basket/products/{productId}`") is reasonable but a one-line note inline would suffice. Alternatively, the entry could be a sub-heading under the first endpoint with a shared sample.

---

## Flows audit

3 flows are present. The brief asked for explicit validation of flow choices.

| Flow | Verdict | Notes |
| --- | --- | --- |
| Resolve a product for configuration | ✅ Genuine multi-step | Product fetch + provision-fields fetch can run in parallel, basket-scoped vs standalone URL is a real branch. |
| Reconfigure (term/option/attribute/quantity) | ✅ Genuine multi-step | Re-fetch provision fields + conditional calculate is exactly the multi-call dance an architect needs to plan around. |
| Re-resolve on currency change | ✅ Genuine multi-step | Currency flip triggers a full re-fetch with selection reconciliation — distinct from reconfigure because the *available* selections may shrink. |

**Three flow choices are well-justified.** The four candidates that were *not* chosen are:

- **Bundle add (parent + children).** Surfaced in Lessons but not as a flow. This is a multi-step BE interaction (add parent → read response → submit children with values from response). Worth promoting to a fourth flow.
- **Deep-link arrival** (URL → normalise → load → validate → maybe-add). Currently inferable from capability 10 + the resolve flow. Could merge with flow 1 as a branch.
- **Catalogue → configure transition** (headline-price → configure-page resolve). Mentioned in Lessons as a price-divergence problem; could be visualised.
- **Trial purchase decision** (zero-amount with payment-details requirement). Discussed in Lessons. Probably belongs as a Lesson, not a flow.

Recommendation: promote **bundle add** to a fourth flow. The current Lesson is too compressed for an architect to plan around.

### Mermaid notation health

- All three diagrams parse. `par … and … end` and `opt` constructs are used correctly.
- The `note over C: …<br/>…` line-break uses `<br/>` consistently.
- Resolve flow uses `note over P: standalone — or` then a second `note over P: basket-line scoped` to express the OR branch. Mermaid renders this; it reads slightly awkward in source. An alternative is `alt … else … end`. Either is acceptable.
- No `useX().method()` leaks into the Mermaid — all platform-side calls are bare HTTP methods + paths ✅.

### `Guarantees` / `Constraints` prose lead-ins

The patched rule mandates prose lead-ins, not sub-headings. The doc complies for all three flows ✅.

🟠 **Phrasing issue across the three `Constraints` blocks.** Many bullets start with "The X to do Y", which parses as a sentence fragment when read alone — e.g.:

> - The product response to include the right set of options for the current term.

reads as "The product response [is expected] to include …" with the subject-clause elided. This pattern shows up in the session foundation flows too; it's becoming a house-style tic. Recommend rewriting as direct statements:

> - The product response carries every option regardless of term — filtering by term is the caller's responsibility.

Same pattern in:

- "The basket-line URL to be safe to call before a basket exists." → "The basket-line URL is not safe to call before a basket exists; it returns an error."
- "Stale calculation responses." → "Stale calculation responses can land after the user moves on."
- "Selections to carry across currencies." → "Selections do not carry across currencies."

Not a critical blocker — readable in context — but a 5-minute polish that significantly improves clarity.

---

## Lessons audit

14 lessons. Mostly problem-shaped.

### 🟢 Praise

- Lesson 1 ("A product's identity does not include its price") is a textbook example of the rule. Pure problem, no prescription.
- Lessons 2, 3, 5, 7, 9, 11 all follow the same shape and avoid solution suffixes.
- Lesson 8 ("A one-off product is `billing_cycle_months: 0`, not absent") is concise, surgical, and exactly the kind of platform fact an architect needs.
- Lesson 14 (trial × payment-required matrix) is a four-way truth-table claim that an architect will want to test against — a great Lesson.

### 🟠 Warnings

- **🟠 Lesson 4 typing leakage.** Already flagged in the Strip audit — `IProductOption extends IProduct` is implementation typing.
- **🟡 Lesson 12 ("Validation has two modes that share the same schema")** uses "the same schema" — but no preceding Lesson or section names a schema. If the reader hasn't been told what the schema is, this Lesson floats. Either name the schema-construction inputs ("derived from required-options + allowed-quantities + mandatory provision fields") or rephrase as "Validation can be skipped — a 'silent' mode hands validation entirely to the back end. Most flows surface field-level errors locally; bulk-add and recommendation flows opt out."

### 🟡 Suggestions

- Lesson 6 ("Inbound deep-link sub-product ids arrive in three shapes") is great but is currently the *only* deep-link-related Lesson. The deep-link URL-bag is a meaningful platform surface; one more Lesson around "Coupon codes ride in alongside sub-products and apply at resolution time, not at add time" would round it out.
- Lesson 11 (bundle products) is the strongest argument for promoting bundle-add to a fourth flow. It currently does double duty: (a) describing what a bundle is, and (b) warning about ordering of add requests. Splitting (a) into a flow and keeping (b) as the Lesson would be cleaner.

---

## In-progress signals

Three-bucket split (per `docs-reviews.md`).

### 🟠 In progress (someone is mid-edit)

- Inline `// unit price for the cycle, in currency minor unit? — actually decimal major` — the `?` is an unresolved-question marker.
- Stub note on `/provision_fields` — explicitly marked "real captures will replace this placeholder once available" ✅ honest.

### 🔴 Not started

- Bundle-add flow (only present as a Lesson, not a flow).

### ✅ Done

- All four API endpoint blocks.
- The `What it is` paragraph, Core concepts, Data shape blocks.
- The three Flows (subject to the phrasing polish).
- 12 of 14 Lessons.

---

## Top 3 priorities (in order)

1. **🔴 Fix the dependants table.** Drop `config` and `brand` (reverse-flow); add `productCatalogue` and `domain` (real dependants); re-grep the weights from cross-module imports or accept that graphify counts and import-edge counts will differ and pick one. Rephrase the `basketProduct` "Reads" entries to be data-named, not capability-named. Estimated effort: 20 minutes with a fresh grep.

2. **🟠 Rework the Operations table to make BE-call rows visible.** Either collapse rows 5/6/7 into row 1 and move 8/9/11/12 under a "Derived from a loaded product" sub-section, or annotate each row with `[BE call]` / `[derived]` / `[client utility]`. The architect-rebuild test ("how many HTTP calls do I have to plan for?") should be answerable from the table at a glance. Estimated effort: 30 minutes.

3. **🟠 Polish flow `Constraints` phrasing.** Replace subject-elided fragments ("The X to do Y") with full statements. Same fix applies to the session foundation doc — worth doing as a sweep across both. Estimated effort: 15 minutes.

A nice-to-have fourth: promote **bundle add** to a fourth flow (the rule allows up to 7).

---

## Copywriter feedback (sympathetic tone)

> Thank you for the work on this one — it's the strongest of the three module docs reviewed so far. Pricing, options, attributes, provisioning, multi-currency, validation modes, and the basket-line-scoped variant are all in scope, the fixtures back up every endpoint, and the three flows you chose (resolve / reconfigure / currency change) are exactly the multi-step interactions an architect rebuilding the platform needs to see. The `meta` discipline is perfect — note once at the top, silent everywhere else.
>
> Three things to land next:
>
> 1. The **dependants table** has two reverse-flow entries (`config`, `brand` don't import product — product imports them) and is missing two real dependants (`productCatalogue`, `domain`). I'd suggest a 20-minute regrep + rewrite. The "directional flow is brand → product, but the read appears in brand's surface because brand owns the keys" note is an honest disclaimer but a dependants table isn't the right place for it — that's content for the brand doc.
> 2. The **Operations table** runs to exactly 12 rows but only 3 of those are actually HTTP calls. The other 9 are in-memory reads / derivations / client-side parsers. An architect reading the table and counting "how many endpoints do I have to build?" gets the answer wrong. Either collapse the in-memory reads into capability 1, or annotate each row with its kind (`[BE]` / `[derived]` / `[client]`).
> 3. The flow **Constraints** bullets read as subject-elided fragments ("The X to do Y" — meaning "you should not expect X to do Y"). Rewriting them as full sentences ("X does not do Y; the caller has to do Z") makes them noticeably easier to parse. Same pattern in the session doc — worth fixing as a single sweep.
>
> Confidence shift from a 76 baseline (which is roughly where the brand and session docs sit after their second passes) to **81/100**. The cluster of small fixes above gets this comfortably into the high 80s.

---

## Appendix A — Property / API reference (from codebase)

### Endpoints exercised by the `product` module

| Method | Path | Source |
| --- | --- | --- |
| `GET` | `/basket/products/{productId}` | `services.ts` line 142 |
| `GET` | `/basket/{basketId}/products/{basketProductId}` | `services.ts` line 142 |
| `GET` | `/basket/products/{productId}/provision_fields` | `services.ts` line 206 |
| `POST` | `/cart/calculate` | `services.ts` line 371 |

### Fixtures consulted

- `tests/__fixtures__/recordings/get-basket-products-c844b0e7.json` (list endpoint, used here to verify Product shape)
- `tests/__fixtures__/recordings/get-basket-products-47d73824-8507-9315-345f-81e642d59e06-provision_fields.json` (empty array — matches doc)
- `tests/__fixtures__/recordings/get-basket-63250798-…-products-98574264-….json` (basket-line-scoped variant)
- `tests/__fixtures__/recordings/post-cart-calculate.json` (matches doc body)

### Cross-module imports of `product` (current HEAD)

```text
basketProduct      10 files
recommendations     5 files
productCatalogue    4 files
domain              4 files
routing             1 file
```

Source: `grep -rE "from \"\\.\\./product\"" packages/headless/src/modules/ | grep -v "/product/" | awk -F: '{print $1}' | sed 's|.*/modules/||;s|/[^/]*$||' | sort | uniq -c | sort -rn`

These are *direct, value-level* imports. Type-only imports and indirect references (via `basketProduct`, via `system`, via `routing` query-string parsing) will inflate the totals — graphify's `34` for basketProduct is plausible if it counts re-exports.

---

## Appendix B — Enum / registration cross-reference

`ProductTypes` (`packages/types/src/data/enums/products.ts`):

| Value | Name |
| --- | --- |
| 1 | SINGLE_PRODUCT |
| 2 | BUNDLE |
| 3 | VOUCHER |
| 4 | OPTION |
| 5 | ATTRIBUTE |
| 6 | SUBPRODUCT |

Doc renders this inline on the `Product.product_type` field comment as `1=single, 2=bundle, 3=voucher, 4=option, 5=attribute, 6=subproduct` — ✅ matches.

`OrderTypes`:

| Value | Name |
| --- | --- |
| 1 | SINGLE |
| 2 | QUANTITY |
| 3 | CONFIGURATION |

Doc renders `1=single-option, 2=quantity-based, 3=configuration-based` — ✅ matches.

`DefaultPaymentPeriod`:

| Value | Name |
| --- | --- |
| 0 | INHERIT_FROM_BRAND |
| 1 | LOWEST_PRICE |
| 2 | LOWEST_MONTHLY_PRICE |
| 3 | HIGHEST_PRICE |

Doc renders `0=inherit, 1=lowest, 2=lowest-monthly, 3=highest` — ✅ matches.

`PriceDisplayTypes` and `PromotionDisplayTypes` — referenced in own-deps but not in data shape (correctly — they live on the brand surface).

`ProductCategoryTypes`:

| Value | Name |
| --- | --- |
| 1 | PRODUCT |
| 2 | OPTION |
| 3 | ATTRIBUTE |

Doc renders `1=product, 2=option, 3=attribute` — ✅ matches.

---

## Appendix C — Verbatim evidence (critical items)

### Dependants direction reversal

> | `config` | 27 | price-display policy, billing-cycle formatting, default payment period | Catalogue rendering (headline price, term descriptions, badge derivation) consumes the product's pricing surface and the brand's display policy. |
> | `brand` | 12 | price-display policy key, default payment period key | Brand reads back the policy keys it controls *for* product rendering — the directional flow is brand → product, but the read appears in brand's surface because brand owns the keys. |

`packages/headless/src/modules/product/utils.ts` line 1:

```ts
import { useBrand } from "../brand";
import { useI18n, useSystem } from "../system";
import { useConfig } from "../config/useConfig";
```

`product` imports from `brand`, `system`, and `config`. The reverse — `brand`/`config` importing from `product` — does not occur:

```text
$ grep -rE "from \"\\.\\./product\"" packages/headless/src/modules/brand/
$ grep -rE "from \"\\.\\./product\"" packages/headless/src/modules/config/
(no output)
```

### Missing dependants

```text
$ grep -lE "from \"\\.\\./product\"" packages/headless/src/modules/productCatalogue/
packages/headless/src/modules/productCatalogue/mappers.ts
packages/headless/src/modules/productCatalogue/useProductCatalogue.ts
packages/headless/src/modules/productCatalogue/services.ts

$ grep -lE "from \"\\.\\./product\"" packages/headless/src/modules/domain/
packages/headless/src/modules/domain/types.ts
packages/headless/src/modules/domain/domain.machine.ts
packages/headless/src/modules/domain/utils.ts
packages/headless/src/modules/domain/dac.machine.ts
```

Both `productCatalogue` and `domain` import from `product` directly; neither appears in the doc's dependants table.

### Implementation-typing leakage in a Lesson

> **Sub-products carry their own dependency chain on the parent.** A sub-product is itself a product (`IProductOption extends IProduct`) with its own prices, its own billing cycles, …

`IProductOption extends IProduct` is TypeScript-extends syntax referring to our internal type system.

---

## Appendix D — Files reviewed

### Standards

- `.agent/rules/docs-modules.md`
- `.agent/rules/docs-reviews.md`
- `.agent/rules/docs-writing.md`

### Target

- `packages/headless/src/modules/product/docs/foundation.md`

### Golden snapshots

- `packages/headless/src/modules/brand/docs/foundation.md`
- `packages/headless/src/modules/session/docs/foundation.md`
- `packages/headless/src/modules/system/docs/foundation.md`

### Source of truth (codebase)

- `packages/headless/src/modules/product/services.ts`
- `packages/headless/src/modules/product/types.ts`
- `packages/headless/src/modules/product/utils.ts`
- `packages/headless/src/modules/product/useProductConfig.ts`
- `packages/headless/src/modules/product/schemas.ts` (referenced — not read line-by-line)
- `packages/headless/src/modules/product/product.machine.ts` (referenced — not read line-by-line)
- `packages/headless/src/modules/product/index.ts`

### Fixtures

- `tests/__fixtures__/recordings/get-basket-products-c844b0e7.json`
- `tests/__fixtures__/recordings/get-basket-products-47d73824-8507-9315-345f-81e642d59e06-provision_fields.json`
- `tests/__fixtures__/recordings/post-cart-calculate.json`

### Cross-module dependants grep

- All files matching `from "../product"` / `from '../product'` under `packages/headless/src/modules/`

---

## Appendix E — In-progress signals (three-bucket split)

### 🟠 In progress

1. `Price.price` inline comment has an unresolved-question marker (`"actually decimal major"` follows a `?`).
2. Provision-fields sample marked as stubbed-pending-real-capture (real fixture has been captured but it's an empty array; doc honestly notes this).
3. The dependants table mixes graphify-count weights with code-grep direction — appears mid-migration between two methodologies.

### 🔴 Not started

1. Bundle-add multi-step interaction has Lesson 11 but no Flow.
2. The "directional flow is brand → product" note in the dependants table is an editorial acknowledgement that the row shouldn't be there — but the row hasn't been removed.

### ✅ Done

1. `What it is` paragraph and `meta` italic note.
2. All four API endpoint entries (curls, samples, trim notes).
3. Three Flows with Mermaid diagrams and prose lead-ins.
4. 12 of 14 Lessons (Lessons 4 and 12 need light edits).
5. Core concepts and Data shape blocks.
