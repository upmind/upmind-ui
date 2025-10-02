[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useBasketProductsPending

# useBasketProductsPending()

```ts
function useBasketProductsPending(): object;
```

## Returns

`object`

### add()

```ts
add: (pid, model, force) => Promise<{
  additionalErrors: ComputedRef<
     | undefined
     | {
     attributes?: any;
     options?: any;
     provisionFields?: any;
     term?: any;
  }>;
  attributes: ComputedRef<SubproductDetails[]>;
  coupons: string[];
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
  model: ComputedRef<undefined | ProductModel>;
  onDone: () => Promise<unknown>;
  options: ComputedRef<SubproductDetails[]>;
  product: ComputedRef<undefined | Product>;
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
}> = ensure;
```

#### Parameters

##### pid

`string`

##### model

[`ProductProps`](../interfaces/ProductProps.md)

##### force

`boolean` = `false`

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
  `coupons`: `string`[];
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
  `model`: `ComputedRef`\<`undefined` \| [`ProductModel`](../type-aliases/ProductModel.md)\>;
  `onDone`: () => `Promise`\<`unknown`\>;
  `options`: `ComputedRef`\<[`SubproductDetails`](../type-aliases/SubproductDetails.md)[]\>;
  `product`: `ComputedRef`\<`undefined` \| [`Product`](../type-aliases/Product.md)\>;
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

### addMany()

```ts
addMany: (configs?) => void;
```

#### Parameters

##### configs?

[`ProductModel`](../type-aliases/ProductModel.md)[]

#### Returns

`void`

### clear()

```ts
clear: () => void;
```

#### Returns

`void`

### configure()

```ts
configure: (pid?, sync?) => Promise<{
  additionalErrors: ComputedRef<
     | undefined
     | {
     attributes?: any;
     options?: any;
     provisionFields?: any;
     term?: any;
  }>;
  attributes: ComputedRef<SubproductDetails[]>;
  coupons: string[];
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
  model: ComputedRef<undefined | ProductModel>;
  onDone: () => Promise<unknown>;
  options: ComputedRef<SubproductDetails[]>;
  product: ComputedRef<undefined | Product>;
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

##### pid?

`string` | `ActorRef`\<`any`, `any`\>

##### sync?

`boolean`

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
  `coupons`: `string`[];
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
  `model`: `ComputedRef`\<`undefined` \| [`ProductModel`](../type-aliases/ProductModel.md)\>;
  `onDone`: () => `Promise`\<`unknown`\>;
  `options`: `ComputedRef`\<[`SubproductDetails`](../type-aliases/SubproductDetails.md)[]\>;
  `product`: `ComputedRef`\<`undefined` \| [`Product`](../type-aliases/Product.md)\>;
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

### exists()

```ts
exists: (pid) => boolean;
```

#### Parameters

##### pid

`string`

#### Returns

`boolean`

### get()

```ts
get: (pid?, sync?, force?) => Promise<{
  additionalErrors: ComputedRef<
     | undefined
     | {
     attributes?: any;
     options?: any;
     provisionFields?: any;
     term?: any;
  }>;
  attributes: ComputedRef<SubproductDetails[]>;
  coupons: string[];
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
  model: ComputedRef<undefined | ProductModel>;
  onDone: () => Promise<unknown>;
  options: ComputedRef<SubproductDetails[]>;
  product: ComputedRef<undefined | Product>;
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
}> = getProduct;
```

#### Parameters

##### pid?

`string`

##### sync?

`boolean`

##### force?

`boolean`

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
  `coupons`: `string`[];
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
  `model`: `ComputedRef`\<`undefined` \| [`ProductModel`](../type-aliases/ProductModel.md)\>;
  `onDone`: () => `Promise`\<`unknown`\>;
  `options`: `ComputedRef`\<[`SubproductDetails`](../type-aliases/SubproductDetails.md)[]\>;
  `product`: `ComputedRef`\<`undefined` \| [`Product`](../type-aliases/Product.md)\>;
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

### isInBasket()

```ts
isInBasket: (config) => Promise<boolean>;
```

#### Parameters

##### config

`Partial`\<[`ProductProps`](../interfaces/ProductProps.md)\>

#### Returns

`Promise`\<`boolean`\>

### isReady()

```ts
isReady: () => Promise<unknown>;
```

#### Returns

`Promise`\<`unknown`\>

### meta

```ts
meta: ComputedRef<{
  hasProducts: boolean;
}>;
```

### products

```ts
products: ComputedRef<undefined | BasketProduct[]>;
```

### productsPending

```ts
productsPending: Record<string, {
  additionalErrors: ComputedRef<
     | undefined
     | {
     attributes?: any;
     options?: any;
     provisionFields?: any;
     term?: any;
  }>;
  attributes: ComputedRef<SubproductDetails[]>;
  coupons: string[];
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
  model: ComputedRef<undefined | ProductModel>;
  onDone: () => Promise<unknown>;
  options: ComputedRef<SubproductDetails[]>;
  product: ComputedRef<undefined | Product>;
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

### remove()

```ts
remove: (pid) => void = unsetProduct;
```

#### Parameters

##### pid

`string`

#### Returns

`void`

### resolve()

```ts
resolve: (target?) => void;
```

#### Parameters

##### target?

`string` | `ActorRef`\<`any`, `any`\>

#### Returns

`void`
