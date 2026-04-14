# Changelog

All notable changes to the `basketProduct` module.

## [0.17.0] - 2026-04-10

### Added

- **Inline basket product option configuration (FE-1502)**
  - `useBasketProductInline` composable for per-product inline editing
  - `OptionToggleMeta` and `BasketOptionSummary` types for toggle state
  - `resolveOptionToggle()` utility to enrich options with toggle metadata
  - `parseOptionUpsells()` utility to build upsell summary lists
  - `resolveUpsells()` method with coupon-adjusted pricing from product machine
  - `filterUpsellOptions()` method with config-engine-scoped eligibility checks
  - `BasketProduct.availableTerms` — pre-parsed billing terms from product
  - `BasketProduct.availableOptions` — pre-parsed option categories from product
  - `BasketProduct.upsells` — pre-computed upsell summaries
  - `BasketProductBenefits.vue` component for rendering option benefit lists
  - `BasketProductOptionContent.vue` — option content with toggle switch and pricing
  - `BasketProductOptionSummaryProps` and `OptionTogglePayload` types (client-vue)

### Changed

- `parseTermDetails()` now accepts `currencyId` to filter prices by currency
- `parseSubproductDetails()` now accepts `currencyId` for currency-scoped pricing
- `BasketProductTermSelector` simplified from `SelectCards` to `Select` dropdown
- `BasketProductOptionSwitch` updated from `:checked` to `:model-value` binding
- Config schema: `optionBenefits` scoped to `OPTION_CATEGORY/OPTION` (was `PRODUCT_CATEGORY/PRODUCT`)
- Config schema: `optionUpsellEnabled` scoped to `OPTION` only (was `OPTION_CATEGORY/OPTION`)

### Fixed

- `product.machine.ts`: Fixed typo `basketPoductChanged` → `basketProductChanged`
- `product.machine.ts`: Fixed client comparison using `==` → `!==` (was incorrectly checking equality)
- `product.machine.ts`: Basket product lookup now searches `data.products` by ID instead of using stale `data.basketProduct` reference
