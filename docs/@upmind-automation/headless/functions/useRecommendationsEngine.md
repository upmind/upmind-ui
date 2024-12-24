[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useRecommendationsEngine

# useRecommendationsEngine()

```ts
function useRecommendationsEngine(): object
```

## Returns

`object`

### add()

```ts
add: (id) => Promise<void>;
```

Add a product to the basket.

#### Parameters

• **id**: `string`

#### Returns

`Promise`\<`void`\>

### cancel()

```ts
cancel: () => void;
```

#### Returns

`void`

### destroy()

```ts
destroy: () => Interpreter<RecommendationsEngineContext, any, AnyEventObject, object, ResolveTypegenMeta<TypegenDisabled, AnyEventObject, BaseActionObject, ServiceMap>>;
```

#### Returns

`Interpreter`\<[`RecommendationsEngineContext`](../interfaces/RecommendationsEngineContext.md), `any`, `AnyEventObject`, `object`, `ResolveTypegenMeta`\<`TypegenDisabled`, `AnyEventObject`, `BaseActionObject`, `ServiceMap`\>\>

### getSnapshot()

```ts
getSnapshot: () => State<RecommendationsEngineContext, AnyEventObject, any, object, ResolveTypegenMeta<TypegenDisabled, AnyEventObject, BaseActionObject, ServiceMap>>;
```

#### Returns

`State`\<[`RecommendationsEngineContext`](../interfaces/RecommendationsEngineContext.md), `AnyEventObject`, `any`, `object`, `ResolveTypegenMeta`\<`TypegenDisabled`, `AnyEventObject`, `BaseActionObject`, `ServiceMap`\>\>

### isReady()

```ts
isReady: () => Promise<State<RecommendationsEngineContext, AnyEventObject, any, object, ResolveTypegenMeta<TypegenDisabled, AnyEventObject, BaseActionObject, ServiceMap>>>;
```

#### Returns

`Promise`\<`State`\<[`RecommendationsEngineContext`](../interfaces/RecommendationsEngineContext.md), `AnyEventObject`, `any`, `object`, `ResolveTypegenMeta`\<`TypegenDisabled`, `AnyEventObject`, `BaseActionObject`, `ServiceMap`\>\>\>

### remove()

```ts
remove: (value) => void;
```

#### Parameters

• **value**: `string`

#### Returns

`void`

### reset()

```ts
reset: () => void;
```

#### Returns

`void`

### seen()

```ts
seen: (values?) => void;
```

#### Parameters

• **values?**: `string`[]

#### Returns

`void`

### service

```ts
service: Interpreter<RecommendationsEngineContext, any, AnyEventObject, object, ResolveTypegenMeta<TypegenDisabled, AnyEventObject, BaseActionObject, ServiceMap>>;
```

### syncBasket()

```ts
syncBasket: () => void;
```

#### Returns

`void`
