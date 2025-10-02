[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / ProductConfigContext

# ProductConfigContext

## Properties

### attempts?

```ts
optional attempts: number;
```

***

### baseModel?

```ts
optional baseModel: ProductModel;
```

***

### basketHelper?

```ts
optional basketHelper: ActorRef<any, any>;
```

***

### basketId?

```ts
optional basketId: string;
```

***

### bundle?

```ts
optional bundle: string;
```

***

### calculateCallback?

```ts
optional calculateCallback: ActorRef<any, any>;
```

***

### clientId?

```ts
optional clientId: string;
```

***

### coupons?

```ts
optional coupons: string[];
```

***

### currencyCode?

```ts
optional currencyCode: ISO_4217_CURRENCY_CODE;
```

***

### currencyId?

```ts
optional currencyId: string;
```

***

### error?

```ts
optional error: ResponseError | ExternalError;
```

***

### errorExternal?

```ts
optional errorExternal: ExternalError;
```

***

### id

```ts
id: string;
```

***

### lookups?

```ts
optional lookups: object;
```

#### attributes?

```ts
optional attributes: SubproductDetails[];
```

#### bundled?

```ts
optional bundled: ProductModel[];
```

#### options?

```ts
optional options: SubproductDetails[];
```

#### prices?

```ts
optional prices: PriceCalculations;
```

#### product?

```ts
optional product: ProductDetails;
```

#### provisionFields?

```ts
optional provisionFields: Record<string, any>;
```

#### terms?

```ts
optional terms: TermDetails[];
```

***

### meta?

```ts
optional meta: UIMeta;
```

***

### model?

```ts
optional model: ProductModel;
```

***

### parseBasketProduct()?

```ts
optional parseBasketProduct: (item) => ProductModel;
```

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

***

### promotions?

```ts
optional promotions: IBasketPromotion[];
```

***

### rawBasketProduct?

```ts
optional rawBasketProduct: IBasketProduct;
```

***

### rawProduct?

```ts
optional rawProduct: IProduct;
```

***

### silent?

```ts
optional silent: boolean;
```

***

### subproducts?

```ts
optional subproducts: string[];
```
