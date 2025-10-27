[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useBasketProductPending

# useBasketProductPending()

```ts
function useBasketProductPending(data): object;
```

Composable for managing the state of a product that is pending addition to the basket.
This composable is designed to handle the configuration, validation, and eventual addition
of a product to the shopping basket.
It leverages an internal XState machine to manage the product's lifecycle.

## Parameters

### data

Either a [ProductProps](../interfaces/ProductProps.md) object directly containing product configuration,
              or an ActorRef to an existing XState machine instance for the product.

`ActorRef`\<`any`, `any`\> | [`ProductProps`](../interfaces/ProductProps.md)

## Returns

The UsePendingProduct API for managing the product's state.

### additionalErrors

```ts
additionalErrors: ComputedRef<
  | {
  attributes?: any;
  options?: any;
  provisionFields?: any;
  term?: any;
}
| undefined>;
```

### attributes

```ts
attributes: ComputedRef<SubproductDetails[]>;
```

### coupons

```ts
coupons: string[];
```

### decrementOption()

```ts
decrementOption: (option, valueId) => Promise<void>;
```

#### Parameters

##### option

[`SubproductDetails`](../type-aliases/SubproductDetails.md)

##### valueId

`string`

#### Returns

`Promise`\<`void`\>

### decrementQuantity()

```ts
decrementQuantity: () => Promise<void>;
```

Decrements the product quantity by its defined step.
Ensures the product is quantifiable before decrementing.

#### Returns

`Promise`\<`void`\>

A promise that resolves when the quantity is decremented.

#### Throws

If the product is not quantifiable or the update fails.

### errors

```ts
errors: ComputedRef<
  | {
  attributes?: any;
  options?: any;
  provisionFields?: any;
  term?: any;
}
| undefined>;
```

### fields

```ts
fields: ComputedRef<Record<string, any>>;
```

### getProvisioningField()

```ts
getProvisioningField: (field) => any;
```

#### Parameters

##### field

`string`

#### Returns

`any`

### id

```ts
id: string;
```

### incrementOption()

```ts
incrementOption: (option, valueId) => Promise<void>;
```

#### Parameters

##### option

[`SubproductDetails`](../type-aliases/SubproductDetails.md)

##### valueId

`string`

#### Returns

`Promise`\<`void`\>

### incrementQuantity()

```ts
incrementQuantity: () => Promise<void>;
```

Increments the product quantity by its defined step.
Ensures the product is quantifiable before incrementing.

#### Returns

`Promise`\<`void`\>

A promise that resolves when the quantity is incremented.

#### Throws

If the product is not quantifiable or the update fails.

### isReady()

```ts
isReady: () => Promise<void>;
```

Waits for the product service to reach an 'available' state, indicating it's ready for interaction.
This is typically used to ensure the product's configuration and initial data have loaded.

#### Returns

`Promise`\<`void`\>

A promise that resolves when the product service is ready.

### isSelectedAttribute()

```ts
isSelectedAttribute: (attributeId, value) => boolean;
```

#### Parameters

##### attributeId

`string`

##### value

`string`

#### Returns

`boolean`

### isSelectedOption()

```ts
isSelectedOption: (optionId, value) => boolean;
```

#### Parameters

##### optionId

`string`

##### value

`string`

#### Returns

`boolean`

### isSelectedTerm()

```ts
isSelectedTerm: (value) => boolean;
```

#### Parameters

##### value

`number`

#### Returns

`boolean`

### lookups

```ts
lookups: ComputedRef<any>;
```

### meta

```ts
meta: ComputedRef<UseProductConfigMeta>;
```

### model

```ts
model: ComputedRef<ProductModel | undefined>;
```

### onDone()

```ts
onDone: () => Promise<unknown>;
```

#### Returns

`Promise`\<`unknown`\>

### options

```ts
options: ComputedRef<SubproductDetails[]>;
```

### product

```ts
product: ComputedRef<Product | undefined>;
```

### productImage()

```ts
productImage: (size) => string | undefined;
```

#### Parameters

##### size

`string` = `"400x400"`

#### Returns

`string` \| `undefined`

### reset()

```ts
reset: () => void;
```

#### Returns

`void`

### service

```ts
service: ActorRef<any, any>;
```

### setAttributes()

```ts
setAttributes: (attribute, values) => Promise<void>;
```

#### Parameters

##### attribute

[`SubproductDetails`](../type-aliases/SubproductDetails.md)

##### values

`string` | `string`[]

#### Returns

`Promise`\<`void`\>

### setOptions()

```ts
setOptions: (option, values) => Promise<void>;
```

#### Parameters

##### option

[`SubproductDetails`](../type-aliases/SubproductDetails.md)

##### values

`string` | `string`[]

#### Returns

`Promise`\<`void`\>

### setProvisioningFields()

```ts
setProvisioningFields: (values) => Promise<void>;
```

#### Parameters

##### values

`Record`\<`string`, `any`\>

#### Returns

`Promise`\<`void`\>

### state

```ts
state: Ref<any, any>;
```

### stop()

```ts
stop: () => boolean;
```

#### Returns

`boolean`

### terms

```ts
terms: ComputedRef<TermDetails[]>;
```

### title

```ts
title: ComputedRef<string>;
```

### update()

```ts
update: () => Promise<void>;
```

Manually triggers an update to the product's configuration in the basket.
This is often called after quantity changes or other modifications.

Updates the product's configuration based on current selections or changes.
It sends an 'UPDATE' event to the service and waits for the operation to complete or error.

#### Returns

`Promise`\<`void`\>

A promise that resolves upon successful update, or rejects if the update fails or times out.

#### Returns

A promise that resolves upon successful update, or rejects on error.

### updateOptionQuantity()

```ts
updateOptionQuantity: (option, valueId, qty) => Promise<void>;
```

#### Parameters

##### option

[`SubproductDetails`](../type-aliases/SubproductDetails.md)

##### valueId

`string`

##### qty

`number`

#### Returns

`Promise`\<`void`\>

### updateQuantity()

```ts
updateQuantity: (value) => Promise<void>;
```

Updates the quantity of the product.
Ensures the product is quantifiable before attempting to update.

#### Parameters

##### value

`number`

The new quantity value.

#### Returns

`Promise`\<`void`\>

A promise that resolves when the quantity is updated.

#### Throws

If the product is not quantifiable or the update fails.

### updateTerm()

```ts
updateTerm: (value) => Promise<void>;
```

#### Parameters

##### value

`number`

#### Returns

`Promise`\<`void`\>

### validationErrors

```ts
validationErrors: ComputedRef<
  | {
  attributes?: any;
  options?: any;
  provisionFields?: any;
  term?: any;
}
| undefined>;
```

## Throws

If the basket is not available, or if the provided product data is invalid or missing.
