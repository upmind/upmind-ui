[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / ProductProps

# ProductProps

Represents the product model used for configuration.
This is the model that is built and verified by the schema

## Extends

- [`ProductModel`](../type-aliases/ProductModel.md)

## Properties

### attributes?

```ts
optional attributes: SubproductModel;
```

#### Inherited from

```ts
ProductModel.attributes
```

***

### bundle?

```ts
optional bundle: string;
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

### id?

```ts
optional id: string;
```

#### Inherited from

```ts
ProductModel.id
```

***

### options?

```ts
optional options: SubproductModel;
```

#### Inherited from

```ts
ProductModel.options
```

***

### productId

```ts
productId: string;
```

#### Inherited from

```ts
ProductModel.productId
```

***

### promotions?

```ts
optional promotions: IBasketPromotion[];
```

***

### provisionFields?

```ts
optional provisionFields: Record<string, any>;
```

#### Inherited from

```ts
ProductModel.provisionFields
```

***

### quantity

```ts
quantity: number;
```

#### Inherited from

```ts
ProductModel.quantity
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

***

### term?

```ts
optional term: number;
```

#### Inherited from

```ts
ProductModel.term
```
