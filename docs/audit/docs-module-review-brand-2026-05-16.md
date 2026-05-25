# Audit: `brand` foundation doc — 2026-05-16

**Module:** `brand`
**Candidate:** [`packages/headless/src/modules/brand/docs/foundation.md`](../../packages/headless/src/modules/brand/docs/foundation.md)
**Golden:** [`docs/workshop/archive/brand.md`](../../workshop/archive/brand.md)
**Prior review:** [`docs/audit/doc-module-review-brand-2026-05-14.md`](doc-module-review-brand-2026-05-14.md)
**Reviewer hat:** ship-readiness pass after the prior audit's critical strip issue + borderline-key suggestion were applied.
**Standards applied:** `.agent/rules/docs-modules.md`, `.agent/rules/docs-reviews.md`, `.agent/rules/docs-writing.md`.

---

## Executive summary

The two actionable items from the prior `2026-05-14` review are resolved. The 🔴 critical strip — `i18n message overrides` in the `system` dependants row (content that physically lives in `meta.i18n` per `useBrand.ts:157`) — is gone. The 🟡 borderline `ui.checkout.hide_promotions_field` key has been dropped from the Checkout lifecycle phase (it remains enumerated in the `BrandConfigKey` type, which is the correct place — the lifecycle table is for architecturally-relevant keys, not the full enumeration).

The doc otherwise carries forward all five "Pro candidate" wins the prior review identified (Terms & Conditions endpoint, typed `OAuthClient` / `TermsAndConditions`, three-state `BrandTaxType` enumeration, Tax + Post-purchase lifecycle phases). Strip-audit grep returns zero hits across every forbidden-pattern family. Section order is canonical. 12 capabilities at the cap. 10 lessons, all problem-shaped.

### Scoring (with delta vs prior)

| Category | Prior | Current | Δ | Notes |
| --- | --- | --- | --- | --- |
| **Technical accuracy** | 92 | 96 | **+4** | Meta-located content (`i18n message overrides`) stripped from dependants. Data shape unchanged — already fixture-true (region_id, email_logo, oauth_clients, demo_data_import_id present). |
| **Completeness** | 95 | 95 | — | No coverage loss; all five Pro-candidate wins retained. |
| **Structure** | 88 | 94 | **+6** | Canonical section order intact. No leaks across sections. Lifecycle table now consistent (no UI-specific key left over). |
| **Tone** | 93 | 96 | **+3** | Zero strip leaks, zero soft prescriptions, zero meta-derived references. |
| **Actionability** | 95 | 95 | — | Same usable curls + samples. T&C sample still honestly stubbed. |
| **Overall** | **93** | **95** | **+2** | Strong publishable doc. **Verdict: pass.** |

---

## Part 1 — Delta vs prior review

### Prior issues — all resolved

| Prior priority | Status | Evidence |
| --- | --- | --- |
| 🔴 **1 — Strip "i18n message overrides" from `system` dependants row** (content physically lives in `meta.i18n`) | ✅ **FIXED** | `system` row at [foundation.md:211](packages/headless/src/modules/brand/docs/foundation.md#L211) now reads `supported languages, default language, locale support check` — no meta-derived content. |
| 🟡 **2 — Reconsider `ui.checkout.hide_promotions_field` in Keys-by-phase Checkout row** (borderline cart-UI-specific) | ✅ **FIXED** | Checkout phase at [foundation.md:18](packages/headless/src/modules/brand/docs/foundation.md#L18) no longer lists `hide_promotions_field`. The key remains in the `BrandConfigKey` enum at [foundation.md:159](packages/headless/src/modules/brand/docs/foundation.md#L159) (which is correct — that enum is the full registry, the lifecycle table is the architectural-relevance filter). |
| ⭐ **3 — Lift wins into golden when next refreshed** (Terms endpoint, typed `OAuthClient`, three-state `BrandTaxType`) | N/A — **architectural follow-up** | Not a candidate-side fix. The wins remain in the candidate; the golden update is a separate workstream. |

**Summary:** 2 ✅ FIXED · 1 N/A (not candidate-actionable). No regressions on prior issues.

### Pro-candidate wins retained from prior review

All five "lift into golden" candidates from the prior review are still in the current doc:

- 🟢 **`GET /terms_and_conditions/current` endpoint** (capability 11 + API endpoint section + `TermsAndConditions` type). Source: `index.ts:2` re-exports `./terms`. Golden missed it; candidate caught it.
- 🟢 **Typed `OAuthClient` and `TermsAndConditions`** in Data shape — golden has neither.
- 🟢 **Three-state `BrandTaxType` enumeration** with semantic labels (`EXCLUDE_TAX` / `INCLUDE_TAX_RESPECT_CLIENT_TAX` / `INCLUDE_TAX_IGNORE_CLIENT_TAX`) — golden lists only `2 = include, others = exclude`. The third state genuinely affects downstream tax calculation.
- 🟢 **Tax lifecycle phase** added to Keys-by-phase table — separate from generic Checkout, architecturally honest.
- 🟢 **Post-purchase lifecycle phase** added — `tickets.support.support_pin_enabled` and `security.ui.allow_vault` are genuinely post-purchase concerns.

Plus three lesson-side wins:

- 🟢 **"Same-key cross-bag overlap"** (Lesson 4) — brand-config vs org-features precedence trap.
- 🟢 **"Host-as-brand-selector"** (Lesson 10) — `oauth_clients[].origin` is the resolution key.
- 🟢 **"T&Cs have two shapes"** (Lesson 8) — embedded `content` vs redirect `url`, per-brand choice.

---

## Part 2 — Fresh full audit

### Strip audit

| Pattern family | Hits | Severity |
| --- | --- | --- |
| Composable method names (`useBrand`, `isReady`, `getConfigValue`) | 0 | ✅ Clean |
| Store / queryKey / persister names | 0 | ✅ Clean |
| Vue / XState / TanStack framework terms | 0 | ✅ Clean |
| `.meta` content outside italic note (any sub-property, any aliasing) | 0 | ✅ Clean — `i18n message overrides` removed |
| Prescriptive verbs (`you should`, `you must`, `plan for`) | 0 | ✅ Clean |
| Solution-shape suffixes (`the cleaner shape is X`, `has to do Y`) | 0 | ✅ Clean |
| Meta-commentary about implementation | 0 | ✅ Clean |
| Reactive-stack leaks (`sub-track`, `subscribes to`, `module emits`) | 0 | ✅ Clean |

**Strip verdict: 🟢 PASS.** The single hit from the prior audit is gone; no new leaks introduced.

### Section audit (canonical order)

| Section | Required? | Present? | Justified? |
| --- | --- | --- | --- |
| Header (`# Module: brand`) | ✅ | ✅ Line 1 | — |
| What it is | ✅ | ✅ Lines 3-7 | Four-questions framing + italic meta note. ✅ |
| Keys by lifecycle phase | Optional (when keyed config) | ✅ Lines 9-22 | Seven phases — Initial load, Product display, Auth/registration, Checkout, Payment, Post-purchase, Tax. ✅ Architecturally honest split. |
| Core concepts | Optional | ✅ Lines 23-29 | Five terms. ✅ |
| State model | Optional (usually omit) | ❌ Omitted | ✅ Correctly omitted (no platform-defined lifecycle states). |
| Operations | ✅ | ✅ Lines 31-46 | 12 capabilities at the rule cap. Includes Capability 12 (Readiness / refresh / invalidate) covering lifecycle behaviours. |
| Data shape | ✅ | ✅ Lines 48-201 | Eight types (BrandSettings, BrandTaxType, Image, Currency, Language, OAuthClient, BrandConfig + key enum, BrandConfigValue, OrgFeatures + key enum, UpmindModule, TermsAndConditions). |
| Dependencies | ✅ | ✅ Lines 203-227 | 11 dependants + presentation layer. Footnote on `config` exclusion. Own dependencies bulleted. |
| API endpoints | ✅ | ✅ Lines 229-381 | 5 endpoints. Four real samples, T&C honestly stubbed. |
| Side effects | Optional (usually omit) | ❌ Omitted | ✅ Correctly omitted (cookie / cache concerns covered in Lesson 9). |
| Coordination | Optional (usually omit) | ❌ Omitted | ✅ Correctly omitted. |
| Flows | Optional | ❌ Omitted | ✅ Correctly omitted (brand is read-many-buckets, no multi-step interactions). |
| Lessons (hard-won) | ✅ | ✅ Lines 383-403 | 10 problem-shaped entries. |

### Content audit

#### Operations / capability coverage

12 capabilities at the rule cap. Cross-checked against `useBrand` exported surface:

| Source-exposed capability | Capability row | Status |
| --- | --- | --- |
| Identity reads (id, code, name, prefix, domain, country) | 1 — Read brand identity | ✅ |
| Visual assets (logo, icon, favicon, theme) | 2 — Read visual assets | ✅ |
| Regional defaults (currency + currencies, language + languages, country) | 3 — Read regional defaults | ✅ folded |
| Tax type read + `includes_tax` derived | 4 — Read tax policy | ✅ |
| `validateCurrency` | 5 — Validate a currency selection | ✅ |
| `validateLanguage` | 6 — Validate a language selection | ✅ |
| `isSupportedLanguage` | 7 — Check locale support | ✅ |
| Keyed brand config | 8 — Read keyed brand config | ✅ |
| Org features | 9 — Read organisation features | ✅ |
| Module entitlement | 10 — Check module entitlement | ✅ |
| Terms & Conditions sub-module | 11 — Read terms & conditions | ✅ |
| Lifecycle: readiness, refresh, invalidate | 12 — Readiness / refresh / invalidate | ✅ |

**Coverage: complete.** Every exported capability has a row. The rule's "cover every observable behaviour including lifecycle" instruction was respected.

#### Data shape vs source-of-truth

All cross-checks from the prior review remain valid; no regressions:
- `BrandSettings` matches fixture (`region_id`, `email_logo`, `oauth_clients`, `demo_data_import_id` all present — fields the typed contract excludes but the wire returns).
- `BrandTaxType` three-state enumeration aligned with `BrandTaxTypes` enum.
- `BrandConfigKey` enumerates 24 keys covering the seven lifecycle phases plus the BrandConfigKey enum surface.
- `OrgFeatureKey` lists the two organisation-level feature gates relevant to a customer rebuild (provisioning, multi-brand).
- `UpmindModule` matches `IUpmindModule`.
- `TermsAndConditions` correctly modelled with the `content` / `url` disjunction.

#### Dependants vs graph

Computed from `graphify-out/graph.json` (basket-style filter: source = brand file, target = non-brand module):

```
product: 12 · domain: 9 · query: 8 (excluded — transport) · session: 7 ·
routing: 4 · client: 4 · system: 4 · theming: 3 · productCategories: 2 · catalogue: 1
```

Doc table (11 rows + presentation):

| Module | Doc weight | Graph weight | Verdict |
| --- | --- | --- | --- |
| `basket` | 4 | — | 🟡 Not in graph (basket → brand likely via types only) |
| `product` | 4 | 12 | 🟡 Under-weighted vs graph |
| `system` | 4 | 4 | ✅ Match |
| `domain` | 4 | 9 | 🟡 Under-weighted |
| `routing` | 3 | 4 | ✅ Within rounding |
| `basketProduct` | 2 | — | 🟡 Not in graph |
| `productCategories` | 2 | 2 | ✅ Match |
| `paymentDetails` | 1 | — | 🟡 Not in graph |
| `theming` | 1 | 3 | 🟡 Under-weighted |
| `client` | 1 | 4 | 🟡 Under-weighted |
| `session` | 1 | 7 | 🟡 Under-weighted |

The prior review noted that "graphify counting methodology varies by query approach" and accepted some variance. With the consolidated graph filter used in recent audits (basket, basketProduct, session) the weights drift more noticeably. Not a blocker — the framing in each Reads / Why column is accurate, only the numerical weights are off — but a regeneration pass would tighten this.

#### API endpoints

5 endpoints, methods + URLs verified against `services.ts:70-169`:
- `GET /brand/settings` — real fixture, trimmed with disclaimer
- `GET /config/brand/values?keys=…` — real fixture, 7 real keys
- `GET /config/organisation/values?keys=…` — real fixture, 2 real keys
- `GET /org/modules` — real fixture (carries `created_at`/`updated_at`/`deleted_at`)
- `GET /terms_and_conditions/current` — honestly stubbed with `// stubbed — real capture replaces this`

#### Lessons

10 problem-shaped entries:

| Lesson | Theme | Verdict |
| --- | --- | --- |
| 1 — Brand read by nearly everything | Fan-in coordination | 🟢 |
| 2 — Sparse keyed config + supersession | Race conditions on growing key sets | 🟢 |
| 3 — Brand identity changes invalidate downstream | Cache invalidation | 🟢 |
| 4 — Same-key cross-bag overlap | Brand-config vs org-features precedence | 🟢 |
| 5 — Three-state tax inclusion | Policy enum, not boolean | 🟢 |
| 6 — Brand response carries identity for systems beyond cart | Admin-adjacent fields ride payload | 🟢 |
| 7 — Languages/currencies are full lists | Multi-currency / multi-language support | 🟢 |
| 8 — Terms & Conditions two shapes | content vs url disjunction | 🟢 |
| 9 — Persisted brand state ages | Cache freshness | 🟢 |
| 10 — Host the cart loads on is the brand selector | OAuth client origin resolution | 🟢 |

All ten describe problems cleanly without solutions.

---

## Part 3 — Golden delta

Reading both the candidate and `docs/workshop/archive/brand.md` deeply (not by textual diff):

| Divergence | Classification | Detail |
| --- | --- | --- |
| Candidate has T&C endpoint (capability 11 + API section + type); golden doesn't | ⭐ **Pro candidate** | Already lifted into the candidate; golden update pending. |
| Candidate types `OAuthClient`, `TermsAndConditions`, `Image` fully; golden doesn't | ⭐ **Pro candidate** | Comprehensive typing aids rebuild without source. |
| Candidate enumerates `BrandTaxType` three-state; golden lists `2 = include, others = exclude` | ⭐ **Pro candidate** | Architecturally meaningful — third state affects downstream tax calculation. |
| Candidate adds Tax + Post-purchase lifecycle phases; golden has 5 phases | ⭐ **Pro candidate** | Architecturally honest split. |
| Candidate's Operations folds currency + language + country into one row ("Read regional defaults"); golden splits | (neither wrong) | Stylistic — candidate's framing fits the 12-cap better. |
| Candidate's Lessons 4, 8, 10 (cross-bag overlap, T&Cs two shapes, host-as-brand-selector) absent from golden | ⭐ **Pro candidate** | Genuine architectural hazards worth lifting. |
| Candidate's What it is uses four-questions framing; golden uses four-buckets enumeration | (neither wrong) | Stylistic. Both pass the rule. |
| Candidate's dependants table inverts some weights vs current graph | 🟡 **Carried from prior review** | Prior review accepted as graphify methodology variance. A regen pass would tighten. |

**Golden delta summary: 6 Pro candidates (5 from prior review + Lessons 4/8/10), all retained.** No agent slips. The candidate legitimately exceeds the golden on multiple dimensions; the golden is the one due an update.

---

## Top 3 priorities (severity × ease)

None are critical or warning-level. Suggestions only:

1. 🟡 **Regenerate dependants table from `graphify-out/graph.json`** to align weights — graph shows `product: 12, domain: 9, session: 7` as the top three. Doc has them at `4, 4, 1` respectively. Framing in Reads / Why columns is correct; only numerical weights drift. Single mechanical edit.
2. ⭐ **Lift the Pro-candidate wins into `docs/workshop/archive/brand.md`** when the golden is next refreshed — Terms endpoint, three-state `BrandTaxType`, typed `OAuthClient`/`TermsAndConditions`, Tax + Post-purchase phases, Lessons 4/8/10. The candidate consistently surfaces architectural truths the golden missed.
3. 🟡 **Capture a real `/terms_and_conditions/current` fixture** when the staging environment supports it. Only stub remaining in the doc.

---

## Suggested rule/skill updates

The prior review's proposed rule update — "everything inside `meta` is out of spec regardless of sub-property, including indirect aliasing like 'i18n message overrides' / 'translation overrides' / 'brand-cart layout'" — has landed in `.agent/rules/docs-modules.md` (confirmed by reading the current rule, which now includes that bullet under What To Strip). No new rule gaps surfaced this pass.

---

## Appendix A — Source-of-truth references

- `packages/headless/src/modules/brand/useBrand.ts` (1-576)
- `packages/headless/src/modules/brand/services.ts` (70-169 — 4 fetchers)
- `packages/headless/src/modules/brand/mappers.ts` (1-73)
- `packages/headless/src/modules/brand/terms/` (T&C sub-module)
- `packages/headless/src/modules/brand/index.ts` (re-exports)
- `packages/types/src/models/brands.ts` (72-95 — `IBrandSettings`)
- `packages/types/src/models/upmindModules.ts`
- `tests/__fixtures__/recordings/get-brand-settings.json`
- `tests/__fixtures__/recordings/get-config-brand-values-*.json`
- `tests/__fixtures__/recordings/get-config-organisation-values-*.json`
- `tests/__fixtures__/recordings/get-org-modules.json`
- `graphify-out/graph.json`

---

## Appendix B — Files reviewed

### Rule + writing standards
- `.agent/rules/docs-modules.md`
- `.agent/rules/docs-writing.md`
- `.agent/rules/docs-reviews.md`

### Candidate
- `packages/headless/src/modules/brand/docs/foundation.md` (post-r1 fixes, 12 capabilities · 10 lessons · 11 dependants)

### Golden
- `docs/workshop/archive/brand.md`

### Prior review
- `docs/audit/doc-module-review-brand-2026-05-14.md`

### Source
- `packages/headless/src/modules/brand/useBrand.ts`
- `packages/headless/src/modules/brand/services.ts`
- `packages/headless/src/modules/brand/types.ts`
- `packages/headless/src/modules/brand/mappers.ts`
- `packages/headless/src/modules/brand/terms/` (sub-module)
- `packages/headless/src/modules/brand/index.ts`

### Types
- `packages/types/src/models/brands.ts`
- `packages/types/src/models/upmindModules.ts`

### Fixtures
- `tests/__fixtures__/recordings/get-brand-settings.json`
- `tests/__fixtures__/recordings/get-config-brand-values-*.json`
- `tests/__fixtures__/recordings/get-config-organisation-values-*.json`
- `tests/__fixtures__/recordings/get-org-modules.json`

### Graph
- `graphify-out/graph.json`

---

## Appendix C — Strip-audit exhaustive list

No hits across any forbidden-pattern family. Grep covering `useBrand`, `isReady(`, `getConfigValue`, `spawn`, `state machine`, `XState`, `TanStack`, `computed(`, `ref(`, `sub-track`, `subscribes to`, `module emits`, `has to (do|invalidate|defer|drop|broadcast|survive|settle|be|remain|stay)`, `the cleaner shape`, `the natural separation`, `the shape that survives`, `you should`, `you must`, `plan for`, `our implementation`, `we chose`, `we split`, `meta.`, `uischema`, `i18nMessages`, `BrandMeta`, `brand-cart`, `i18n message overrides` returns zero matches.

---

## Verdict

**Pass.** Overall 95/100, +2 over the prior 93. Both prior actionable items are resolved (the 🔴 meta-leak and the 🟡 borderline-key). The doc continues to legitimately exceed the golden on five architectural dimensions; the golden is the one due an update.

Remaining items (dependants weights, golden lift, T&C fixture capture) are all 🟡 suggestion / ⭐ pro-candidate-follow-up — none block ship.
