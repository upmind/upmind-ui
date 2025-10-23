[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / ProductDetails

# ProductDetails

```ts
type ProductDetails = object;
```

Represents the actual store product details, typically retrieved from the API.
This contains all the displayable and configurable information for a product.

## Properties

### badge?

```ts
optional badge: Badge;
```

An optional [Badge](../interfaces/Badge.md) to display with the product.

***

### benefits?

```ts
optional benefits: Benefit[];
```

An array of [Benefit](../interfaces/Benefit.md) objects associated with the product.

***

### brand

```ts
brand: string;
```

The brand associated with the product.

***

### breadcrumb?

```ts
optional breadcrumb: ProductBreadcrumb[];
```

An array of [ProductBreadcrumb](ProductBreadcrumb.md) items, defining the navigational path to the product.

***

### categories?

```ts
optional categories: string[];
```

An array of parent category names for the product, if applicable.

***

### category

```ts
category: string;
```

The name of the primary category the product belongs to.

***

### categoryId

```ts
categoryId: string;
```

The ID of the primary category the product belongs to.

***

### cycle

```ts
cycle: number;
```

The default billing cycle in months for the product.

***

### defaultPaymentPeriod?

```ts
optional defaultPaymentPeriod: number;
```

The default payment period in days, if different from the billing cycle.

***

### description?

```ts
optional description: string;
```

A detailed description of the product.

***

### displayPrice?

```ts
optional displayPrice: TermDetails;
```

Optional [TermDetails](TermDetails.md) for how the price is displayed for this term.

***

### excerpt?

```ts
optional excerpt: string;
```

A short excerpt or summary of the product description.

***

### id

```ts
id: string;
```

The unique identifier of the product.

***

### images?

```ts
optional images: ProductImage[];
```

An array of [ProductImage](ProductImage.md) objects for the product.

***

### imgUrl?

```ts
optional imgUrl: string;
```

The URL of the main image for the product.

***

### max

```ts
max: number;
```

The maximum allowed quantity for the product, or `Infinity`.

***

### min

```ts
min: number;
```

The minimum allowed quantity for the product.

***

### name

```ts
name: string;
```

The untranslated name of the product, often used for reporting purposes.

***

### quantifiable

```ts
quantifiable: boolean;
```

`true` if the product allows quantity selection, `false` otherwise.

***

### quantity

```ts
quantity: number;
```

The default or current quantity of the product.

***

### step

```ts
step: number;
```

The step increment for quantity selection.

***

### title

```ts
title: string;
```

The display title of the product, typically translated.

***

### uiCategoryMeta?

```ts
optional uiCategoryMeta: Record<string, any>;
```

Optional UI meta-data specific to the product's category.

***

### uiMeta?

```ts
optional uiMeta: UIMeta;
```

Optional [UIMeta](../interfaces/UIMeta.md) for UI-specific product configuration.
