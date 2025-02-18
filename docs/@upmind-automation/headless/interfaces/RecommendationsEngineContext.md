[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / RecommendationsEngineContext

# RecommendationsEngineContext

## Properties

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

### basketItem?

```ts
optional basketItem: ActorRef<any>;
```

---

### basketItemBuilder()?

```ts
optional basketItemBuilder: (model) => BasketProduct;
```

#### Parameters

• **model**: [`ProductModel`](ProductModel.md)

#### Returns

[`BasketProduct`](BasketProduct.md)

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

### currencyId?

```ts
optional currencyId: string;
```

---

### error?

```ts
optional error: any;
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

### promotions?

```ts
optional promotions: string[];
```

---

### raw

```ts
raw: object;
```

#### added

```ts
added: string[];
```

#### products

```ts
products: BasketProduct[];
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

---

### recommendations

```ts
recommendations: Recommendation[];
```
