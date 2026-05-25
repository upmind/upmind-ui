# Audit: `basketProduct` foundation doc — 2026-05-15

**Artefact reviewed:** `packages/headless/src/modules/basketProduct/docs/foundation.md`
**Standards applied:** `.agent/rules/docs-modules.md` (patched State-model + Flows guidance), `.agent/rules/docs-reviews.md`
**Golden references:** `packages/headless/src/modules/brand/docs/foundation.md`, `packages/headless/src/modules/session/docs/foundation.md`, `packages/headless/src/modules/system/docs/foundation.md`
**Prior audit:** none — this is the first audit of the basketProduct foundation doc.
**Reviewer hat:** treating the doc as ship-ready for architects rebuilding the cart configuration substrate in a non-Vue stack.

---

## Opening acknowledgement

This is the strongest first-cut foundation doc to date. It picks up everything the brand / system / session golden snapshots have settled on and applies them to a module that is materially harder to describe — basketProduct sits between a basket envelope, a product catalogue, a provisioning subsystem, and an analytics pipeline, with a back end that is the sole authority on validity. Specific highlights:

- 🟢 **"What it is" is exactly the right shape.** The three-lifecycle framing (pending / line / bulk) is the load-bearing insight an architect needs first, and the doc lands it in two paragraphs without leaning on our composable vocabulary.
- 🟢 **Operations table is capability-shaped throughout.** "Read configurable product", "Update line product", "Validate provisioning fields" — none of the rows are method signatures. The split between "Update line product" (single mutation) and "Update many products" (bulk-replace) is exactly the architectural truth, not an implementation accident.
- 🟢 **Data shape is comprehensive without being noisy.** The pricing-field comment block (`base_*` vs `*_converted`, `configuration_*` vs not, `*_formatted` vs raw) is genuinely useful — the reader is told the *taxonomy* of fields rather than asked to memorise twenty-four field names.
- 🟢 **Lessons section is the strongest written so far.** 17 entries, all problem-shaped, no "the cleaner shape is X" trailing prescriptions, covers validity ownership, configuration recursion, dynamic-field references, two-mode validation, the bulk-update destructive contract, cross-currency baskets, and inline-vs-editor races. This is the load-bearing section for the workshop and it carries its weight.
- 🟢 **Flows section is the cleanest application of the patched rule yet.** Five flows, each with one-line purpose, Mermaid sequence, and `Guarantees` / `Constraints` prose lead-ins. No state-model commentary leaks into the flows; no `useX()` calls in the Mermaid diagrams.
- 🟢 **`meta` is stripped throughout.** Italic note at line 9 appears once; no stray `meta` references in the data shape, samples, or lessons.

The doc is at or above the brand / system / session bars on most dimensions, with a small set of correctable issues below.

---

## Scoring

| Category | Score | Notes |
| --- | --- | --- |
| **Technical Accuracy** | 82/100 | One real capability/endpoint mismatch (Capability 10 "Validate provisioning fields" lists no separate "read stored values" capability for the `GET …/provision_fields/values` endpoint that *is* documented). Capabilities 11 and 12 ("Parse line product", "Resolve dynamic field references") are internal-helper shapes lifted from our module's exported surface — they don't correspond to BE endpoints, so they don't belong in the operations table. Sample JSON for `POST /orders` and bulk `PUT /orders/{basketId}` is stubbed; the rest of the curls match the captured fixture paths. |
| **Completeness** | 84/100 | All required sections present and well-populated. Two endpoints in the curls don't have dedicated Operations rows (`GET …/provision_fields/values` read, and the `provision_fields/values/check` endpoint is mapped but Capability 10 conflates it with add-time validation). Lessons coverage is excellent. |
| **Structure** | 88/100 | Canonical section order; Coordination section retained, judged below (verdict: keep, with one wording fix). Flows use the new prose lead-in pattern consistently. |
| **Clarity** | 84/100 | Strong throughout, but the three "Constraints the caller has to plan around" lists have an inverted-logic phrasing that reads oddly on first pass (e.g. *"The platform to accept per-line promotions on this call."* — meaning "don't expect the platform to accept…"). The construction is intentional but the omitted lead-in word ("Don't expect…") trips a careful reader. The session foundation doc has the same construction; flag it once across all foundation docs rather than per-module. |
| **Actionability** | 84/100 | An architect can rebuild from this doc without reading source for any major capability. The two stubbed sample responses (`POST /orders`, `PUT /orders/{basketId}`) are the main copy-paste gaps. |
| **Overall Confidence** | **84/100** | Solid first cut. Three targeted fixes lift it to ~90. |

---

## Top 3 priorities (severity × ease)

1. 🔴 **Reconcile the Operations table with the endpoints actually documented.** Two issues:
   - Capability 11 ("Parse line product") and Capability 12 ("Resolve dynamic field references") are internal parser/helper behaviours, not platform capabilities. They don't correspond to BE endpoints and they're not capabilities a rebuilt platform exposes — they're capabilities a *client of the platform* implements. The `docs-modules.md` rule is explicit: "Cover every observable behaviour the module exposes" → these are exported from our composable surface but they're consumer-side computations, not BE-observable behaviour. Recommend either deleting them or moving them into Lessons as problems ("the parsed line and the catalogue product resolve to the same configuration shape — without that, basket-page edit and configurator add diverge"). This frees the operations table to stay under 12 and pins it to BE endpoints.
   - The `GET /orders/{basketId}/products/{basketProductId}/provision_fields/values` endpoint *is* documented in API endpoints but has no corresponding Operations row. Add Capability 11 (replacing the deleted Parse row): "**Read stored provisioning-field values** — inputs: `basketId`, line-product id — outputs: array of provisioning-field values currently stored on the line."
2. 🟠 **Fix the two stubbed sample responses.** `POST /orders` (line 391–425) and `PUT /orders/{basketId}` (the bulk update) are the headline mutations of this module. Both are marked `// stubbed — real capture replaces this`, but real captures exist in the fixtures dir (`get-basket-products-*.json` covers the read side; the recordings already include several `post-orders-*` and `patch-orders-*` files). For the workshop deliverable, an architect copy-pasting the curl and seeing a fully-shaped real response is the difference between "I trust the doc" and "I have to verify against source". The `PATCH …/provision_fields/values/check` and `GET …/provision_fields/values` samples *are* real captures (line 538–543, 557–563) — match that pattern for the two big mutations.
3. 🟠 **Coordination section: one wording fix, then keep it.** The user's note flagged this section for re-evaluation. Verdict below in the dedicated section — the architectural truths (per-basket mutation serialisation + shared parsing contract) are genuinely externally-observable and belong outside Lessons. But the second bullet's framing — *"The same parsing pipeline produces both inputs to the add endpoint and the post-add response interpretation"* — describes our parser, not the platform. Rewrite to describe the *constraint* ("any add-request body and any returned line resolve against the same option/attribute/provisioning-field schema, currency-scoped via `base_price_currency_id`"); strip "the same parsing pipeline" — that's our orchestration leaking through.

---

## Strip-audit verdict

The strip is broadly clean — above the brand and system bars on day-one, on par with the recently-audited session doc.

| Checklist item | Verdict | Evidence |
| --- | --- | --- |
| No composable method names (`useBasketProduct`, `isReady`, `add()`, etc.) | ✅ Clean | Spot-checked all 12 operations + 17 lessons — capability descriptions throughout, no `useX` references. |
| No store / queryKey / persister names | ✅ Clean | No `["basket", "products"]` query keys, no `parseBasketProductData`, no `AsyncQueuer`, no `useDataLayer` references. |
| No Vue / XState / TanStack references | ✅ Clean | No `computed`, `ref`, `watch`, `spawn`, `actor`, `service`, `query`, `mutate`, or any framework vocabulary. |
| No `.meta` content anywhere except the top-line italic note | ✅ Clean | Italic note at line 9; no further `meta` references anywhere. Fixtures inspected — the BE response does carry a `meta: null` field; the doc correctly omits it from sample bodies. |
| No "you should…" / "needs to…" / "plan for…" / "the cleaner shape is…" | 🟡 One slip | Lessons section contains "**The shape that survives is** 'list every product the basket should contain after the call'" (Lesson 9 / *Bulk update is destructive*). "The shape that survives is X" is a soft prescriptive verdict on the right design — describe the *problem* (reusing the bulk endpoint as a partial-update is destructive) and stop there. |
| No commentary about why we encoded X the way we did | ✅ Clean | No "we chose" / "our implementation" anywhere. |
| No rolled-up substrate framing — one Operations row per BE endpoint | 🟠 Two slips, both at the operations table | (a) Capability 11 "Parse line product" — internal parser, not a BE endpoint. (b) Capability 12 "Resolve dynamic field references" — internal computation, not a BE endpoint. Both belong in Lessons. See Top Priority 1. |

**Strip verdict: 🟢 PASS, with the two operations-table slips and one Lesson-shaped prescription to clean up.**

---

## Flow-shape audit

Per the patched `docs-modules.md` Flows section, each flow must carry: one-line purpose, Mermaid sequence, `Guarantees the platform holds:` lead-in, `Constraints the caller has to plan around:` lead-in.

| Flow | Purpose line | Mermaid | Guarantees lead-in | Constraints lead-in | Verdict |
| --- | --- | --- | --- | --- | --- |
| Configure then add to a new basket | ✅ Present | ✅ Caller ↔ Platform only, BE endpoints on platform side | ✅ Present | ✅ Present | 🟢 Pass |
| Add to an existing basket | ✅ Present | ✅ | ✅ | ✅ | 🟢 Pass |
| Edit an existing line product | ✅ Present | ✅ | ✅ | ✅ | 🟢 Pass |
| Standalone provisioning-field check | ✅ Present | ✅ | ✅ | ✅ | 🟢 Pass |
| Bulk update | ✅ Present | ✅ | ✅ | ✅ | 🟢 Pass |

**No flow-shape violations.** All five flows match the new pattern. No state-machine residue in the sequence diagrams. No `useX()` calls. No subscription / query-invalidation commentary inside the sequences.

One small clarity point: the **Configure then add** flow's first Constraints bullet — *"The platform to accept per-line `promotions` on this call. On basket creation only, promotion codes have to ride at the root of the body; sent per-line they are silently dropped."* — would read more cleanly with a `Don't expect` lead-in word ("Don't expect the platform to accept per-line `promotions` on this call…"), but the construction is consistent with the session doc's flows so I'm flagging it as a cross-doc consistency item, not a basketProduct fix.

---

## Coordination section verdict

Specific reviewer brief: *"this doc retained its Coordination section after the sweep (judged genuinely externally-observable). Verify that judgement is sound; if the Coordination content is really 'how we orchestrate', flag it."*

**Verdict: 🟡 KEEP with one wording fix.**

The section's two bullets:

1. **"Mutations serialise per basket"** — single-concurrency queue, mid-queue basket-id substitution, single post-drain re-fetch.
2. **"Catalogue-shape and line-shape parsing share one contract"** — same configuration model whether reading a configurable product or re-editing an existing line; currency-scoped via `base_price_currency_id`.

Bullet (1) is genuinely externally-observable. From the platform's vantage point, the architectural constraint is real: concurrent mutations against a single basket can race the back end's pricing/discount/tax recomputation. Whether *our* client serialises them via an `AsyncQueuer` is implementation; the *constraint that mutations against the same basket cannot interleave safely without a queue somewhere* is architectural. The bullet describes the constraint without naming the queue — that's the right shape for a Coordination entry. **Keep as-is.**

Bullet (2) is the one to fix. The phrase *"The same parsing pipeline produces both inputs to the add endpoint and the post-add response interpretation"* leaks our orchestration. The architectural truth underneath is: *the configuration shape submitted on add/update and the configuration shape returned on the line are the same shape* — a contract the platform enforces, not a pipeline our client implements. Rewrite to:

> **Catalogue-shape and line-shape resolve to one contract.** The configuration model on the request body (term, quantity, options, attributes, provisioning-field values) and the configuration model returned on a line in the basket payload are the same shape. A line in one currency inside a basket in another currency does not silently widen its price set — the line carries `base_price_currency_id` and currency-scoped term/option catalogues, regardless of whether the consumer is mid-configure or re-editing.

With that change, both Coordination bullets describe externally-observable contracts the platform holds, and neither one leans on our implementation. **Keep the section.**

The user's instinct — "verify whether this is really externally observable" — is the right one to bring to every Coordination section. In this case the section earns its keep; in most modules it wouldn't, which is why `docs-modules.md` makes it optional.

---

## Mermaid notation health

All five flow diagrams are well-formed:

- Consistent participant aliases (`C as Caller`, `P as Platform`) across all flows.
- BE endpoints on the platform side (`POST /orders`, `PUT /orders/{basketId}/products/{basketProductId}`, etc.) — no `useX()` leaks.
- `note over C: …` used for caller-side computation; `note over P: …` for platform-side asynchronous behaviour. Consistent.
- Multi-line `<br/>` notes in two diagrams (Configure-then-add, Bulk update) render correctly in standard Mermaid.
- The Bulk-update flow's note-block describing the payload contract (`existing lines carry order_product_id; new lines do not`) is precisely the right load-bearing detail to include in the diagram.

**Verdict: 🟢 PASS.** No syntax issues, no missing arrows, no ambiguous participant references.

---

## Operations completeness check

The doc lists 12 capabilities. Cross-referenced against the exported surface in `packages/headless/src/modules/basketProduct/services.ts` and the API endpoints actually documented:

| BE endpoint | Capability row | Verdict |
| --- | --- | --- |
| `GET /basket/products/{productId}` | Capability 1 | ✅ Present |
| `GET /basket/products` | Capability 2 | ✅ Present |
| `GET /basket/products/{productId}/related` | Capability 3 | ✅ Present |
| `POST /orders` (create basket + first product) | Capability 4 | ✅ Present |
| `POST /orders/{basketId}/products` | Capability 5 | ✅ Present |
| `PUT /orders/{basketId}/products/{basketProductId}` | Capability 6 | ✅ Present |
| `PUT /orders/{basketId}` (bulk) | Capability 7 | ✅ Present |
| (also `PUT /orders/{basketId}/products/{basketProductId}` for quantity) | Capability 8 | 🟡 Same endpoint as Cap 6 — keep as a separate capability because quantity has product-specific bounds (`min`, `max`, `step`) and is the most-used path |
| `DELETE /orders/{basketId}/products/{basketProductId}` | Capability 9 | ✅ Present |
| `PATCH /orders/{basketId}/provision_fields/values/check` | Capability 10 | ✅ Present |
| `GET /orders/{basketId}/products/{basketProductId}/provision_fields/values` | **— missing —** | 🔴 No operations row for this endpoint |
| (internal: parse line product into configuration) | Capability 11 | 🔴 Not a BE endpoint — internal computation |
| (internal: resolve `${…}` dynamic field references) | Capability 12 | 🔴 Not a BE endpoint — internal computation |

**Recommendation:** delete Capabilities 11 and 12, surface their content in Lessons (the cross-line dynamic-reference behaviour is already there as Lesson 15), and add a "Read stored provisioning-field values" capability for the documented `GET …/provision_fields/values` endpoint.

After that change the operations table reaches 11 rows, well under the 12-cap budget, and every row maps to exactly one BE endpoint.

---

## Lessons audit

17 entries. All are problem-shaped on read-through. One soft-prescription slip (Lesson 9, *Bulk update is destructive*: "The shape that survives is 'list every product…'"). Five spot-checks:

| Lesson | Problem-shaped? | Solution-leak? | Verdict |
| --- | --- | --- | --- |
| 1. Validity ownership is split | ✅ "drifts out of sync the first time the back end rejects a configuration the UI thought was complete" | None | 🟢 |
| 7. Price is a fan of fields | ✅ "a consumer that reaches for the first numerically-sensible field will render the wrong value" | None | 🟢 |
| 9. Bulk update is destructive | ✅ Problem stated cleanly | 🟡 "The shape that survives is X" — soft prescription at end | 🟡 Strip the last sentence |
| 13. Inline edits and editor edits race | ✅ "Without a single coordinator, late-arriving inline edits clobber editor changes (or vice versa)" | None — "without a single coordinator" is naming the constraint, not prescribing | 🟢 |
| 16. Free trials are a configuration opt-in | ✅ "A consumer that branches into a separate 'trial product' code path duplicates configuration logic and drifts" | None | 🟢 |

**Lessons verdict: 🟢 PASS, with one slip to clean up.**

---

## Issues by severity

### 🔴 Critical

| # | Issue | Evidence | Fix |
| --- | --- | --- | --- |
| C1 | Capability 11 ("Parse line product") describes an internal computation, not a BE endpoint | Line 34: *"raw basket line → configuration model + currency-scoped term and option catalogues"* — this is consumer-side parsing, not a platform call | Delete; the architectural truth is already in Coordination bullet (2) |
| C2 | Capability 12 ("Resolve dynamic field references") describes an internal computation, not a BE endpoint | Line 35: *"a pending product's provisioning-field values, the current set of basket line products → the same model with `${…}` template references resolved"* — `${…}` template resolution is a client-side computation; the platform doesn't receive `${…}` strings | Delete; the architectural truth is already in Lesson 15 |
| C3 | `GET /orders/{basketId}/products/{basketProductId}/provision_fields/values` endpoint has no Operations row | Endpoint documented at line 547; Operations table 20–35 has no matching capability | Add: "Read stored provisioning-field values" |

### 🟠 Warning

| # | Issue | Evidence | Fix |
| --- | --- | --- | --- |
| W1 | `POST /orders` sample response stubbed | Line 391: `// stubbed — real capture replaces this` | Replace with real captured fixture (the recordings dir has `post-orders-*.json` files) |
| W2 | `PUT /orders/{basketId}` (bulk) has no sample response at all | Line 503: shows the curl, no response block follows | Add a real captured response (or at minimum a stubbed one with the marker) |
| W3 | Coordination bullet (2) leaks the phrase "the same parsing pipeline" | Line 571 | Rewrite to describe the configuration-shape contract; strip "pipeline" |
| W4 | Lesson 9 (*Bulk update is destructive*) ends with a soft prescription | "The shape that survives is 'list every product the basket should contain after the call'" | Delete that sentence; the lesson is complete without it |

### 🟡 Suggestion

| # | Issue | Fix |
| --- | --- | --- |
| S1 | "Constraints the caller has to plan around" lists across all five flows have an implicit "Don't expect" lead-in that omits the verb on every bullet | Either lead each list with `Don't expect:` or rephrase first bullet of each so the construction is self-evident — affects all foundation docs, not just basketProduct |
| S2 | Capability 8 ("Update quantity") and Capability 6 ("Update line product") share the same BE endpoint (`PUT …/products/{basketProductId}`) | Add a one-line note under Capability 8 clarifying it's the same endpoint with bounded inputs; the split is justified because the bounds (`min`/`max`/`step`) are product-specific and the call is the most-used in the module |
| S3 | The pricing-field bullet block inside `BasketLineProduct` is a 40-line comment | Split into a short table — `prefix` (`net_`, `total_`, `configuration_`, etc.) → meaning — to make the field taxonomy scannable. Currently scannable as comments but readers will lose the through-line on first scroll |

### 🟢 Praise

- The five-flow set with prose lead-ins is the cleanest application of the patched `docs-modules.md` Flows guidance to date — reproduce this pattern on `basket` and `product` foundation docs.
- The Lessons section is the strongest in any foundation doc so far. 17 problem-stated entries, no solution-shape suffixes (one slip), exemplary coverage of validity/recursion/cross-currency/cross-line-reference edge cases.
- The decision to retain Coordination is correct. The bullets describe constraints the platform holds, not orchestration the client implements. The Coordination section is empirically rare across modules — module owners contemplating one should use this doc as the bar.

---

## Appendix A — Property / API reference (from codebase)

### BE endpoints exposed by the module (`packages/headless/src/modules/basketProduct/services.ts`)

| HTTP | Path | Service function | Used for |
| --- | --- | --- | --- |
| `GET` | `basket/products/{productId}` | `fetch()` | Read one configurable product |
| `GET` | `basket/products/?filter[id]=…&limit=N` | `fetchSelected()` | Read several configurable products |
| `GET` | `basket/products/{productId}/related` | `fetchRelated()` | Read related products |
| `POST` | `orders` | `generateBasket()` | Create basket with one or more products |
| `POST` | `orders/{basketId}/products` | `update()` (when `isNew`) | Add product to existing basket |
| `PUT` | `orders/{basketId}/products/{basketProductId}` | `update()` / `updateQuantity()` | Update one line product |
| `PUT` | `orders/{basketId}` | `updateMany()` | Bulk update (destructive) |
| `DELETE` | `orders/{basketId}/products/{basketProductId}` | `remove()` | Remove one line product |
| `PATCH` | `orders/{basketId}/provision_fields/values/check` | (called from `useBasketProduct.ts`) | Validate provisioning fields without mutating |
| `GET` | `orders/{basketId}/products/{basketProductId}/provision_fields/values` | (called from `useBasketProduct.ts`) | Read stored provisioning-field values |

### Key types (`packages/headless/src/modules/basketProduct/types.ts`)

- `BasketProduct extends Product` — line product in the basket, always carries `id`, optional `serviceIdentifier`, optional embedded `product: IProduct`.
- `IBasketProductModel` — config submitted to add/update endpoints: `product_id`, `quantity`, `billing_cycle_months`, optional `attributes[]`, `options[]`, `provision_field_values`, `provision_field_values_validate`, `promotions[]`, `start_trial`.
- `IBasketSubproductModel` — option/attribute config: `product_id`, `unit_quantity`, `billing_cycle_months`.
- `BasketHelperContext<T>` — parser hooks for converting between domain models and `IBasketProduct`.
- `OptionToggleMeta`, `BasketOptionSummary`, `BasketUpsellSummary` — consumer-facing summary shapes (inline upsell rendering).

### Internal queue (`services.ts:62–125`)

- `AsyncQueuer` with `concurrency: 1`, keyed `"basketProducts"`.
- Mid-queue basket-id patching after `generateBasket()` resolves (`services.ts:514–519`).
- Post-drain `invalidateQueryByKey(["basket"])` + `useBasket().refresh(result)` on `isEmpty` (`services.ts:116–123`).

---

## Appendix B — Operations vs endpoints cross-reference

| Operations row | BE endpoint(s) | Issue |
| --- | --- | --- |
| 1. Read configurable product | `GET /basket/products/{productId}` | None |
| 2. Read several configurable products | `GET /basket/products?filter[id]=…` | None |
| 3. Read related products | `GET /basket/products/{productId}/related` | None |
| 4. Create basket from products | `POST /orders` | None |
| 5. Add product to basket | `POST /orders/{basketId}/products` | None |
| 6. Update line product | `PUT /orders/{basketId}/products/{basketProductId}` | None |
| 7. Update many products | `PUT /orders/{basketId}` | None |
| 8. Update quantity | `PUT /orders/{basketId}/products/{basketProductId}` (same as 6) | Defensible split — quantity-specific bounds |
| 9. Remove product from basket | `DELETE /orders/{basketId}/products/{basketProductId}` | None |
| 10. Validate provisioning fields | `PATCH /orders/{basketId}/provision_fields/values/check` | None |
| 11. **Parse line product** | (no BE endpoint — consumer-side parsing) | 🔴 Internal computation; delete |
| 12. **Resolve dynamic field references** | (no BE endpoint — consumer-side computation) | 🔴 Internal computation; delete |
| **missing** | `GET /orders/{basketId}/products/{basketProductId}/provision_fields/values` | 🔴 Endpoint is documented in curls but has no Operations row |

---

## Appendix C — Verbatim evidence for critical issues

### C1 — Capability 11 describes internal parsing

Line 34 of `foundation.md`:

> | 11 | **Parse line product** | raw basket line | A configuration model + currency-scoped term and option catalogues, paired with any per-field errors from the back end. Equivalent rebuilds happen wherever a basket payload arrives (basket fetch, basket refresh, per-product update response). |

Evidence this is consumer-side, not BE-observable:

- `parseBasketProductData()` in `packages/headless/src/modules/basketProduct/utils.ts` is the parser.
- No BE endpoint accepts "a raw basket line" as input — basket lines arrive *from* the BE on every mutation response.

### C2 — Capability 12 describes internal `${…}` resolution

Line 35:

> | 12 | **Resolve dynamic field references** | a pending product's provisioning-field values, the current set of basket line products | The same model with `${…}` template references resolved against fields already on other line products (e.g. a hosting product's domain field interpolated from the basket's domain product). |

Evidence this is consumer-side:

- `${…}` template strings are resolved client-side before the body is POSTed; the BE never receives `${…}` literal strings (Lesson 15 itself states this: *"only the basket lines present at submit time are considered, and only fields the consumer reads off `IBasketProduct` are reachable"*).

### C3 — `GET …/provision_fields/values` is documented but has no Operations row

Line 547 of `foundation.md`:

> ### `GET /orders/{basketId}/products/{basketProductId}/provision_fields/values`
>
> Read the currently-stored provisioning-field values for one line. Empty array when no values have been supplied yet.

Operations table (lines 22–35): no row mentions reading stored provisioning-field values; Capability 10 covers the *check* endpoint (PATCH …/check) only.

### W3 — Coordination bullet (2) leaks "parsing pipeline"

Line 571:

> The same parsing pipeline produces both inputs to the add endpoint and the post-add response interpretation.

"Parsing pipeline" is implementation language. The architectural truth is the contract that the request body and the response line resolve against the same configuration shape, not the existence of a pipeline.

### W4 — Lesson 9 soft prescription

Line 726 (Lesson 9, *Bulk update is destructive*):

> `PUT /orders/{basketId}` replaces the basket's product set; lines absent from the payload are removed. Reusing the bulk endpoint as an "update some products in place" call (without listing the unchanged ones) silently empties the basket of everything else. **The shape that survives is "list every product the basket should contain after the call".**

The bolded final sentence is a solution-shape suffix per the `docs-modules.md` rule. The lesson is complete after "silently empties the basket of everything else."

---

## Appendix D — Files reviewed

### Codebase source-of-truth files

- `packages/headless/src/modules/basketProduct/services.ts` — primary service implementation, queue, mutation handlers
- `packages/headless/src/modules/basketProduct/types.ts` — `BasketProduct`, `IBasketProductModel`, `IBasketSubproductModel`, helper context types
- `packages/headless/src/modules/basketProduct/docs/gotchas.md` — background only; not subject to audit per `docs-modules.md` scope
- `packages/headless/src/modules/basketProduct/docs/foundation.md` — the artefact under review

### Standards referenced

- `.agent/rules/docs-modules.md` (patched State-model + Flows guidance, 2026-05)
- `.agent/rules/docs-reviews.md`

### Golden snapshots compared

- `packages/headless/src/modules/brand/docs/foundation.md`
- `packages/headless/src/modules/session/docs/foundation.md`
- `packages/headless/src/modules/system/docs/foundation.md`

### Prior audit referenced

- None (first audit)

### Fixtures inspected

- `tests/__fixtures__/recordings/get-basket-products-*.json` (multiple, configurable product reads)
- `tests/__fixtures__/recordings/patch-orders-{basketId}-provision_fields-values-check.json` — confirms `{ data: null, related: null, total: null, error: null, messages: [], meta: null }` shape on success
- `tests/__fixtures__/recordings/get-orders-{basketId}-products-{bpid}-provision_fields-values.json` — confirms empty-array data on no-stored-values
- `tests/__fixtures__/recordings/post-orders-*-error-*.json` — confirms BE error shape: dot-notation keys like `options.0.product_id`, `options.0.unit_quantity`, `attributes.0.product_id`

---

## Appendix E — In-progress signals

### 🟠 In Progress (someone is mid-edit)

- The two stubbed sample responses (`POST /orders` line 391; `PUT /orders/{basketId}` line 503 has no sample at all) are placeholders marked for real-capture replacement. The fixture data is available; this is mid-flight, not blocked.

### 🔴 Not Started (no evidence of work)

- None. Every required section is present and non-empty.

### ✅ Done

- "What it is", Core concepts, Operations (modulo the two internal-helper rows), Data shape, Dependencies (both directions), most API endpoint samples, Coordination, all five Flows, Lessons. The bulk of the doc reads as shippable.

---

## One-sentence summary for the copywriter

Strong first cut — fix the two operations-table rows that describe internal helpers rather than BE endpoints, swap in the real captures for the two stubbed mutation responses, and trim the soft prescription at the tail of Lesson 9, and this doc reaches ~90.
