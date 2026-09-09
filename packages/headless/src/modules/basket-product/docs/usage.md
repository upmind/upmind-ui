# Usage & API

## Composables

### `useBasketProducts()`

Access all products in the basket.

```ts
import { useBasketProducts } from "@upmind-automation/headless";

const { products, configure, remove } = useBasketProducts();
```

| Return      | Type                                        | Description                                |
| ----------- | ------------------------------------------- | ------------------------------------------ |
| `products`  | `ComputedRef<BasketProduct[] \| undefined>` | All parsed basket products                 |
| `configure` | `(id, opts?) => Promise<UseBasketProduct>`  | Spawn product machine for a basket product |
| `remove`    | `(id: string) => Promise<void>`             | Remove a product from the basket           |

---

### `useBasketProductInline(bpid)`

Per-product inline editing composable. See [Inline Editing](./inline-editing.md) for full details on meta flags, upsell visibility, and auto-save flow.

```ts
import {
  useBasketProductInline,
  useBasketProducts
} from "@upmind-automation/headless";

const { products } = useBasketProducts();
const [basketProduct] = products.value ?? [];

const { meta, configure, filterUpsellOptions, resolveUpsells } =
  useBasketProductInline(basketProduct.id);
```

| Return                | Type                                           | Description                                                                                                                |
| --------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `meta`                | `ComputedRef<InlineMeta>`                      | Inline control visibility flags                                                                                            |
| `configure`           | `() => ConfigureAPI`                           | Spawns the product machine with `allowMultipleEdits`                                                                       |
| `filterUpsellOptions` | `(options) => SubproductDetails[]`             | Filters to upsell-eligible option groups                                                                                   |
| `resolveUpsells`      | `(config?) => { upsell, option, benefits? }[]` | Resolves upsell summaries — each paired with its option group and benefits — from the config's persisted (baseModel) state |

---

## Types

### `BasketProduct`

Extends `Product`, so it carries `availableTerms`, `availableOptions` and `upsells` from there. It adds only the three members below.

```ts
import type { Product } from "@upmind-automation/headless";
import type { IProduct } from "@upmind-automation/types";

interface BasketProduct extends Product {
  id: string;
  serviceIdentifier?: string;
  product?: IProduct; // the raw API product, for conditional-rule lookups
}
```

### `BasketOptionSummary`

A product summary detail enriched with basket-specific toggle metadata.

```ts
import type {
  OptionToggleMeta,
  ProductSummaryDetailWithPrice
} from "@upmind-automation/headless";

type BasketOptionSummary = ProductSummaryDetailWithPrice & {
  toggle?: OptionToggleMeta;
  min?: number;
  max?: number;
  step?: number;
};
```

### `OptionToggleMeta`

Toggle state for an option switch in the basket.

```ts
type OptionToggleMeta = {
  categoryId: string; // Option category ID
  valueId: string; // Selected value ID
  cycle: number; // Billing cycle months
  selected: boolean; // Currently selected?
  benefits?: { label: string }[]; // Benefit labels for display
};
```

### `IBasketProductModel`

Payload shape for adding/updating a product in the basket API.

```ts
import type { IBasketSubproductModel } from "@upmind-automation/headless";

interface IBasketProductModel {
  product_id: string;
  quantity: number;
  billing_cycle_months: number;
  attributes?: IBasketSubproductModel[];
  options?: IBasketSubproductModel[];
  provision_field_values?: Record<string, any>;
  provision_field_values_validate?: boolean;
  promotions?: { promocode: string }[];
  start_trial?: boolean;
}
```

---

## Utility Functions

### `parseBasketProduct(raw, errors?)`

Converts an `IBasketProduct` API response into a `BasketProduct`. Builds detail arrays, resolves toggle metadata, and pre-computes upsell summaries. Pre-parses `availableTerms` and `availableOptions` scoped to the basket product's currency.

### `resolveOptionToggle(productId, availableOptions?)`

Looks up an option value by product ID across all available option categories. Returns `OptionToggleMeta` if found (with `selected: true`). Used to enrich existing basket option details.

### `parseOptionUpsells(selectedOptions, availableOptions?)`

Builds `BasketOptionSummary[]` from available options. Selected options are always included. Unselected options are included only if they have a price.

### `parseBasketProductData(model, clean?)`

Converts a `ProductProps` model to the `IBasketProductModel` payload shape for the basket API. When `clean` is true, strips nil/empty values.

### `parseBasketProductError(rawError)`

Maps API error field names (e.g., `billing_cycle_months`) to schema-aligned paths (e.g., `/term`) for AJV-compatible error display.
