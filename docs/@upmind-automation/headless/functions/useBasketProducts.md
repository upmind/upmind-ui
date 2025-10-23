[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useBasketProducts

# useBasketProducts()

```ts
function useBasketProducts(): object;
```

Provides a composable interface for managing products within the shopping basket.
It leverages the [useBasket](useBasket.md) composable for core basket state and actions,
and exposes methods for interacting with individual basket products, such as
retrieving, removing, updating quantity, and resolving product configurations.

## Returns

The API for managing basket products.

### configure()

```ts
configure: (bpid) => Promise<{
  additionalErrors: ComputedRef<
     | {
     attributes?: any;
     options?: any;
     provisionFields?: any;
     term?: any;
   }
    | undefined>;
  attributes: ComputedRef<SubproductDetails[]>;
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
  model: ComputedRef<any>;
  onDone: () => Promise<unknown>;
  options: ComputedRef<SubproductDetails[]>;
  product: ComputedRef<Product>;
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

Configures and returns a composable for a specific basket product, identified by its ID.
This allows for granular control over individual items within the basket.

#### Parameters

##### bpid

`string`

The basket product ID to configure.

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
  `model`: `ComputedRef`\<`any`\>;
  `onDone`: () => `Promise`\<`unknown`\>;
  `options`: `ComputedRef`\<[`SubproductDetails`](../type-aliases/SubproductDetails.md)[]\>;
  `product`: `ComputedRef`\<[`Product`](../type-aliases/Product.md)\>;
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

A promise resolving to the [UseBasketProduct](../type-aliases/UseBasketProduct.md) composable for the specified product.

#### Throws

If the basket product is not found.

### decrementQuantity()

```ts
decrementQuantity: (...args) => Promise<IBasket>;
```

Decrements the quantity of a product in the basket by its step. This operation is debounced.

#### Parameters

##### args

...\[`string`\]

#### Returns

`Promise`\<`IBasket`\>

A promise resolving to the updated IBasket or `undefined`.

### incrementQuantity()

```ts
incrementQuantity: (...args) => Promise<IBasket>;
```

Increments the quantity of a product in the basket by its step. This operation is debounced.

#### Parameters

##### args

...\[`string`\]

#### Returns

`Promise`\<`IBasket`\>

A promise resolving to the updated IBasket or `undefined`.

### isReady()

```ts
isReady: () => Promise<boolean>;
```

Waits for the basket service to be ready (available or error state).

#### Returns

`Promise`\<`boolean`\>

Resolves `true` if ready, `false` if in an error state.

### meta

```ts
meta: ComputedRef<{
  hasProducts: boolean;
  isLoading: boolean;
  isProcessing: (bpid?) => boolean;
}>;
```

Meta-information computed from the basket's state.

### products

```ts
products: ComputedRef<BasketProduct[] | undefined>;
```

The reactive list of all [BasketProduct](../interfaces/BasketProduct.md)s currently in the basket.

### refresh()

```ts
refresh: (data?) => Promise<IBasket | undefined>;
```

Refreshes the entire basket state by fetching the latest data.

#### Parameters

##### data?

`IBasket`

#### Returns

`Promise`\<`IBasket` \| `undefined`\>

A promise resolving to the updated IBasket or `undefined`.

### remove()

```ts
remove: (...args) => Promise<IBasket>;
```

Removes a product from the basket by its ID. This operation is debounced.

#### Parameters

##### args

...\[`string`\]

#### Returns

`Promise`\<`IBasket`\>

A promise resolving to the updated IBasket or `undefined`.

### resolve()

```ts
resolve: (id, data) => Promise<IBasket | undefined>;
```

Resolves a product's configuration and updates it in the basket.

Resolves a product's configuration by updating it in the basket.
This is used when a user finalizes configuration changes for a product.
It handles data updates, basket refresh, and pushes 'add_to_cart' event to dataLayer.

#### Parameters

##### id

`string`

The unique identifier of the basket product.

##### data

[`ProductModel`](../type-aliases/ProductModel.md)

The [ProductModel](../type-aliases/ProductModel.md) containing the updated configuration.

#### Returns

`Promise`\<`IBasket` \| `undefined`\>

A promise resolving to the updated IBasket or `undefined` if the basket is not available.

#### Throws

If the basket is not available, the product is not found, or an error occurs during update.

#### Param

The basket product ID.

#### Param

The updated [ProductModel](../type-aliases/ProductModel.md) data.

#### Returns

A promise resolving to the updated IBasket or `undefined`.

### updateQuantity()

```ts
updateQuantity: (...args) => Promise<IBasket>;
```

Updates the quantity of a product in the basket to a specific value. This operation is debounced.

#### Parameters

##### args

...\[`string`, `number`\]

#### Returns

`Promise`\<`IBasket`\>

A promise resolving to the updated IBasket or `undefined`.
