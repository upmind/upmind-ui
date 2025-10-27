[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / SubproductValue

# SubproductValue

```ts
type SubproductValue = ProductDetails & object;
```

Type alias for a specific value/option of a subproduct, extending [ProductDetails](ProductDetails.md).

## Type Declaration

### meta

```ts
meta: ProductSummaryMeta;
```

Meta-information about this subproduct value.

### order

```ts
order: number;
```

The display order of this subproduct value.

### price?

```ts
optional price: PriceDetail;
```

Optional detailed price information for this subproduct value.

### pricing?

```ts
optional pricing: ProductSummaryDetailWithPrice[];
```

Optional array of [ProductSummaryDetailWithPrice](ProductSummaryDetailWithPrice.md) for pricing breakdown.

### promotions?

```ts
optional promotions: PromotionDetails[];
```

Optional array of [PromotionDetails](PromotionDetails.md) applied to this subproduct value.
