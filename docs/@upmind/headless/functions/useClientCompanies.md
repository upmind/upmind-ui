[Upmind](../../packages.md) / [@upmind/headless](../index.md) / useClientCompanies

# useClientCompanies()

```ts
function useClientCompanies(): object
```

## Returns

`object`

### getDefault()

```ts
getDefault: () => any;
```

#### Returns

`any`

### getItem()

```ts
getItem: (id) => any;
```

#### Parameters

• **id**: `any`

#### Returns

`any`

### getItems()

```ts
getItems: () => any[];
```

#### Returns

`any`[]

### getItemsSnapshot()

```ts
getItemsSnapshot: () => any;
```

#### Returns

`any`

### getSelected()

```ts
getSelected: () => Promise<any>;
```

#### Returns

`Promise`\<`any`\>

### getSnapshot()

```ts
getSnapshot: () => any;
```

#### Returns

`any`

### isReady()

```ts
isReady: () => Promise<State<object, AnyEventObject, any, object, ResolveTypegenMeta<TypegenDisabled, AnyEventObject, BaseActionObject, ServiceMap>>>;
```

#### Returns

`Promise`\<`State`\<`object`, `AnyEventObject`, `any`, `object`, `ResolveTypegenMeta`\<`TypegenDisabled`, `AnyEventObject`, `BaseActionObject`, `ServiceMap`\>\>\>

### search()

```ts
search: (data) => Promise<any>;
```

#### Parameters

• **data**: `any`

#### Returns

`Promise`\<`any`\>

### service

```ts
service: Interpreter<object, any, AnyEventObject, object, ResolveTypegenMeta<TypegenDisabled, AnyEventObject, BaseActionObject, ServiceMap>>;
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
