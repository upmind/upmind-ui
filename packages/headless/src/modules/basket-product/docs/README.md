# Basket Product

Manages products that live inside the basket — parsing, configuring, and editing them.

Think of it like a basket item card: it knows the product's current price, billing term, selected options, and exposes controls for changing them.

## Quick Start

```typescript
import {
  useBasketProducts,
  useBasketProductInline
} from "@upmind-automation/headless";

// List all basket products
const { products, configure, remove } = useBasketProducts();

// Inline editing for a specific basket product
const {
  meta,
  configure: spawnConfig,
  resolveUpsells,
  filterUpsellOptions
} = useBasketProductInline(basketProductId);
```

## Features

| Feature                    | Status | Notes                                                 |
| -------------------------- | ------ | ----------------------------------------------------- |
| Basket product parsing     | ✅     | Converts API responses to `BasketProduct`             |
| Product configuration      | ✅     | Full configure flow via product machine               |
| Inline term editing        | ✅     | Change billing cycle directly in basket (FE-1502)     |
| Inline option toggling     | ✅     | Add/remove options via switches in basket (FE-1502)   |
| Option upsells             | ✅     | Surface available options with pricing (FE-1502)      |
| Provision field validation | ✅     | Parse and display provision errors                    |
| Promotion/coupon display   | ✅     | Parse basket-level promotions                         |
| Pending products           | ✅     | Manage products before they're confirmed in basket    |
| Dynamic provision values   | ✅     | Template literals resolved from other basket products |

## Key Concepts

### BasketProduct vs Product

A `BasketProduct` extends `Product` — it always has an `id` (its basket entry ID) and a `serviceIdentifier` (e.g. a domain name for hosting). Products that haven't been added to the basket yet are handled by `useBasketProductPending`.

### Inline Editing (FE-1502)

Products can now be edited directly in the basket without navigating to the full configuration page. This is controlled by:

- **Meta property `configurableInline`** — Set at the product/option-category level via the config engine
- **`useBasketProductInline(bpid)`** — Per-product composable that resolves inline controls and spawns a "light" product machine
- **Auto-save** — Changes are applied immediately via the basket API

See [Inline Editing](./inline-editing.md) for full details on upsell visibility, term selector, and the auto-save flow.

> **🧪 For Testers:** Verify that toggling an option switch in the basket adds/removes the option and updates pricing. Changing the billing term should also update all option prices that are cycle-dependent.

> **👩‍💻 For Developers:** See [Inline Editing](./inline-editing.md) for API details and config engine properties.

> **🔧 For Contributors:** The inline machine reuses the product configure pattern — see [Architecture](./architecture.md).

## Documentation

- [Architecture](./architecture.md) — Data flow, parsing pipeline, integration points
- [Inline Editing](./inline-editing.md) — Upsell visibility, term selector, auto-save, config engine
- [Usage & API](./usage.md) — Composable signatures, return values, examples
- [Gotchas](./gotchas.md) — Edge cases and known issues
- [CHANGELOG](./CHANGELOG.md) — Version history
