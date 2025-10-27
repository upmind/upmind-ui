[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / UIProductMeta

# UIProductMeta

Interface representing UI meta-data specific to a product, allowing for granular control
over how product components are displayed in the user interface.

## Properties

### card

```ts
card: object;
```

Configuration for the product card display.

#### benefits

```ts
benefits: object;
```

Configuration for product benefits.

##### benefits.data?

```ts
optional data: Benefit[];
```

An array of [Benefit](Benefit.md) data to display.

##### benefits.hide?

```ts
optional hide: boolean;
```

`true` to hide benefits on the card.

#### breakdown

```ts
breakdown: object;
```

Configuration for price breakdown.

##### breakdown.hide?

```ts
optional hide: boolean;
```

`true` to hide the price breakdown on the card.

#### description

```ts
description: object;
```

Configuration for product description.

##### description.hide?

```ts
optional hide: boolean;
```

`true` to hide the description on the card.

#### price

```ts
price: object;
```

Configuration for product price display.

##### price.hide?

```ts
optional hide: boolean;
```

`true` to hide the price on the card.

#### terms

```ts
terms: object;
```

Configuration for product terms.

##### terms.hide?

```ts
optional hide: boolean;
```

`true` to hide the terms on the card.

***

### display\_price?

```ts
optional display_price: object;
```

Configuration for displaying product prices.

#### trim\_trailing\_zeroes?

```ts
optional trim_trailing_zeroes: boolean;
```

`true` to trim trailing zeros from displayed prices.

***

### image

```ts
image: object;
```

Configuration for product images.

#### carousel?

```ts
optional carousel: boolean;
```

`true` to enable an image carousel.

#### hide?

```ts
optional hide: boolean;
```

`true` to hide product images.

#### ratio?

```ts
optional ratio: string;
```

The aspect ratio for product images (e.g. "16:9").

***

### variant?

```ts
optional variant: string;
```

Optional variant string for styling purposes.
