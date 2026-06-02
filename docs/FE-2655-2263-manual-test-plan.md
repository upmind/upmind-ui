# Manual Smoke Test — FE-2655 + FE-2263

Minimum viable test set to prove both features work end-to-end and catch any major regressions. Not exhaustive — pick the corner cases up if any of these fail.

## Setup

### Run the app

- `pnpm dev` from `apps/velia` (or whichever app you're testing).

### Test data needed

- A test brand with:
  - At least 2 products (note their UUIDs — you'll substitute them into the JSON below as `<PRODUCT_A_ID>`, `<PRODUCT_B_ID>`)
  - At least 1 product that supports multiple billing cycles (e.g., 1-month and 12-month plans)
  - At least 1 active coupon code (note the code as `<COUPON_CODE>`)
  - At least 1 recommendation product (a product that will be recommended when others are in basket — note its UUID as `<RECOMMENDATION_ID>`)

### Where to author meta

You'll author meta at three levels in these tests:
- **Brand level:** PATCH the brand's `uiMeta` field (typically via admin API or test fixture)
- **Product level:** PATCH the product's `uiMeta` field
- **Category level:** PATCH the category's `uiMeta`

Each test specifies which level to use. The JSON in each test is what goes into that entity's `uiMeta` object.

Replace `<PRODUCT_A_ID>` etc. with real UUIDs from your test brand before authoring.

---

## Part 1 — FE-2655: Conditional rules (4 tests)

### 1.1 Plain values still work (backwards compatibility)

**What this checks:** plain string values bypass conditional evaluation cleanly — pre-FE-2655 authoring still works.

**Author at brand level uiMeta:**
```json
{
  "@context.basket.productTermSelector": "hidden"
}
```

**Steps:**
1. Add any product (e.g., `<PRODUCT_A_ID>`) to the basket.
2. Navigate to the **basket screen** (`/basket` or wherever the cart UI lives in your app).

**Verify in UI:** the basket line item does NOT display a term selector (the dropdown/radio for choosing billing cycle).

✅ Plain values bypass conditional evaluation.

---

### 1.2 Conditional rules evaluate against basket state

**What this checks:** a `basket.*` rule fires reactively when the basket changes.

**Author at brand level uiMeta** (replace `<PRODUCT_A_ID>` with a real product UUID from your test brand):
```json
{
  "@context.basket.productTermSelector": {
    "default": "hidden",
    "rules": [
      {
        "when": { "basket.pids": { "$contains": "<PRODUCT_A_ID>" } },
        "then": "visible"
      }
    ]
  }
}
```

**Steps:**
1. Open the basket screen with an empty basket.
2. Verify the term selector is **hidden** (default applies).
3. Add `<PRODUCT_A_ID>` to the basket.
4. Verify the term selector becomes **visible** within ~1 second (no page reload needed — reactive update).
5. Remove the product from basket.
6. Verify the term selector returns to **hidden**.

✅ Conditional rules fire reactively against `basket.*` state.

---

### 1.3 Screen lock wins over conditional rules

**What this checks:** when a setting is locked on a context, conditional rules never apply at runtime — the UI ignores the authored override.

This test uses `basketFields` rather than `productTermSelector` because it requires a setting that has a **schema-defined screen lock**. `basketFields` is locked to `"visible"` on the basket screen (per `schema/definitions.ts`). `productTermSelector` has no such lock, so it can't exercise this code path.

**Author at brand level uiMeta:**
```json
{
  "@context.basket.basketFields": {
    "default": "hidden",
    "rules": [
      { "when": { "basket.item_count": { "$gte": 1 } }, "then": "hidden" }
    ]
  }
}
```

**Steps:**
1. Navigate to the basket screen with at least one item in the basket.

**Verify in UI:** the basket fields section is **visible** (the schema lock forces this regardless of your authored `"hidden"`).

✅ Lock wins at runtime; conditional rules are ignored.

---

### 1.4 Per-line basketProduct state in line-item UI

**Why this test exists:** the FE-2655 rollout shipped without consumers wiring `basketProduct` through `useConfig` for line-item rendering — so `basketProduct.*` rules silently no-op'd everywhere. This test verifies the fix actually evaluates per line.

**Author at brand level uiMeta:**
```json
{
  "@context.basket.productTermSelector": {
    "default": "visible",
    "rules": [
      { "when": { "basketProduct.bcm": { "$eq": 12 } }, "then": "hidden" }
    ]
  }
}
```

**Steps:**
1. Add the same product to the basket **twice**:
   - First instance: choose a **6-month** billing cycle.
   - Second instance: choose a **12-month** billing cycle.
2. Navigate to the basket screen — both line items should be visible side-by-side or stacked.

**Verify in UI:**
- The **6-month** line item displays the term selector (the rule doesn't match because `bcm = 6 ≠ 12`).
- The **12-month** line item does NOT display the term selector (the rule matches because `bcm = 12`).

**The two lines must show different states.** This is the load-bearing assertion — it proves the rule is evaluated per line (using each line's own `basketProduct`), not against the basket as a whole.

**If both lines show the same visibility** (either both hidden or both visible), the fix is broken: `basketProduct` isn't being plumbed correctly into the per-line `useConfig` instance. Report this as a regression of the gap-fix work.

✅ Per-line basketProduct state evaluation works — each line's rule fires against its own state.

---

## Part 2 — FE-2263: Recommendations (3 tests)

**Where recommendations are authored:** `productsToRecommend` is a `@data.*` setting (not `@context.*`) authored on a **product's** uiMeta (not brand). Recommendations attached to product A appear when product A is in the basket. Replace `<RECOMMENDATION_ID>` with the UUID of the product to recommend, and author each test below at `<PRODUCT_A_ID>`'s uiMeta (the trigger product).

---

### 2.1 matchLevel default behaviour (defaults to product_id)

**What this checks:** without an explicit `matchLevel`, recommendations default to `"product_id"` matching — they hide whenever ANY variant of the recommendation product is in the basket.

**Author at `<PRODUCT_A_ID>`'s product-level uiMeta:**
```json
{
  "@data.productsToRecommend": [
    {
      "object_id": "<RECOMMENDATION_ID>",
      "object_type": "product",
      "active": true
    }
  ]
}
```

**Steps:**
1. Add `<PRODUCT_A_ID>` to the basket (this triggers the recommendation to appear).
2. Verify the recommendation card for `<RECOMMENDATION_ID>` is **visible** in the recommendations strip.
3. Add `<RECOMMENDATION_ID>` to the basket on a **12-month** plan.
4. Verify the recommendation card **disappears**.
5. Change that basket product's billing cycle to **6-month** (or remove and re-add at 6-month).
6. Verify the recommendation card is **still hidden** (any variant still counts as a match).

✅ Default behaviour: `product_id` matches any variant.

---

### 2.2 matchLevel "product_config" preserves variant matching

**What this checks:** `matchLevel: "product_config"` opt-in makes hide-detection variant-sensitive — only the exact configured variant counts.

**Author at `<PRODUCT_A_ID>`'s product-level uiMeta:**
```json
{
  "@data.productsToRecommend": [
    {
      "object_id": "<RECOMMENDATION_ID>",
      "object_type": "product",
      "active": true,
      "matchLevel": "product_config",
      "config": { "bcm": 12 }
    }
  ]
}
```

**Steps:**
1. Add `<PRODUCT_A_ID>` to the basket.
2. Add `<RECOMMENDATION_ID>` to the basket on a **6-month** plan.
3. Verify the recommendation card is still **visible** (the config doesn't match — recommendation expects bcm=12, basket has bcm=6).
4. Change the basket product's billing cycle to **12-month** (or remove and re-add at 12-month).
5. Verify the recommendation card now **disappears** (exact config match: bcm=12 in basket matches recommendation's `config.bcm`).

✅ `product_config` matching is variant-sensitive — preserves pre-FE-2263 behaviour as opt-in.

---

### 2.2a matchLevel "product_config" without `config` — hides like product_id

**What this checks:** `product_config` with no `config` reduces to `product_id`-equivalent behaviour because "all defined fields match" is vacuously true when no fields are defined.

**Author at `<PRODUCT_A_ID>`'s product-level uiMeta:**
```json
{
  "@data.productsToRecommend": [
    {
      "object_id": "<RECOMMENDATION_ID>",
      "object_type": "product",
      "active": true,
      "matchLevel": "product_config"
    }
  ]
}
```

**Steps:**
1. Add `<PRODUCT_A_ID>` to the basket.
2. Add `<RECOMMENDATION_ID>` to the basket on **any** billing cycle.
3. Verify the recommendation card **disappears** (no `config` defined → vacuous match → hide on any variant).

✅ Absent `config` under `product_config` reduces to `product_id`-equivalent.

---

### 2.3 Conditional visibility — basketProduct.* per-product evaluation

**What this checks:** the per-product walk added in FE-2263 (walks matching basket products → "any says hidden = hide" combiner). This is the FE-2263-specific feature, not just the FE-2655 conditional rules infrastructure.

**Author at `<PRODUCT_A_ID>`'s product-level uiMeta:**
```json
{
  "@data.productsToRecommend": [
    {
      "object_id": "<RECOMMENDATION_ID>",
      "object_type": "product",
      "active": true,
      "matchLevel": "product_id",
      "conditions": {
        "default": "visible",
        "rules": [
          {
            "when": { "basketProduct.bcm": { "$eq": 12 } },
            "then": "hidden"
          }
        ]
      }
    }
  ]
}
```

**Steps:**
1. Add `<PRODUCT_A_ID>` to the basket on a **6-month** plan → verify the recommendation is **visible** (rule doesn't match: bcm=6, not 12).
2. Change that basket product's term to **12-month** → verify the recommendation **disappears** (rule matches: bcm=12).
3. **Now the per-product test:** add `<PRODUCT_A_ID>` to the basket **twice** — one line on 6-month, one line on 12-month.
4. Verify the recommendation is **hidden** ("any says hidden = hide" combiner — the 12-month line's evaluation says hide, so the rec hides even though the 6-month line's evaluation said visible).

✅ Per-product walk fires; documented combiner behaves correctly.

---

## Part 3 — Cross-feature sanity (1 test)

### 3.1 FE-2655 + FE-2263 features run together

**What this checks:** authoring a conditional context setting AND a conditional-visibility recommendation simultaneously — to confirm they don't interfere with each other.

**Author at brand level uiMeta:**
```json
{
  "@context.basket.productTermSelector": {
    "default": "visible",
    "rules": [
      {
        "when": { "basket.coupons": { "$contains": "<COUPON_CODE>" } },
        "then": "hidden"
      }
    ]
  }
}
```

**Author at `<PRODUCT_A_ID>`'s product-level uiMeta:**
```json
{
  "@data.productsToRecommend": [
    {
      "object_id": "<RECOMMENDATION_ID>",
      "object_type": "product",
      "active": true,
      "conditions": {
        "default": "visible",
        "rules": [
          {
            "when": { "basket.coupons": { "$contains": "<COUPON_CODE>" } },
            "then": "hidden"
          }
        ]
      }
    }
  ]
}
```

**Steps:**
1. Add `<PRODUCT_A_ID>` to the basket.
2. Verify the term selector is **visible** AND the recommendation card is **visible**.
3. Apply coupon `<COUPON_CODE>` to the basket.
4. Verify BOTH the term selector AND the recommendation card hide simultaneously (both evaluate the same `basket.coupons` rule and both update reactively).
5. Remove the coupon.
6. Verify both reappear.

✅ Both features evaluate independently and update reactively.

---

## If anything fails

Capture:
1. Which test number failed.
2. Exact authored meta (JSON).
3. Basket state.
4. What you expected vs what you saw.

If all 8 pass, the feature is functionally complete; remaining gaps are limited to the documented edge cases (full operator coverage, every validator code, perf at scale) which automated tests will cover.
