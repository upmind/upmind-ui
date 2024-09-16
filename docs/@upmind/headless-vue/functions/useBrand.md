[Upmind](../../packages.md) / [@upmind/headless-vue](../index.md) / useBrand

# useBrand()

```ts
function useBrand(): object
```

## Returns

`object`

### context

```ts
context: ComputedRef<BrandContext>;
```

### errors

```ts
errors: ComputedRef<any>;
```

### getAnayltics()

```ts
getAnayltics: () => Promise<any>;
```

#### Returns

`Promise`\<`any`\>

### getConfig()

```ts
getConfig: (keys) => Promise<Pick<any, BrandConfigKeys>> = brand.getConfig;
```

#### Parameters

• **keys**: [`BrandConfigKeys`](../../headless/enumerations/BrandConfigKeys.md) \| [`BrandConfigKeys`](../../headless/enumerations/BrandConfigKeys.md)[]

#### Returns

`Promise`\<`Pick`\<`any`, [`BrandConfigKeys`](../../headless/enumerations/BrandConfigKeys.md)\>\>

### isReady()

```ts
isReady: () => Promise<State<BrandContext, AnyEventObject, any, object, ResolveTypegenMeta<Typegen0, AnyEventObject, BaseActionObject, ServiceMap>>> = brand.isReady;
```

#### Returns

`Promise`\<`State`\<`BrandContext`, `AnyEventObject`, `any`, `object`, `ResolveTypegenMeta`\<`Typegen0`, `AnyEventObject`, `BaseActionObject`, `ServiceMap`\>\>\>

### meta

```ts
meta: ComputedRef<object>;
```

#### Type declaration

##### hasErrors

```ts
hasErrors: boolean;
```

##### isComplete

```ts
isComplete: boolean;
```

##### isLoading

```ts
isLoading: boolean;
```

##### isReady

```ts
isReady: boolean;
```

### responses

```ts
responses: ComputedRef<object>;
```

#### Type declaration

##### values

```ts
values: object = {};
```

### send()

```ts
send: (event, payload?) => State<BrandContext, AnyEventObject, any, object, ResolveTypegenMeta<Typegen0, AnyEventObject, BaseActionObject, ServiceMap>>;
```

Sends an event to the running interpreter to trigger a transition.

An array of events (batched) can be sent as well, which will send all
batched events to the running interpreter. The listeners will be
notified only **once** when all events are processed.

#### Parameters

• **event**: `Event`\<`AnyEventObject`\> \| `SingleOrArray`\<`Event`\<`AnyEventObject`\>\>

The event(s) to send

• **payload?**: `EventData`

#### Returns

`State`\<`BrandContext`, `AnyEventObject`, `any`, `object`, `ResolveTypegenMeta`\<`Typegen0`, `AnyEventObject`, `BaseActionObject`, `ServiceMap`\>\>

### state

```ts
state: ComputedRef<StateValue>;
```
