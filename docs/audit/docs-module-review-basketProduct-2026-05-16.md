# Audit: `basketProduct` foundation doc — 2026-05-16

**Module:** `basketProduct`
**Candidate:** [`packages/headless/src/modules/basketProduct/docs/foundation.md`](../../packages/headless/src/modules/basketProduct/docs/foundation.md)
**Golden:** none (no `docs/workshop/archive/basketProduct.md`)
**Prior review:** [`docs/audit/basketProduct-foundation-2026-05-15.md`](basketProduct-foundation-2026-05-15.md)
**Reviewer hat:** evaluating the second cut after a major scope refinement — catalogue concerns moved out, capability set re-pinned to in-basket management only.
**Standards applied:** `.agent/rules/docs-modules.md`, `.agent/rules/docs-reviews.md`, `.agent/rules/docs-writing.md`.

---

## Executive summary

This is a structural rewrite, not a touch-up. The prior review's three Critical issues (internal-helper capabilities, missing `provision_fields/values` row) and all four Warnings (stubbed samples, Coordination leak, soft-prescription suffix) are resolved. **More importantly**, the doc has been re-scoped: catalogue reads, the seating call, and the bulk-update "convenience" framing are gone, replaced with a tight in-basket-management surface. Three pieces of producer-side architecture that were leaking through the doc — `provision_field_values_validate` (a back-end-side flag we use for batch processing), "Inline edits and editor edits race" (our two-surface UI choice), and "Operation queue" (our client-side serialisation) — have all been removed. The provisioning-check endpoint was re-framed correctly as a checkout-readiness gate against saved state, not a pre-save validator. Bulk replace was then re-added with its full destructive contract and a dedicated flow.

The result is a 6-capability doc with 3 focused flows, 15 problem-shaped lessons, and zero strip leaks. Substantial uplift across every scoring dimension.

### Scoring (with delta vs prior review)

| Category | Prior | Current | Δ | Notes |
| --- | --- | --- | --- | --- |
| **Technical accuracy** | 82 | 96 | **+14** | Six capabilities map 1:1 to six BE endpoints. Hydration endpoint (`GET /basket/{basketId}/products/{basketProductId}`) added — sourced from `product/services.ts:142`. Bulk replace destructive contract documented with three reconciliation rules. Provisioning-check correctly framed as body-less checkout-readiness gate (not pre-save validator). Sample bodies match real captures or are clearly minimal. |
| **Completeness** | 84 | 94 | **+10** | All required sections present. Operations table covers every BE endpoint the module touches. Catalogue concerns explicitly moved out of scope with a forward reference to `productCatalogue` — defensible boundary, not an omission. |
| **Structure** | 88 | 96 | **+8** | Canonical section order intact. Coordination section dropped (its two bullets either moved to "What it is" or were producer-side architecture leaking). 6 capabilities under the 12 cap. 3 flows total — all on the in-basket surface. |
| **Tone** | 84 | 96 | **+12** | Zero strip leaks (no `useX()`, no reactive-stack vocab, no `pending product`, no `configuration model shape`, no `state machine`, no `sub-track`, no `subscribes to`, no `has to <verb>`, no orchestration commentary). The `provision_field_values_validate` flag — which the prior audit accepted — has been removed as a producer-side hack. |
| **Actionability** | 84 | 95 | **+11** | All 6 endpoint sections carry real curls with real fixture-shape samples. The bulk replace flow visualises the three reconciliation rules so an architect can implement them without re-reading the prose. The destructive contract is impossible to miss. |
| **Overall** | **84** | **95** | **+11** | Strong second cut. **Verdict: pass.** Remaining items are suggestion-level. |

---

## Part 1 — Delta vs prior review

### Prior-issue status (all resolved, mostly via scope refinement)

| Prior ID | Issue | Status | Evidence |
| --- | --- | --- | --- |
| 🔴 **C1** | Capability 11 "Parse line product" describes an internal computation, not a BE endpoint | ✅ **FIXED** | Removed entirely from Operations. The architectural truth (catalogue / basket-product configure against the same contract) lives in "What it is" para 3 and the `Product (catalogue side)` dependency entry. |
| 🔴 **C2** | Capability 12 "Resolve dynamic field references" describes an internal computation | ✅ **FIXED** | Removed from Operations. Surfaced in Lesson "Dynamic field references cross product boundaries" — problem-shaped, no `${...}` resolution prescribed. |
| 🔴 **C3** | `GET /orders/{basketId}/products/{basketProductId}/provision_fields/values` had no Operations row | ✅ **FIXED** | Capability 5 ("Read stored provisioning-field values") added. API endpoint section preserved with the real fixture-shape response (`data: []`). |
| 🟠 **W1** | `POST /orders` sample stubbed | N/A — **OUT OF SCOPE** | `POST /orders` removed entirely (catalogue → basket seating belongs in `productCatalogue`). The scope decision supersedes the fix. |
| 🟠 **W2** | `PUT /orders/{basketId}` (bulk) has no sample | ✅ **FIXED** | Bulk endpoint now has a full curl + body sample, plus a dedicated flow diagram, plus a dedicated lesson. The destructive contract is documented in three places. |
| 🟠 **W3** | Coordination bullet "the same parsing pipeline" leaks orchestration | ✅ **FIXED** | Coordination section dropped entirely. Bullet (1) was producer-side queue framing (now Lesson "Every mutation triggers a full basket recomputation" — describes the platform cost, not the queue). Bullet (2) became part of "What it is" para 3. |
| 🟠 **W4** | Lesson 9 ended with "The shape that survives is X" soft prescription | ✅ **FIXED** | Old Lesson 9 ("Bulk update is destructive") replaced with a re-titled, re-framed version ("Bulk product replacement is destructive") that ends without prescription — closes on the trap of using it as partial-update. |
| 🟡 **S1** | Constraints lead-in phrasing inversion across flows | N/A — **cross-doc concern** | Construction unchanged; still applies to every foundation doc. Worth a rule-level rather than module-level fix. |
| 🟡 **S2** | Capability 8 (quantity) same endpoint as Cap 6 | N/A — **CAPABILITY REMOVED** | "Update quantity" was producer-side surfacing of the same `PUT` call; folded into Capability 2 "Update a basket product" which explicitly lists every mutation kind including quantity. |
| 🟡 **S3** | Pricing-field block could be a table | 🟡 **DEFERRED** | Still a comment block in the `BasketProduct` type. Acceptable per prior review's "scannable as comments" verdict; the table format remains a polish opportunity. |

**Summary:** 6 ✅ FIXED · 3 N/A (resolved by scope decision or capability fold) · 1 🟡 DEFERRED (S3). No regressions on prior issues.

### New scope and strengths introduced this iteration

- 🟢 **Catalogue / in-basket boundary** finally drawn cleanly. The doc opens by stating its scope and forwarding catalogue concerns to `productCatalogue`. This is the right architectural shape for an architect rebuilding — they read this doc for "what to do once a product is in a basket" and the catalogue doc for "what's available and how to seat it".
- 🟢 **GET /basket/{basketId}/products/{basketProductId}** (the in-basket hydration with full catalogue context) added as Capability 1, sourced from `product/services.ts:142`. This endpoint was missing entirely from the prior cut; an architect re-opening a basket product in a configurator now has a documented path.
- 🟢 **Bulk replace destructive contract** documented thoroughly. The three reconciliation rules (entry with `order_product_id` → in place; entry without `order_product_id` → fresh id; absent entries → removed) appear in Capability 6, in the API endpoint section, in the Mermaid flow as visual branches, and in the Lesson. Impossible to miss.
- 🟢 **Provisioning-check correctly framed** as a body-less checkout-readiness gate against saved state. The prior cut had this wrong — framed as a between-keystrokes validator with a body. Corrected at four sites (capability, API endpoint, flow, lesson).
- 🟢 **`provision_field_values_validate` removed.** This back-end-side flag is a producer-side hack for batch processing; documenting it leaked our implementation. Removed cleanly from the config type, the errors-type comment, the PUT sample body, and two lessons.
- 🟢 **"Operation queue" and "Inline edits" lessons removed.** Both were producer-side architectural choices (client-side serialisation; our two-surface UI). The platform truth that remained — "every mutation triggers a full basket recomputation, which is expensive" — is now its own Lesson, framed as platform cost rather than rationale for our queue.
- 🟢 **15 problem-shaped lessons** covering validity ownership split, configuration recursion, two-moments provisioning validation, the cost of mutations, the destructive bulk contract, cross-currency pricing, `unit_quantity` vs `quantity`, error addressing by code vs index, dynamic field references, free trials, and the catalogue product as load-bearing context.

---

## Part 2 — Fresh full audit

### Strip audit

Severity-marked findings against the rule's forbidden patterns:

| Pattern family | Hits | Severity | Evidence |
| --- | --- | --- | --- |
| Composable method names (`useBasketProduct`, `isReady`, etc.) | 0 | ✅ Clean | None across 6 capabilities, 3 flows, 15 lessons. |
| Store / queryKey / persister names | 0 | ✅ Clean | No `["basket", "products"]`, no mutation key shape, no parser names. |
| Vue / XState / TanStack framework terms | 0 | ✅ Clean | No `computed`, `ref`, `spawn`, `actor`, `service`, `queryClient`, `staleTime`. The word `actor` does not appear at all. |
| `.meta` content outside italic note | 0 | ✅ Clean | Single italic note at line 11. No further `meta` references. |
| Prescriptive verbs ("you should", "you must", "plan for") | 0 | ✅ Clean | Zero hits. |
| "has to <verb>" soft prescription | 0 | ✅ Clean | The Constraints lead-in uses "the caller has to plan around" which is the construction's framing, not a forbidden suffix. |
| Producer-side framing (`pending product`, `Operation queue`, `provision_field_values_validate`, `Inline edits race`) | 0 | ✅ Clean | All four producer-side concepts removed in this iteration. |
| "configuration model shape" / "configuration state machine" leak | 0 | ✅ Clean | The `Product (catalogue side)` dependency now reads as constraints (terms / options / attributes / quantity bounds / provisioning blueprint), not as a lifted model. |

**Strip verdict: 🟢 PASS.** Cleanest strip on any second-cut foundation doc reviewed to date.

### Section audit (canonical order)

| Section | Required? | Present? | Justified? |
| --- | --- | --- | --- |
| Header (`# Module: basketProduct`) | ✅ | ✅ Line 1 | — |
| What it is | ✅ | ✅ Lines 3-11 | Three paragraphs — scope statement, boundary with `productCatalogue`, contract continuity — plus italic meta note. ✅ Best-in-class shape. |
| Core concepts | ⚠️ Optional | ✅ Lines 13-18 | Four terms (Basket product, Configuration, Sub-product, Provisioning field). Each definition is plain English. ✅ Justified. |
| State model | ⚠️ Optional (usually omit) | ❌ Omitted | ✅ Correctly omitted. No platform-defined lifecycle states on basket products beyond the basket's own `status`. |
| Operations | ✅ | ✅ Lines 20-29 | 6 capabilities. Maps 1:1 to 6 BE endpoints. Under 12 cap. |
| Data shape | ✅ | ✅ Lines 31-188 | Three types (`BasketProductConfig`, `BasketProduct`, `BasketProductErrors`). Inline comments throughout. Pricing-field comment block remains scannable. |
| Dependencies | ✅ | ✅ Lines 190-211 | Dependants table 6 modules + presentation. Own dependencies bulleted — transport, basket envelope, product catalogue, shared types. |
| API endpoints | ✅ | ✅ Lines 213-300 | 6 endpoints, all with curls and either real-fixture-shape samples or descriptive prose. |
| Side effects | ⚠️ Optional (usually omit) | ❌ Omitted | ✅ Correctly omitted. |
| Coordination | ⚠️ Optional (usually omit) | ❌ Omitted | ✅ Correctly dropped this iteration. Bullet (1) was producer-side; bullet (2) is now in "What it is". |
| Flows | ⚠️ Optional | ✅ Lines 302-388 | 3 flows: edit a basket product, validate saved provisioning configuration, replace full product set. All `flowchart TD`. ✅ |
| Lessons (hard-won) | ✅ | ✅ Lines 390-422 | 15 problem-shaped entries. No soft prescriptions. |
| Keys by lifecycle phase | N/A | ❌ | ✅ Correctly absent (basketProduct doesn't own keyed config). |

### Content audit

#### Operations / capability coverage

| BE endpoint | Capability row | Verdict |
| --- | --- | --- |
| `GET /basket/{basketId}/products/{basketProductId}` | Capability 1 | ✅ Present — sourced from `product/services.ts:142` |
| `PUT /orders/{basketId}/products/{basketProductId}` | Capability 2 | ✅ Present — sourced from `basketProduct/services.ts:435`, every mutation kind enumerated |
| `DELETE /orders/{basketId}/products/{basketProductId}` | Capability 3 | ✅ Present — sourced from `basketProduct/services.ts:715` |
| `PATCH /orders/{basketId}/provision_fields/values/check` | Capability 4 | ✅ Present — correctly framed as body-less checkout-readiness gate against saved state |
| `GET /orders/{basketId}/products/{basketProductId}/provision_fields/values` | Capability 5 | ✅ Present — was missing in the prior cut |
| `PUT /orders/{basketId}` (products body) | Capability 6 | ✅ Present — destructive contract explicit, three reconciliation rules in the description |

**Coverage: 6 of 6.** Every documented BE endpoint has a capability row; every capability has a BE endpoint. No internal-helper capabilities surviving.

#### Data shape vs source-of-truth

The `BasketProductConfig` type matches the request bodies seen in `services.ts:430` (update) and `services.ts:565` (POST add — though POST is out of scope for this doc, the shape parity holds). `BasketProduct` matches `IBasketProduct` in `packages/types/src/models/baskets.ts:126-211` with the same trim convention as the basket foundation doc (customer-facing fields surfaced, admin-adjacent fields elided with comments).

The pricing-field comment block trims the `configuration_*` fan to a taxonomy rather than enumeration — defensible, consistent with the prior review's verdict.

#### Dependants vs graph

Quick spot-check against `graphify-out/graph.json` (basketProduct → other module references, all relations):

| Module | Doc | Graph (all relations) | Verdict |
| --- | --- | --- | --- |
| `basket` | 4 | 2 | ✅ Within rounding |
| `product` | 3 | 34 | 🟡 Under-weighted (see N1) |
| `recommendations` | 2 | ~ | ✅ Close |
| `invoices` | 2 | ~ | ✅ Close |
| `system` | 2 | ~ | ✅ Close |
| `productCatalogue` | 1 | ~ | ✅ Close |
| `domain` | — | ~ | ✅ Correctly omitted per scope decision |
| `routing` | — | ~ | ✅ Correctly omitted (app-level concern) |

The `product` weight is under-counted (graph shows ~34 cross-module references; doc says 3) — this is a graph-granularity vs file-count distinction the prior audit also encountered. The framing ("re-editing reuses the parsed basket product") is correct; the weight understates the breadth.

#### API endpoints

6 endpoints, methods + URLs verified against `basketProduct/services.ts` (and `product/services.ts:142` for the hydration GET). The provisioning-check fixture confirms body-less call: `tests/__fixtures__/recordings/patch-orders-{basketId}-provision_fields-values-check.json` shows `request.method: "PATCH"` with no body present.

The bulk PUT endpoint has a representative curl + body. No real fixture for the success case captured yet — the response shape matches the basket envelope so the "Response is the refreshed basket" framing is sound, but a future iteration could inline a real capture.

#### Lessons

15 lessons, all problem-shaped. Five spot-checks against the rule's "problem not solution" standard:

| Lesson | Problem-stated? | Solution-leak? | Verdict |
| --- | --- | --- | --- |
| Validity ownership is split | ✅ "drifts out of sync the first time the back end rejects" | None | 🟢 |
| Every mutation triggers a full basket recomputation | ✅ "the platform's responsiveness degrades visibly" — describes cost | None — names debounce / batch / accept as caller choices, doesn't prescribe | 🟢 |
| Bulk product replacement is destructive | ✅ "empties the basket of everything else" | None — closes on the trap, not the solution | 🟢 |
| Provisioning-field validation runs at two distinct moments | ✅ Describes the conflation anti-pattern and its consequences | None | 🟢 |
| Dynamic field references cross product boundaries | ✅ "leaves literal `${...}` strings in the provisioning payload" | None — describes the platform constraint (BE never receives `${...}`) | 🟢 |

**Lessons verdict: 🟢 PASS.**

#### Flows

3 flows: Edit a basket product · Validate the basket's saved provisioning configuration · Replace the basket's full product set.

- Edit flow: shows the GET hydration → assemble config → PUT round-trip with validation branch. ✅
- Validate flow: shows body-less PATCH with the two outcomes; closes by routing failures back to re-edit. ✅
- Replace flow: visualises the three reconciliation rules as branches off the `ok` outcome — `order_product_id` present → in place; absent → fresh id; saved-not-in-payload → removed. The destructive case is the most prominent visual element. ✅

All three use `flowchart TD` per the rule. No producer-side commentary inside any node. Endpoints named on platform-side nodes.

---

## Top 3 priorities (severity × ease)

None are critical or warning-level. Suggestions only:

1. 🟡 **Inline a real bulk-success fixture sample** under the `PUT /orders/{basketId}` (products body) section. The shape is "refreshed basket" so it's correct as-is, but a real capture would make the destructive-contract real for an architect copy-pasting. Capture the next time a bulk test runs.
2. 🟡 **The pricing-field taxonomy could become a small table.** Prior review's S3 — still defensible as a comment block, still worth a future iteration to make scannable in long type listings.
3. 🟡 **Forward reference to `productCatalogue` could be a hard link** when that doc's foundation lands. Currently the in-text reference is plain English; once `productCatalogue/docs/foundation.md` exists, swap to `[productCatalogue](../../productCatalogue/docs/foundation.md)`.

---

## Suggested rule/skill updates

None new from this iteration. The prior basket re-review surfaced three proposed rule additions (sub-track / has-to-verb / over-cap guidance) that remain valid but didn't reappear here because the basketProduct doc dodged them by scope refinement rather than by enforcement.

---

## Appendix A — Source-of-truth references

- `packages/headless/src/modules/basketProduct/services.ts`
  - PUT update @ line 435
  - POST add @ line 570 (out of scope — catalogue → basket)
  - DELETE remove @ line 715
- `packages/headless/src/modules/product/services.ts:142` — GET `basket/{basketId}/products/{basketProductId}` (hydration with catalogue context)
- `packages/headless/src/modules/basket/services.ts:192` — PATCH `/orders/{basketId}/provision_fields/values/check` (body-less)
- `packages/types/src/models/baskets.ts` — `IBasket` (22-99), `IBasketProduct` (126-211), `IBasketPromotion` (101-110)
- `tests/__fixtures__/recordings/patch-orders-{basketId}-provision_fields-values-check.json` — confirms body-less call, `data: null` success shape
- `tests/__fixtures__/recordings/get-orders-{basketId}-products-{bpid}-provision_fields-values.json` — confirms `data: []` empty-state response
- `tests/__fixtures__/recordings/put-orders-63250798-…json` — PUT method confirmation (response shape)
- `tests/__fixtures__/recordings/post-orders-*-error-*.json` — confirms per-product, per-field error envelope keys
- `graphify-out/graph.json` — cross-module reference counts (informational; doc uses file-count weights, not graph edge counts)

---

## Appendix B — Files reviewed

### Rule + writing standards
- `.agent/rules/docs-modules.md`
- `.agent/rules/docs-writing.md`
- `.agent/rules/docs-reviews.md`

### Candidate
- `packages/headless/src/modules/basketProduct/docs/foundation.md` (post-rewrite, 6 capabilities · 3 flows · 15 lessons)

### Prior review
- `docs/audit/basketProduct-foundation-2026-05-15.md` (355 lines)

### Source
- `packages/headless/src/modules/basketProduct/services.ts`
- `packages/headless/src/modules/basketProduct/types.ts`
- `packages/headless/src/modules/product/services.ts` (for the in-basket hydration GET)
- `packages/headless/src/modules/basket/services.ts` (for the body-less provisioning check)

### Types + fixtures
- `packages/types/src/models/baskets.ts`
- `packages/types/src/models/products.ts`
- `tests/__fixtures__/recordings/patch-orders-*-provision_fields-values-check.json`
- `tests/__fixtures__/recordings/get-orders-*-products-*-provision_fields-values.json`
- `tests/__fixtures__/recordings/put-orders-*.json`
- `tests/__fixtures__/recordings/post-orders-*-error-*.json`

### Graph
- `graphify-out/graph.json`

---

## Appendix C — Strip-audit exhaustive list

No hits across any forbidden-pattern family. Grep covering `useX(`, `isReady`, `getConfigValue`, `spawn`, `actor`, `state machine`, `XState`, `TanStack`, `computed`, `ref`, `sub-track`, `subscribes to`, `module emits`, `operation queue`, `pending product`, `provision_field_values_validate`, `configuration model shape`, `configuration state machine`, `Inline edits`, `line product`, `line-product`, `domain registrant`, `has to (invalidate|defer|drop|broadcast|survive|settle)`, `you should`, `you must`, `plan for`, `the cleaner shape`, `the shape that survives`, `our implementation`, `we chose`, `we split` returns zero matches.

---

## Verdict

**Pass.** Overall 95/100, +11 over prior. The scope refinement is the right call — basketProduct now describes "manage products already in a basket" with no catalogue conflation, no producer-side framing, and no internal-flag leaks. Six platform capabilities, six BE endpoints, three flows, fifteen problem-shaped lessons.

The remaining items are all suggestion-level polish: inline a real bulk-success fixture when one's captured, consider a pricing-field taxonomy table, hard-link to `productCatalogue` when that doc lands. None block ship.

Ready for the workshop deliverable.
