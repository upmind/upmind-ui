[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / UIMeta

# UIMeta

Interface representing UI meta-data for a product or view.
It encapsulates configurations for UI elements, related items, and product-specific overrides.

## Properties

### product?

```ts
optional product: UIProductMeta;
```

Optional [UIProductMeta](UIProductMeta.md) for product-specific UI overrides.

***

### related?

```ts
optional related: Recommendation[];
```

Optional array of [Recommendation](Recommendation.md) for related products.

***

### ui?

```ts
optional ui: UIConfig;
```

Optional [UIConfig](UIConfig.md) for general UI settings.

***

### uischema?

```ts
optional uischema: UISchema;
```

Optional [UISchema](UISchema.md) for form UI layout.
