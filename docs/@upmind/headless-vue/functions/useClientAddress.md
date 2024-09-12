[Upmind](../../packages.md) / [@upmind/headless-vue](../index.md) / useClientAddress

# useClientAddress()

```ts
function useClientAddress(item, context?): object
```

## Parameters

• **item**: `any`

• **context?**: `any`

## Returns

`object`

### cancel()

```ts
cancel: () => State<object, AnyEventObject, any, object, MarkAllImplementationsAsProvided<ResolveTypegenMeta<Typegen0, AnyEventObject, BaseActionObject, ServiceMap>>>;
```

#### Returns

`State`\<`object`, `AnyEventObject`, `any`, `object`, `MarkAllImplementationsAsProvided`\<`ResolveTypegenMeta`\<`Typegen0`, `AnyEventObject`, `BaseActionObject`, `ServiceMap`\>\>\>

##### error

```ts
error: undefined = undefined;
```

##### filters

```ts
filters: undefined = undefined;
```

##### items

```ts
items: never[] = [];
```

##### raw

```ts
raw: never[] = [];
```

##### selected

```ts
selected: undefined = undefined;
```

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

### description

```ts
description: ComputedRef<any>;
```

### edit()

```ts
edit: () => State<object, AnyEventObject, any, object, MarkAllImplementationsAsProvided<ResolveTypegenMeta<Typegen0, AnyEventObject, BaseActionObject, ServiceMap>>>;
```

#### Returns

`State`\<`object`, `AnyEventObject`, `any`, `object`, `MarkAllImplementationsAsProvided`\<`ResolveTypegenMeta`\<`Typegen0`, `AnyEventObject`, `BaseActionObject`, `ServiceMap`\>\>\>

##### error

```ts
error: undefined = undefined;
```

##### filters

```ts
filters: undefined = undefined;
```

##### items

```ts
items: never[] = [];
```

##### raw

```ts
raw: never[] = [];
```

##### selected

```ts
selected: undefined = undefined;
```

### errors

```ts
errors: ComputedRef<any>;
```

### filters

```ts
filters: ComputedRef<any>;
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

##### canRemove

```ts
canRemove: boolean = !!state.value?.context?.model?.can_delete;
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

##### isDisabled

```ts
isDisabled: any = context.disabled;
```

##### isHidden

```ts
isHidden: any = context.hidden;
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

##### isSelectable

```ts
isSelectable: any = context.selectable;
```

##### isSelected

```ts
isSelected: any = context.selected;
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
select: () => State<object, AnyEventObject, any, object, MarkAllImplementationsAsProvided<ResolveTypegenMeta<Typegen0, AnyEventObject, BaseActionObject, ServiceMap>>>;
```

#### Returns

`State`\<`object`, `AnyEventObject`, `any`, `object`, `MarkAllImplementationsAsProvided`\<`ResolveTypegenMeta`\<`Typegen0`, `AnyEventObject`, `BaseActionObject`, `ServiceMap`\>\>\>

##### error

```ts
error: undefined = undefined;
```

##### filters

```ts
filters: undefined = undefined;
```

##### items

```ts
items: never[] = [];
```

##### raw

```ts
raw: never[] = [];
```

##### selected

```ts
selected: undefined = undefined;
```

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

### title

```ts
title: ComputedRef<any>;
```

### uischema

```ts
uischema: ComputedRef<any>;
```

### update()

```ts
update: () => void;
```

#### Returns

`void`
