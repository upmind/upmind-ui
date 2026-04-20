# Usage & API

## Composables

### `useBasketProducts()`

Access all products in the basket.

```typescript
import { useBasketProducts } from "@upmind-automation/headless";

const { products, configure, remove } = useBasketProducts();
```

| Return      | Type                                  | Description                                |
| ----------- | ------------------------------------- | ------------------------------------------ |
| `products`  | `Ref<BasketProduct[]>`                | All parsed basket products                 |
| `configure` | `(id: string, opts?) => ConfigureAPI` | Spawn product machine for a basket product |
| `remove`    | `(id: string) => Promise<void>`       | Remove a product from the basket           |

---

### `useBasketProductInline(bpid)`

Per-product inline editing composable. See [Inline Editing](./inline-editing.md) for full details on meta flags, upsell visibility, and auto-save flow.

```typescript
import { useBasketProductInline } from "@upmind-automation/headless";

const { meta, configure, filterUpsellOptions, resolveUpsells } =
  useBasketProductInline(basketProduct.id);
```

| Return                | Type                                                        | Description                                          |
| --------------------- | ----------------------------------------------------------- | ---------------------------------------------------- |
| `meta`                | `ComputedRef<InlineMeta>`                                   | Inline control visibility flags                      |
| `configure`           | `() => ConfigureAPI`                                        | Spawns the product machine with `allowMultipleEdits` |
| `filterUpsellOptions` | `(options) => SubproductDetails[]`                          | Filters to upsell-eligible option groups             |
| `resolveUpsells`      | `(machineOptions?, modelOptions?) => BasketOptionSummary[]` | Resolves upsell summaries with adjusted pricing      |

---

## Types

### `BasketProduct`

Extends `Product`. Guaranteed to have an `id` and optional `serviceIdentifier`.

```typescript
interface BasketProduct extends Product {
  id: string;
  serviceIdentifier?: string;
  availableTerms?: TermDetails[];
  availableOptions?: SubproductDetails[];
  upsells?: ProductSummaryDetailWithPrice[];
}
```

### `BasketOptionSummary`

A product summary detail enriched with basket-specific toggle metadata.

```typescript
type BasketOptionSummary = ProductSummaryDetailWithPrice & {
  toggle?: OptionToggleMeta;
  min?: number;
  max?: number;
  step?: number;
};
```

### `OptionToggleMeta`

Toggle state for an option switch in the basket.

```typescript
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

```typescript
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
