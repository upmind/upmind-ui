[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / ProductConfigContext

# ProductConfigContext

Interface representing the context for product configuration, typically managed by an XState machine.
It holds the state for configuring a single product, including its model, lookups, pricing, and associated errors.

## Properties

### attempts?

```ts
optional attempts: number;
```

Number of attempts made for an operation.

***

### baseModel?

```ts
optional baseModel: ProductModel;
```

The base [ProductModel](../type-aliases/ProductModel.md) before modifications.

***

### basketHelper?

```ts
optional basketHelper: ActorRef<any, any>;
```

An `ActorRef` to the basket helper service.

***

### basketId?

```ts
optional basketId: string;
```

The ID of the current shopping basket.

***

### bundle?

```ts
optional bundle: string;
```

Optional bundle ID.

***

### calculateCallback?

```ts
optional calculateCallback: ActorRef<any, any>;
```

An `ActorRef` for a price calculation callback.

***

### clientId?

```ts
optional clientId: string;
```

Optional client ID for context.

***

### coupons?

```ts
optional coupons: string[];
```

Optional array of coupon codes.

***

### currencyCode?

```ts
optional currencyCode: ISO_4217_CURRENCY_CODE;
```

Optional currency code for pricing.

***

### currencyId?

```ts
optional currencyId: string;
```

Optional currency ID for pricing.

***

### error?

```ts
optional error: ResponseError | ExternalError;
```

An ResponseError or [ExternalError](../type-aliases/ExternalError.md) object if an error occurred during configuration.

#### Todo

Implement the new response errors types from the API.

***

### errorExternal?

```ts
optional errorExternal: ExternalError;
```

External errors object.

***

### id

```ts
id: string;
```

The unique identifier for the product configuration instance.

***

### lookups?

```ts
optional lookups: object;
```

Lookups for various product-related data.

#### attributes?

```ts
optional attributes: SubproductDetails[];
```

An array of [SubproductDetails](../type-aliases/SubproductDetails.md) for available attributes.

#### bundled?

```ts
optional bundled: ProductModel[];
```

An array of [ProductModel](../type-aliases/ProductModel.md) for bundled products.

#### options?

```ts
optional options: SubproductDetails[];
```

An array of [SubproductDetails](../type-aliases/SubproductDetails.md) for available options.

#### prices?

```ts
optional prices: PriceCalculations;
```

[PriceCalculations](../type-aliases/PriceCalculations.md) for current pricing state.

#### product?

```ts
optional product: ProductDetails;
```

The [ProductDetails](../type-aliases/ProductDetails.md) of the base product.

#### provisionFields?

```ts
optional provisionFields: Record<string, any>;
```

A record of provision field definitions.

#### terms?

```ts
optional terms: TermDetails[];
```

An array of [TermDetails](../type-aliases/TermDetails.md) for available billing terms.

***

### meta?

```ts
optional meta: UIMeta;
```

Optional [UIMeta](UIMeta.md) for UI-specific configuration.

***

### model?

```ts
optional model: ProductModel;
```

The current [ProductModel](../type-aliases/ProductModel.md) being configured.

***

### parseBasketProduct()?

```ts
optional parseBasketProduct: (item) => ProductModel;
```

A function to parse a [ProductModel](../type-aliases/ProductModel.md) for the basket.

#### Parameters

##### item

[`ProductModel`](../type-aliases/ProductModel.md)

#### Returns

[`ProductModel`](../type-aliases/ProductModel.md)

***

### parseBasketProductComparison()?

```ts
optional parseBasketProductComparison: (item) => Partial<ProductModel>;
```

A function to parse a [BasketProduct](BasketProduct.md) for comparison with a partial [ProductModel](../type-aliases/ProductModel.md).

#### Parameters

##### item

[`BasketProduct`](BasketProduct.md)

#### Returns

`Partial`\<[`ProductModel`](../type-aliases/ProductModel.md)\>

***

### product?

```ts
optional product: Product;
```

The fully configured [Product](../type-aliases/Product.md) object.

***

### promotions?

```ts
optional promotions: IBasketPromotion[];
```

Optional array of IBasketPromotion for promotions.

***

### rawBasketProduct?

```ts
optional rawBasketProduct: IBasketProduct;
```

The raw `IBasketProduct` object if the product is already in the basket.

***

### rawProduct?

```ts
optional rawProduct: IProduct;
```

The raw `IProduct` object from the API.

***

### silent?

```ts
optional silent: boolean;
```

`true` if operating in silent mode (no provision field validation).

***

### subproducts?

```ts
optional subproducts: string[];
```

Optional array of subproduct IDs.
