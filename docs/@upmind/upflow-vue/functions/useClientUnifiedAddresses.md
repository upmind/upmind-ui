[Upmind](../../packages.md) / [@upmind/upflow-vue](../index.md) / useClientUnifiedAddresses

# useClientUnifiedAddresses()

```ts
function useClientUnifiedAddresses(): object
```

## Returns

`object`

### add()

```ts
add: () => State<object, AnyEventObject, any, object, MarkAllImplementationsAsProvided<ResolveTypegenMeta<Typegen0, AnyEventObject, BaseActionObject, ServiceMap>>>;
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

### context

```ts
context: ComputedRef<object>;
```

#### Type declaration

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

### edit()

```ts
edit: (id) => State<object, AnyEventObject, any, object, MarkAllImplementationsAsProvided<ResolveTypegenMeta<Typegen0, AnyEventObject, BaseActionObject, ServiceMap>>>;
```

#### Parameters

• **id**: `any`

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
errors: ComputedRef<undefined>;
```

### filter

```ts
filter: DebouncedFunc<(data) => State<object, AnyEventObject, any, object, MarkAllImplementationsAsProvided<ResolveTypegenMeta<Typegen0, AnyEventObject, BaseActionObject, ServiceMap>>>>;
```

### getSelected()

```ts
getSelected: () => Promise<any>;
```

#### Returns

`Promise`\<`any`\>

### initial

```ts
initial: ComputedRef<any>;
```

### isReady()

```ts
isReady: () => Promise<State<object, AnyEventObject, any, object, MarkAllImplementationsAsProvided<ResolveTypegenMeta<Typegen0, AnyEventObject, BaseActionObject, ServiceMap>>>>;
```

#### Returns

`Promise`\<`State`\<`object`, `AnyEventObject`, `any`, `object`, `MarkAllImplementationsAsProvided`\<`ResolveTypegenMeta`\<`Typegen0`, `AnyEventObject`, `BaseActionObject`, `ServiceMap`\>\>\>\>

### items

```ts
items: ComputedRef<object[]>;
```

### meta

```ts
meta: ComputedRef<object>;
```

#### Type declaration

##### canFilter

```ts
canFilter: boolean;
```

##### hasErrors

```ts
hasErrors: boolean;
```

##### isAdding

```ts
isAdding: boolean;
```

##### isAvailable

```ts
isAvailable: boolean;
```

##### isEditing

```ts
isEditing: boolean;
```

##### isEmpty

```ts
isEmpty: boolean;
```

##### isLoading

```ts
isLoading: boolean;
```

##### isProcessing

```ts
isProcessing: boolean;
```

### select()

```ts
select: (id) => Promise<void>;
```

#### Parameters

• **id**: `any`

#### Returns

`Promise`\<`void`\>

### selected

```ts
selected: ComputedRef<null | object>;
```

### state

```ts
state: ComputedRef<StateValue>;
```
