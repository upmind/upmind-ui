[Upmind](../../packages.md) / [@upmind/headless-vue](../index.md) / useLookupItem

# useLookupItem()

```ts
function useLookupItem(__namedParameters, __namedParameters): object
```

## Parameters

• **\_\_namedParameters**: `any`

• **\_\_namedParameters**: `any`

## Returns

`object`

### cancel()

```ts
cancel: () => any;
```

#### Returns

`any`

### clear()

```ts
clear: () => any;
```

#### Returns

`any`

### context

```ts
context: ComputedRef<any>;
```

### edit()

```ts
edit: () => any;
```

#### Returns

`any`

### errors

```ts
errors: ComputedRef<any>;
```

### input()

```ts
input: (model) => any;
```

#### Parameters

• **model**: `any`

#### Returns

`any`

### meta

```ts
meta: ComputedRef<object>;
```

#### Type declaration

##### canAdd

```ts
canAdd: boolean = !!state.value?.context;
```

##### canRemove

```ts
canRemove: any = state.value.context.model.can_delete;
```

##### hasErrors

```ts
hasErrors: boolean;
```

##### isComplete

```ts
isComplete: any;
```

##### isDefault

```ts
isDefault: boolean = !!state.value?.context?.model?.default;
```

##### isLoading

```ts
isLoading: boolean;
```

##### isNew

```ts
isNew: boolean = !state.value.context?.model?.id;
```

##### isProcessing

```ts
isProcessing: boolean;
```

##### isValid

```ts
isValid: boolean;
```

##### isVerified

```ts
isVerified: boolean = !!state.value?.context?.model?.verified;
```

### model

```ts
model: ComputedRef<any>;
```

### remove()

```ts
remove: () => any;
```

#### Returns

`any`

### schema

```ts
schema: ComputedRef<any>;
```

### select()

```ts
select: () => any;
```

#### Returns

`any`

### setDefault()

```ts
setDefault: () => any;
```

#### Returns

`any`

### state

```ts
state: ComputedRef<any>;
```

### uischema

```ts
uischema: ComputedRef<any>;
```

### update()

```ts
update: () => any;
```

#### Returns

`any`
