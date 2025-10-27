[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / BasketHelperContext

# BasketHelperContext\<T\>

Interface representing the context for a basket helper, which facilitates
the conversion and management of products between a generic type `T` and
the specific `IBasketProduct` format required by the basket.

## Extended by

- [`DomainContext`](DomainContext.md)

## Type Parameters

### T

`T` = `unknown`

The generic type of product model this helper context is designed to manage.

## Properties

### parseBasketProduct()

```ts
parseBasketProduct: (product, context?) => T | undefined;
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

`T` \| `undefined`

The parsed product model of type `T`, or `undefined` if parsing fails.

***

### parseProductModel()

```ts
parseProductModel: (model) => ProductProps | undefined;
```

Converts a generic model of type `T` into the correct `ProductProps` model required to be added to the basket.

#### Parameters

##### model

`T`

The model of type `T` to parse.

#### Returns

[`ProductProps`](ProductProps.md) \| `undefined`

The parsed `ProductProps` model, or `undefined` if parsing fails.

***

### promotions?

```ts
optional promotions: IBasketPromotion[];
```

An array of `IBasketPromotion` objects that apply to the basket.
