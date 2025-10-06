[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / RecommendationsEngineContext

# RecommendationsEngineContext

## Properties

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

### basketItem?

```ts
optional basketItem: ActorRef<any, any>;
```

***

### currency?

```ts
optional currency: ICurrency;
```

***

### error?

```ts
optional error: ResponseError;
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

### parseProductModel()?

```ts
optional parseProductModel: (recommendation, products) => ProductProps;
```

#### Parameters

##### recommendation

[`Recommendation`](Recommendation.md)

##### products

`IBasketProduct`[]

#### Returns

[`ProductProps`](ProductProps.md)

***

### promotions?

```ts
optional promotions: IPromotion[];
```

***

### raw

```ts
raw: object;
```

#### added

```ts
added: IBasketProduct[];
```

#### products

```ts
products: IProduct[];
```

#### related

```ts
related: RelatedProduct[];
```

#### relationships

```ts
relationships: Record<string, string[]>;
```

#### seen

```ts
seen: string[];
```

***

### recommendations

```ts
recommendations: Recommendation[];
```
