# Cart 2.0 Notion Documentation Review

**Date:** 2026-04-23  
**Reviewer:** Claude (assisted by Dom)  
**Source:** https://www.notion.so/upmind-app/Using-Cart-2-0-2e9782386d418073bf56e5532f73d1cd  
**Prior Audit:** 2026-04-16 (68/100)  
**Scope:** Delta audit + fresh full audit  
**Compared Against:** Codebase (`packages/headless/src/modules/config/schema/definitions.ts`), `.agent/rules/guides-writing.md`

---

## Executive Summary

| Metric | Previous | Current | Delta |
|--------|----------|---------|-------|
| **Overall Confidence** | 68/100 | 76/100 | **+8** |
| Technical Accuracy | 70/100 | 74/100 | +4 |
| Completeness | 55/100 | 78/100 | +23 |
| Structure | 65/100 | 80/100 | +15 |
| Clarity | 75/100 | 78/100 | +3 |
| Actionability | 60/100 | 72/100 | +12 |

**Verdict:** Meaningful progress. The copywriter addressed the most critical issues from the prior audit. The Glossary is now fully populated (was the #1 blocker), intro blocks follow guide standards, and both UI and Data property tables are comprehensive. The `@data` syntax confusion has been explicitly clarified with a callout. Remaining issues are polish items, not blockers.

---

## TL;DR: Remaining Polish Items

> **For the copywriter (no codebase access needed):**
>
> - Resolve discussion threads in "Using the Decision Guide" — `<span discussion-urls="...">` markers are leaking into the published view
>
> **For engineering assist (requires codebase verification):**
>
> - Add template enum values per context — auth uses `split`, `canvas-card`, etc. (NOT `full`)
> - Fix `productStyle` enum: change `carded-flush` → `flush-carded`
> - Fix `productList` enum: add missing `carousel` value
> - Verify `invoiceItemImages` and `termSelectorPosition` exist in codebase or remove from docs

---

## Part 1: Delta Audit (vs 2026-04-16)

### Prior Issues — Status

| Issue | Severity | Status | Evidence |
|-------|----------|--------|----------|
| Glossary completely empty (40+ empty rows) | 🔴 Critical | ✅ **FIXED** | Now contains 60+ defined terms with descriptions |
| JSON syntax errors (// comments) | 🔴 Critical | ✅ **FIXED** | All JSON examples are now comment-free |
| Data settings syntax (`@data.*.storeUrl`) | 🔴 Critical | ✅ **FIXED** | Explicit callout: "Data settings do not use context wildcards" + correct examples |
| Titles are noun-based, not action-based | 🟠 Medium | ✅ **FIXED** | Now "Configuring Your Store with UI Metadata", "Understanding the Cart Architecture" |
| Missing intro blocks (Time/Difficulty/Modules) | 🔴 High | ✅ **FIXED** | Present on all major pages (UI Metadata, Architecture, Decision Guide) |
| No "What You'll Build" section | 🔴 High | ✅ **FIXED** | Added to UI Metadata page: "A working UI Metadata configuration..." |
| Prerequisites inconsistent | 🟠 Medium | ✅ **FIXED** | Consistent prerequisite blocks on all guide pages |
| No complete copy-paste examples | 🔴 High | 🟡 **PARTIAL** | Examples inline are good, but no single "Complete Example" section at end of UI Metadata page |
| Missing UI properties (productAnchorPrice, optionSelector, etc.) | 🟠 Medium | ✅ **FIXED** | All properties now in UI Properties appendix table |
| Missing Data properties (trimTrailingZeroes, trustMessagingMarkdown, etc.) | 🟠 Medium | ✅ **FIXED** | All properties now in Data Properties appendix table |
| SEO properties not documented | 🟠 Medium | ✅ **FIXED** | SEO appendix table added with all 9 properties |
| No error handling guidance | 🟠 Medium | ✅ **FIXED** | New section: "Error handling and invalid values" |
| External spreadsheet reference | 🟠 Medium | ✅ **FIXED** | No external references found; all content inline |
| Template values for auth (lists `full` which doesn't exist) | 🟠 Medium | ❌ **NOT FIXED** | `template` property still shows no enum values in docs; auth templates not explicitly listed |
| Missing defaults table | 🟠 Medium | ✅ **FIXED** | Both UI and Data tables now include Default column |

### New Issues Since Prior Audit

| Issue | Severity | Location | Details |
|-------|----------|----------|---------|
| 🟠 In-progress markers in Decision Guide | Warning | Decision Guide page | `<span discussion-urls="...">` markers visible — unresolved comment threads |
| 🟡 New properties not in codebase | Suggestion | UI Properties table | `invoiceItemImages`, `termSelectorPosition` appear in docs but not in `UI_META_DEFINITIONS` |
| 🟡 Enum discrepancy: productList | Suggestion | UI Properties table | Docs show `grid \| dac`; code shows `grid \| carousel \| dac` — missing `carousel` |
| 🟡 Enum discrepancy: productStyle | Suggestion | UI Properties table | Docs show `flush \| carded \| carded-flush`; code shows `flush \| carded \| flush-carded` |

### New Strengths

| Strength | Location | Impact |
|----------|----------|--------|
| 🟢 Comprehensive UI Properties table | UI Metadata page | Clients can now find all 50+ properties with defaults, enum values, contexts, and scopes |
| 🟢 Explicit context vs data distinction | UI Metadata page | Clear callout box: "Data settings do not use context wildcards" |
| 🟢 Error handling section | UI Metadata page | Explains silent fallback behavior — prevents client confusion |
| 🟢 Inheritance explanation | UI Metadata page | Fallback chain clearly documented: product → category → brand → default |
| 🟢 Populated Glossary | Glossary page | 60+ terms professionally defined |

---

## Part 2: Fresh Full Audit

### Technical Accuracy: 74/100

**Correct:**
- Context names match `UIContext` enum in codebase
- Scope inheritance chain matches `SCOPE_ORDER`
- Viewport modifiers (`/sm`, `/md`, `/lg`) correct
- Most property names, defaults, and contexts match `UI_META_DEFINITIONS`
- Data syntax now correctly shows `@data.storeUrl` (no context wildcard)

**Issues:**
- `invoiceItemImages` and `termSelectorPosition` appear in docs but not in codebase `UI_META_DEFINITIONS` (lines 30-515)
- `productList` enum missing `carousel` value
- `productStyle` shows `carded-flush` but code has `flush-carded`
- `template` property lacks enum values — auth context specifically uses different template set (SESSION_TEMPLATE: `split`, `enclosed`, `canvas-card`, `surface-box`, `two-column-ltr`, `two-column-rtl` — NOT `full`)

### Completeness: 78/100

**Covered:**
- All 50+ UI properties from `UI_META_DEFINITIONS`
- All 22 Data properties from `DATA_DEFINITIONS`
- All 9 SEO properties
- Error handling guidance
- Inheritance/fallback explanation

**Missing:**
- Template enum values per context (critical — auth has different templates than basket/checkout)
- `locked` behavior documentation (some properties are locked in certain contexts)
- No "Complete Example" section with full working JSON config

### Structure: 80/100

**Follows guides-writing.md:**
- ✅ Action-based titles: "Configuring Your Store with UI Metadata"
- ✅ Intro blocks: Time / Difficulty present
- ✅ "What You'll Build" section
- ✅ Prerequisites block
- 🟡 No numbered step-by-step (examples scattered)
- 🟡 No "Complete Example" section at end
- ✅ Persona callouts not required for this reference doc type

### Clarity: 78/100

**Good:**
- Active voice throughout
- Clear distinction between `@context` and `@data`
- Examples with screenshots
- Explicit callout box for data syntax

**Issues:**
- `<span discussion-urls="...">` markers leak into Decision Guide (unresolved editorial threads)
- Some table entries could use clearer descriptions

### Actionability: 72/100

**Good:**
- JSON examples are copy-paste ready
- Screenshots show expected results
- Error handling section explains what to check

**Missing:**
- Single complete working config example
- Template enum values (client can't know valid values for auth `template`)

---

## Copywriter Feedback

First — thank you for the substantial work. The jump from 68 → 76 is real and reflects genuine effort across multiple fronts:

1. **The Glossary is excellent.** 60+ terms with professional definitions transforms it from a credibility problem to an asset.
2. **The intro blocks are consistent.** Time/Difficulty/Prerequisites appear across all major pages — exactly as `guides-writing.md` specifies.
3. **The `@data` clarification is perfect.** The callout "Data settings do not use context wildcards" directly addresses the prior audit's #1 confusion point.
4. **The property tables are comprehensive.** Both UI and Data appendices are now complete reference material.

### Top 3 Priorities (ordered by severity × ease)

1. **Clean up Decision Guide discussion markers** (🟠 Easy fix, copywriter can do)
   - The page has visible `<span discussion-urls="...">` markers around the decision questions
   - These are unresolved Notion comment threads leaking into the published view
   - **Fix:** Resolve or delete the discussion threads in Notion

2. **Document template enum values per context** (🔴 Requires codebase access)
   - The `template` property row shows no enum values
   - Different contexts support different templates (auth ≠ basket ≠ checkout)
   - **Fix (engineering-assisted):** Add a template reference showing which templates are valid for which contexts:
     - Auth: `split`, `enclosed`, `canvas-card`, `surface-box`, `two-column-ltr`, `two-column-rtl`
     - Basket/Checkout/Confirmation: `full`, `two-column-ltr`, `two-column-rtl`, `enclosed`

3. **Fix enum discrepancies** (🟡 Requires codebase access)
   - `productList`: add `carousel` to enum values
   - `productStyle`: change `carded-flush` to `flush-carded`
   - Verify `invoiceItemImages` and `termSelectorPosition` exist in codebase or remove

### One-Sentence Summary

The documentation is now client-ready for most use cases; the remaining fixes are editorial cleanup (discussion markers) and technical accuracy checks (template enums) that require one pass with codebase access.

---

## Appendix A: Complete Property Reference from Codebase

### UI Properties (from `UI_META_DEFINITIONS` — 50 properties)

| Property | Type | Default | Contexts | Scopes |
|----------|------|---------|----------|--------|
| activeCategoryBadge | VISIBILITY | visible | catalogue | brand |
| activeCategoryDescription | VISIBILITY | visible | catalogue | brand |
| basketFields | VISIBILITY | hidden | basket, checkout | brand |
| basketItems | VISIBILITY | hidden | checkout | brand |
| basketSummary | VISIBILITY | visible | auth, checkout | brand |
| basketTaxes | TAXES_DISPLAY | consolidated | basket, auth, checkout, confirmation | brand |
| billingDetails | EDITABILITY | readonly | billing_details, checkout | brand |
| breadcrumbs | BREADCRUMBS | parent | all | brand, product_category, product |
| categoryBadge | VISIBILITY | visible | catalogue | brand, product_category |
| categoryExcerpt | VISIBILITY | visible | catalogue | brand, product_category |
| categoryIcon | VISIBILITY | hidden | catalogue | brand, product_category |
| categoryImageFallback | VISIBILITY | visible | catalogue | brand, product_category |
| categoryImageRatio | IMAGE_RATIO | 1:1 | catalogue | brand, product_category |
| categoryImages | VISIBILITY | hidden | catalogue | brand, product_category |
| categoryList | LIST_STYLE | grid | catalogue, recommendations | brand, product_category |
| categoryListLayout | CATEGORY_GRID_LAYOUT | 3-col | catalogue, recommendations | brand, product_category |
| iconVariant | ICON_VARIANT | line | all | brand |
| optionGroupDescription | DESCRIPTION_DISPLAY | tooltip | configure | brand, product_category, product, option_category |
| optionGroupDividers | DIVIDER_STYLE | hidden | configure | brand, product_category, product |
| optionGroupSpacing | OPTION_GROUP_SPACING | 4 | configure | brand, product_category, product |
| optionItemBenefits | VISIBILITY | visible | configure, basket, checkout | brand, product_category, product, option_category, option |
| optionItemDescription | DESCRIPTION_DISPLAY | inline | configure | brand, product_category, product, option_category, option |
| optionSelector | OPTION_SELECTOR | radio-rows | configure | brand, product_category, product, option_category |
| optionSelectorGrid | GRID_LAYOUT | 2-col | configure | brand, product_category, product, option_category |
| optionSelectorIcons | VISIBILITY | visible | configure | brand, product_category, product, option_category |
| optionUpsells | VISIBILITY | visible | basket, checkout | brand, product_category, product, option_category |
| paymentGatewaysCap | GATEWAY_CAP | 5 | checkout | brand, product_category, product |
| productAnchorPrice | VISIBILITY | visible | catalogue, configure, recommendations | brand, product_category, product |
| productBadge | VISIBILITY | visible | catalogue, configure, recommendations | brand, product_category, product |
| productBenefits | VISIBILITY | visible | catalogue, recommendations | brand, product_category, product |
| productCategory | VISIBILITY | hidden | catalogue, configure, recommendations | brand, product_category, product |
| productConfigFieldsSummary | VISIBILITY | hidden | configure | brand, product_category, product |
| productConfigOptionsSummary | VISIBILITY | visible | configure, basket | brand, product_category, product |
| productConfigSummary | VISIBILITY | visible | configure, basket | brand, product_category, product |
| productDescription | CLAMPABLE_VISIBILITY | clamped | configure | brand, product_category, product |
| productDescriptionClamp | CLAMP_LINES | 3 | configure | brand, product_category, product |
| productExcerpt | VISIBILITY | visible | catalogue, recommendations | brand, product_category, product |
| productImageFallback | VISIBILITY | visible | catalogue, configure, recommendations, basket, confirmation | brand, product_category, product |
| productImageRatio | IMAGE_RATIO | 1:1 | catalogue, configure, recommendations, basket, confirmation | brand, product_category, product |
| productImages | VISIBILITY | visible | catalogue, configure, recommendations, basket, confirmation | brand, product_category, product |
| productImagesStyle | IMAGES_STYLE | auto | catalogue, configure, recommendations, basket, confirmation | brand, product_category, product |
| productList | PRODUCT_LIST_STYLE | grid | catalogue, recommendations | brand, product_category |
| productListLayout | GRID_LAYOUT | 3-col | catalogue, recommendations | brand, product_category |
| productNativeRecommendations | VISIBILITY | visible | recommendations | brand, product_category, product |
| productOrientation | ORIENTATION | vertical | catalogue, recommendations | brand, product_category, product |
| productPriceSummary | VISIBILITY | visible | catalogue, recommendations | brand, product_category, product |
| productStyle | PRODUCT_STYLE | flush | catalogue, recommendations | brand, product_category, product |
| productTermSelector | VISIBILITY | hidden | catalogue, recommendations, basket | brand, product_category, product |
| seoCanonical | - | undefined | all | brand, product_category, product |
| seoDescription | - | undefined | all | brand, product_category, product |
| seoOgDescription | - | undefined | all | brand, product_category, product |
| seoOgImage | - | undefined | all | brand, product_category, product |
| seoOgTitle | - | undefined | all | brand, product_category, product |
| seoTitle | - | undefined | all | brand, product_category, product |
| seoTwitterDescription | - | undefined | all | brand, product_category, product |
| seoTwitterImage | - | undefined | all | brand, product_category, product |
| seoTwitterTitle | - | undefined | all | brand, product_category, product |
| template | - | undefined | all | brand |
| termSelector | TERM_SELECTOR | radio-grid | configure | brand, product_category, product |
| termSelectorGrid | GRID_LAYOUT | 2-col | configure | brand, product_category, product |
| termSelectorSummary | VISIBILITY | visible | configure | brand, product_category, product |
| theme | - | default | all | brand |
| trustMessaging | VISIBILITY | visible | configure, basket, checkout | brand, product_category, product |
| zeroPriceDisplay | ZERO_PRICE_DISPLAY | label | catalogue, configure, recommendations, basket, auth, checkout, confirmation | brand, product_category, product, option_category, option |

### Data Properties (from `DATA_DEFINITIONS` — 22 properties)

| Property | Default | Contexts | Scopes |
|----------|---------|----------|--------|
| billingDetailsDisabled | false | billing_details | brand |
| catalogueDisabled | false | catalogue | brand |
| categoryBadge | undefined | catalogue, configure | brand, product_category |
| clickwrapDisclaimer | undefined | checkout | brand |
| displayFontLink | undefined | all | brand |
| optionBadge | undefined | configure, basket, checkout | option_category, option |
| optionBenefits | [] | configure, basket, checkout | option_category, option |
| optionGroupIcon | undefined | configure | option_category, option |
| optionGroupLabel | undefined | configure, basket | option_category, option |
| optionImgUrl | undefined | configure, basket | option_category, option |
| optionUpsellEnabled | false | basket, checkout | option |
| productBadge | undefined | catalogue, configure, recommendations | product_category, product |
| productBenefits | [] | catalogue, configure, recommendations | product_category, product |
| productName | undefined | configure, basket, auth, checkout, confirmation | product_category, product |
| productsToBundle | [] | catalogue, configure, recommendations | brand, product_category, product |
| productsToRecommend | [] | recommendations | product_category, product |
| storeBadge | undefined | catalogue | brand |
| storeHeading | undefined | catalogue | brand |
| storeSubHeading | undefined | catalogue | brand |
| storeUrl | undefined | all | brand |
| trimTrailingZeroes | true | catalogue, configure, recommendations, basket, auth | brand, product_category, product, option_category, option |
| trustMessagingMarkdown | undefined | configure, basket, checkout | brand, product_category, product |

---

## Appendix B: Template Cross-Reference

### Templates by Context (from codebase)

| Context | Component | Template Enum | Valid Values |
|---------|-----------|---------------|--------------|
| auth | session/Login.vue | SESSION_TEMPLATE | split, enclosed, canvas-card, surface-box, two-column-ltr, two-column-rtl |
| auth | session/Register.vue | SESSION_TEMPLATE | split, enclosed, canvas-card, surface-box, two-column-ltr, two-column-rtl |
| auth | session/RecoverPassword.vue | SESSION_TEMPLATE | split, enclosed, canvas-card, surface-box, two-column-ltr, two-column-rtl |
| basket | basket/Basket.vue | BASKET_TEMPLATE | full, two-column-ltr, two-column-rtl, enclosed |
| checkout | checkout/Checkout.vue | CHECKOUT_TEMPLATE | full, two-column-ltr, two-column-rtl, enclosed |
| billing_details | billing/Billing.vue | BILLING_TEMPLATE | full, two-column-ltr, two-column-rtl, enclosed |
| configure | product/Configure.vue | PRODUCT_TEMPLATE | full, two-column-ltr, two-column-rtl, enclosed |
| confirmation | order/Order.vue | ORDER_TEMPLATE | full, two-column-ltr, two-column-rtl, enclosed |

**Key Finding:** Auth context does NOT support `full` template. Docs should explicitly note this.

---

## Appendix C: Verbatim Evidence

### Discussion Markers in Decision Guide

```
- <span discussion-urls="discussion://31878238-6d41-8047-b154-001c8eeea550">Do you want to sell as soon as possible with minimal setup?</span>
- <span discussion-urls="discussion://31878238-6d41-8047-b154-001c8eeea550">Do you need full control over layout, flow, and interaction?</span>
```

### Enum Discrepancy: productList

- **Docs:** `grid | dac`
- **Code (types.ts:98-104):**
  ```typescript
  export const PRODUCT_LIST_STYLE = {
    GRID: "grid",
    CAROUSEL: "carousel",
    DAC: "dac"
  } as const;
  ```

### Enum Discrepancy: productStyle

- **Docs:** `flush | carded | carded-flush`
- **Code (types.ts:120-125):**
  ```typescript
  export const PRODUCT_STYLE = {
    FLUSH: "flush",
    CARDED: "carded",
    "FLUSH-CARDED": "flush-carded"
  } as const;
  ```

---

## Appendix D: Files Reviewed

### Notion Pages Fetched
- Using Cart 2.0 (root)
- Getting Started with Cart 2.0
- Understanding Cart 2.0
- Understanding the Cart Architecture
- Choosing What to Implement for Your Business
- Using the Decision Guide
- Exploring Example Scenarios
- Configuring Your Store with UI Metadata
- Setting Up Theming with CSS Variables
- Choosing a Quick Start Path
- Launching with the Ready-made Cart
- Building a Custom Checkout with Headless Setup
- Migrating from Cart 1.0 to Cart 2.0
- Understanding the Migration Overview
- Planning Your Migration Strategy
- Customizing and Theming Your Cart
- Configuring Options in Cart and Portal
- Applying Accessibility Considerations
- Understanding Key Terms in the Glossary

### Codebase Files Read
- `packages/headless/src/modules/config/schema/definitions.ts` (lines 1-659)
- `packages/headless/src/modules/config/schema/types.ts` (lines 1-330)
- `packages/client-vue/src/modules/session/types.ts` (SESSION_TEMPLATE enum)

### Standards Referenced
- `.agent/rules/guides-writing.md`
- `.agent/rules/docs-reviews.md`

---

## Appendix E: In-Progress Signals

### 🟠 In Progress (mid-edit work)
- Decision Guide: `<span discussion-urls="...">` markers indicate unresolved editorial discussions

### 🔴 Not Started
- Template enum values per context
- `locked` behavior documentation

### ✅ Done (shippable)
- Glossary
- UI Properties appendix
- Data Properties appendix
- SEO Properties appendix
- Error handling section
- Intro blocks on all guide pages
- @data syntax clarification
