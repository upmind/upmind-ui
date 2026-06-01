# Audit: `basket` foundation doc — 2026-05-15 (r2)

**Module:** `basket`
**Candidate:** [`packages/headless/src/modules/basket/docs/foundation.md`](../../packages/headless/src/modules/basket/docs/foundation.md)
**Golden:** none (no `docs/workshop/archive/basket.md`)
**Prior review:** [`docs/audit/basket-foundation-2026-05-15.md`](basket-foundation-2026-05-15.md)
**Reviewer hat:** evaluating candidate as the second cut, after the first audit's three top fixes plus collateral cleanup.
**Standards applied:** `.agent/rules/docs-modules.md`, `.agent/rules/docs-reviews.md`, `.agent/rules/docs-writing.md`.

---

## Executive summary

The candidate landed all three top-priority fixes from the prior review (PUT vs PATCH, dependants regen, missing data-shape fields) and most of the warnings. Mermaid diagrams have correctly migrated from `sequenceDiagram` to `flowchart TD` per the updated rule. Three of the four flagged soft-prescriptive sentences are gone. **However**, new strip leaks have surfaced in the Lessons section — `sub-track`, `subscribes to`, and `session module emits AUTHENTICATED` are reactive-stack / our-orchestrator vocabulary the rule explicitly forbids — and the regenerated dependants table still doesn't match `graphify-out/graph.json`. Capability count crept from 12 → 13, breaching the rule's "Max 12" cap. `PATCH /orders/{id}/convert` remains stubbed despite being the architectural climax of the basket lifecycle.

### Scoring (with delta vs prior review)

| Category | Prior | Current | Δ | Notes |
| --- | --- | --- | --- | --- |
| **Technical accuracy** | 82 | 88 | **+6** | PUT/PATCH fixed across all sites. Data shape adds `display_status`, `pricelist_id`, `partial_amount_to_credit_*` formatted/converted pair. `object_meta` acknowledged in the italic note. Two provision-fields fixtures inlined as real captures. Dependants still drift from the graph (see C2 below). |
| **Completeness** | 86 | 92 | **+6** | Capability 13 (`POST /orders`) added per W4. Brand cross-link added per S1. Lifecycle "always-on" sub-list preserved. Convert / currency / promotions / warning samples still stubbed. |
| **Structure** | 92 | 93 | **+1** | Canonical order intact. `flowchart TD` migration complete (7/7 flows). State model + Coordination still correctly omitted. One row over the 12-capability cap. |
| **Tone** | 90 | 92 | **+2** | Three of four soft-prescriptive sentences fixed. **Lesson 14 ("Tax behaviour reads from three places") still contains "has to invalidate"** — the prior review missed it; this review catches it. New reactive-stack vocabulary in Lessons (`sub-track`, `subscribes to`) is a regression rather than a polish gap. |
| **Actionability** | 84 | 90 | **+6** | Copy-paste safe except for the four still-stubbed mutation endpoints. The `convert` stub is the costliest gap — architects rebuilding will rely on the doc's claimed payload shape for the most complex call. |
| **Overall** | **87** | **91** | **+4** | Strong second cut. Two focused fixes (strip leaks, dependants regen) lift to ~94. **Verdict: pass with fixes.** |

---

## Part 1 — Delta vs prior review

### Prior-issue status

| Prior ID | Issue | Status | Evidence |
| --- | --- | --- | --- |
| 🔴 **C1** | `PATCH /orders/{id}` should be `PUT /orders/{id}` (billing + fields) | ✅ **FIXED** | Candidate line 697 now reads `### PUT /orders/{id}`. Both curl blocks (lines 703, 713) use `-X PUT`. Matches `billing/services.ts:120` and `fields/services.ts:107`. |
| 🔴 **C2** | Dependants table mis-weighted; missing `product`, `config`, `invoices`; under-weighted `product` 18× | 🟡 **PARTIAL** | Table regenerated and meaningfully larger (9 module rows + presentation layer). `basketProduct: 21` and `routing: 2` align with graph (basketProduct=20, routing=2). But `domain: 8` (graph: 2), `recommendations: 4` (graph: 1), `productCatalogue: 3` (graph: 5), `brand: 1` (graph: 7), `system: 2` (graph: 25 — though doc's "analytics" framing is correct). `client: 22` and `session: 17` from the graph are missing from the table with no footnote justification. |
| 🔴 **C3** | `config` ambiguity (basket sub-module vs top-level module) | ✅ **FIXED** | Lines 472-476 footnote now explicitly names `basketProduct, payment, paymentDetails, config` as distinct top-level modules at `packages/headless/src/modules/<name>/` and clarifies `config` (the UI override module) does not import basket. Architecturally correct. |
| 🟠 **W1** | Five data-shape fields trimmed without disclaimer | ✅ **FIXED** | Lines 61 (`display_status: string`), 67 (`pricelist_id: string`), 139-144 (`partial_amount_credited_*` and `partial_amount_to_credit_*` formatted/converted pair) all added. Italic note at line 7 now covers both `meta` and `object_meta`. |
| 🟠 **W2** | Five stubbed samples with real fixtures available | 🟡 **PARTIAL** | Provision-fields check (lines 819-828) and provision-fields per-product read (lines 839-848) now use real fixture payloads. PUT `/orders/{id}` response is not inlined but the doc cites the fixture path (line 722). Convert (line 869), currency (line 736), promotion add (line 752), promotion delete (line 786), warnings-hide (line 885) all remain stubbed. |
| 🟠 **W3** | Inline comment syntax slip `net_amount: number; numeric values` | ✅ **FIXED** | Line 94 is clean — no stray fragment. |
| 🟠 **W4** | `POST /orders` lacked an Operations-table row | ✅ **FIXED** | Capability 13 (line 35) added with a clear "implicit creation handles most flows" disclaimer. **Side effect: capability count is now 13, over the rule's 12 cap (see N3).** |
| 🟠 **W5** | Three soft-prescriptive sentences (Lesson 8, Flow 3, Lesson 17) | 🟡 **PARTIAL** | Lesson 8 rewritten as problem ("A basket refresh needs an 'intent' signal that fires before the network response"). Flow 3 rewritten (`Defer fetch — guest cannot read another actor's basket`). Lesson 17 rewritten ("Local-only logout leaves the basket on screen"). **But** Lesson 14 ("Tax behaviour reads from three places", line 1119) now contains "Changing the billing address **has to invalidate** the running tax breakdown" — same forbidden pattern, missed by prior review. |
| 🟡 **S1** | Add cross-link to brand hot-keys table | ✅ **FIXED** | Line 486 cross-link with relative path to `brand/docs/foundation.md` and explicit list of the five keys basket reads. |
| 🟡 **S2** | `<br/>` in Mermaid messages → `note over` blocks | N/A | Diagrams migrated to `flowchart TD`; `<br/>` is now the canonical line-break inside node labels per the rule. No longer applicable. |
| 🟡 **S3** | Inline real provision-fields-check fixture | ✅ **FIXED** | Lines 819-828 use real payload. |
| 🟡 **S4** | `object_meta` note | ✅ **FIXED** | Italic note at line 7 covers both fields. |
| 🟡 **S5** | Capture a real `PATCH /orders/{id}/convert` fixture | ❌ **NOT FIXED** | Line 869 still `// stubbed — real capture replaces this.` |
| 🟡 **S6** | Note that capability 10 folds two BE calls | ✅ **FIXED** | Capability 10 row (line 32) now spells out both calls explicitly. |

**Summary:** 9 ✅ FIXED · 3 🟡 PARTIAL · 1 ❌ NOT FIXED · 1 N/A. No regressions on prior issues.

### New issues introduced since prior review

- 🟠 **N1 — Reactive-stack vocabulary in Lessons:** `sub-track` / `sub-tracks` appears 5 times across Operations (line 40) and Lessons (lines 1093, 1105, 1125). Prior review didn't catch this. The rule's strip list forbids "scoped composables" and the spirit of "no orchestrator framing" — `sub-track` is exactly our orchestrator's framing.
- 🟠 **N2 — `subscribes to` and `session module emits AUTHENTICATED` in Lessons:** Line 1125 reads "Without an explicit UNAUTHENTICATED signal that the basket subscribes to". Line 1093 reads "The session module emits AUTHENTICATED, the basket runs claim". Both are reactive-stack / actor-model implementation vocabulary the rule forbids.
- 🟠 **N3 — Capability count: 13 over the 12 cap.** Operations table (lines 21-35) lists capabilities 1–13. Rule says "Max 12 capabilities per module" verbatim. Capabilities 1 ("Read current basket") and 2 ("Read specific basket by id") are the same BE endpoint family (`GET /orders/{id}`) with a path variation; folding them is the natural way to reclaim the slot. Alternatively, capability 13 ("Explicitly create a basket") can sit under the "Additional always-on behaviours" sub-list since it's an explicit-counterpart to implicit creation, which the doc already documents there.
- 🟡 **N4 — Lesson 14 missed "has to invalidate"** — see W5 status above.
- 🟡 **N5 — Operations row 11 mentions "all sub-tracks settled"** as an input precondition. Same `sub-track` leak as N1, restricted to a single cell but worth catching.

### New strengths

- 🟢 The `flowchart TD` migration is complete and consistent. All 7 flows use rounded `([...])` for entry/terminal states, square `["..."]` for actions, diamond `{...}` for decisions, and `subgraph` for the payment-gateway boundary in Flow 7. Exemplary adoption of the new rule.
- 🟢 The basketProduct dependant row (weight 21) correctly flags the architectural quirk that basketProduct is a separate top-level module operating against `/orders/{basketId}/products` — addresses C3 cleanly without dodging the graph.
- 🟢 The capability 13 disclaimer ("the explicit POST is for flows that need to materialise a basket id *before* products are added") is the right architectural framing — describes the constraint, not our choice.
- 🟢 The `Keys by lifecycle phase` cross-link to `brand/docs/foundation.md` at line 486 is the cleanest module-to-module reference in any foundation doc to date. Adopt this pattern.

---

## Part 2 — Fresh full audit

### Strip audit

Severity-marked findings against the rule's forbidden patterns. Line citations are absolute against the candidate.

| Pattern family | Hits | Severity | Evidence |
| --- | --- | --- | --- |
| Composable method names (`useBasket`, `isReady`, `getConfigValue`) | 0 | ✅ Clean | Spot-checked all 13 capabilities, 7 flows, 26 lessons — no `useX()` references survive. |
| Store / queryKey / persister names | 0 | ✅ Clean | No `["basket", "current"]`, no `mutationKey`, no `localStoragePersister`. Codebase has these throughout `services.ts` — none leaked. |
| Vue / XState / TanStack framework terms | 0 in body | ✅ Clean | No `computed`, `ref`, `watch`, `spawn`, `actor`, `queryClient`, `staleTime`. The word `actor` appears 5 times (`actor swap`, `calling actor`, `actor_type: client`, `another actor's basket`) — all platform-level BE concepts (the actor-type token model), not XState actors. Acceptable. |
| `.meta` content outside italic note | 0 | ✅ Clean | Italic note at line 7 covers both `meta` and `object_meta`. No `meta.cart`, `meta.uischema`, `meta.i18n`, no UI-override framing anywhere else. |
| Prescriptive verbs ("you should", "you must", "plan for") | 0 | ✅ Clean | Zero hits. |
| "has to do X" / "needs to" / "the cleaner shape" | 1 | 🟠 Warning | Line 1119 "Changing the billing address **has to invalidate** the running tax breakdown". Rewrite as "Changing the billing address invalidates the running tax breakdown — the same line item priced for one country resolves to a different tax outcome priced for another." |
| Meta-commentary ("our implementation", "we chose") | 0 | ✅ Clean | No first-person commentary. |
| Reactive-stack / orchestrator vocab (`sub-track`, `subscribes to`, `machine emits`, `subscription`) | 7 | 🟠 Warning | Line 33 "all sub-tracks settled" (Operations 11 input). Line 40 "broadcast a 'basket is updating' signal to every sub-track" (Refresh always-on). Line 1093 "The session module emits AUTHENTICATED" + "downstream sub-tracks (billing, payment-method) never spawn" (Lesson 2). Line 1105 "Multiple sub-tracks (currency, promotions, custom fields, billing, payment-method)" (Lesson 8). Line 1125 "the basket subscribes to" + "the loaded basket, its sub-track state" (Lesson 17). |

**Strip verdict: 🟡 Two correctable cleanups.** The strip is otherwise the cleanest in any foundation doc. The `sub-track` leak is a single concept that recurs in 5 places — one search-and-replace pass would resolve it.

### Section audit (canonical order)

| Section | Required? | Present? | Justified? |
| --- | --- | --- | --- |
| Header (`# Module: basket`) | ✅ | ✅ Line 1 | — |
| What it is | ✅ | ✅ Lines 3-7 | One-paragraph domain framing + italic meta note. ✅ |
| Core concepts | ⚠️ Optional | ✅ Lines 9-17 | Seven terms (Basket, Current basket, Claim, Basket product, Promotion, Warning note, Summary). Each definition is plain English. ✅ Justified. |
| State model | ⚠️ Optional (usually omit) | ❌ Omitted | ✅ Correctly omitted. The basket has BE-defined `status` enum values surfaced inline in the Data shape — promoting them to a section would be over-fit. |
| Operations | ✅ | ✅ Lines 19-41 | 13 capabilities + 3 always-on. **Capability count over the 12 cap (see N3).** |
| Data shape | ✅ | ✅ Lines 43-453 | Six type blocks (Basket, BasketProduct, BasketPromotion, WarningNote, AppliedTax, mutation bodies). Inline comments throughout. ✅ |
| Dependencies (dependants + own) | ✅ | ✅ Lines 455-486 | Dependants table 9 rows + presentation layer. Footnote on internal sub-dirs and config ambiguity. Own dependencies bulleted with brand-config-key cross-link. **Weight drift vs graph (see C2 status).** |
| API endpoints | ✅ | ✅ Lines 488-887 | 13 endpoints (one per BE call). Curls and sample bodies for each. **Four mutation samples still stubbed.** |
| Side effects | ⚠️ Optional (usually omit) | ❌ Omitted | ✅ Correctly omitted. |
| Coordination | ⚠️ Optional (usually omit) | ❌ Omitted | ✅ Correctly omitted. |
| Flows | ⚠️ Optional (include for multi-step) | ✅ Lines 889-1087 | Seven flows: anonymous browse + add, guest→client claim, deep-link, currency switch, promotion apply/remove, configure-then-add, convert + pay. All `flowchart TD`. ✅ |
| Lessons (hard-won) | ✅ | ✅ Lines 1089-1141 | 26 problem-shaped entries. **One soft-prescription slip (N4) and several `sub-track` leaks (N1).** |
| Keys by lifecycle phase | N/A (brand owns config) | ❌ | ✅ Defensible. Brand-config cross-link at line 486 handles this. |

### Content audit

#### Operations / capability coverage

13 capabilities map to 13 BE endpoints. Capability 10 explicitly folds two endpoints (`PATCH /orders/{id}/provision_fields/values/check` + `GET /orders/{id}/products/{basketProductId}/provision_fields/values`) into one row — defensible because the check is a precondition for the read and the row explicitly says so. **Capability 13 (`POST /orders`) is the marginal entry pushing over the 12 cap.**

#### Data shape vs source-of-truth

Cross-referenced against `packages/types/src/models/baskets.ts`:

- `IBasket` (typed) has ~99 fields. Candidate covers ~95 (typed contract + fixture wire shape union).
- `display_status: string` (line 61) — wire-only field, not in typed `IBasket`. Per the rule's "follow the fixture where typed contract is narrower" carve-out, ✅ correct.
- `pricelist_id: string` (line 67) — in `IBasket` as `pricelist_id: IPricelist["id"]`. ✅ correct.
- `payment_currency: Currency | null` (line 74) — fixture has the expanded object; typed `IBasket` only has the id pair. Doc follows fixture. ✅ correct.
- `partial_amount_to_credit_*` and `partial_amount_credited_*` formatted/converted pairs (lines 139-144) — all present in fixture, ✅ now in doc.

No new fixture-trim gaps found.

#### Dependants vs graph (`graphify-out/graph.json`)

Computed from `graphify-out/graph.json` (all relations, source = basket file, target = non-basket module file):

```
system: 25 · client: 22 · basketProduct: 20 · session: 17 · checkout: 11 ·
billing: 8 · brand: 7 · query: 6 · paymentDetails: 5 · productCatalogue: 5 ·
feedback: 5 · product: 4 · invoices: 2 · domain: 2 · routing: 2 ·
payment: 2 · dataManager: 2 · recommendations: 1
```

| Module | Doc weight | Graph weight | Verdict |
| --- | --- | --- | --- |
| `basketProduct` | 21 | 20 | ✅ Within rounding |
| `domain` | 8 | 2 | 🔴 Over-weighted 4× — drift not justified |
| `product` | 5 | 4 | ✅ Within rounding |
| `recommendations` | 4 | 1 | 🔴 Over-weighted 4× |
| `invoices` | 3 | 2 | ✅ Within rounding |
| `productCatalogue` | 3 | 5 | 🟠 Under-weighted |
| `routing` | 2 | 2 | ✅ Match |
| `system` | 2 | 25 | 🟠 Under-weighted; doc's "analytics" framing is correct but the weight understates the fan-in |
| `brand` | 1 | 7 | 🟠 Under-weighted; doc says "basket-driven currency switching" which is real (brand currency-resolution reads basket currency for theming) |
| `client` | — | 22 | 🔴 Missing entirely from doc, no footnote justifying exclusion. Client-module reads of basket are real (user-context resolution at checkout time). |
| `session` | — | 17 | 🔴 Missing entirely from doc, no footnote justifying exclusion. Session-module reads of basket exist (claim coordination, refresh on AUTHENTICATED). |
| `checkout` | — | 11 | 🟠 Missing — could be classified as presentation-layer if `checkout/` is the cart-UI module, but the doc's "Presentation layer" row is generic and doesn't name checkout. |
| `query` | — | 6 | ✅ Correctly excluded per footnote (transport layer). |

**Verdict on dependants:** The table is regenerated but still authored from a mix of intuition and graph data. The `client` and `session` omissions are the most architecturally misleading — both are real, cross-module headless dependants. The `domain` over-weight and `recommendations` over-weight are unexplained.

#### API endpoints

13 endpoints, all method + URL match `services.ts` and sub-module services. Four mutation samples remain stubbed (currency, promotion add/delete, convert, warnings-hide). The `PATCH /orders/{id}/convert` stub is the architectural priority — capturing this fixture would close the largest remaining actionability gap.

#### Lessons

26 problem-shaped entries. Strong material throughout. One soft-prescription slip (N4). Multiple `sub-track` / `subscribes to` leaks (N1, N2). The "Promotion adjustments can rewrite the basket reference" (Lesson 26) and "The basket id changes on conversion" (Lesson 24) are the most valuable platform-quirk lessons — keep this bar.

---

## Top 3 priorities (severity × ease)

1. 🟠 **Strip `sub-track` / `subscribes to` / `session module emits` reactive-stack vocabulary** from Operations row Refresh (line 40), Operations row 11 input cell (line 33), Lesson 2 (line 1093), Lesson 8 (line 1105), Lesson 17 (line 1125). One search-and-replace pass rewrites each in BE-/platform-neutral terms ("downstream consumers", "modules reading basket state", "the basket is invalidated when…").
2. 🟠 **Resolve the 13-capability count and the dependants drift.** Fold capability 1 + capability 2 into a single "Read a basket" row (both hit `GET /orders/{id}`, with capability 1 being the `id = current` alias). And/or move capability 13 (`POST /orders`) into the "Additional always-on behaviours" sub-list since it's the explicit counterpart to implicit creation. Separately, add `client` and `session` rows to the dependants table (or footnote their exclusion), reconcile `domain` and `recommendations` weights against the graph numbers above.
3. 🟡 **Rewrite Lesson 14 "has to invalidate"** → "Changing the billing address invalidates the running tax breakdown — not just the address field — because the same line item priced for one country resolves to a different tax outcome priced for another." And capture the real `PATCH /orders/{id}/convert` fixture to retire the convert stub.

---

## Suggested rule/skill updates

Two reproducible patterns surfaced across the prior review and this one. Both warrant rule updates:

### Proposal A — Add explicit forbidden term: `sub-track`

The prior review accepted "broadcast a basket is updating signal" because the verb itself is descriptive. But the recurring noun `sub-track` (= our orchestrator's name for child services spawned by the basket machine) leaked through 5 separate places in this candidate alone. It is not currently on the strip list.

**Proposed addition to `.agent/rules/docs-modules.md` under "Framework / library choices":**

```diff
 - ❌ XState machines, actors, services, guards, spawn
 - ❌ TanStack Query, query keys, refetch, persisters
 - ❌ Scoped composables (`useX().as('client')`)
+- ❌ Orchestrator framing words from our machines: `sub-track`, `sub-machine`,
+      `child service`, `subscribes to`, `module emits`, `actor swap`
+      (when used to describe our orchestrator rather than the BE actor model)
```

### Proposal B — Add explicit forbidden suffix: "X has to invalidate / has to settle / has to survive"

The current rule lists "the X has to do Y" as a forbidden pattern in Lessons but doesn't enumerate the specific verbs that recur. The prior review caught "has to broadcast / defer / drop"; this review caught "has to invalidate" and "Optimistic merges have to survive" (Lesson 9, line 1107) is borderline.

**Proposed addition to `.agent/rules/docs-modules.md` under "What To Strip › Implementation patterns presented as requirements":**

```diff
 - ❌ "Everyone awaits `isReady()` before initialising"
 - ❌ "You should..." / "every consumer must..." / "plan for X early"
 - ❌ "The cleaner shape is X"
 - ❌ "If you implement one thing first, build Y"
+- ❌ "X has to <verb>" where <verb> is invalidate / settle / survive /
+      broadcast / defer / drop / refresh — these are constraint statements
+      framed as imperatives. Rewrite as the factual constraint:
+      ✅ "Changing the billing address invalidates the tax breakdown because…"
```

### Proposal C — Add a section limit re-iteration: max 12 capabilities

The rule already says "Max 12 capabilities per module" but doesn't explicitly tell producers how to handle the case where a 13th BE call surfaces during iteration. Both basket and (per related reviews) other modules have hit this. **Proposed clarification:**

```diff
 - **Cover every observable behaviour the module exposes**…
 - Max 12 capabilities per module.
+- When a module exposes 13+ BE calls, fold related calls into a single
+  capability row (e.g. capabilities that share the same endpoint family with
+  a path variation — `GET /orders/current` and `GET /orders/{id}` — collapse to
+  one "Read a basket" row with both inputs noted) or move lifecycle-shaped
+  capabilities to the "Additional always-on behaviours" sub-list.
 - No method names.
```

These are proposals only — I have not edited the rule or skill. The user reviews and approves before any rule edit.

---

## Appendix A — Source-of-truth references

- `packages/types/src/models/baskets.ts` — `IBasket` (lines 22-99), `IBasketProduct` (126-211), `IBasketPromotion` (101-110), `IWarningNote` (112-118), `IBasketCategory` (120-124)
- `packages/types/src/data/enums/tokens.ts` — `GrantTypes` enum used in flow node labels
- `packages/types/src/models/contexts.ts` — `Contexts` enum (GUEST / CLIENT actor slugs)
- `packages/types/src/models/promotions.ts` — `IPromotion` shape
- `packages/headless/src/modules/basket/services.ts` — endpoint method verification (GET `/orders/current`, PATCH `/orders/claim`, PATCH `/orders/{id}/convert`, PATCH `/orders/{id}/provision_fields/values/check`, GET `/orders/{id}/products/.../provision_fields/values`, PUT `/orders/{id}/warnings/hide`)
- `packages/headless/src/modules/basket/billing/services.ts:120` — PUT `/orders/{id}` (billing body)
- `packages/headless/src/modules/basket/fields/services.ts:107` — PUT `/orders/{id}` (fields body), GET `/basket_fields`
- `packages/headless/src/modules/basket/currency/services.ts:73` — PUT `/orders/{id}/currency`
- `packages/headless/src/modules/basket/promotions/services.ts:54,78` — POST + DELETE `/orders/{id}/promotions`
- `tests/__fixtures__/recordings/get-orders-current.json` — full 200 payload
- `tests/__fixtures__/recordings/patch-orders-claim.json` — claim 200 payload
- `tests/__fixtures__/recordings/post-orders.json` — explicit create 200 payload
- `tests/__fixtures__/recordings/put-orders-63250798-…json` — billing/fields PUT 200 confirms method
- `tests/__fixtures__/recordings/patch-orders-…-provision_fields-values-check.json` — provision check 200
- `tests/__fixtures__/recordings/get-orders-…-products-…-provision_fields-values.json` — per-product provision read 200
- `tests/__fixtures__/recordings/get-basket_fields.json` — basket fields 200 (empty)
- `graphify-out/graph.json` — cross-module imports / references (2134 nodes, 6383 links). Cross-module weights for `modules/basket/` computed at the top of Part 2.

---

## Appendix B — Verbatim evidence

### N1 — `sub-track` reactive-stack vocabulary

Candidate line 33 (Operations row 11 input cell):
> `basket (must have products, billing, payment method selected, all sub-tracks settled)`

Candidate line 40 (Operations always-on Refresh):
> `Refresh — re-fetch the basket and broadcast a "basket is updating" signal to every sub-track so they can stage their own state ahead of the new data landing.`

Candidate line 1093 (Lesson 2):
> `A refresh that skips claim produces a client-scoped basket read with no client_id on the underlying record, and downstream sub-tracks (billing, payment-method) never spawn because they require a claimed basket.`

Candidate line 1105 (Lesson 8):
> `Multiple sub-tracks (currency, promotions, custom fields, billing, payment-method) and external consumers (recommendations, route guards, analytics) all hold their own derived state off the basket.`

Candidate line 1125 (Lesson 17):
> `the loaded basket, its sub-track state, and any optimistic merges in flight all remain in memory. Without an explicit UNAUTHENTICATED signal that the basket subscribes to…`

### N2 — `session module emits AUTHENTICATED`

Candidate line 1093 (Lesson 2):
> `The session module emits AUTHENTICATED, the basket runs claim, and then any subsequent refresh path…`

Rule context: this is naming our event vocabulary (`AUTHENTICATED` is an event from the session machine). The platform fact is "after a successful password-grant login". Rewrite as: "After a successful authentication, the basket runs claim, and any subsequent refresh path back to `orders/current` must also re-attempt claim…"

### N3 — Capability count: 13 over the 12 cap

Candidate lines 21-35 — Operations table rows numbered 1-13. Rule (`.agent/rules/docs-modules.md` line 169):
> `Max 12 capabilities per module.`

### N4 — "has to invalidate" in Lesson 14

Candidate line 1119:
> `Tax behaviour reads from three places. Tax-inclusion policy on the brand, the per-client tax exemption flag, and the basket's billing address all contribute to which taxes apply. Changing the billing address has to invalidate the running tax breakdown — not just the address field — because the same line item priced for one country resolves to a different tax outcome priced for another.`

Rule context (line 260): `No solution-shape suffixes. Forbidden patterns include "the cleaner shape is X", "the natural separation is Y", "the X has to do Y"…`

---

## Appendix C — Files reviewed

### Rule + writing standards
- `.agent/rules/docs-modules.md`
- `.agent/rules/docs-writing.md`
- `.agent/rules/docs-reviews.md`

### Candidate
- `packages/headless/src/modules/basket/docs/foundation.md` (1142 lines)

### Prior review
- `docs/audit/basket-foundation-2026-05-15.md` (538 lines)

### Source
- `packages/headless/src/modules/basket/services.ts`
- `packages/headless/src/modules/basket/billing/services.ts`
- `packages/headless/src/modules/basket/currency/services.ts`
- `packages/headless/src/modules/basket/fields/services.ts`
- `packages/headless/src/modules/basket/promotions/services.ts`
- `packages/headless/src/modules/basket/basket.machine.ts`
- `packages/headless/src/modules/basket/types.ts`
- `packages/headless/src/modules/basket/README.md` (cross-reference for internal-doc separation)

### Types + enums
- `packages/types/src/models/baskets.ts`
- `packages/types/src/models/promotions.ts`
- `packages/types/src/models/contexts.ts`
- `packages/types/src/data/enums/tokens.ts`

### Fixtures (recordings)
- `tests/__fixtures__/recordings/get-orders-current.json`
- `tests/__fixtures__/recordings/get-basket_fields.json`
- `tests/__fixtures__/recordings/patch-orders-claim.json`
- `tests/__fixtures__/recordings/post-orders.json`
- `tests/__fixtures__/recordings/put-orders-63250798-065d-1e20-388f-8174e234e98d.json`
- `tests/__fixtures__/recordings/patch-orders-…-provision_fields-values-check.json`
- `tests/__fixtures__/recordings/get-orders-…-products-…-provision_fields-values.json`

### Graph
- `graphify-out/graph.json` (cross-module edge analysis for `modules/basket/` as source)

---

## Appendix D — Strip-audit exhaustive list

| Line | Phrase | Pattern | Severity |
| --- | --- | --- | --- |
| 33 | `all sub-tracks settled` | Orchestrator framing | 🟠 N1 |
| 40 | `broadcast a "basket is updating" signal to every sub-track` | Orchestrator framing | 🟠 N1 |
| 1093 | `The session module emits AUTHENTICATED` | Our event vocabulary | 🟠 N2 |
| 1093 | `downstream sub-tracks (billing, payment-method) never spawn` | Orchestrator framing + `spawn` | 🟠 N1 |
| 1105 | `Multiple sub-tracks (currency, promotions, custom fields, billing, payment-method)` | Orchestrator framing | 🟠 N1 |
| 1119 | `Changing the billing address has to invalidate the running tax breakdown` | "X has to <verb>" prescription | 🟠 N4 |
| 1125 | `the basket subscribes to` | Reactive-stack vocab | 🟠 N2 |
| 1125 | `its sub-track state` | Orchestrator framing | 🟠 N1 |

All other strip categories (composable method names, queryKey names, Vue / TanStack vocab, `.meta` outside note, prescriptive verbs, meta-commentary) — ✅ clean.

---

## Verdict

**Pass with fixes.** Overall 91/100, +4 over prior. Two focused passes — strip the `sub-track` / `subscribes to` / `module emits` vocabulary and reconcile capability count + dependants table — lift the doc to ~94 and clear the rule completely. Producer iteration recommended over a `/docs-module` re-run; the gaps are surgical, not structural.
