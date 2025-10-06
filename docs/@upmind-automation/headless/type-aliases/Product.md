[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / Product

# Product

```ts
type Product = object;
```

Represents a "configured" product with its configuration, pricing, and associated details.

## Extended by

- [`BasketProduct`](../interfaces/BasketProduct.md)
- [`Recommendation`](../interfaces/Recommendation.md)

## Properties

### configuration

```ts
configuration: ProductProps;
```

The model of the product, this contains the configuration settings/values to be used for editing purposes

***

### details

```ts
details: (
  | ProductSummaryDetail
  | ProductSummaryDetailWithPrice)[];
```

A summary of the product configuration.
This can include details with or without pricing information, depending on the context.
eg:
 terms will have pricing information
 a subproduct may have pricing information depending if its an option or attribute
 provision fields will not have pricing information

***

### errors?

```ts
optional errors: object;
```

An optional object containing errors related to the product.
This can include errors for terms, attributes, options, or provision fields.

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

Errors related to the product's term.

***

### id?

```ts
optional id: string;
```

The unique identifier of the product. Optional as pending products will not have an ID.

***

### meta

```ts
meta: ProductSummaryMeta;
```

***

### price

```ts
price: PriceDetail;
```

The display price details for the product. This is the total configured pricing including any discounts or adjustments.
It will always be the price that is shown to the customer, and it may or may not include tax, depending on the brand's settings.
The display price includes the current amount, regular amount, and any savings.

***

### pricing

```ts
pricing: ProductSummaryDetailWithPrice[];
```

A breakdown of the product's pricing details.
This may have multiple entries depending on if some configuration options are not quantifiable

***

### productDetails

```ts
productDetails: ProductDetails;
```

The detailed information about the actial product. This will contain all the product details such as title, description etc

***

### promotions?

```ts
optional promotions: PromotionDetails[];
```

The promotions that are currently applied to the product.
