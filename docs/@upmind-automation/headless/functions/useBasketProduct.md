[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useBasketProduct

# useBasketProduct()

```ts
function useBasketProduct(bpid): object;
```

Provides utility functions and state management for interacting with a specific product in the shopping basket.

This function leverages several internal hooks and services to facilitate product-related operations
such as quantity management, readiness checks, and error handling. It initialises and returns methods
that allow interaction with the basket product through a state machine.

## Parameters

### bpid

`string`

## Returns

`object`

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

#### Returns

`Promise`\<`void`\>

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
id: string = bpid;
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

#### Returns

`Promise`\<`void`\>

### isReady()

```ts
isReady: () => Promise<void>;
```

#### Returns

`Promise`\<`void`\>

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
model: ComputedRef<any>;
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
product: ComputedRef<Product>;
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

#### Returns

`Promise`\<`void`\>

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

#### Parameters

##### value

`number`

#### Returns

`Promise`\<`void`\>

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
