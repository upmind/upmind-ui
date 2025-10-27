[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / PromotionDetails

# PromotionDetails

```ts
type PromotionDetails = object;
```

Type alias for detailed information about a promotion.

## Properties

### code

```ts
code: string;
```

The promotion code.

***

### description?

```ts
optional description: string;
```

A detailed description of the promotion.

***

### excerpt?

```ts
optional excerpt: string;
```

A short excerpt or summary of the promotion description.

***

### meta?

```ts
optional meta: object;
```

Meta-information about the promotion's display and effects.

#### discounted?

```ts
optional discounted: boolean;
```

`true` if the promotion applies a discount.

#### display?

```ts
optional display: PromotionDisplayTypes;
```

The display type of the promotion (e.g. `PromotionDisplayTypes.FREE_PRODUCT`).

#### mixed?

```ts
optional mixed: boolean;
```

`true` if the promotion involves mixed effects (e.g. discount and free item).

***

### name

```ts
name: string;
```

The untranslated name of the promotion, often for reporting.

***

### price?

```ts
optional price: object;
```

Optional pricing details related to the promotion's savings.

#### savingAmount

```ts
savingAmount: PriceDetail["savingAmount"];
```

The numerical saving amount.

#### savingPercent

```ts
savingPercent: PriceDetail["savingPercent"];
```

The saving percentage formatted as a string.

#### savingPrice

```ts
savingPrice: PriceDetail["savingPrice"];
```

The formatted saving price.

***

### title

```ts
title: string;
```

The display title of the promotion, typically translated.
