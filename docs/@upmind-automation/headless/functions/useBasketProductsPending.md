[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useBasketProductsPending

# useBasketProductsPending()

```ts
function useBasketProductsPending(): object;
```

Provides functionalities to manage products that are being configured and are pending addition to the basket.
This composable handles the lifecycle of pending products, including their addition, resolution,
and integration with the main basket state.

## Returns

The API for managing pending basket products.

### add()

```ts
add: (pid, model, force) => Promise<{
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
}> = ensure;
```

Adds a product configuration to the pending state or ensures it exists.
This is a debounced version of the `ensure` function.

Ensures a product configuration exists and is ready. If it doesn't exist or `force` is true,
it adds the product. It then waits for the product's service to become available or error.

#### Parameters

##### pid

`string`

The product ID for which to ensure the configuration.

##### model

[`ProductProps`](../interfaces/ProductProps.md)

The [ProductProps](../interfaces/ProductProps.md) defining the product and its configuration.

##### force

`boolean` = `false`

If `true`, re-adds the product even if it already exists.

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

A promise resolving to the [UseBasketProductPending](../type-aliases/UseBasketProductPending.md) instance.

#### Throws

If the product cannot be added, validated, or found.

#### Param

The [ProductProps](../interfaces/ProductProps.md) defining the product and its configuration.

#### Returns

A promise resolving to the [UseBasketProductPending](../type-aliases/UseBasketProductPending.md) instance.

### addMany()

```ts
addMany: (configs?) => void;
```

Adds multiple product configurations to the pending list, persisting them.

Adds multiple product configurations to the pending list.
It iterates through the provided configurations and calls `setProduct` for each.

#### Parameters

##### configs?

[`ProductModel`](../type-aliases/ProductModel.md)[]

An optional array of [ProductModel](../type-aliases/ProductModel.md) configurations to add.

#### Returns

`void`

#### Param

An optional array of [ProductModel](../type-aliases/ProductModel.md) configurations to add.

### clear()

```ts
clear: () => void;
```

Clears all pending product configurations from cache, storage, and stops their services.

Clears all pending product configurations from the cache, storage, and stops their services.
This effectively resets the pending products state.

#### Returns

`void`

### configure()

```ts
configure: (pid?, sync?) => Promise<{
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
}>;
```

Configures and returns a composable for a specific pending product, identified by its ID or configuration.
It either retrieves an existing pending product instance or creates a new one.

#### Parameters

##### pid?

The product ID or an ActorRef to an existing product machine. If omitted, it defaults to the last product pending.

`string` | `ActorRef`\<`any`, `any`\>

##### sync?

`boolean`

If `true`, subscribes to the product's state changes.

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

A promise resolving to the [UseBasketProductPending](../type-aliases/UseBasketProductPending.md) instance for the product.

#### Throws

If the product is not available or cannot be configured.

### exists()

```ts
exists: (pid) => boolean;
```

Checks if a product configuration exists in the pending list.

Checks if a product with the given ID and model configuration exists in the pending products.

#### Parameters

##### pid

`string`

The product ID to check for.

#### Returns

`boolean`

`true` if the product exists in pending configurations, `false` otherwise.

#### Param

The product ID to check.

#### Returns

`true` if the product configuration exists, `false` otherwise.

### get()

```ts
get: (pid?, sync?, force?) => Promise<{
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
}> = getProduct;
```

Retrieves a pending product instance by its product ID.
Optionally synchronises with its state changes.

Retrieves a pending product instance by its product ID.
It first checks for existing pending products, otherwise it attempts to ensure
the product by adding it if necessary. Optionally synchronises the subscription.

#### Parameters

##### pid?

`string`

The product ID to retrieve. If omitted, defaults to the last key in `productConfigs`.

##### sync?

`boolean`

If `true`, subscribes to the product's state changes.

##### force?

`boolean`

If `true`, forces a re-addition of the product even if it exists.

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

A promise resolving to the [UseBasketProductPending](../type-aliases/UseBasketProductPending.md) instance.

#### Throws

If the product ID is not found or if ensuring the product fails.

#### Param

The product ID. If omitted, defaults to the last product pending.

#### Param

If `true`, subscribes to the product's state changes.

#### Returns

A promise resolving to the [UseBasketProductPending](../type-aliases/UseBasketProductPending.md) instance.

### isInBasket()

```ts
isInBasket: (config) => Promise<boolean>;
```

Checks if a product with the given configuration already exists in the pending products list or the main basket.
This prevents duplicate pending entries and redundant operations.

#### Parameters

##### config

`Partial`\<[`ProductProps`](../interfaces/ProductProps.md)\>

Partial [ProductProps](../interfaces/ProductProps.md) to check for existence.

#### Returns

`Promise`\<`boolean`\>

A promise resolving to `true` if the product exists in pending or basket, `false` otherwise.

### isReady()

```ts
isReady: () => Promise<unknown>;
```

Checks if the basket service is ready.

#### Returns

`Promise`\<`unknown`\>

A promise resolving to `true` if pending products have been loaded from storage.

### meta

```ts
meta: ComputedRef<{
  hasProducts: boolean;
}>;
```

Meta-information about the pending products state.

### products

```ts
products: ComputedRef<BasketProduct[] | undefined>;
```

The reactive list of all products currently in the shopping basket.

### productsPending

```ts
productsPending: Record<string, {
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
}>;
```

The reactive record of all pending product configurations, keyed by product ID.

### remove()

```ts
remove: (pid) => void = unsetProduct;
```

Removes a pending product configuration. This operation is debounced.

Removes a pending product configuration from the cache, storage, and any active subscriptions.
Also stops the product's XState service if it's running.

#### Parameters

##### pid

`string`

The product ID to unset.

#### Returns

`void`

#### Param

The product ID to remove.

#### Returns

A promise resolving to the updated IBasket or `undefined`.

### resolve()

```ts
resolve: (target?) => void;
```

Resolves a pending product, removing it from pending state and storage after it's processed or added to the basket.

Resolves a pending product, typically after it has been successfully added to the basket.
This removes the product from pending configurations, storage, and unsubscribes from its service.
It also cleans up any completed products from the pending list.

#### Parameters

##### target?

The product ID or `ActorRef` to resolve. If `null` or `undefined`, it resolves all completed products.

`string` | `ActorRef`\<`any`, `any`\>

#### Returns

`void`
