[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / ProductConfigContext

# ProductConfigContext

## Properties

### baseModel

```ts
baseModel: ProductModel;
```

---

### basketHelper?

```ts
optional basketHelper: ActorRef<any>;
```

---

### basketId?

```ts
optional basketId: string;
```

---

### basketItemMapper()?

```ts
optional basketItemMapper: (item) => Partial<BasketProduct>;
```

#### Parameters

• **item**: [`BasketProduct`](BasketProduct.md)

#### Returns

`Partial`\<[`BasketProduct`](BasketProduct.md)\>

---

### basketProduct?

```ts
optional basketProduct: BasketProduct;
```

---

### calculateCallback?

```ts
optional calculateCallback: ActorRef<any>;
```

---

### clientId

```ts
clientId: string;
```

---

### coupons?

```ts
optional coupons: string[];
```

---

### currencyId

```ts
currencyId: string;
```

---

### error?

```ts
optional error: any;
```

---

### errorExternal

```ts
errorExternal: any;
```

---

### id

```ts
id: string;
```

---

### itemBuilder()?

```ts
optional itemBuilder: (item) => ProductModel;
```

#### Parameters

• **item**: [`ProductModel`](ProductModel.md)

#### Returns

[`ProductModel`](ProductModel.md)

---

### lookups

```ts
lookups: object;
```

#### attributes?

```ts
optional attributes: any[];
```

#### options?

```ts
optional options: any[];
```

#### product?

```ts
optional product: any;
```

#### terms?

```ts
optional terms: any[];
```

---

### model

```ts
model: ProductModel;
```

---

### prices?

```ts
optional prices: object;
```

#### attributes?

```ts
optional attributes: number[];
```

#### options?

```ts
optional options: number[];
```

#### term?

```ts
optional term: number[];
```

---

### promotions?

```ts
optional promotions: string[];
```

---

### rawProduct?

```ts
optional rawProduct: any;
```

---

### summary?

```ts
optional summary: any;
```
