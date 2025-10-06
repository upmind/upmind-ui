[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useBasketProducts

# useBasketProducts()

```ts
function useBasketProducts(): object;
```

## Returns

`object`

### configure()

```ts
configure: (bpid) => Promise<{
  additionalErrors: ComputedRef<
     | undefined
     | {
     attributes?: any;
     options?: any;
     provisionFields?: any;
     term?: any;
  }>;
  attributes: ComputedRef<SubproductDetails[]>;
  decrementOption: (option, valueId) => Promise<void>;
  decrementQuantity: () => Promise<void>;
  errors: ComputedRef<
     | undefined
     | {
     attributes?: any;
     options?: any;
     provisionFields?: any;
     term?: any;
  }>;
  fields: ComputedRef<Record<string, any>>;
  getProvisioningField: (field) => any;
  id: string;
  incrementOption: (option, valueId) => Promise<void>;
  incrementQuantity: () => Promise<void>;
  isReady: () => Promise<void>;
  isSelectedAttribute: (attributeId, value) => boolean;
  isSelectedOption: (optionId, value) => boolean;
  isSelectedTerm: (value) => boolean;
  lookups: ComputedRef<any>;
  meta: ComputedRef<UseProductConfigMeta>;
  model: ComputedRef<any>;
  onDone: () => Promise<unknown>;
  options: ComputedRef<SubproductDetails[]>;
  product: ComputedRef<Product>;
  productImage: (size) => undefined | string;
  reset: () => void;
  service: ActorRef<any, any>;
  setAttributes: (attribute, values) => Promise<void>;
  setOptions: (option, values) => Promise<void>;
  setProvisioningFields: (values) => Promise<void>;
  state: Ref<any, any>;
  stop: () => boolean;
  terms: ComputedRef<TermDetails[]>;
  title: ComputedRef<string>;
  update: () => Promise<void>;
  updateOptionQuantity: (option, valueId, qty) => Promise<void>;
  updateQuantity: (value) => Promise<void>;
  updateTerm: (value) => Promise<void>;
  validationErrors: ComputedRef<
     | undefined
     | {
     attributes?: any;
     options?: any;
     provisionFields?: any;
     term?: any;
  }>;
}>;
```

#### Parameters

##### bpid

`string`

#### Returns

`Promise`\<\{
  `additionalErrors`: `ComputedRef`\<
     \| `undefined`
     \| \{
     `attributes?`: `any`;
     `options?`: `any`;
     `provisionFields?`: `any`;
     `term?`: `any`;
  \}\>;
  `attributes`: `ComputedRef`\<[`SubproductDetails`](../type-aliases/SubproductDetails.md)[]\>;
  `decrementOption`: (`option`, `valueId`) => `Promise`\<`void`\>;
  `decrementQuantity`: () => `Promise`\<`void`\>;
  `errors`: `ComputedRef`\<
     \| `undefined`
     \| \{
     `attributes?`: `any`;
     `options?`: `any`;
     `provisionFields?`: `any`;
     `term?`: `any`;
  \}\>;
  `fields`: `ComputedRef`\<`Record`\<`string`, `any`\>\>;
  `getProvisioningField`: (`field`) => `any`;
  `id`: `string`;
  `incrementOption`: (`option`, `valueId`) => `Promise`\<`void`\>;
  `incrementQuantity`: () => `Promise`\<`void`\>;
  `isReady`: () => `Promise`\<`void`\>;
  `isSelectedAttribute`: (`attributeId`, `value`) => `boolean`;
  `isSelectedOption`: (`optionId`, `value`) => `boolean`;
  `isSelectedTerm`: (`value`) => `boolean`;
  `lookups`: `ComputedRef`\<`any`\>;
  `meta`: `ComputedRef`\<[`UseProductConfigMeta`](../type-aliases/UseProductConfigMeta.md)\>;
  `model`: `ComputedRef`\<`any`\>;
  `onDone`: () => `Promise`\<`unknown`\>;
  `options`: `ComputedRef`\<[`SubproductDetails`](../type-aliases/SubproductDetails.md)[]\>;
  `product`: `ComputedRef`\<[`Product`](../type-aliases/Product.md)\>;
  `productImage`: (`size`) => `undefined` \| `string`;
  `reset`: () => `void`;
  `service`: `ActorRef`\<`any`, `any`\>;
  `setAttributes`: (`attribute`, `values`) => `Promise`\<`void`\>;
  `setOptions`: (`option`, `values`) => `Promise`\<`void`\>;
  `setProvisioningFields`: (`values`) => `Promise`\<`void`\>;
  `state`: `Ref`\<`any`, `any`\>;
  `stop`: () => `boolean`;
  `terms`: `ComputedRef`\<[`TermDetails`](../type-aliases/TermDetails.md)[]\>;
  `title`: `ComputedRef`\<`string`\>;
  `update`: () => `Promise`\<`void`\>;
  `updateOptionQuantity`: (`option`, `valueId`, `qty`) => `Promise`\<`void`\>;
  `updateQuantity`: (`value`) => `Promise`\<`void`\>;
  `updateTerm`: (`value`) => `Promise`\<`void`\>;
  `validationErrors`: `ComputedRef`\<
     \| `undefined`
     \| \{
     `attributes?`: `any`;
     `options?`: `any`;
     `provisionFields?`: `any`;
     `term?`: `any`;
  \}\>;
\}\>

### decrementQuantity()

```ts
decrementQuantity: (...args) => Promise<IBasket>;
```

#### Parameters

##### args

...\[`string`\]

#### Returns

`Promise`\<`IBasket`\>

### incrementQuantity()

```ts
incrementQuantity: (...args) => Promise<IBasket>;
```

#### Parameters

##### args

...\[`string`\]

#### Returns

`Promise`\<`IBasket`\>

### isReady()

```ts
isReady: () => Promise<boolean>;
```

#### Returns

`Promise`\<`boolean`\>

### meta

```ts
meta: ComputedRef<{
  hasProducts: boolean;
  isLoading: boolean;
  isProcessing: (bpid?) => boolean;
}>;
```

### products

```ts
products: ComputedRef<undefined | BasketProduct[]>;
```

### refresh()

```ts
refresh: (data?) => Promise<undefined | IBasket>;
```

#### Parameters

##### data?

`IBasket`

#### Returns

`Promise`\<`undefined` \| `IBasket`\>

### remove()

```ts
remove: (...args) => Promise<IBasket>;
```

#### Parameters

##### args

...\[`string`\]

#### Returns

`Promise`\<`IBasket`\>

### resolve()

```ts
resolve: (id, data) => Promise<undefined | IBasket>;
```

#### Parameters

##### id

`string`

##### data

[`ProductModel`](../type-aliases/ProductModel.md)

#### Returns

`Promise`\<`undefined` \| `IBasket`\>

### updateQuantity()

```ts
updateQuantity: (...args) => Promise<IBasket>;
```

#### Parameters

##### args

...\[`string`, `number`\]

#### Returns

`Promise`\<`IBasket`\>
