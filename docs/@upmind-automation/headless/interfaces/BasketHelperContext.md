[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / BasketHelperContext

# BasketHelperContext\<T\>

## Type Parameters

### T

`T` = `unknown`

## Indexable

```ts
[key: string]: any
```

## Properties

### parseBasketProduct()

```ts
parseBasketProduct: (product, context?) => undefined | T;
```

#### Parameters

##### product

`IBasketProduct`

##### context?

`any`

#### Returns

`undefined` \| `T`

***

### parseProductModel()

```ts
parseProductModel: (model) => undefined | ProductProps;
```

#### Parameters

##### model

`T`

#### Returns

`undefined` \| [`ProductProps`](ProductProps.md)

***

### promotions?

```ts
optional promotions: IBasketPromotion[];
```
