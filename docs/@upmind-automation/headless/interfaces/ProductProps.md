[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / ProductProps

# ProductProps

Interface defining the properties required to create or configure a product.
It extends [ProductModel](../type-aliases/ProductModel.md) with additional client, currency, and promotion details.

## Extends

- [`ProductModel`](../type-aliases/ProductModel.md)

## Properties

### attributes?

```ts
optional attributes: SubproductModel;
```

Optional subproduct model for attributes.

#### Inherited from

```ts
ProductModel.attributes
```

***

### bundle?

```ts
optional bundle: string;
```

An optional bundle ID. If provided, indicates that this product should apply
a specific bundle configuration. If set to `false`, forces no bundles to be applied.

***

### clientId?

```ts
optional clientId: string;
```

The ID of the client for whom the product is being configured.

***

### coupons?

```ts
optional coupons: string[];
```

An array of coupon codes passed via URL or configuration that are not yet in the basket.

***

### currencyCode?

```ts
optional currencyCode: ISO_4217_CURRENCY_CODE;
```

The ISO code of the currency to use for pricing.

***

### currencyId?

```ts
optional currencyId: string;
```

The ID of the currency to use for pricing.

***

### id?

```ts
optional id: string;
```

The unique identifier of the product instance (if existing).

#### Inherited from

```ts
ProductModel.id
```

***

### options?

```ts
optional options: SubproductModel;
```

Optional subproduct model for options.

#### Inherited from

```ts
ProductModel.options
```

***

### productId

```ts
productId: string;
```

The unique identifier of the base product.

#### Inherited from

```ts
ProductModel.productId
```

***

### promotions?

```ts
optional promotions: IBasketPromotion[];
```

An array of IBasketPromotion objects. These are needed to determine if the price needs recalculation.

***

### provisionFields?

```ts
optional provisionFields: Record<string, any>;
```

Key-value pairs for provision field values.

#### Inherited from

```ts
ProductModel.provisionFields
```

***

### quantity

```ts
quantity: number;
```

The quantity of the product.

#### Inherited from

```ts
ProductModel.quantity
```

***

### silent?

```ts
optional silent: boolean;
```

If `true`, indicates that provision fields should not be validated, treating this
as a bulk or background operation.

***

### subproducts?

```ts
optional subproducts: string[];
```

An array of IDs of subproducts passed via URL or configuration that are not yet in the model/config.

***

### term?

```ts
optional term: number;
```

The selected billing term in months.

#### Inherited from

```ts
ProductModel.term
```
