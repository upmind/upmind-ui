[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / DomainContext

# DomainContext

Interface representing the context for the domain management XState machine.
It holds the state for domain availability checks, existing domains, basket integration,
search queries, and related lookups.

## Extends

- [`BasketHelperContext`](BasketHelperContext.md)\<[`DomainProduct`](../type-aliases/DomainProduct.md)\>

## Properties

### authHelper?

```ts
optional authHelper: ActorRef<any, any>;
```

An `ActorRef` to an authentication helper service.

***

### baseModel?

```ts
optional baseModel: DomainModel[];
```

The base [DomainModel](../type-aliases/DomainModel.md) or array of models, representing the initial state before user modifications.

***

### basketHelper?

```ts
optional basketHelper: ActorRef<any, any>;
```

An `ActorRef` to a basket helper service.

***

### basketId?

```ts
optional basketId: string;
```

The unique identifier of the shopping basket.

***

### brandId?

```ts
optional brandId: string;
```

The unique identifier of the brand.

***

### choices

```ts
choices: DomainTypes[];
```

An array of available [DomainTypes](../enumerations/DomainTypes.md) to choose from.

***

### controller?

```ts
optional controller: AbortController;
```

An `AbortController` instance to manage ongoing fetch requests.

***

### currency?

```ts
optional currency: string;
```

The currency code (e.g. "GBP") to be used for domain pricing.

***

### error?

```ts
optional error: ResponseError;
```

An error object if any issue occurred during domain operations.

***

### lookups

```ts
lookups: object;
```

Lookups for domain data, including searched, history, owned, and basket domains.

#### basket

```ts
basket: DomainProduct[];
```

Domains currently in the client's basket.

#### history

```ts
history: DomainProduct[];
```

Domain search history.

#### owned

```ts
owned: DomainProduct[];
```

Domains owned by the client.

#### searched

```ts
searched: DomainProduct[];
```

Domains found during searches.

***

### model?

```ts
optional model: DomainModel[];
```

The current [DomainModel](../type-aliases/DomainModel.md) or array of models representing the selected domains.

***

### parseBasketProduct()

```ts
parseBasketProduct: (product, context?) => DomainProduct | undefined;
```

Converts an `IBasketProduct` from the main basket into a specific model type `T` (e.g. from `IBasketProduct` to `DomainProduct`).

#### Parameters

##### product

`IBasketProduct`

The `IBasketProduct` to parse.

##### context?

`any`

Optional additional context for the parsing process.

#### Returns

[`DomainProduct`](../type-aliases/DomainProduct.md) \| `undefined`

The parsed product model of type `T`, or `undefined` if parsing fails.

#### Inherited from

[`BasketHelperContext`](BasketHelperContext.md).[`parseBasketProduct`](BasketHelperContext.md#parsebasketproduct)

***

### parseProductModel()

```ts
parseProductModel: (model) => ProductProps | undefined;
```

Converts a generic model of type `T` into the correct `ProductProps` model required to be added to the basket.

#### Parameters

##### model

[`DomainProduct`](../type-aliases/DomainProduct.md)

The model of type `T` to parse.

#### Returns

[`ProductProps`](ProductProps.md) \| `undefined`

The parsed `ProductProps` model, or `undefined` if parsing fails.

#### Inherited from

[`BasketHelperContext`](BasketHelperContext.md).[`parseProductModel`](BasketHelperContext.md#parseproductmodel)

***

### preferredCycle?

```ts
optional preferredCycle: number;
```

The preferred billing cycle duration in months for domains.

***

### promotions?

```ts
optional promotions: IBasketPromotion[];
```

An array of IBasketPromotion objects applicable to domains.

#### Overrides

[`BasketHelperContext`](BasketHelperContext.md).[`promotions`](BasketHelperContext.md#promotions)

***

### search?

```ts
optional search: object;
```

Parameters related to domain searching, including limits, offsets, and the query itself.

#### limit

```ts
limit: number;
```

The number of results to fetch per page.

#### offset

```ts
offset: number;
```

The number of results to skip (for pagination).

#### query?

```ts
optional query: string;
```

The current search query string.

#### total

```ts
total: number;
```

The total number of available results for the current search.

***

### tlds?

```ts
optional tlds: string[];
```

An array of available Top-Level Domains (TLDs).

***

### total?

```ts
optional total: number;
```

The total number of domain items available in the current context (e.g. search results).

***

### type?

```ts
optional type: DomainTypes;
```

The currently active [DomainTypes](../enumerations/DomainTypes.md) being managed.
