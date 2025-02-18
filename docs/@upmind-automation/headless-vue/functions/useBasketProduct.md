[Upmind](../../packages.md) / [@upmind-automation/headless-vue](../index.md) / useBasketProduct

# useBasketProduct()

```ts
function useBasketProduct(id): object;
```

## Parameters

• **id**: `string`

## Returns

`object`

### decrementQuantity()

```ts
decrementQuantity: () => Promise<undefined | ActorRef<any>>;
```

#### Returns

`Promise`\<`undefined` \| `ActorRef`\<`any`, `any`\>\>

### error

```ts
error: ComputedRef<undefined | object>;
```

### id

```ts
id: string;
```

### incrementQuantity()

```ts
incrementQuantity: () => Promise<undefined | ActorRef<any>>;
```

#### Returns

`Promise`\<`undefined` \| `ActorRef`\<`any`, `any`\>\>

### meta

```ts
meta: ComputedRef<object>;
```

#### Type declaration

##### hasAttributes

```ts
hasAttributes: boolean = !!basketProduct?.attributes;
```

##### hasErrors

```ts
hasErrors: boolean;
```

##### hasOptions

```ts
hasOptions: boolean = !!basketProduct?.options;
```

##### hasProvisioning

```ts
hasProvisioning: boolean = !!basketProduct?.provisionFields;
```

##### hasTaxIncluded

```ts
hasTaxIncluded: boolean;
```

##### hasTerms

```ts
hasTerms: boolean = !!basketProduct?.term;
```

##### isDirty

```ts
isDirty: boolean = false;
```

##### isLoading

```ts
isLoading: boolean = false;
```

##### isNew

```ts
isNew: boolean = false;
```

##### isProcessing

```ts
isProcessing: boolean = processing.value;
```

##### isTouched

```ts
isTouched: boolean = false;
```

##### isUnavailable

```ts
isUnavailable: boolean;
```

### model

```ts
model: ComputedRef<Omit<BasketProduct, "error" | "summary" | "product">>;
```

### product

```ts
product: ComputedRef<BasketProductDetails>;
```

### remove()

```ts
remove: () =>
  Promise<
    State<
      BasketContext,
      AnyEventObject,
      any,
      object,
      ResolveTypegenMeta<
        TypegenDisabled,
        AnyEventObject,
        BaseActionObject,
        ServiceMap
      >
    >
  >;
```

#### Returns

`Promise`\<`State`\<[`BasketContext`](../../headless/interfaces/BasketContext.md), `AnyEventObject`, `any`, `object`, `ResolveTypegenMeta`\<`TypegenDisabled`, `AnyEventObject`, `BaseActionObject`, `ServiceMap`\>\>\>

### stop()

```ts
stop: () => void;
```

Cancels the document load.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Window/stop)

#### Returns

`void`

### summary

```ts
summary: ComputedRef<object>;
```

#### Type declaration

##### details

```ts
details: BasketProductSummaryDetail[];
```

##### pricing

```ts
pricing: BasketProductSummaryPrice[];
```

### updateQuantity

```ts
updateQuantity: DebouncedFunc<(value) => Promise<ActorRef<any>>>;
```
