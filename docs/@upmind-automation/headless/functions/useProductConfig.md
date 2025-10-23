[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useProductConfig

# useProductConfig()

```ts
function useProductConfig(service): object;
```

A composable function that provides functionality and state management for product configuration.
It integrates various aspects of product customisation, such as quantity, terms, attributes, and options,
while managing the underlying state using an actor-based state management system.

## Parameters

### service

`ActorRef`\<`any`\>

The actor reference representing the product configuration state machine.

## Returns

`object`

The [UseProductConfig](../type-aliases/UseProductConfig.md) composable methods and state for product configuration.

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

### decrementQuantity

```ts
decrementQuantity: DebouncedFunc<(value?) => Promise<void>>;
```

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
id: ComputedRef<string>;
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

### incrementQuantity

```ts
incrementQuantity: DebouncedFunc<(value?) => Promise<void>>;
```

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

### terms

```ts
terms: ComputedRef<TermDetails[]>;
```

### title

```ts
title: ComputedRef<string>;
```

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

### updateQuantity

```ts
updateQuantity: DebouncedFunc<(value?) => Promise<void>>;
```

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
