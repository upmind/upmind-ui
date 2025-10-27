[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / Product

# Product

```ts
type Product = object;
```

Represents a "configured" product with its configuration, pricing, and associated details.
This type aggregates all information necessary for displaying and managing a product
in various contexts, such as a product page or shopping basket.

## Extended by

- [`BasketProduct`](../interfaces/BasketProduct.md)
- [`Recommendation`](../interfaces/Recommendation.md)

## Properties

### configuration

```ts
configuration: ProductProps;
```

The configuration model of the product. This contains the settings and values
used for editing or defining the product, built and verified against a schema.

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

***

### id?

```ts
optional id: string;
```

The unique identifier of the product. Optional, as pending products may not have an ID yet.

***

### meta

```ts
meta: ProductSummaryMeta;
```

Meta-information about the product's summary state.

***

### price

```ts
price: PriceDetail;
```

The display price details for the product. This represents the total configured pricing,
including any discounts or adjustments. It is always the price shown to the customer,
and its tax inclusion depends on the brand's settings.

***

### pricing

```ts
pricing: ProductSummaryDetailWithPrice[];
```

A breakdown of the product's pricing details.
This may contain multiple entries, e.g. for different configuration options.

***

### productDetails

```ts
productDetails: ProductDetails;
```

Detailed information about the actual product, including its title, description, etc.

***

### promotions?

```ts
optional promotions: PromotionDetails[];
```

An array of [PromotionDetails](PromotionDetails.md) that are currently applied to the product.
