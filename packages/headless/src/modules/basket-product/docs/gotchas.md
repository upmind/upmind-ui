# Gotchas

Known edge cases, common mistakes, and things to watch for in the basketProduct module.

For inline editing and upsell-specific gotchas, see [Inline Editing](./inline-editing.md).

---

## 1. Currency Filtering in Term/Option Parsing

**Problem:** Products may have prices in multiple currencies. Without filtering, the wrong currency's price could display.

**Solution (FE-1502):** `parseTermDetails` and `parseSubproductDetails` now accept an optional `currencyId` parameter. When parsing basket products, `base_price_currency_id` is passed to filter prices to the correct currency.

**Watch for:** If `base_price_currency_id` is missing or null, all prices are included (no filtering). This is the expected behavior for non-basket contexts (e.g., product catalog).

---

## 2. `basketProductChanged` Typo Fix (FE-1502)

FE-1502 fixed a typo in `product.machine.ts` — `basketPoductChanged` → `basketProductChanged`. Also fixed a bug where `clientId == data?.client_id` used loose equality instead of `!==` (it was checking equality when it should have been checking \_in_equality).

Additionally, the comparison now correctly looks up the basket product from `data.products` by ID rather than comparing against the old `data.basketProduct` reference — which could be stale after a basket refresh.

---

## 3. Config Schema Scope Corrections (FE-1502)

**FE-1502 corrected two config definitions:**

| Property              | Old Scope                   | New Scope                 | Reason                                              |
| --------------------- | --------------------------- | ------------------------- | --------------------------------------------------- |
| `optionBenefits`      | `PRODUCT_CATEGORY, PRODUCT` | `OPTION_CATEGORY, OPTION` | Benefits are per-option, not per-product            |
| `optionUpsellEnabled` | `OPTION_CATEGORY, OPTION`   | `OPTION` only             | Upsell toggle is per-option value, not per-category |

> **🔧 For Contributors:** If you add meta properties for options, make sure to scope them correctly. See `config/schema/definitions.ts`. Scoping too broadly (e.g., at product level) means the setting applies to all options, which is rarely the intent.

---

## 4. Basket Term Selector Forced Full-Term Pricing

The basket term selector forces `PriceDisplayTypes.CYCLE` via the `type` prop on `TermCard`, ensuring it always shows the full billing cycle price (e.g., `$120/yr`). This prevents a visual mismatch with the basket product card price.

The product listing term selector (`ProductTerm.vue`) does NOT override this — it respects the brand's `PRICE_DISPLAY_TYPE` setting via `meta.useMonthlyFromPrice`.

See [Inline Editing — Pricing Display](./inline-editing.md#pricing-display-full-term-price-forced) for full details.

> **🔧 For Contributors:** `TermCard` accepts a generic `type` prop (`PriceDisplayTypes` enum). When set, it overrides `meta.useMonthlyFromPrice`. If you change how prices display in the term selector or on the basket card, ensure both stay in sync.
