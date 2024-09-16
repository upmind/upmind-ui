[Upmind](../../packages.md) / [@upmind/headless-vue](../index.md) / useProductConfig

# useProductConfig()

```ts
function useProductConfig(actor): object
```

## Parameters

• **actor**: `any`

## Returns

`object`

### attributes

```ts
attributes: ComputedRef<any>;
```

### decrementOption()

```ts
decrementOption: (option, value) => void;
```

#### Parameters

• **option**: `any`

• **value**: `any`

#### Returns

`void`

### decrementQuantity()

```ts
decrementQuantity: () => void;
```

#### Returns

`void`

### errors

```ts
errors: ComputedRef<any>;
```

### fields

```ts
fields: ComputedRef<any>;
```

### getProvisioningField()

```ts
getProvisioningField: (field) => any;
```

#### Parameters

• **field**: `any`

#### Returns

`any`

### incrementOption()

```ts
incrementOption: (option, value) => void;
```

#### Parameters

• **option**: `any`

• **value**: `any`

#### Returns

`void`

### incrementQuantity()

```ts
incrementQuantity: () => void;
```

#### Returns

`void`

### isSelectedAttribute()

```ts
isSelectedAttribute: (attributeId, value) => boolean;
```

#### Parameters

• **attributeId**: `any`

• **value**: `any`

#### Returns

`boolean`

### isSelectedOption()

```ts
isSelectedOption: (optionId, value) => boolean;
```

#### Parameters

• **optionId**: `any`

• **value**: `any`

#### Returns

`boolean`

### isSelectedTerm()

```ts
isSelectedTerm: (term) => boolean;
```

#### Parameters

• **term**: `any`

#### Returns

`boolean`

### lookups

```ts
lookups: ComputedRef<any>;
```

### meta

```ts
meta: ComputedRef<object>;
```

#### Type declaration

##### hasAttributes

```ts
hasAttributes: boolean;
```

##### hasErrors

```ts
hasErrors: boolean;
```

##### hasOptions

```ts
hasOptions: boolean;
```

##### hasProvisioning

```ts
hasProvisioning: boolean;
```

##### hasTerms

```ts
hasTerms: boolean;
```

##### isCalculating

```ts
isCalculating: boolean;
```

##### isConfigurable

```ts
isConfigurable: boolean;
```

##### isConfigured

```ts
isConfigured: boolean;
```

##### isDirty

```ts
isDirty: boolean;
```

##### isLoading

```ts
isLoading: boolean;
```

##### isNew

```ts
isNew: boolean = !contextMatches(state, ["basket_product"]);
```

##### isProcessing

```ts
isProcessing: boolean;
```

### model

```ts
model: Ref<any, any>;
```

### options

```ts
options: ComputedRef<any>;
```

### product

```ts
product: ComputedRef<any>;
```

### reset()

```ts
reset: () => any;
```

#### Returns

`any`

### setAttributes()

```ts
setAttributes: (attribute, values) => void;
```

#### Parameters

• **attribute**: `any`

• **values**: `any`

#### Returns

`void`

### setOptions()

```ts
setOptions: (option, values) => void;
```

#### Parameters

• **option**: `any`

• **values**: `any`

#### Returns

`void`

### setProvisioningFields()

```ts
setProvisioningFields: (value) => void;
```

#### Parameters

• **value**: `any`

#### Returns

`void`

### state

```ts
state: any;
```

### summary

```ts
summary: ComputedRef<any>;
```

### terms

```ts
terms: ComputedRef<any>;
```

### updateAttributes()

```ts
updateAttributes: () => any;
```

#### Returns

`any`

### updateOptionQuantity()

```ts
updateOptionQuantity: (option, value, qty) => void;
```

#### Parameters

• **option**: `any`

• **value**: `any`

• **qty**: `any`

#### Returns

`void`

### updateOptions()

```ts
updateOptions: () => any;
```

#### Returns

`any`

### updateProvisioning()

```ts
updateProvisioning: () => void;
```

#### Returns

`void`

### updateQuantity()

```ts
updateQuantity: (value?) => void;
```

#### Parameters

• **value?**: `number`

#### Returns

`void`

### updateTerm()

```ts
updateTerm: (term) => any;
```

#### Parameters

• **term**: `any`

#### Returns

`any`
