[Upmind](../../packages.md) / [@upmind-automation/headless-vue](../index.md) / useBasketProductConfig

# useBasketProductConfig()

```ts
function useBasketProductConfig(id): object;
```

## Parameters

• **id**: `string`

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
decrementQuantity: () => Promise<any>;
```

#### Returns

`Promise`\<`any`\>

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
getProvisioningField: field => any;
```

#### Parameters

• **field**: `any`

#### Returns

`any`

### id

```ts
id: string;
```

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
incrementQuantity: () => Promise<any>;
```

#### Returns

`Promise`\<`any`\>

### isReady()

```ts
isReady: () =>
  Promise<
    State<
      unknown,
      AnyEventObject,
      any,
      object,
      ResolveTypegenMeta<
        TypegenDisabled,
        AnyEventObject,
        BaseActionObject,
        ServiceMap
      >
    >
  >;
```

#### Returns

`Promise`\<`State`\<`unknown`, `AnyEventObject`, `any`, `object`, `ResolveTypegenMeta`\<`TypegenDisabled`, `AnyEventObject`, `BaseActionObject`, `ServiceMap`\>\>\>

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
isSelectedTerm: term => boolean;
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

##### hasMonthlyTerms

```ts
hasMonthlyTerms: boolean;
```

##### hasOptions

```ts
hasOptions: boolean;
```

##### hasProvisioning

```ts
hasProvisioning: boolean;
```

##### hasTaxIncluded

```ts
hasTaxIncluded: boolean;
```

##### hasTerms

```ts
hasTerms: boolean;
```

##### isCalculating

```ts
isCalculating: boolean;
```

##### isComplete

```ts
isComplete: any;
```

##### isConfigurable

```ts
isConfigurable: boolean;
```

##### isDirty

```ts
isDirty: boolean;
```

##### isDone

```ts
isDone: any = state.value.done;
```

##### isInvalid

```ts
isInvalid: boolean;
```

##### isLoading

```ts
isLoading: boolean;
```

##### isNew

```ts
isNew: boolean;
```

##### isProcessing

```ts
isProcessing: boolean;
```

##### isTouched

```ts
isTouched: boolean = touched.value;
```

##### isUnavailable

```ts
isUnavailable: any;
```

### model

```ts
model: ActorRef<any>;
```

### options

```ts
options: ComputedRef<any>;
```

### product

```ts
product: ComputedRef<any>;
```

### productImage()

```ts
productImage: size => null | string;
```

#### Parameters

• **size**: `string` = `"400x400"`

#### Returns

`null` \| `string`

### remove()

```ts
remove: () => Promise<any>;
```

#### Returns

`Promise`\<`any`\>

### reset()

```ts
reset: () => void;
```

#### Returns

`void`

### service

```ts
service: Interpreter<
  unknown,
  any,
  AnyEventObject,
  object,
  ResolveTypegenMeta<
    TypegenDisabled,
    AnyEventObject,
    BaseActionObject,
    ServiceMap
  >
>;
```

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
state: ActorRef<any>;
```

### stop()

```ts
stop: () =>
  Interpreter<
    unknown,
    any,
    AnyEventObject,
    object,
    ResolveTypegenMeta<
      TypegenDisabled,
      AnyEventObject,
      BaseActionObject,
      ServiceMap
    >
  >;
```

#### Returns

`Interpreter`\<`unknown`, `any`, `AnyEventObject`, `object`, `ResolveTypegenMeta`\<`TypegenDisabled`, `AnyEventObject`, `BaseActionObject`, `ServiceMap`\>\>

### summary

```ts
summary: ComputedRef<any>;
```

### terms

```ts
terms: ComputedRef<any>;
```

### update()

```ts
update: () => Promise<ActorRef<any>>;
```

#### Returns

`Promise`\<`ActorRef`\<`any`, `any`\>\>

### updateAttributes()

```ts
updateAttributes: () => void;
```

#### Returns

`void`

### updateOptionQuantity()

```ts
updateOptionQuantity: (option, productId, qty) => void;
```

#### Parameters

• **option**: `any`

• **productId**: `string`

• **qty**: `number`

#### Returns

`void`

### updateOptions()

```ts
updateOptions: () => void;
```

#### Returns

`void`

### updateProvisioning()

```ts
updateProvisioning: () => void;
```

#### Returns

`void`

### updateQuantity()

```ts
updateQuantity: (value?) => Promise<any>;
```

#### Parameters

• **value?**: `number`

#### Returns

`Promise`\<`any`\>

### updateTerm()

```ts
updateTerm: (term) => void;
```

#### Parameters

• **term**: `any`

#### Returns

`void`
