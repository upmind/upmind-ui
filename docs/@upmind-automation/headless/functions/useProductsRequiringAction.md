[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useProductsRequiringAction

# useProductsRequiringAction()

```ts
function useProductsRequiringAction(): object;
```

Composable function to provide methods and properties related to products requiring action.

This composable integrates functionality for identifying and managing products that require specific actions,
leveraging utilities from the `useRouteRequiresAction` hook. It facilitates the readiness state,
retrieval of the next actionable product in various conditions, and access to the list of products.

## Returns

`object`

### getNext()

```ts
getNext: (currentBasketItem?, types) => 
  | string
  | BasketProduct
  | <TResult1, TResult2>(onfulfilled?, onrejected?) => Promise<TResult1 | TResult2>
  | <TResult>(onrejected?) => Promise<
  | {
  additionalErrors: ComputedRef<
     | {
     attributes?: any;
     options?: any;
     provisionFields?: any;
     term?: any;
   }
    | undefined>;
  attributes: ComputedRef<SubproductDetails[]>;
  coupons: string[];
  decrementOption: (option, valueId) => Promise<void>;
  decrementQuantity: () => Promise<void>;
  errors: ComputedRef<
     | {
     attributes?: any;
     options?: any;
     provisionFields?: any;
     term?: any;
   }
    | undefined>;
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
  model: ComputedRef<ProductModel | undefined>;
  onDone: () => Promise<unknown>;
  options: ComputedRef<SubproductDetails[]>;
  product: ComputedRef<Product | undefined>;
  productImage: (size) => string | undefined;
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
     | {
     attributes?: any;
     options?: any;
     provisionFields?: any;
     term?: any;
   }
    | undefined>;
}
  | TResult>
  | (onfinally?) => Promise<{
  additionalErrors: ComputedRef<
     | {
     attributes?: any;
     options?: any;
     provisionFields?: any;
     term?: any;
   }
    | undefined>;
  attributes: ComputedRef<SubproductDetails[]>;
  coupons: string[];
  decrementOption: (option, valueId) => Promise<void>;
  decrementQuantity: () => Promise<void>;
  errors: ComputedRef<
     | {
     attributes?: any;
     options?: any;
     provisionFields?: any;
     term?: any;
   }
    | undefined>;
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
  model: ComputedRef<ProductModel | undefined>;
  onDone: () => Promise<unknown>;
  options: ComputedRef<SubproductDetails[]>;
  product: ComputedRef<Product | undefined>;
  productImage: (size) => string | undefined;
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
     | {
     attributes?: any;
     options?: any;
     provisionFields?: any;
     term?: any;
   }
    | undefined>;
}>
  | null;
```

#### Parameters

##### currentBasketItem?

`ActorRef`\<`any`, `any`\>

##### types?

[`REQUIRES_ACTION`](../enumerations/REQUIRES_ACTION.md)[] = `...`

#### Returns

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
     \| \{
     `attributes?`: `any`;
     `options?`: `any`;
     `provisionFields?`: `any`;
     `term?`: `any`;
   \}
    \| `undefined`\>;
  `attributes`: `ComputedRef`\<[`SubproductDetails`](../type-aliases/SubproductDetails.md)[]\>;
  `coupons`: `string`[];
  `decrementOption`: (`option`, `valueId`) => `Promise`\<`void`\>;
  `decrementQuantity`: () => `Promise`\<`void`\>;
  `errors`: `ComputedRef`\<
     \| \{
     `attributes?`: `any`;
     `options?`: `any`;
     `provisionFields?`: `any`;
     `term?`: `any`;
   \}
    \| `undefined`\>;
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
  `model`: `ComputedRef`\<[`ProductModel`](../type-aliases/ProductModel.md) \| `undefined`\>;
  `onDone`: () => `Promise`\<`unknown`\>;
  `options`: `ComputedRef`\<[`SubproductDetails`](../type-aliases/SubproductDetails.md)[]\>;
  `product`: `ComputedRef`\<[`Product`](../type-aliases/Product.md) \| `undefined`\>;
  `productImage`: (`size`) => `string` \| `undefined`;
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
     \| \{
     `attributes?`: `any`;
     `options?`: `any`;
     `provisionFields?`: `any`;
     `term?`: `any`;
   \}
    \| `undefined`\>;
\}

##### TResult2

`TResult2` = `never`

#### Parameters

##### onfulfilled?

The callback to execute when the Promise is resolved.

(`value`) => `TResult1` \| `PromiseLike`\<`TResult1`\> | `null`

##### onrejected?

The callback to execute when the Promise is rejected.

(`reason`) => `TResult2` \| `PromiseLike`\<`TResult2`\> | `null`

#### Returns

`Promise`\<`TResult1` \| `TResult2`\>

A Promise for the completion of which ever callback is executed.

```ts
<TResult>(onrejected?) => Promise<
  | {
  additionalErrors: ComputedRef<
     | {
     attributes?: any;
     options?: any;
     provisionFields?: any;
     term?: any;
   }
    | undefined>;
  attributes: ComputedRef<SubproductDetails[]>;
  coupons: string[];
  decrementOption: (option, valueId) => Promise<void>;
  decrementQuantity: () => Promise<void>;
  errors: ComputedRef<
     | {
     attributes?: any;
     options?: any;
     provisionFields?: any;
     term?: any;
   }
    | undefined>;
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
  model: ComputedRef<ProductModel | undefined>;
  onDone: () => Promise<unknown>;
  options: ComputedRef<SubproductDetails[]>;
  product: ComputedRef<Product | undefined>;
  productImage: (size) => string | undefined;
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
     | {
     attributes?: any;
     options?: any;
     provisionFields?: any;
     term?: any;
   }
    | undefined>;
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

(`reason`) => `TResult` \| `PromiseLike`\<`TResult`\> | `null`

#### Returns

`Promise`\<
  \| \{
  `additionalErrors`: `ComputedRef`\<
     \| \{
     `attributes?`: `any`;
     `options?`: `any`;
     `provisionFields?`: `any`;
     `term?`: `any`;
   \}
    \| `undefined`\>;
  `attributes`: `ComputedRef`\<[`SubproductDetails`](../type-aliases/SubproductDetails.md)[]\>;
  `coupons`: `string`[];
  `decrementOption`: (`option`, `valueId`) => `Promise`\<`void`\>;
  `decrementQuantity`: () => `Promise`\<`void`\>;
  `errors`: `ComputedRef`\<
     \| \{
     `attributes?`: `any`;
     `options?`: `any`;
     `provisionFields?`: `any`;
     `term?`: `any`;
   \}
    \| `undefined`\>;
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
  `model`: `ComputedRef`\<[`ProductModel`](../type-aliases/ProductModel.md) \| `undefined`\>;
  `onDone`: () => `Promise`\<`unknown`\>;
  `options`: `ComputedRef`\<[`SubproductDetails`](../type-aliases/SubproductDetails.md)[]\>;
  `product`: `ComputedRef`\<[`Product`](../type-aliases/Product.md) \| `undefined`\>;
  `productImage`: (`size`) => `string` \| `undefined`;
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
     \| \{
     `attributes?`: `any`;
     `options?`: `any`;
     `provisionFields?`: `any`;
     `term?`: `any`;
   \}
    \| `undefined`\>;
\}
  \| `TResult`\>

A Promise for the completion of the callback.

```ts
(onfinally?) => Promise<{
  additionalErrors: ComputedRef<
     | {
     attributes?: any;
     options?: any;
     provisionFields?: any;
     term?: any;
   }
    | undefined>;
  attributes: ComputedRef<SubproductDetails[]>;
  coupons: string[];
  decrementOption: (option, valueId) => Promise<void>;
  decrementQuantity: () => Promise<void>;
  errors: ComputedRef<
     | {
     attributes?: any;
     options?: any;
     provisionFields?: any;
     term?: any;
   }
    | undefined>;
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
  model: ComputedRef<ProductModel | undefined>;
  onDone: () => Promise<unknown>;
  options: ComputedRef<SubproductDetails[]>;
  product: ComputedRef<Product | undefined>;
  productImage: (size) => string | undefined;
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
     | {
     attributes?: any;
     options?: any;
     provisionFields?: any;
     term?: any;
   }
    | undefined>;
}>
```

Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
resolved value cannot be modified from the callback.

#### Parameters

##### onfinally?

The callback to execute when the Promise is settled (fulfilled or rejected).

() => `void` | `null`

#### Returns

`Promise`\<\{
  `additionalErrors`: `ComputedRef`\<
     \| \{
     `attributes?`: `any`;
     `options?`: `any`;
     `provisionFields?`: `any`;
     `term?`: `any`;
   \}
    \| `undefined`\>;
  `attributes`: `ComputedRef`\<[`SubproductDetails`](../type-aliases/SubproductDetails.md)[]\>;
  `coupons`: `string`[];
  `decrementOption`: (`option`, `valueId`) => `Promise`\<`void`\>;
  `decrementQuantity`: () => `Promise`\<`void`\>;
  `errors`: `ComputedRef`\<
     \| \{
     `attributes?`: `any`;
     `options?`: `any`;
     `provisionFields?`: `any`;
     `term?`: `any`;
   \}
    \| `undefined`\>;
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
  `model`: `ComputedRef`\<[`ProductModel`](../type-aliases/ProductModel.md) \| `undefined`\>;
  `onDone`: () => `Promise`\<`unknown`\>;
  `options`: `ComputedRef`\<[`SubproductDetails`](../type-aliases/SubproductDetails.md)[]\>;
  `product`: `ComputedRef`\<[`Product`](../type-aliases/Product.md) \| `undefined`\>;
  `productImage`: (`size`) => `string` \| `undefined`;
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
     \| \{
     `attributes?`: `any`;
     `options?`: `any`;
     `provisionFields?`: `any`;
     `term?`: `any`;
   \}
    \| `undefined`\>;
\}\>

A Promise for the completion of the callback.

`null`

### getNextInvalid()

```ts
getNextInvalid: (current?) => BasketProduct | undefined;
```

#### Parameters

##### current?

`ActorRef`\<`any`, `any`\>

#### Returns

[`BasketProduct`](../interfaces/BasketProduct.md) \| `undefined`

### getNextPending()

```ts
getNextPending: (current?) => 
  | string
  | <TResult1, TResult2>(onfulfilled?, onrejected?) => Promise<TResult1 | TResult2>
  | <TResult>(onrejected?) => Promise<
  | {
  additionalErrors: ComputedRef<
     | {
     attributes?: any;
     options?: any;
     provisionFields?: any;
     term?: any;
   }
    | undefined>;
  attributes: ComputedRef<SubproductDetails[]>;
  coupons: string[];
  decrementOption: (option, valueId) => Promise<void>;
  decrementQuantity: () => Promise<void>;
  errors: ComputedRef<
     | {
     attributes?: any;
     options?: any;
     provisionFields?: any;
     term?: any;
   }
    | undefined>;
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
  model: ComputedRef<ProductModel | undefined>;
  onDone: () => Promise<unknown>;
  options: ComputedRef<SubproductDetails[]>;
  product: ComputedRef<Product | undefined>;
  productImage: (size) => string | undefined;
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
     | {
     attributes?: any;
     options?: any;
     provisionFields?: any;
     term?: any;
   }
    | undefined>;
}
  | TResult>
  | (onfinally?) => Promise<{
  additionalErrors: ComputedRef<
     | {
     attributes?: any;
     options?: any;
     provisionFields?: any;
     term?: any;
   }
    | undefined>;
  attributes: ComputedRef<SubproductDetails[]>;
  coupons: string[];
  decrementOption: (option, valueId) => Promise<void>;
  decrementQuantity: () => Promise<void>;
  errors: ComputedRef<
     | {
     attributes?: any;
     options?: any;
     provisionFields?: any;
     term?: any;
   }
    | undefined>;
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
  model: ComputedRef<ProductModel | undefined>;
  onDone: () => Promise<unknown>;
  options: ComputedRef<SubproductDetails[]>;
  product: ComputedRef<Product | undefined>;
  productImage: (size) => string | undefined;
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
     | {
     attributes?: any;
     options?: any;
     provisionFields?: any;
     term?: any;
   }
    | undefined>;
}>
  | undefined;
```

#### Parameters

##### current?

`ActorRef`\<`any`, `any`\>

#### Returns

`string`

```ts
<TResult1, TResult2>(onfulfilled?, onrejected?) => Promise<TResult1 | TResult2>
```

Attaches callbacks for the resolution and/or rejection of the Promise.

#### Type Parameters

##### TResult1

`TResult1` = \{
  `additionalErrors`: `ComputedRef`\<
     \| \{
     `attributes?`: `any`;
     `options?`: `any`;
     `provisionFields?`: `any`;
     `term?`: `any`;
   \}
    \| `undefined`\>;
  `attributes`: `ComputedRef`\<[`SubproductDetails`](../type-aliases/SubproductDetails.md)[]\>;
  `coupons`: `string`[];
  `decrementOption`: (`option`, `valueId`) => `Promise`\<`void`\>;
  `decrementQuantity`: () => `Promise`\<`void`\>;
  `errors`: `ComputedRef`\<
     \| \{
     `attributes?`: `any`;
     `options?`: `any`;
     `provisionFields?`: `any`;
     `term?`: `any`;
   \}
    \| `undefined`\>;
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
  `model`: `ComputedRef`\<[`ProductModel`](../type-aliases/ProductModel.md) \| `undefined`\>;
  `onDone`: () => `Promise`\<`unknown`\>;
  `options`: `ComputedRef`\<[`SubproductDetails`](../type-aliases/SubproductDetails.md)[]\>;
  `product`: `ComputedRef`\<[`Product`](../type-aliases/Product.md) \| `undefined`\>;
  `productImage`: (`size`) => `string` \| `undefined`;
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
     \| \{
     `attributes?`: `any`;
     `options?`: `any`;
     `provisionFields?`: `any`;
     `term?`: `any`;
   \}
    \| `undefined`\>;
\}

##### TResult2

`TResult2` = `never`

#### Parameters

##### onfulfilled?

The callback to execute when the Promise is resolved.

(`value`) => `TResult1` \| `PromiseLike`\<`TResult1`\> | `null`

##### onrejected?

The callback to execute when the Promise is rejected.

(`reason`) => `TResult2` \| `PromiseLike`\<`TResult2`\> | `null`

#### Returns

`Promise`\<`TResult1` \| `TResult2`\>

A Promise for the completion of which ever callback is executed.

```ts
<TResult>(onrejected?) => Promise<
  | {
  additionalErrors: ComputedRef<
     | {
     attributes?: any;
     options?: any;
     provisionFields?: any;
     term?: any;
   }
    | undefined>;
  attributes: ComputedRef<SubproductDetails[]>;
  coupons: string[];
  decrementOption: (option, valueId) => Promise<void>;
  decrementQuantity: () => Promise<void>;
  errors: ComputedRef<
     | {
     attributes?: any;
     options?: any;
     provisionFields?: any;
     term?: any;
   }
    | undefined>;
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
  model: ComputedRef<ProductModel | undefined>;
  onDone: () => Promise<unknown>;
  options: ComputedRef<SubproductDetails[]>;
  product: ComputedRef<Product | undefined>;
  productImage: (size) => string | undefined;
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
     | {
     attributes?: any;
     options?: any;
     provisionFields?: any;
     term?: any;
   }
    | undefined>;
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

(`reason`) => `TResult` \| `PromiseLike`\<`TResult`\> | `null`

#### Returns

`Promise`\<
  \| \{
  `additionalErrors`: `ComputedRef`\<
     \| \{
     `attributes?`: `any`;
     `options?`: `any`;
     `provisionFields?`: `any`;
     `term?`: `any`;
   \}
    \| `undefined`\>;
  `attributes`: `ComputedRef`\<[`SubproductDetails`](../type-aliases/SubproductDetails.md)[]\>;
  `coupons`: `string`[];
  `decrementOption`: (`option`, `valueId`) => `Promise`\<`void`\>;
  `decrementQuantity`: () => `Promise`\<`void`\>;
  `errors`: `ComputedRef`\<
     \| \{
     `attributes?`: `any`;
     `options?`: `any`;
     `provisionFields?`: `any`;
     `term?`: `any`;
   \}
    \| `undefined`\>;
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
  `model`: `ComputedRef`\<[`ProductModel`](../type-aliases/ProductModel.md) \| `undefined`\>;
  `onDone`: () => `Promise`\<`unknown`\>;
  `options`: `ComputedRef`\<[`SubproductDetails`](../type-aliases/SubproductDetails.md)[]\>;
  `product`: `ComputedRef`\<[`Product`](../type-aliases/Product.md) \| `undefined`\>;
  `productImage`: (`size`) => `string` \| `undefined`;
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
     \| \{
     `attributes?`: `any`;
     `options?`: `any`;
     `provisionFields?`: `any`;
     `term?`: `any`;
   \}
    \| `undefined`\>;
\}
  \| `TResult`\>

A Promise for the completion of the callback.

```ts
(onfinally?) => Promise<{
  additionalErrors: ComputedRef<
     | {
     attributes?: any;
     options?: any;
     provisionFields?: any;
     term?: any;
   }
    | undefined>;
  attributes: ComputedRef<SubproductDetails[]>;
  coupons: string[];
  decrementOption: (option, valueId) => Promise<void>;
  decrementQuantity: () => Promise<void>;
  errors: ComputedRef<
     | {
     attributes?: any;
     options?: any;
     provisionFields?: any;
     term?: any;
   }
    | undefined>;
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
  model: ComputedRef<ProductModel | undefined>;
  onDone: () => Promise<unknown>;
  options: ComputedRef<SubproductDetails[]>;
  product: ComputedRef<Product | undefined>;
  productImage: (size) => string | undefined;
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
     | {
     attributes?: any;
     options?: any;
     provisionFields?: any;
     term?: any;
   }
    | undefined>;
}>
```

Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
resolved value cannot be modified from the callback.

#### Parameters

##### onfinally?

The callback to execute when the Promise is settled (fulfilled or rejected).

() => `void` | `null`

#### Returns

`Promise`\<\{
  `additionalErrors`: `ComputedRef`\<
     \| \{
     `attributes?`: `any`;
     `options?`: `any`;
     `provisionFields?`: `any`;
     `term?`: `any`;
   \}
    \| `undefined`\>;
  `attributes`: `ComputedRef`\<[`SubproductDetails`](../type-aliases/SubproductDetails.md)[]\>;
  `coupons`: `string`[];
  `decrementOption`: (`option`, `valueId`) => `Promise`\<`void`\>;
  `decrementQuantity`: () => `Promise`\<`void`\>;
  `errors`: `ComputedRef`\<
     \| \{
     `attributes?`: `any`;
     `options?`: `any`;
     `provisionFields?`: `any`;
     `term?`: `any`;
   \}
    \| `undefined`\>;
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
  `model`: `ComputedRef`\<[`ProductModel`](../type-aliases/ProductModel.md) \| `undefined`\>;
  `onDone`: () => `Promise`\<`unknown`\>;
  `options`: `ComputedRef`\<[`SubproductDetails`](../type-aliases/SubproductDetails.md)[]\>;
  `product`: `ComputedRef`\<[`Product`](../type-aliases/Product.md) \| `undefined`\>;
  `productImage`: (`size`) => `string` \| `undefined`;
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
     \| \{
     `attributes?`: `any`;
     `options?`: `any`;
     `provisionFields?`: `any`;
     `term?`: `any`;
   \}
    \| `undefined`\>;
\}\>

A Promise for the completion of the callback.

`undefined`

### getNextRelated()

```ts
getNextRelated: (current) => BasketProduct | undefined;
```

#### Parameters

##### current

`ActorRef`\<`any`\>

#### Returns

[`BasketProduct`](../interfaces/BasketProduct.md) \| `undefined`

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
