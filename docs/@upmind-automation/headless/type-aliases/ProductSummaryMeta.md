[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / ProductSummaryMeta

# ProductSummaryMeta

```ts
type ProductSummaryMeta = object;
```

Type alias for meta-information about a product summary.

## Properties

### available?

```ts
optional available: boolean;
```

`true` if the product is available.

***

### default?

```ts
optional default: boolean;
```

`true` if the product is the default selection.

***

### discounted?

```ts
optional discounted: boolean;
```

`true` if the product has a discount applied.

***

### free?

```ts
optional free: boolean;
```

`true` if the product is free.

***

### freeTrail?

```ts
optional freeTrail: boolean;
```

`true` if the product offers a free trial.

***

### includes?

```ts
optional includes: boolean;
```

`true` if the product includes other items.

***

### includesTax?

```ts
optional includesTax: boolean;
```

`true` if the price includes tax.

***

### invalid?

```ts
optional invalid: boolean;
```

`true` if the product's configuration is invalid.

***

### mixed?

```ts
optional mixed: boolean;
```

`true` if the product has mixed configuration options.

***

### oneoff?

```ts
optional oneoff: boolean;
```

`true` if the product is a one-off purchase.

***

### overrides?

```ts
optional overrides: boolean;
```

`true` if the product's configuration overrides a default.

***

### quantifiable?

```ts
optional quantifiable: boolean;
```

`true` if the product allows quantity selection.

***

### useMonthlyFromPrice?

```ts
optional useMonthlyFromPrice: boolean;
```

`true` if monthly pricing should be derived from the product's price.
