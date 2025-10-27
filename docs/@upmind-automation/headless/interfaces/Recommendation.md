[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / Recommendation

# Recommendation

Interface representing a single product recommendation, extending a base `Product`
with additional details specific to recommendations, such as pricing, configuration,
and meta-information for tracking.

## Extends

- [`Product`](../type-aliases/Product.md)

## Properties

### configuration

```ts
configuration: ProductProps;
```

The product configuration matching the structure expected by a product configuration machine ([ProductProps](ProductProps.md)).
This includes additional fields for setting subproducts (`sub_pids`), coupons, currency, etc.,
allowing the recommendation to be easily added to a basket with specific options.

#### Overrides

```ts
Product.configuration
```

***

### details

```ts
details: (
  | ProductSummaryDetail
  | ProductSummaryDetailWithPrice)[];
```

A summary of the product configuration, providing details that may or may not
include pricing information, depending on the context.
e.g. terms will have pricing information, a subproduct may have pricing information
depending on if it is an option or attribute, provision fields will not have pricing information.

#### Inherited from

```ts
Product.details
```

***

### errors?

```ts
optional errors: object;
```

An optional object containing errors related to various aspects of the product's configuration.

#### attributes?

```ts
optional attributes: any;
```

Errors related to the product's attributes.

#### options?

```ts
optional options: any;
```

Errors related to the product's options.

#### provisionFields?

```ts
optional provisionFields: any;
```

Errors related to the product's provision fields.

#### term?

```ts
optional term: any;
```

Errors related to the product's billing term.

#### Inherited from

```ts
Product.errors
```

***

### id

```ts
id: string;
```

The unique identifier of the recommendation. This typically corresponds to a product ID.

#### Overrides

```ts
Product.id
```

***

### meta

```ts
meta: ProductSummaryMeta & object;
```

Meta-information about the recommendation's state within the engine.

#### Type Declaration

##### added?

```ts
optional added: boolean;
```

`true` if this recommendation has been added to the basket.

##### loading?

```ts
optional loading: boolean;
```

`true` if the recommendation data is currently being loaded.

##### processing?

```ts
optional processing: boolean;
```

`true` if the recommendation is currently being processed (e.g. being added to the basket).

##### seen?

```ts
optional seen: boolean;
```

`true` if the user has seen this recommendation.

#### Overrides

```ts
Product.meta
```

***

### price

```ts
price: PriceDisplay & object & object;
```

Pricing details for the recommendation, augmented with monthly pricing calculations
based on current and regular amounts.

#### Type Declaration

##### configuration?

```ts
optional configuration: Price;
```

The configuration price, representing the total price of the product,
including any adjustments or quantity modifiers.

##### unit?

```ts
optional unit: Price;
```

The individual unit price, representing the base price of the product before
any adjustments or quantity modifiers.

#### Type Declaration

##### monthlyFromCurrentAmount?

```ts
optional monthlyFromCurrentAmount: number;
```

The calculated monthly amount from the current price.

##### monthlyFromCurrentPrice?

```ts
optional monthlyFromCurrentPrice: string;
```

The calculated monthly price from the current price, formatted as a string.

##### monthlyFromRegularAmount?

```ts
optional monthlyFromRegularAmount: number;
```

The calculated monthly amount from the regular price.

##### monthlyFromRegularPrice?

```ts
optional monthlyFromRegularPrice: string;
```

The calculated monthly price from the regular price, formatted as a string.

#### Overrides

```ts
Product.price
```

***

### pricing

```ts
pricing: ProductSummaryDetailWithPrice[];
```

A breakdown of the product's pricing details.
This may contain multiple entries, e.g. for different configuration options.

#### Inherited from

```ts
Product.pricing
```

***

### productDetails

```ts
productDetails: ProductDetails & object;
```

Detailed product information for the recommendation, including a display label,
an optional badge, and associated benefits.

#### Type Declaration

##### badge?

```ts
optional badge: Badge;
```

An optional badge to display alongside the recommendation.

##### benefits?

```ts
optional benefits: Benefit[];
```

An array of benefits associated with the recommended product.

##### label

```ts
label: string;
```

The primary display label for the recommended product.

#### Overrides

```ts
Product.productDetails
```

***

### promotions?

```ts
optional promotions: PromotionDetails[];
```

An array of [PromotionDetails](../type-aliases/PromotionDetails.md) that are currently applied to the product.

#### Inherited from

```ts
Product.promotions
```

***

### serviceIdentifier?

```ts
optional serviceIdentifier: string;
```

An optional identifier for the service associated with the recommendation.
