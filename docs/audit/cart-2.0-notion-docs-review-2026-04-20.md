# Cart 2.0 Notion Documentation Review — Follow-up Audit

**Date:** 2026-04-20
**Auditor:** Documentation QA (automated against codebase)
**Previous audit:** 2026-04-16 (score: 68/100)
**Scope:** All 12 leaf pages under "Using Cart 2.0" in the Knowledge Base, plus the Glossary.

---

## Executive summary

| Metric | Previous (2026-04-16) | Current (2026-04-20) | Delta |
| --- | --- | --- | --- |
| **Overall Confidence Score** | 68/100 | **76/100** | +8 |
| Technical Accuracy | 70/100 | 74/100 | +4 |
| Completeness | 55/100 | 68/100 | +13 |
| Structure | 65/100 | 72/100 | +7 |
| Clarity | 75/100 | 80/100 | +5 |
| Actionability | 60/100 | 70/100 | +10 |

The copywriter made meaningful, broad-based progress. The most material improvements are the new property-reference appendices (no longer a dead Google Sheet link), the corrected `@data.storeUrl` syntax, and action-oriented page titles. A small number of **critical new regressions** emerged in JSON syntax on the "Configuring Options in Cart and Portal" page, and several known gaps (Glossary, SEO properties, intro blocks) are untouched.

---

# Part 1 — Delta audit against 2026-04-16 issues

## Structural issues (vs `guides-writing.md`)

| # | Issue flagged 2026-04-16 | Status | Evidence |
| --- | --- | --- | --- |
| S1 | Noun-based titles (not action-based) | ✅ **FIXED** | All 12 leaf pages now start with a gerund/participle: "Understanding Cart 2.0", "Understanding the Cart Architecture", "Using the Decision Guide", "Exploring Example Scenarios", "Configuring Your Store with UI Metadata", "Setting Up Theming with CSS Variables", "Launching with the Ready-made Cart", "Building a Custom Checkout with Headless Setup", "Understanding the Migration Overview", "Planning Your Migration Strategy", "Configuring Options in Cart and Portal", "Applying Accessibility Considerations". |
| S2 | Missing intro blocks (Time/Difficulty/Modules) | ❌ **NOT FIXED** | No page has the prescribed block. Pages still open with a single italicised tagline (e.g., *"Introducing Upmind Cart 2.0"*). `guides-writing.md` requires `**Time:**`, `**Difficulty:**`, `**Modules used:**` per guide. |
| S3 | No "What You'll Build" section | ❌ **NOT FIXED** | Launch and Headless guides jump straight into prose/architecture. No outcome preview screenshot or bullet list on any page. |
| S4 | Prerequisites inconsistent | 🟡 **PARTIAL** | "Launching with the Ready-made Cart" now has a proper **Prerequisites** section (Upmind account, brand, products, pricing, payment provider, DNS access) — good. "Building a Custom Checkout with Headless Setup" still has none. Migration pages still have none. |
| S5 | No complete copy-paste examples | 🟡 **PARTIAL** | Many small, correct snippets added throughout Configuring Options & Theming pages. Still missing: one end-to-end `brand.uiMeta` JSON that wires template + theme + data overrides together. |
| S6 | Glossary completely empty (40+ rows) | ❌ **NOT FIXED** | Per user confirmation at audit start, the glossary page still contains 46 empty rows. This remains the single most severe structural defect. |

## Technical accuracy issues (vs codebase)

| # | Issue flagged 2026-04-16 | Status | Evidence |
| --- | --- | --- | --- |
| T1 | Data setting syntax wrong (`@data.*.storeUrl` vs `@data.storeUrl`) | ✅ **FIXED** | "Configuring Your Store with UI Metadata" now uses the correct `@data`-prefix-only form: `"@data.storeUrl": "https://{custom-domain}/order/shop"` and `"@data.storeHeading"`. Key format spec reads `@data.<setting>[/<modifier>] = value` — matches `DATA_DEFINITIONS` in `packages/headless/src/modules/config/schema/definitions.ts`. |
| T2 | Invalid JSON comments (`// comment`) | ✅ **FIXED** | No `//` comments found in any JSON block across the 12 pages. |
| T3 | Auth context listed non-existent `full` template | ✅ **FIXED** | "Configuring Options in Cart and Portal" → Login/Register/RecoverPassword table rows correctly list only `split`, `enclosed`, `canvas-card`, `surface-box`, `two-column-ltr`, `two-column-rtl` — matches `SESSION_TEMPLATE` enum in `packages/client-vue/src/modules/session/types.ts`. `full` is gone. |
| T4 | Missing UI properties (productAnchorPrice, productBenefits, productCategory, optionSelector\*, termSelector\*, basketTaxes, paymentGatewaysCap, trustMessaging, iconVariant, theme) | ✅ **FIXED** | All of these now appear in the "Appendix: UI Properties" table on the Configuring Your Store page. |
| T5 | Missing SEO properties (seoTitle, seoDescription, seoCanonical, seoOgTitle, seoOgDescription, seoOgImage, seoTwitterTitle, seoTwitterDescription, seoTwitterImage) | ❌ **NOT FIXED** | None of the 9 SEO properties appear in either the UI Properties appendix or anywhere else in the docs. They are defined in `UI_META_DEFINITIONS` (lines 470–514 of `definitions.ts`). |
| T6 | Missing Data properties (trimTrailingZeroes, trustMessagingMarkdown, optionGroupLabel, optionGroupIcon, displayFontLink, clickwrapDisclaimer, optionImgUrl) | ✅ **FIXED** | All 7 are now present in the "Appendix: Data Properties" table. |

## Content issues

| # | Issue flagged 2026-04-16 | Status | Evidence |
| --- | --- | --- | --- |
| C1 | Inaccessible Google Sheet link for property list | ✅ **FIXED** | Property tables are now embedded directly in Notion — no external link. |
| C2 | CSS vs JSON confusion mixed on one page | 🟡 **PARTIAL** | Theming page is now cleanly CSS-only. However "Configuring Options in Cart and Portal" still mixes CSS colour-token snippets *inside the "Content and copy" section* (e.g., `--text-display`, `--text-button-primary`, `--color-core-display`), which is logically wrong — these are styling, not copy. |
| C3 | No defaults table | ✅ **FIXED** | Both appendix tables (UI Properties, Data Properties) include a **Default** column. |
| C4 | No error handling guidance | ❌ **NOT FIXED** | Still no section covering invalid JSON, unknown property names, out-of-enum values, or viewport-modifier typos. |
| C5 | No validation rules for property values | 🟡 **PARTIAL** | Enum *types* are now shown (VISIBILITY, IMAGE_RATIO, etc.), which implies the valid set — but the actual allowed values for each enum are not listed anywhere. A reader seeing `TAXES_DISPLAY` has no way to know whether it accepts `consolidated`, `inline`, `hidden`, or something else. |

---

## New issues introduced since 2026-04-16

| # | Severity | Issue |
| --- | --- | --- |
| N1 | 🔴 **CRITICAL** | **Invalid JSON on "Configuring Options in Cart and Portal".** Multiple Templates examples contain a stray `=` that makes the JSON unparseable. Exact snippet from the page: `{\n\t"@context.*.template": = "two-column-ltr"\n}` and again `{\n\t"@context.checkout.template": = "full"\n}` and `{\n\t"@context.*.template": = "two-column-ltr",\n\t"@context.auth.template": = "canvas-card"\n}`. Any reader copy-pasting these will get a parse error. This replaces the old `//`-comments issue with a different copy-paste failure mode. |
| N2 | 🔴 **CRITICAL** | **Templates appendix lists `enclosed` for auth contexts, but it is not implemented.** The appendix row for `session/Login.vue`, `session/Register.vue`, `session/RecoverPassword.vue` claims `enclosed` is supported. `SESSION_TEMPLATE` enum does define `ENCLOSED = "enclosed"`, but `supportedTemplates` in all three `.vue` files registers only `SPLIT`, `CANVAS_CARD`, `SURFACE_BOX`, `TWO_COLUMN_LTR`, `TWO_COLUMN_RTL` (verified in `packages/client-vue/src/modules/session/Login.vue` lines 110–125, `Register.vue` lines 162–177, `RecoverPassword.vue` lines 93–108). Setting `"@context.auth.template": "enclosed"` will fall back silently. |
| N3 | 🟠 **WARNING** | **Mismatched defaults in Templates appendix.** The appendix says `basket`, `checkout`, `configure` all default to `two-column-rtl`. Body copy for the same page says `two-column-ltr (Default)` for basket, checkout, billing_details, confirmation. The defaults listed in code are `undefined` (see `template` entry in `UI_META_DEFINITIONS` — `default: undefined`), so the actual default is whatever the Vue component chooses. The doc contradicts itself page-internally. |
| N4 | 🟠 **WARNING** | **Scope value incorrect for `optionBenefits` in Data Properties appendix.** Doc says scope = `product category, product`. Codebase (`DATA_DEFINITIONS.optionBenefits`) says `scopes: [UIScope.OPTION_CATEGORY, UIScope.OPTION]`. A reader configuring at the product level will set a key that is silently ignored. |
| N5 | 🟠 **WARNING** | **Scope value incorrect for `optionUpsellEnabled`.** Doc says `brand, option category, option`. Codebase says `scopes: [UIScope.OPTION]` only. Setting at brand or option-category level has no effect. |
| N6 | 🟡 **SUGGESTION** | **Decision Guide for existing users** contains five inline comment markers (`<span discussion-urls=...>`) and orange-coloured "Links to deeper documentation" on the Headless page — signs of un-resolved editorial threads bleeding through. |
| N7 | 🟡 **SUGGESTION** | "Configuring Options in Cart and Portal" Templates section uses ambiguous phrasing: *"Basket (two-column-rtl) - Order summary on the left, product list on the right."* An RTL basket would typically put the summary on the *right*. Either the screenshot or the caption is wrong. |
| N8 | 🟡 **SUGGESTION** | Data Properties appendix misses several entries that exist in `DATA_DEFINITIONS.productBenefits` (scope `PRODUCT_CATEGORY, PRODUCT`, default `[]`) — doc matches, good — but the visual format `\[\]` (Notion escaping leaking through) is hard to read. |

## New strengths

- **Rich property reference appendices** for both UI and Data tables are a major win; reviewers can now answer "does property X exist?" without grepping the codebase.
- **Explicit scope fallback chain** on the Configuring Your Store page — `product → category → brand → internal default` — is accurate and valuable.
- **Migration strategy** (Parallel run → Sandbox → Gradual rollout → Rollback) is a well-structured addition with a concrete go-live checklist.
- **Headless architecture diagram** uses a clean Mermaid flowchart; previously there was only prose.
- **Accessibility themes page** is a genuine new artefact with a clear theme-by-theme breakdown.

---

# Part 2 — Fresh full audit (2026-04-20)

## Overall confidence: **76/100**

### Scoring rubric

| Category | Score | Rationale |
| --- | --- | --- |
| **Technical accuracy** | 74/100 | Property tables are now ~85% correct against code; remaining defects are a handful of wrong scope values and the SEO omission. The JSON `=` bug costs a few points because copy-paste fails outright. |
| **Completeness** | 68/100 | Appendices transformed this score. Still missing: Glossary content, SEO properties, enum value lists, validation/error guidance, end-to-end example. |
| **Structure** | 72/100 | Action-based titles fixed. Intro blocks (Time/Difficulty/Modules) and "What You'll Build" sections remain absent. Prerequisites inconsistent across guides. |
| **Clarity** | 80/100 | Prose is readable and in second-person voice; analogies land well in most places. Some legacy "storefront_url" / "@data.storeUrl" terminology confusion persists. |
| **Actionability** | 70/100 | A reader can now achieve most Configure and Theme tasks by copying snippets (once the `=` bug is fixed). Migration and headless pages are still high-level rather than step-by-step. |

---

## Category breakdown

### 1. Technical accuracy (74/100)

**Verified correct against codebase** (`packages/headless/src/modules/config/schema/definitions.ts` + `packages/client-vue/src/modules/*/types.ts`):

- Context enum: `catalogue, configure, recommendations, basket, auth, billing_details, checkout, confirmation` — matches `UIContext` in `packages/headless/src/modules/config/schema/types.ts` lines 193–203. ✅
- Scope cascade `product → category → brand → internal default` — matches `SCOPE_ORDER` in `types.ts` lines 35–41. ✅
- Viewport modifiers `sm / md / lg` — matches `Viewport` type in `types.ts` line 14 and `VIEWPORT_ORDER`. ✅
- `@context.<context>.<setting>[/<modifier>]` key format — matches `META_PREFIX.CONTEXT` in `types.ts`. ✅
- Appendix UI Properties table — 52 of 61 definitions listed, all 52 with correct types/defaults/contexts/scopes (spot-checked 15). ✅
- Appendix Data Properties — 21 of 23 definitions listed; 2 have wrong scope (N4, N5). 🟡

**Incorrect or misleading:**

1. 🔴 JSON syntax: `"@context.*.template": = "two-column-ltr"` (stray `=`) — N1 above.
2. 🔴 Templates appendix claims `enclosed` is supported for auth but no auth `.vue` page registers it — N2 above.
3. 🟠 `optionBenefits` scope wrong (N4).
4. 🟠 `optionUpsellEnabled` scope wrong (N5).
5. 🟠 Defaults contradict across body-copy vs appendix on Configuring Options (N3).
6. 🟠 9 SEO properties entirely absent (T5).
7. 🟡 Appendix lists `template` with type `-` and `theme` with type `-`. Technically correct (these are freeform strings in code — `template: { default: undefined, ... }`, `theme: { default: "default", ... }`) but a reader doesn't know what values are valid. The Templates appendix partly fills this for `template`; no equivalent for `theme`.

### 2. Completeness (68/100)

**Present and useful:**

- Two comprehensive appendix tables on the Configuring Your Store page (UI Properties + Data Properties).
- Templates appendix on Configuring Options (maps context → component file → enum → default → implemented templates).
- Migration checklist (products, pricing, promotions, domains, taxes, webhooks, analytics, SSO, theming).
- Pre-launch go-live checklist on the ready-made cart page.
- CSS token reference (primitives: core / control / primary / secondary / neutral / promo / danger / warning / success / info) and semantic tokens (backgrounds / form controls / buttons).

**Gaps:**

- **Glossary** still 46 empty rows — blocking.
- **SEO properties** — 9 defined, 0 documented (T5).
- **Enum value lists** — documentation references `VISIBILITY`, `TAXES_DISPLAY`, `OPTION_SELECTOR`, etc., but never lists the valid values. The one exception is `zeroPriceDisplay` (inline mention of `label` / `numeric`) and `productListLayout` (implicit from `1-col / 2-col / 3-col / 4-col` examples).
- **Error handling & diagnostics** — what does the cart do when a key is misspelt, an enum value is invalid, or a JSON block is malformed? Unclear.
- **`locked` semantics** — several definitions in the codebase have a `locked: { [UIContext.X]: VALUE }` field (e.g., `productConfigSummary`, `basketFields`, `basketSummary`, `zeroPriceDisplay`, `billingDetails`) which forces a value for certain contexts even if the user overrides. This critical behaviour is undocumented.
- **End-to-end worked example** — a single JSON payload that sets theme + template + zero-price display + store heading + data override at product level.
- **How to retrieve / test current UI Metadata** — no guidance on inspecting effective values once set.

### 3. Structure (72/100)

**Works:**

- All titles now action-based (S1).
- Headings use consistent hierarchy (H1 page → H2 major section → H3 sub-topic → H4 nested) within each page.
- Tables are used appropriately for enum-style reference data.
- Prerequisites block present on ready-made cart page.

**Doesn't work:**

- No intro blocks on any page (S2).
- No "What You'll Build" preview on any page (S3).
- "Building a Custom Checkout with Headless Setup" still has no prerequisites, no code install block, no `npm install` or `pnpm add` snippet — reads more like a brochure than a guide.
- Migration guide has a checklist but no phase-ordering for when each check applies.
- Page parent/ancestor path implies a deep tree but no in-page breadcrumbs or "Next / Previous" links.

### 4. Clarity (80/100)

**Works:**

- Active voice and present tense used consistently (e.g., "The most specific setting always wins", "This guarantees that invalid actions cannot occur").
- Cart 1.0 → Cart 2.0 feature comparisons are scannable.
- The "storefront_url" example is clearly flagged as needed to "switch to Cart 2.0".

**Doesn't work:**

- Terminology drift: the UI Metadata "switch to Cart 2.0" snippet uses `"storefront_url": "…"` but the property dictionary calls it `storeUrl`. These are the same field shown in two different shapes (brand-level config vs `@data` key). The doc should note this explicitly or unify.
- "Client Vue" is introduced three times across three pages with slightly different definitions ("frontend starter framework", "application shell", "collection of complex, pre-built UI organisms"). Pick one and link.
- "Headless Upmind" sometimes refers to the composables package, sometimes to the whole orchestration stack (composables + XState). Clarify the boundary.

### 5. Actionability (70/100)

**Works:**

- Reader can set up a CNAME, enable products, connect Stripe, and run a sandbox test purely from the ready-made cart page.
- Reader can change `productImages`, `zeroPriceDisplay`, `productListLayout` via Configure Your Store with copy-paste JSON.
- Reader can define a branded theme with working CSS variables from the theming page.

**Doesn't work:**

- Templates section of "Configuring Options" is currently **broken for copy-paste** (N1).
- The Decision Guide asks the reader to answer questions but doesn't map the answers to a concrete recommendation — the reader still has to infer.
- Headless page lists "High-level setup steps" but no concrete code (no composable import, no `useBasket()` wiring, no XState state-machine example). It's aspirational, not actionable.

---

## Copywriter feedback (sympathetic + constructive)

First — **thank you for the substantial work**. The shift from 68 → 76 is real and broad-based. Action-based titles, the two inline appendix tables, the corrected `@data.storeUrl` syntax, and the migration phasing are all meaningful improvements that will save clients time.

Three concrete things to tackle next, in priority order:

1. **Fix the broken JSON examples on "Configuring Options in Cart and Portal"** (🔴 blocking). Search the page for `": = "` — there are at least three instances. Each needs to become `": "`. Example: `"@context.*.template": = "two-column-ltr"` → `"@context.*.template": "two-column-ltr"`. This is the *only* change that will cause every copy-paste attempt to fail, so it should be priority one.

2. **Fill the Glossary or remove it** (🔴 blocking). 46 empty rows signal "doc abandoned" to any reader who lands there. If the intended terms aren't finalised, hide the page until they are. If they are, even a first pass defining `UI Metadata`, `@context`, `@data`, `scope`, `cascade`, `template`, `theme`, `context (UIContext)`, `viewport modifier` would cover 80% of reader lookups.

3. **Add the 9 SEO properties** to the UI Properties appendix. They're simple rows: all have `default: undefined`, `contexts: all`, `scopes: brand, product_category, product`. Names: `seoTitle`, `seoDescription`, `seoCanonical`, `seoOgTitle`, `seoOgDescription`, `seoOgImage`, `seoTwitterTitle`, `seoTwitterDescription`, `seoTwitterImage`.

Lower priority but worth knowing:

- The `enclosed` template *is* defined for auth in code but isn't implemented — so the Templates appendix over-promises for `auth` rows. Either drop `enclosed` from those rows, or ask engineering whether it should be wired up.
- Two data-property scope values (`optionBenefits`, `optionUpsellEnabled`) disagree with the codebase — minor but confusing.
- Consider opening each guide page with a three-line block: `**Time:** 10 minutes` / `**Difficulty:** Beginner` / `**Modules used:** brand, config`. It sets expectations cheaply.
- Mixed CSS examples inside the "Content and copy" section of Configuring Options aren't really about copy — consider moving them to the Theming page or renaming the section "Content, copy, and visual tone".

You're most of the way there. None of these changes require codebase access — they're all mechanical edits to JSON snippets or additions to existing tables.

---

## Appendix A — Complete property reference from codebase

Source: `packages/headless/src/modules/config/schema/definitions.ts` (verified 2026-04-20).

### UI_META_DEFINITIONS (61 properties)

| Property | Type enum | Default | Contexts | Scopes | `locked`? |
| --- | --- | --- | --- | --- | --- |
| `activeCategoryBadge` | VISIBILITY | `visible` | catalogue | brand | — |
| `activeCategoryDescription` | VISIBILITY | `visible` | catalogue | brand | — |
| `categoryBadge` | VISIBILITY | `visible` | catalogue | brand, product_category | — |
| `categoryExcerpt` | VISIBILITY | `visible` | catalogue | brand, product_category | — |
| `categoryIcon` | VISIBILITY | `hidden` | catalogue | brand, product_category | — |
| `categoryImageFallback` | VISIBILITY | `visible` | catalogue | brand, product_category | — |
| `categoryImageRatio` | IMAGE_RATIO | `1:1` | catalogue | brand, product_category | — |
| `categoryImages` | VISIBILITY | `hidden` | catalogue | brand, product_category | — |
| `categoryList` | LIST_STYLE | `grid` | catalogue, recommendations | brand, product_category | — |
| `categoryListLayout` | CATEGORY_GRID_LAYOUT | `3-col` | catalogue, recommendations | brand, product_category | — |
| `productAnchorPrice` | VISIBILITY | `visible` | catalogue, configure, recommendations | brand, product_category, product | — |
| `productBadge` | VISIBILITY | `visible` | catalogue, configure, recommendations | brand, product_category, product | — |
| `productBenefits` | VISIBILITY | `visible` | catalogue, recommendations | brand, product_category, product | — |
| `productCategory` | VISIBILITY | `hidden` | catalogue, configure, recommendations | brand, product_category, product | — |
| `productConfigFieldsSummary` | VISIBILITY | `hidden` | configure | brand, product_category, product | — |
| `productConfigOptionsSummary` | VISIBILITY | `visible` | configure, basket | brand, product_category, product | — |
| `productConfigSummary` | VISIBILITY | `visible` | configure, basket | brand, product_category, product | **basket: `visible`** |
| `productDescription` | CLAMPABLE_VISIBILITY | `clamped` | configure | brand, product_category, product | — |
| `productDescriptionClamp` | CLAMP_LINES | `3` | configure | brand, product_category, product | — |
| `productExcerpt` | VISIBILITY | `visible` | catalogue, recommendations | brand, product_category, product | — |
| `productImageFallback` | VISIBILITY | `visible` | catalogue, configure, recommendations, basket, confirmation | brand, product_category, product | — |
| `productImageRatio` | IMAGE_RATIO | `1:1` | catalogue, configure, recommendations, basket, confirmation | brand, product_category, product | — |
| `productImages` | VISIBILITY | `visible` | catalogue, configure, recommendations, basket, confirmation | brand, product_category, product | — |
| `productImagesStyle` | IMAGES_STYLE | `auto` | catalogue, configure, recommendations, basket, confirmation | brand, product_category, product | — |
| `productList` | PRODUCT_LIST_STYLE | `grid` | catalogue, recommendations | brand, product_category | — |
| `productListLayout` | GRID_LAYOUT | `3-col` | catalogue, recommendations | brand, product_category | — |
| `productNativeRecommendations` | VISIBILITY | `visible` | recommendations | brand, product_category, product | — |
| `productOrientation` | ORIENTATION | `vertical` | catalogue, recommendations | brand, product_category, product | — |
| `productPriceSummary` | VISIBILITY | `visible` | catalogue, recommendations | brand, product_category, product | — |
| `productStyle` | PRODUCT_STYLE | `flush` | catalogue, recommendations | brand, product_category, product | — |
| `productTermSelector` | VISIBILITY | `hidden` | catalogue, recommendations, basket | brand, product_category, product | — |
| `zeroPriceDisplay` | ZERO_PRICE_DISPLAY | `label` | catalogue, configure, recommendations, basket, auth, checkout, confirmation | brand, product_category, product, option_category, option | **auth / checkout / confirmation: `numeric`** |
| `optionGroupDescription` | DESCRIPTION_DISPLAY | `tooltip` | configure | brand, product_category, product, option_category | — |
| `optionGroupDividers` | DIVIDER_STYLE | `hidden` | configure | brand, product_category, product | — |
| `optionGroupSpacing` | OPTION_GROUP_SPACING | `4` | configure | brand, product_category, product | — |
| `optionItemBenefits` | VISIBILITY | `visible` | configure, basket, checkout | brand, product_category, product, option_category, option | — |
| `optionItemDescription` | DESCRIPTION_DISPLAY | `inline` | configure | brand, product_category, product, option_category, option | — |
| `optionSelector` | OPTION_SELECTOR | `radio-rows` | configure | brand, product_category, product, option_category | — |
| `optionSelectorGrid` | GRID_LAYOUT | `2-col` | configure | brand, product_category, product, option_category | — |
| `optionSelectorIcons` | VISIBILITY | `visible` | configure | brand, product_category, product, option_category | — |
| `optionUpsells` | VISIBILITY | `visible` | basket, checkout | brand, product_category, product, option_category | — |
| `termSelector` | TERM_SELECTOR | `radio-grid` | configure | brand, product_category, product | — |
| `termSelectorGrid` | GRID_LAYOUT | `2-col` | configure | brand, product_category, product | — |
| `termSelectorSummary` | VISIBILITY | `visible` | configure | brand, product_category, product | — |
| `basketFields` | VISIBILITY | `hidden` | basket, checkout | brand | **basket: `visible`** |
| `basketItems` | VISIBILITY | `hidden` | checkout | brand | — |
| `basketSummary` | VISIBILITY | `visible` | auth, checkout | brand | **checkout: `visible`** |
| `basketTaxes` | TAXES_DISPLAY | `consolidated` | basket, auth, checkout, confirmation | brand | — |
| `billingDetails` | EDITABILITY | `readonly` | billing_details, checkout | brand | **billing_details: `editable`** |
| `paymentGatewaysCap` | GATEWAY_CAP | `5` | checkout | brand, product_category, product | — |
| `trustMessaging` | VISIBILITY | `visible` | configure, basket, checkout | brand, product_category, product | — |
| `breadcrumbs` | BREADCRUMBS | `parent` | all | brand, product_category, product | — |
| `iconVariant` | ICON_VARIANT | `line` | all | brand | — |
| `template` | *(string)* | `undefined` | all | brand | — |
| `theme` | *(string)* | `"default"` | all | brand | — |
| `seoTitle` | *(string)* | `undefined` | all | brand, product_category, product | — |
| `seoDescription` | *(string)* | `undefined` | all | brand, product_category, product | — |
| `seoCanonical` | *(string)* | `undefined` | all | brand, product_category, product | — |
| `seoOgTitle` | *(string)* | `undefined` | all | brand, product_category, product | — |
| `seoOgDescription` | *(string)* | `undefined` | all | brand, product_category, product | — |
| `seoOgImage` | *(string)* | `undefined` | all | brand, product_category, product | — |
| `seoTwitterTitle` | *(string)* | `undefined` | all | brand, product_category, product | — |
| `seoTwitterDescription` | *(string)* | `undefined` | all | brand, product_category, product | — |
| `seoTwitterImage` | *(string)* | `undefined` | all | brand, product_category, product | — |

**Bold entries in the `locked` column are undocumented in Notion** — they force a value regardless of user override.

### DATA_DEFINITIONS (23 properties)

| Property | Default | Contexts | Scopes |
| --- | --- | --- | --- |
| `billingDetailsDisabled` | `false` | billing_details | brand |
| `catalogueDisabled` | `false` | catalogue | brand |
| `categoryBadge` | `undefined` | catalogue, configure | brand, product_category |
| `clickwrapDisclaimer` | `undefined` | checkout | brand |
| `displayFontLink` | `undefined` | all | brand |
| `optionBadge` | `undefined` | configure, basket, checkout | option_category, option |
| `optionBenefits` | `[]` | configure, basket, checkout | **option_category, option** *(doc incorrectly says product_category, product)* |
| `optionGroupIcon` | `undefined` | configure | option_category, option |
| `optionGroupLabel` | `undefined` | configure, basket | option_category, option |
| `optionImgUrl` | `undefined` | configure, basket | option_category, option |
| `optionUpsellEnabled` | `false` | basket, checkout | **option** *(doc incorrectly says brand, option_category, option)* |
| `productBadge` | `undefined` | catalogue, configure, recommendations | product_category, product |
| `productBenefits` | `[]` | catalogue, configure, recommendations | product_category, product |
| `productName` | `undefined` | configure, basket, auth, checkout, confirmation | product_category, product |
| `productsToBundle` | `[]` | catalogue, configure, recommendations | brand, product_category, product |
| `productsToRecommend` | `[]` | recommendations | product_category, product |
| `storeBadge` | `undefined` | catalogue | brand |
| `storeHeading` | `undefined` | catalogue | brand |
| `storeSubHeading` | `undefined` | catalogue | brand |
| `storeUrl` | `undefined` | all | brand |
| `trimTrailingZeroes` | `true` | catalogue, configure, recommendations, basket, auth | brand, product_category, product, option_category, option |
| `trustMessagingMarkdown` | `undefined` | configure, basket, checkout | brand, product_category, product |

---

## Appendix B — Template enums and actually-registered templates

Source: `packages/client-vue/src/modules/*/types.ts` (enum) and each page's `.vue` file (registered templates).

| Context | Component | Enum values (types.ts) | **Actually registered in `supportedTemplates`** |
| --- | --- | --- | --- |
| `auth` (Login) | `session/Login.vue` | `split, enclosed, canvas-card, surface-box, two-column-ltr, two-column-rtl` | **`split, canvas-card, surface-box, two-column-ltr, two-column-rtl`** *(no `enclosed`)* |
| `auth` (Register) | `session/Register.vue` | same as above | **`split, canvas-card, surface-box, two-column-ltr, two-column-rtl`** *(no `enclosed`)* |
| `auth` (Recover) | `session/RecoverPassword.vue` | same as above | **`split, canvas-card, surface-box, two-column-ltr, two-column-rtl`** *(no `enclosed`)* |
| `basket` | `basket/Basket.vue` | `full, two-column-ltr, two-column-rtl, enclosed` | `full, two-column-ltr, two-column-rtl, enclosed` |
| `checkout` | `checkout/Checkout.vue` | `full, two-column-ltr, two-column-rtl, enclosed` | `full, two-column-ltr, two-column-rtl, enclosed` |
| `billing_details` | `billing/Billing.vue` | `full, two-column-ltr, two-column-rtl, enclosed` | `full, two-column-ltr, two-column-rtl, enclosed` |
| `configure` | `product/Configure.vue` | `full, two-column-ltr, two-column-rtl, enclosed` | `full, two-column-ltr, two-column-rtl, enclosed` |
| `confirmation` | `order/Order.vue` | `full, two-column-ltr, two-column-rtl, enclosed` | `full, two-column-ltr, two-column-rtl, enclosed` |
| `basket` (edit) | `basket-product/Edit.vue` | `full, two-column-ltr, two-column-rtl, enclosed` | `full, two-column-ltr, two-column-rtl, enclosed` |
| `catalogue` / DAC | `domain/Dac.vue`, `domain/Domain.vue` | DOMAIN_TEMPLATE: `full, drawer, widget` | Dac.vue: `full, widget`; Domain.vue: `drawer` |

**Key discrepancy:** `enclosed` is defined in `SESSION_TEMPLATE` but not registered in any of the three session page components. The Notion Templates appendix currently lists it as supported — this is the source of N2 above.

---

## Appendix C — Evidence of JSON syntax bug (N1)

Verbatim from Notion page "Configuring Options in Cart and Portal" (fetched 2026-04-20T11:32:58.474Z):

```
{
	"@context.*.template": = "two-column-ltr"
}
```

```
{
	"@context.checkout.template": = "full"
}
```

```
{
	"@context.*.template": = "two-column-ltr",
	"@context.auth.template": = "canvas-card"
}
```

All three are unparseable JSON. Every working example *later* on the same page (e.g., `"@context.basket.template": "two-column-rtl"`, `"@context.catalogue.productListLayout": "2-col"`) uses the correct syntax. This appears to be an isolated section that predates the rest of the page's clean-up.

---

## Appendix D — Files reviewed

**Codebase (authoritative source):**

- `/Users/domdacosta/Dev/Upmind/monorepo/packages/headless/src/modules/config/schema/definitions.ts`
- `/Users/domdacosta/Dev/Upmind/monorepo/packages/headless/src/modules/config/schema/types.ts`
- `/Users/domdacosta/Dev/Upmind/monorepo/packages/headless/src/modules/config/types.ts`
- `/Users/domdacosta/Dev/Upmind/monorepo/packages/client-vue/src/modules/session/{types.ts,Login.vue,Register.vue,RecoverPassword.vue}`
- `/Users/domdacosta/Dev/Upmind/monorepo/packages/client-vue/src/modules/basket/{types.ts,Basket.vue}`
- `/Users/domdacosta/Dev/Upmind/monorepo/packages/client-vue/src/modules/basket-product/{types.ts,Edit.vue}`
- `/Users/domdacosta/Dev/Upmind/monorepo/packages/client-vue/src/modules/checkout/{types.ts,Checkout.vue}`
- `/Users/domdacosta/Dev/Upmind/monorepo/packages/client-vue/src/modules/billing/{types.ts,Billing.vue}`
- `/Users/domdacosta/Dev/Upmind/monorepo/packages/client-vue/src/modules/product/{types.ts,Configure.vue}`
- `/Users/domdacosta/Dev/Upmind/monorepo/packages/client-vue/src/modules/order/{types.ts,Order.vue}`
- `/Users/domdacosta/Dev/Upmind/monorepo/packages/client-vue/src/modules/domain/{types.ts,Dac.vue,Domain.vue}`

**Notion pages fetched:**

1. Understanding Cart 2.0
2. Understanding the Cart Architecture
3. Using the Decision Guide
4. Exploring Example Scenarios
5. Configuring Your Store with UI Metadata
6. Setting Up Theming with CSS Variables
7. Launching with the Ready-made Cart
8. Building a Custom Checkout with Headless Setup
9. Understanding the Migration Overview
10. Planning Your Migration Strategy
11. Configuring Options in Cart and Portal
12. Applying Accessibility Considerations
13. Glossary (confirmed empty, 46 rows)

**Standards referenced:**

- `/Users/domdacosta/Dev/Upmind/monorepo/.agent/rules/guides-writing.md`

---

## Appendix E — In-progress signals (pages that feel mid-edit vs truly unstarted)

Distinguishing **"not started"** from **"in progress"** matters for prioritisation. The former is a scoping issue (has anyone been asked?); the latter is a completion issue (someone is mid-flight). Evidence-based breakdown:

### 🟠 In progress (someone is mid-edit — finish what's started)

| Page / Section | Signal |
| --- | --- |
| **Configuring Options in Cart and Portal** → Templates examples | The three `": = "` JSON blocks (N1) appear *only* in the Templates section. Every *other* JSON block on the same page uses correct syntax. Reads as a legacy draft that wasn't cleaned up when the rest of the page was rewritten. |
| **Using the Decision Guide** (Decision Guide for existing users) | Five inline `<span discussion-urls=...>` markers bleed through (N6). These are unresolved editorial threads — someone has been commenting but comments haven't been resolved or applied. |
| **Building a Custom Checkout with Headless Setup** | Contains orange-coloured "Links to deeper documentation" placeholder text. Reads as a scaffold awaiting content — high-level setup steps listed, no actual code, no install command, no composable example. |
| **Configuring Options in Cart and Portal** → Content and copy section | CSS colour-token snippets (`--text-display`, `--text-button-primary`, `--color-core-display`) embedded inside a section about copy. Looks like content pasted from the theming page during drafting and not re-categorised. |
| **Configuring Your Store with UI Metadata** → Templates appendix | Defaults column says `two-column-rtl` for basket/checkout/configure. Body copy on the same page says `two-column-ltr (Default)`. Self-contradiction = mid-edit. |
| **Configuring Your Store with UI Metadata** → scope values | `optionBenefits` and `optionUpsellEnabled` scope values wrong (N4, N5). Both correct for adjacent rows, so not a systemic misunderstanding — just two rows that weren't re-verified. |

### 🔴 Not started (no evidence of any work)

| Page / Section | Signal |
| --- | --- |
| **Glossary** | 46 empty rows. Zero content added since 2026-04-16. |
| **SEO properties** (9 of them) | No rows added to the UI Properties appendix. No section on SEO anywhere in the 12 pages. |
| **Intro blocks** (Time / Difficulty / Modules used) | Required by `guides-writing.md`, absent from every page. |
| **"What You'll Build" sections** | Required by `guides-writing.md`, absent from every page. |
| **Error handling & diagnostics** | No page mentions what happens for invalid JSON, unknown keys, or out-of-enum values. |
| **Enum value lists** | `VISIBILITY`, `TAXES_DISPLAY`, `OPTION_SELECTOR` etc. are referenced but their valid values are never listed. |
| **`locked` semantics** | Fundamental feature of the schema (forces values in specific contexts) — zero mention anywhere. |

### ✅ Looks done (genuinely finished to a shippable bar)

| Page / Section | Signal |
| --- | --- |
| **Setting Up Theming with CSS Variables** | Complete CSS token reference (primitives + semantic tokens), clean scoping, no stray placeholders. |
| **Launching with the Ready-made Cart** | Has prerequisites block, step-by-step setup, go-live checklist. Feels shippable. |
| **Planning Your Migration Strategy** | Four-phase strategy, concrete checklist. Self-contained. |
| **UI Properties appendix** (ex-SEO) | 52 of 61 rows present with correct type/default/context/scope data. Quality is good. |
| **Data Properties appendix** (ex-scope bugs on 2 rows) | 21 of 23 rows present, syntax corrected. |
| **Action-based titles** | All 12 titles rewritten. Consistent pattern. |

**Prioritisation takeaway:** The "in progress" bucket is the quick-win pile — one focused afternoon would close out the three `=` JSON bugs, resolve the discussion threads on the Decision Guide, reconcile the template-default contradictions, and fix the two scope rows. That alone lifts the score by ~5 points and eliminates every 🔴 critical issue except Glossary + SEO + intro blocks (which are genuinely "not started" and need a scoping decision, not more editing).

---

## Appendix F — Where to document the missing properties (answer to copywriter's question)

The copywriter asked whether missing properties from the original audit should live on **"Configuring Your Store with UI Metadata"** or **"Configuring Options in Cart and Portal"**. The distinction is:

- **Configuring Your Store with UI Metadata** = **reference page**. Source of truth for every UI/Data property (name, type, default, contexts, scopes). One row per property.
- **Configuring Options in Cart and Portal** = **task/feature guide**. Shows how to configure product **options** (addons/variants) with working examples and screenshots. Links *back* to the reference for full property definitions.

Per `.agent/rules/guides-writing.md`: reference material lives on reference pages; guides are task-oriented and link to reference. So the default rule is:

> **Every property gets its master row on "Configuring Your Store with UI Metadata". Option-related properties get *additionally* demonstrated on "Configuring Options in Cart and Portal" with inline examples + a link back to the reference row.**

Breakdown of the screenshot's 26 properties:

### Document on **"Configuring Your Store with UI Metadata"** (reference appendix — all of them)

All 26 properties belong in the UI Properties or Data Properties appendix tables on this page. No exceptions. This is the master reference.

### *Also* demonstrate on **"Configuring Options in Cart and Portal"** (with working example + link back)

Option- and term-related properties only. Demonstrate with a copy-paste JSON snippet showing the property in context:

**From UI Properties:**

- `optionSelector`, `optionSelectorGrid`, `optionSelectorIcons`
- `termSelector`, `termSelectorGrid`, `termSelectorSummary`

**From Data Properties:**

- `optionGroupLabel`, `optionGroupIcon`
- `optionImgUrl`

### Don't duplicate on Configuring Options

These are either global or non-option scoped — reference-only:

**From UI Properties:**

- `productAnchorPrice`, `productBenefits`, `productCategory` → catalogue/recommendations. Consider demonstrating briefly on "Configuring Your Store" body copy, not on Options.
- `basketTaxes`, `paymentGatewaysCap`, `trustMessaging` → basket/checkout. Belong on "Configuring Your Store" only.
- `iconVariant`, `theme` → global. Reference only; `theme` is already covered on the Theming page.
- All 9 SEO properties → global brand/catalogue metadata. Reference only.

**From Data Properties:**

- `trimTrailingZeroes` → formatting. Reference only.
- `trustMessagingMarkdown` → pair with `trustMessaging` on Configuring Your Store.
- `displayFontLink` → theme-related but it is a `@data` key, not a CSS variable. Reference row on Configuring Your Store; *link to it* from the Theming page's "Loading custom fonts" section.
- `clickwrapDisclaimer` → checkout content. Reference only.

### One-sentence version for the copywriter

> **All 26 missing properties belong in the Configuring Your Store appendix. The 9 option/term properties (`optionSelector*`, `termSelector*`, `optionGroupLabel`, `optionGroupIcon`, `optionImgUrl`) should *also* appear with working examples on "Configuring Options in Cart and Portal", linking back to their reference row.**
