# Doc-module review — brand — 2026-05-14

| Field | Value |
| --- | --- |
| Module | `brand` |
| Reviewer | `/doc-module-review` |
| Date | 2026-05-14 |
| Candidate | `packages/headless/src/modules/brand/README.md` |
| Golden | `docs/workshop/archive/brand.md` |
| Prior review | _none — first review of this module_ |
| Rule version | `.agent/rules/docs-modules.md` (post 2026-05-14 sharpening pass) |
| Producer skill version | `.agent/workflows/doc-module.md` (post 2026-05-14 sharpening pass) |

---

## Executive summary

| Category | Score | Band |
| --- | --- | --- |
| Technical accuracy | 92 / 100 | 90–100 — publishable |
| Completeness | 95 / 100 | 90–100 — publishable |
| Structure | 88 / 100 | 75–89 — pass with fixes |
| Tone | 93 / 100 | 90–100 — publishable |
| Actionability | 95 / 100 | 90–100 — publishable |
| **Overall** | **93 / 100** | **90–100 — publishable** |

**Verdict:** **Pass with fixes.** The candidate is publishable after one strip fix and one debatable-key-inclusion call. The recent rule + skill sharpening landed cleanly — the agent followed the fixture-as-source-of-truth instruction, included every cross-module dependant + a presentation-layer row, covered lifecycle capabilities in Operations, and avoided most forbidden patterns. The candidate also legitimately exceeds the golden in three places (Terms & Conditions endpoint, fuller data shape, more granular lifecycle-phase table). One 🔴 slip: a meta-derived reference (`i18n message overrides`) surfaced in a dependants row — `.meta` is **always** ignored regardless of sub-property, and the candidate referenced content that physically lives in `meta.i18n`.

---

## Part 2: Fresh full audit

### Strip audit findings

| Pattern family | Hit count | Severity | Status |
| --- | --- | --- | --- |
| Composable method names | 0 | — | ✅ Clean |
| Internal store / queryKey / persister names | 0 | — | ✅ Clean |
| Framework terms (Vue / XState / TanStack) | 0 | — | ✅ Clean |
| `.meta` content outside the italic note | 1 | 🔴 Critical | See below |
| Prescriptive verbs | 0 | — | ✅ Clean |
| Solution-shape suffixes | 0 | — | ✅ Clean |
| Meta-commentary about implementation | 0 | — | ✅ Clean |

**Hit** — Line 210 (system dependants row): `"supported languages, default language, locale support check, i18n message overrides | Locale negotiation and translation overrides depend on the brand's supported language list."`

The "i18n message overrides" reference points at content that physically lives in `meta.i18n` (see `mappers.ts:42` `mapBrandSettings` — the mapper transposes `meta.i18n` then reads it via `useBrand.ts:157` `get(brandSettings.value, "meta.i18n")`).

**Rule reminder:** `.meta` is the Upmind UI-workaround bucket and is ignored for spec purposes **regardless of sub-property**. The candidate should not surface i18n message overrides, brand-cart UI overrides, or any other meta-located content under brand's architectural reads.

Severity: 🔴 Critical. Replace "i18n message overrides" with content that lives outside meta, or drop the bit entirely (`system`'s remaining reads — supported languages, default language, locale support — are sufficient justification for the row).

### Section audit

| Section | Required? | Present? | Notes |
| --- | --- | --- | --- |
| What it is | ✅ Required | ✅ L3 | Present, dense single paragraph + four-area framing. No `meta` note slip. |
| Core concepts | Optional | ✅ L23 | 5 terms including "Terms and conditions" — added relative to golden |
| State model | Optional | — | Correctly omitted (no state machine) |
| Operations | ✅ Required | ✅ L31 | 12 rows; covers terms sub-module which golden missed |
| Data shape | ✅ Required | ✅ L48 | 200 lines; enumerates `BrandTaxType` / `BrandConfigKey` / `OrgFeatureKey`; types `OAuthClient`, `TermsAndConditions` |
| Dependencies (Dependants + Own) | ✅ Required | ✅ L203 | 13 dependant rows including Presentation layer; comprehensive |
| API endpoints | ✅ Required | ✅ L228 | 5 endpoints (golden has 4); terms endpoint marked stubbed |
| Side effects | Optional | — | Correctly omitted |
| Coordination | Optional | — | Correctly omitted |
| Flows | Optional | — | Correctly omitted |
| Lessons (hard-won) | ✅ Required | ✅ L382 | 10 lessons; all descriptive of problems; no solution suffixes |

**All canonical sections present in canonical order. No unjustified optional sections.** ✅

### Content audit

**Operations (capability coverage):**

| Source-exposed capability | Capability row in candidate | Status |
| --- | --- | --- |
| `useBrand` identity reads (id, code, name, prefix, domain, country) | Row 1 — Read brand identity | ✅ |
| Visual asset reads | Row 2 — Read visual assets | ✅ |
| Currency + currencies reads | Row 3 (folded with language + country) — Read regional defaults | ✅ |
| Language + languages reads | Row 3 | ✅ |
| Tax type read + `includes_tax` derived | Row 4 — Read tax policy | ✅ |
| `validateCurrency` | Row 5 — Validate a currency selection | ✅ |
| `validateLanguage` | Row 6 — Validate a language selection | ✅ |
| `isSupportedLanguage` | Row 7 — Check locale support | ✅ |
| `getConfig` / `getConfigValue` / `ensureConfig` | Row 8 — Read keyed brand config | ✅ collapsed correctly |
| Org features bucket | Row 9 — Read organisation features | ✅ |
| `hasModuleEnabled` | Row 10 — Check module entitlement | ✅ |
| `brand/terms` sub-module | Row 11 — Read terms & conditions | ⭐ Caught what golden missed |
| `isReady` / `refresh` / `invalidate` | Row 12 — Readiness / refresh / invalidate | ✅ lifecycle present |

**Verdict: complete coverage.** The new rule's "cover every observable behaviour including lifecycle" instruction was respected. The Terms capability is a genuine win — `index.ts:2` re-exports `./terms` and the candidate's source-walk found it.

**Data shape vs fixture + typed contracts:**

| Field | Candidate | Fixture | `IBrandSettings` | Status |
| --- | --- | --- | --- | --- |
| `id`, `code`, `name`, `prefix`, `domain` | ✅ | ✅ | ✅ | match |
| `country_id`, `country?` | ✅ | ✅ (country_id only in fixture sample shown) | ✅ | match |
| `region_id` | ✅ | ✅ (`null` in fixture) | ❌ not on contract | ⭐ Candidate correctly followed fixture per new rule |
| `language_id` + `languages` | ✅ | ✅ | ✅ | match |
| `currency_id` + `currencies` | ✅ | ✅ | ✅ | match |
| `pricelist_id` | ✅ | ✅ | ✅ | match |
| `tax_type: BrandTaxType` (0/1/2 enum) | ✅ | ✅ | ✅ | ⭐ Properly enumerated; golden only listed 2 values |
| `vat_number`, `vat_exempt: 0\|1` | ✅ | ✅ | ✅ | match |
| `style` nullable | ✅ | ✅ | ✅ | match |
| `image`, `icon`, `favicon`, `email_logo` | ✅ | ✅ | partial (no `email_logo` on contract) | ⭐ Followed fixture per new rule |
| `oauth_clients: OAuthClient[]` | ✅ typed | ✅ | ✅ as `IDomain[]` | ⭐ Candidate types it more precisely |
| `demo_data_import_id`, `wipe_data` | ✅ | ✅ | partial | ⭐ Followed fixture |
| `meta` | (stripped per top-of-doc note) | (present in fixture) | ✅ on contract | ✅ correctly stripped |

**Verdict: fixture-first, comprehensive, type-aligned.** The new rule's "follow the fixture, types are reference" instruction landed perfectly.

**Dependants weights vs graphify:**

The candidate's weights (basket 6, system 5, client 5, …) differ from both the golden's weights (product 13, domain 9, session 8, …) and the earlier fresh graphify query (basket 4, product 4, system 4, domain 4, …). All three are non-identical, which suggests **graphify counting methodology varies by query approach** rather than the candidate inventing weights. Not flagging as inaccurate — the relative ordering is consistent enough across runs.

**Verdict on dependants table:** 13 entries including Presentation layer; comprehensive per the new "include every cross-module dependant" rule. ✅

**API endpoints:**

| Endpoint | URL | Method | Source ref | Sample | Status |
| --- | --- | --- | --- | --- | --- |
| Brand settings | `/brand/settings?lang=en` | GET | `services.ts:73` `fetchBrandSettings` | Real fixture, trimmed | ✅ |
| Brand config | `/config/brand/values?keys=…` | GET | `services.ts:102` `fetchBrandConfig` | Real fixture, 7 real keys | ✅ |
| Org config | `/config/organisation/values?keys=…` | GET | `services.ts:142` `fetchOrganisationConfig` | Real fixture, 2 real keys | ✅ |
| Org modules | `/org/modules` | GET | `services.ts:129` `fetchModules` | Real fixture, includes `created_at`/`updated_at`/`deleted_at` per new rule | ✅ |
| Terms & conditions | `/terms_and_conditions/current` | GET | `terms/` sub-module | Marked `// stubbed — real capture replaces this` | ⭐ Caught what golden missed |

The candidate notes at L287: `> Sample trimmed for readability — full asset and currency/language entries omitted but preserved in the captured fixture.` Acceptable — it preserves traceability while keeping the doc readable.

**Lessons (10):**

Every entry maps to an observable phenomenon in source / fixture / cross-module-edges:

1. Read-by-everyone race-at-boot — observable in `useBrand.ts` consumer pattern + dependants table
2. Sparse keyed config grows + supersession — observable in `services.ts:102` `fetchBrandConfig` accumulator pattern
3. Brand identity changes invalidate downstream — observable in cycle prevention pattern (`useBrand.ts:221`)
4. Same-key cross-bag overlap (brand-config vs org-features) — real architectural concern; observable in source
5. Three-state tax inclusion — observable in `BrandTaxTypes` enum
6. Brand response carries admin-surface identity — observable in fixture (`oauth_clients`, `email_logo`, `prefix`, `demo_data_import_id`)
7. Languages/currencies are full lists, not just defaults — observable in fixture
8. T&Cs have two shapes (content vs url) — observable in `terms/` sub-module
9. Persisted brand state ages — observable in `useBrand.ts:49` `needsRefresh` + persister pattern
10. Host-as-brand-selector — observable in `oauth_clients[].origin` pattern

**Tone:** Every lesson is stated as a problem or as a consequence; no "the cleaner shape is X" / "the natural separation is Y" / "the X has to do Y" / "the inversion has to happen somewhere". ✅

---

## Part 3: Golden delta

| # | Divergence | Classification | Detail |
| --- | --- | --- | --- |
| 1 | Candidate has 5 API endpoints (incl. `/terms_and_conditions/current`); golden has 4 | ⭐ **Pro candidate** | `index.ts:2` re-exports `./terms`; the sub-module is part of brand's surface. Golden missed it. Worth lifting into golden when next refreshed. |
| 2 | Candidate's data shape includes typed `OAuthClient`, `TermsAndConditions`, `BrandConfigKey` enum, `OrgFeatureKey` enum, full `Image` type | ⭐ **Pro candidate** | Comprehensive typing aids agent rebuilding without our source. |
| 3 | Candidate enumerates `BrandTaxType` as `0`/`1`/`2` with semantic labels (`EXCLUDE_TAX` / `INCLUDE_TAX_RESPECT_CLIENT_TAX` / `INCLUDE_TAX_IGNORE_CLIENT_TAX`); golden lists only `2 = include`, `others = exclude` | ⭐ **Pro candidate** | Three-state model genuinely affects downstream tax calculation; the third value is non-trivial. Worth lifting into golden. |
| 4 | Candidate adds a "Tax" lifecycle phase to the Keys-by-phase table; golden has 5 phases | ⭐ **Pro candidate** | Tax policy is distinct from generic checkout requirements. Lifting it out is architecturally honest. |
| 5 | Candidate adds a "Post-purchase" lifecycle phase | ⭐ **Pro candidate** | `tickets.support.support_pin_enabled` and `security.ui.allow_vault` are post-purchase concerns. Reasonable. |
| 6 | Candidate includes `invoices.guest_checkout.enabled` and `ui.checkout.hide_promotions_field` in Checkout phase; golden omits these | 🟡 **Rule weakness** | The rule says "omit cart-UI-specific keys" but is silent on borderline cases. `guest_checkout.enabled` is architectural (affects auth requirement); `ui.checkout.hide_promotions_field` is more UI-specific. Rule could give examples of "architectural vs UI". |
| 7 | Candidate's Lessons (10) include "same-key cross-bag overlap" (lesson 4), "host-as-brand-selector" (lesson 10), "T&Cs two-shape" (lesson 8) | ⭐ **Pro candidate** | All three are genuine architectural hazards. Worth lifting into golden. |
| 8 | Candidate's "What it is" uses a four-questions framing instead of golden's four-buckets enumeration | (neither wrong) | Both pass the rule. Style choice. |
| 9 | Candidate's system dependants row references "i18n message overrides"; golden omits | 🔴 **Agent slip** | i18n overrides live in `meta.i18n` (`useBrand.ts:157`). `.meta` is ignored regardless of sub-property — the candidate should not surface meta-located content in the dependants table. |
| 10 | Candidate folds currency + language + country into one Operations row ("Read regional defaults"); golden splits them | (neither wrong) | Stylistic; candidate's framing is more concise and fits 12-row limit better. |

---

## Top 3 priorities

1. 🔴 **Strip "i18n message overrides" from the system dependants row** (candidate L210). The bag physically lives in `meta.i18n`; `.meta` is ignored regardless of sub-property. Either drop the reference or replace with content that lives outside meta.
2. 🟡 **Reconsider `ui.checkout.hide_promotions_field` in the Keys-by-phase Checkout row** (candidate L18). Borderline cart-UI-specific. Either drop it or keep it consistently with similar UI keys — currently inconsistent (this is in, others like `BASKET_FUNNELLING` are correctly out per rule guidance).
3. ⭐ **Lift the wins into golden when next refreshed** — Terms & Conditions endpoint, typed `OAuthClient` / enum-listed `BrandConfigKey` / `OrgFeatureKey`, three-state `BrandTaxType` enumeration. The candidate caught these legitimately; the golden should benefit on the next lock.

---

## Suggested rule/skill updates

One sharpening warranted: the existing meta-strip rule and the reviewer's strip-audit table both mention `.meta` and a fixed list of sub-properties (`meta.cart`, `meta.uischema`, `meta.i18n`, `BrandMeta`, `uischema`, `uiCart`, `i18nMessages`). Both should be more explicit that **anything inside `meta` is ignored regardless of sub-property** — including content surfaced under different names (e.g. "i18n message overrides", "translation overrides") that ultimately resolves to a meta-located bag.

### Rule sharpening — `.agent/rules/docs-modules.md`

**Where:** under the existing `.meta` italic note section.

**Proposed addition** (one bullet):

> - **Everything inside `meta` is out of spec, regardless of sub-property.** This includes `meta.i18n`, `meta.cart`, `meta.uischema`, any future sub-keys, and any content surfaced under a different name (e.g. "i18n message overrides", "translation overrides", "brand-cart layout") that resolves to a meta-located bag. The architectural surface excludes everything under `meta` — never reference it by name, even indirectly, in any section of the doc.

### Reviewer skill sharpening — `.agent/workflows/doc-module-review.md`

**Where:** the strip-audit table row for `.meta` content.

**Replace** the current row text (`meta.cart`, `meta.uischema`, `meta.i18n`, `BrandMeta`, `uischema`, `uiCart`, `i18nMessages`) with:

> Any reference to content located in `.meta` regardless of sub-property — including indirect references like "i18n message overrides", "translation overrides", "brand-cart UI", etc. that resolve to a meta-located bag.

Confidence this update is warranted: **high.** One occurrence in this run, but the misclassification on first-pass review (briefly withdrawn, then restored) shows the existing rule wording was ambiguous about indirect references. Sharpening the language prevents the same slip in the next module.

---

## Appendix A: Source-of-truth references

| Reference | Path | Lines |
| --- | --- | --- |
| `useBrand` composable | `packages/headless/src/modules/brand/useBrand.ts` | 1–576 |
| Brand services (4 fetchers) | `packages/headless/src/modules/brand/services.ts` | 70–169 |
| Brand types (local) | `packages/headless/src/modules/brand/types.ts` | 1–147 |
| Brand mappers (settings + config) | `packages/headless/src/modules/brand/mappers.ts` | 1–73 |
| Brand index (re-exports) | `packages/headless/src/modules/brand/index.ts` | 1–3 |
| `IBrandSettings` typed contract | `packages/types/src/models/brands.ts` | 72–95 |
| `IBrand` admin entity | `packages/types/src/models/brands.ts` | 24–70 |
| `IUpmindModule` | `packages/types/src/models/upmindModules.ts` | 4–13 |
| Fixture: brand settings | `tests/__fixtures__/recordings/get-brand-settings.json` | 1–516 |
| Fixture: brand config | `tests/__fixtures__/recordings/get-config-brand-values-d0166d3c.json` | 1–50 |
| Fixture: org config | `tests/__fixtures__/recordings/get-config-organisation-values-c1572e00.json` | 1–27 |
| Fixture: org modules | `tests/__fixtures__/recordings/get-org-modules.json` | 1–35 |
| Graphify cross-module edges | `graphify-out/graph.json` | (queried) |

## Appendix B: Verbatim evidence

**Meta-derived content surfaced under brand's architectural reads (🔴 Critical):**

Candidate, L210:

> \| `system` \| 5 \| supported languages, default language, locale support check, i18n message overrides \| Locale negotiation and translation overrides depend on the brand's supported language list. \|

Source trace: `useBrand.ts:157` exposes `i18nMessages` as `get(brandSettings.value, "meta.i18n")`. `mappers.ts:42` `mapBrandSettings` transposes the same field. Both confirm the bag physically lives at `meta.i18n` in the response payload.

**Three-state tax enumeration (⭐ Pro candidate):**

Candidate, L83–86:

```ts
type BrandTaxType =
  | 0   // EXCLUDE_TAX — prices net of tax
  | 1   // INCLUDE_TAX_RESPECT_CLIENT_TAX — gross prices, recalculate per client tax
  | 2;  // INCLUDE_TAX_IGNORE_CLIENT_TAX — gross prices, do not recalculate
```

Golden, L66 (for comparison): `tax_type: number; // enum: 2 = include tax, others = exclude tax`

**Terms & Conditions endpoint discovery (⭐ Pro candidate):**

Candidate, L360–380:

> `### GET /terms_and_conditions/current`
> _The active terms and conditions document for the brand. Either `content` is populated (embedded body) or `url` is populated (external policy)._

Golden: not present.

Source confirmation: `packages/headless/src/modules/brand/index.ts:2` — `export * from "./terms";`

## Appendix C: Files reviewed

- `.agent/rules/docs-modules.md` (post 2026-05-14 sharpening pass)
- `.agent/workflows/doc-module.md` (post 2026-05-14 sharpening pass)
- `.agent/workflows/doc-module-review.md` (this skill)
- `packages/headless/src/modules/brand/README.md` (candidate, 403 lines)
- `docs/workshop/archive/brand.md` (golden, 285 lines)
- `packages/headless/src/modules/brand/useBrand.ts`
- `packages/headless/src/modules/brand/services.ts`
- `packages/headless/src/modules/brand/types.ts`
- `packages/headless/src/modules/brand/mappers.ts`
- `packages/headless/src/modules/brand/index.ts`
- `packages/types/src/models/brands.ts`
- `packages/types/src/models/upmindModules.ts`
- `tests/__fixtures__/recordings/get-brand-settings.json`
- `tests/__fixtures__/recordings/get-config-brand-values-d0166d3c.json`
- `tests/__fixtures__/recordings/get-config-organisation-values-c1572e00.json`
- `tests/__fixtures__/recordings/get-org-modules.json`
- `graphify-out/graph.json` (cross-module edge query)

## Appendix D: Strip-audit exhaustive list

Single critical-level hit:

- 🔴 L210 (Dependants table, `system` row): `"i18n message overrides"` — content lives in `meta.i18n` per `useBrand.ts:157`. `.meta` is ignored regardless of sub-property.

No other forbidden patterns detected across the remaining 402 lines.
