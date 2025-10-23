[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / RecommendationsEngineContext

# RecommendationsEngineContext

Interface representing the context for the recommendation engine, typically managed by an XState machine.
It holds the list of recommendations, raw product data, relationships, and various helper functions
and references for basket integration.

## Properties

### basketHelper?

```ts
optional basketHelper: ActorRef<any, any>;
```

An `ActorRef` to the basket helper service, facilitating integration with the main basket.

***

### basketId?

```ts
optional basketId: string;
```

The unique identifier of the current shopping basket.

***

### basketItem?

```ts
optional basketItem: ActorRef<any, any>;
```

An `ActorRef` to the basket item service, used for inter-service communication related to basket products.

***

### currency?

```ts
optional currency: ICurrency;
```

The current currency in which recommendations' prices are displayed.

***

### error?

```ts
optional error: ResponseError;
```

An error object if any issue occurred during recommendation processing.

***

### parseBasketProduct()?

```ts
optional parseBasketProduct: (item) => ProductModel;
```

A function to parse a [ProductModel](../type-aliases/ProductModel.md) into a [ProductModel](../type-aliases/ProductModel.md) suitable for the basket.

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

A function to parse a [BasketProduct](BasketProduct.md) into a partial [ProductModel](../type-aliases/ProductModel.md) for comparison purposes.

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

A function to parse a [Recommendation](Recommendation.md) and an array of `IBasketProduct`s into [ProductProps](ProductProps.md)
suitable for product configuration.

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

An array of `IPromotion` objects that might apply to recommendations.

***

### raw

```ts
raw: object;
```

Raw data used internally by the engine, including original products, related product mappings,
seen recommendations, and items added to the basket.

#### added

```ts
added: IBasketProduct[];
```

An array of `IBasketProduct` objects that have been added to the basket from recommendations.

#### products

```ts
products: IProduct[];
```

An array of raw `IProduct` objects fetched from the API.

#### related

```ts
related: RelatedProduct[];
```

An array of [RelatedProduct](RelatedProduct.md) objects, detailing relationships between products.

#### relationships

```ts
relationships: Record<string, string[]>;
```

A record mapping product IDs to arrays of related product IDs, defining relationships.

#### seen

```ts
seen: string[];
```

An array of recommendation IDs that have been marked as 'seen' by the user.

***

### recommendations

```ts
recommendations: Recommendation[];
```

An array of active [Recommendation](Recommendation.md) objects displayed by the engine.
