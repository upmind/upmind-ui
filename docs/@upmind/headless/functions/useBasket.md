[Upmind](../../packages.md) / [@upmind/headless](../index.md) / useBasket

# useBasket()

```ts
function useBasket(): object
```

## Returns

`object`

### addItem()

```ts
addItem: (__namedParameters) => Promise<any>;
```

#### Parameters

• **\_\_namedParameters**: `IProductModel`

#### Returns

`Promise`\<`any`\>

### checkout()

```ts
checkout: () => State<BasketContext, AnyEventObject, any, object, ResolveTypegenMeta<TypegenDisabled, AnyEventObject, BaseActionObject, ServiceMap>>;
```

#### Returns

`State`\<`BasketContext`, `AnyEventObject`, `any`, `object`, `ResolveTypegenMeta`\<`TypegenDisabled`, `AnyEventObject`, `BaseActionObject`, `ServiceMap`\>\>

### clear()

```ts
clear: () => State<BasketContext, AnyEventObject, any, object, ResolveTypegenMeta<TypegenDisabled, AnyEventObject, BaseActionObject, ServiceMap>>;
```

#### Returns

`State`\<`BasketContext`, `AnyEventObject`, `any`, `object`, `ResolveTypegenMeta`\<`TypegenDisabled`, `AnyEventObject`, `BaseActionObject`, `ServiceMap`\>\>

### findItem()

```ts
findItem: (mapping) => any;
```

#### Parameters

• **mapping**: `any`

#### Returns

`any`

### getBasketId()

```ts
getBasketId: () => undefined | string;
```

#### Returns

`undefined` \| `string`

### getItemsSnapshot()

```ts
getItemsSnapshot: () => any[];
```

#### Returns

`any`[]

### getSnapshot()

```ts
getSnapshot: () => State<BasketContext, AnyEventObject, any, object, ResolveTypegenMeta<TypegenDisabled, AnyEventObject, BaseActionObject, ServiceMap>>;
```

#### Returns

`State`\<`BasketContext`, `AnyEventObject`, `any`, `object`, `ResolveTypegenMeta`\<`TypegenDisabled`, `AnyEventObject`, `BaseActionObject`, `ServiceMap`\>\>

### isReady()

```ts
isReady: () => Promise<State<BasketContext, AnyEventObject, any, object, ResolveTypegenMeta<TypegenDisabled, AnyEventObject, BaseActionObject, ServiceMap>>>;
```

#### Returns

`Promise`\<`State`\<`BasketContext`, `AnyEventObject`, `any`, `object`, `ResolveTypegenMeta`\<`TypegenDisabled`, `AnyEventObject`, `BaseActionObject`, `ServiceMap`\>\>\>

### itemExists()

```ts
itemExists: (mapping) => boolean;
```

#### Parameters

• **mapping**: `any`

#### Returns

`boolean`

### refresh()

```ts
refresh: (data?) => Promise<State<BasketContext, AnyEventObject, any, object, ResolveTypegenMeta<TypegenDisabled, AnyEventObject, BaseActionObject, ServiceMap>>>;
```

#### Parameters

• **data?**: `any`

#### Returns

`Promise`\<`State`\<`BasketContext`, `AnyEventObject`, `any`, `object`, `ResolveTypegenMeta`\<`TypegenDisabled`, `AnyEventObject`, `BaseActionObject`, `ServiceMap`\>\>\>

### removeItem()

```ts
removeItem: (itemId) => Promise<any>;
```

#### Parameters

• **itemId**: `any`

#### Returns

`Promise`\<`any`\>

### service

```ts
service: Interpreter<BasketContext, any, AnyEventObject, object, ResolveTypegenMeta<TypegenDisabled, AnyEventObject, BaseActionObject, ServiceMap>>;
```

### updateItem()

```ts
updateItem: (itemId) => Promise<any>;
```

#### Parameters

• **itemId**: `any`

#### Returns

`Promise`\<`any`\>
