[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useProductsRequiringAction

# useProductsRequiringAction()

```ts
function useProductsRequiringAction(): object;
```

## Returns

`object`

### getNext()

```ts
getNext: (currentBasketItem?, types) => 
  | null
  | string
  | BasketProduct
  | <TResult1, TResult2>(onfulfilled?, onrejected?) => Promise<TResult1 | TResult2>
  | <TResult>(onrejected?) => Promise<
  | {
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
}
  | TResult>
  | (onfinally?) => Promise<{
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

##### currentBasketItem?

`ActorRef`\<`any`, `any`\>

##### types?

[`REQUIRES_ACTION`](../enumerations/REQUIRES_ACTION.md)[] = `...`

#### Returns

`null`

`string`

[`BasketProduct`](../interfaces/BasketProduct.md)

```ts
<TResult1, TResult2>(onfulfilled?, onrejected?) => Promise<TResult1 | TResult2>
```

Attaches callbacks for the resolution and/or rejection of the Promise.

#### Type Parameters

##### TResult1

`TResult1` = \{
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
\}

##### TResult2

`TResult2` = `never`

#### Parameters

##### onfulfilled?

The callback to execute when the Promise is resolved.

`null` | (`value`) => `TResult1` \| `PromiseLike`\<`TResult1`\>

##### onrejected?

The callback to execute when the Promise is rejected.

`null` | (`reason`) => `TResult2` \| `PromiseLike`\<`TResult2`\>

#### Returns

`Promise`\<`TResult1` \| `TResult2`\>

A Promise for the completion of which ever callback is executed.

```ts
<TResult>(onrejected?) => Promise<
  | {
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
}
| TResult>
```

Attaches a callback for only the rejection of the Promise.

#### Type Parameters

##### TResult

`TResult` = `never`

#### Parameters

##### onrejected?

The callback to execute when the Promise is rejected.

`null` | (`reason`) => `TResult` \| `PromiseLike`\<`TResult`\>

#### Returns

`Promise`\<
  \| \{
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
\}
  \| `TResult`\>

A Promise for the completion of the callback.

```ts
(onfinally?) => Promise<{
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
}>
```

Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
resolved value cannot be modified from the callback.

#### Parameters

##### onfinally?

The callback to execute when the Promise is settled (fulfilled or rejected).

`null` | () => `void`

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

A Promise for the completion of the callback.

### getNextInvalid()

```ts
getNextInvalid: (current?) => undefined | BasketProduct;
```

#### Parameters

##### current?

`ActorRef`\<`any`, `any`\>

#### Returns

`undefined` \| [`BasketProduct`](../interfaces/BasketProduct.md)

### getNextPending()

```ts
getNextPending: (current?) => 
  | undefined
  | string
  | <TResult1, TResult2>(onfulfilled?, onrejected?) => Promise<TResult1 | TResult2>
  | <TResult>(onrejected?) => Promise<
  | {
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
}
  | TResult>
  | (onfinally?) => Promise<{
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

##### current?

`ActorRef`\<`any`, `any`\>

#### Returns

`undefined`

`string`

```ts
<TResult1, TResult2>(onfulfilled?, onrejected?) => Promise<TResult1 | TResult2>
```

Attaches callbacks for the resolution and/or rejection of the Promise.

#### Type Parameters

##### TResult1

`TResult1` = \{
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
\}

##### TResult2

`TResult2` = `never`

#### Parameters

##### onfulfilled?

The callback to execute when the Promise is resolved.

`null` | (`value`) => `TResult1` \| `PromiseLike`\<`TResult1`\>

##### onrejected?

The callback to execute when the Promise is rejected.

`null` | (`reason`) => `TResult2` \| `PromiseLike`\<`TResult2`\>

#### Returns

`Promise`\<`TResult1` \| `TResult2`\>

A Promise for the completion of which ever callback is executed.

```ts
<TResult>(onrejected?) => Promise<
  | {
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
}
| TResult>
```

Attaches a callback for only the rejection of the Promise.

#### Type Parameters

##### TResult

`TResult` = `never`

#### Parameters

##### onrejected?

The callback to execute when the Promise is rejected.

`null` | (`reason`) => `TResult` \| `PromiseLike`\<`TResult`\>

#### Returns

`Promise`\<
  \| \{
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
\}
  \| `TResult`\>

A Promise for the completion of the callback.

```ts
(onfinally?) => Promise<{
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
}>
```

Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
resolved value cannot be modified from the callback.

#### Parameters

##### onfinally?

The callback to execute when the Promise is settled (fulfilled or rejected).

`null` | () => `void`

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

A Promise for the completion of the callback.

### getNextRelated()

```ts
getNextRelated: (current) => undefined | BasketProduct;
```

#### Parameters

##### current

`ActorRef`\<`any`\>

#### Returns

`undefined` \| [`BasketProduct`](../interfaces/BasketProduct.md)

### isReady()

```ts
isReady: () => Promise<boolean>;
```

#### Returns

`Promise`\<`boolean`\>

### products

```ts
products: ComputedRef<BasketProduct[]>;
```
