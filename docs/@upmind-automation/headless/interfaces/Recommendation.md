[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / Recommendation

# Recommendation

Represents a "configured" product with its configuration, pricing, and associated details.

## Extends

- [`Product`](../type-aliases/Product.md)

## Properties

### configuration

```ts
configuration: ProductProps;
```

The product configuration matches the way we can interperet a product config machine: ie ProductProps
This has additional fields to allow setting sub_pids, coupons,currency, etc...

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

A summary of the product configuration.
This can include details with or without pricing information, depending on the context.
eg:
 terms will have pricing information
 a subproduct may have pricing information depending if its an option or attribute
 provision fields will not have pricing information

#### Inherited from

```ts
Product.details
```

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

#### Inherited from

```ts
Product.errors
```

***

### id

```ts
id: string;
```

The unique identifier of the product. Optional as pending products will not have an ID.

#### Overrides

```ts
Product.id
```

***

### meta

```ts
meta: ProductSummaryMeta & object;
```

#### Type Declaration

##### added?

```ts
optional added: boolean;
```

##### loading?

```ts
optional loading: boolean;
```

##### processing?

```ts
optional processing: boolean;
```

##### seen?

```ts
optional seen: boolean;
```

#### Overrides

```ts
Product.meta
```

***

### price

```ts
price: PriceDisplay & object & object;
```

The display price details for the product. This is the total configured pricing including any discounts or adjustments.
It will always be the price that is shown to the customer, and it may or may not include tax, depending on the brand's settings.
The display price includes the current amount, regular amount, and any savings.

#### Type Declaration

##### configuration?

```ts
optional configuration: Price;
```

##### unit?

```ts
optional unit: Price;
```

#### Type Declaration

##### monthlyFromCurrentAmount?

```ts
optional monthlyFromCurrentAmount: number;
```

##### monthlyFromCurrentPrice?

```ts
optional monthlyFromCurrentPrice: string;
```

##### monthlyFromRegularAmount?

```ts
optional monthlyFromRegularAmount: number;
```

##### monthlyFromRegularPrice?

```ts
optional monthlyFromRegularPrice: string;
```

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
This may have multiple entries depending on if some configuration options are not quantifiable

#### Inherited from

```ts
Product.pricing
```

***

### productDetails

```ts
productDetails: ProductDetails & object;
```

The detailed information about the actial product. This will contain all the product details such as title, description etc

#### Type Declaration

##### badge?

```ts
optional badge: Badge;
```

##### benefits?

```ts
optional benefits: Benefit[];
```

##### label

```ts
label: string;
```

#### Overrides

```ts
Product.productDetails
```

***

### promotions?

```ts
optional promotions: PromotionDetails[];
```

The promotions that are currently applied to the product.

#### Inherited from

```ts
Product.promotions
```

***

### serviceIdentifier?

```ts
optional serviceIdentifier: string;
```
