[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useRecommendations

# useRecommendations()

```ts
function useRecommendations(): object;
```

## Returns

### add()

```ts
add: (id) => Promise<void>;
```

Adds a product to the recommendations engine.

#### Parameters

##### id

`string`

The id of the product to add.

#### Returns

`Promise`\<`void`\>

### basketItem

```ts
basketItem: ComputedRef<undefined | ActorRef<any, any>>;
```

The current basket item context.

### cancel()

```ts
cancel: () => void;
```

Cancels the current recommendations process.

#### Returns

`void`

### context

```ts
context: ComputedRef<
  | undefined
| RecommendationsEngineContext>;
```

The current context

### errors

```ts
errors: ComputedRef<undefined | ResponseError>;
```

Any error returned by the engine.

### fetchRecommendation()

```ts
fetchRecommendation: (value) => void;
```

Fetches a recommendation by value.

#### Parameters

##### value

`string`

#### Returns

`void`

### isReady()

```ts
isReady: () => Promise<boolean>;
```

Waits for the recommendations engine to be ready (available, unavailable, or error state).

#### Returns

`Promise`\<`boolean`\>

Resolves true if ready, false if error.

### meta

```ts
meta: ComputedRef<{
  hasErrors: boolean;
  hasRecommendations: boolean;
  hasUnseenRecommendations: boolean;
  isConfiguring: boolean;
  isLoading: boolean;
  isProcessing: boolean;
  isRefreshing: boolean;
}>;
```

Meta information about the recommendations engine state.

### recommendations

```ts
recommendations: ComputedRef<undefined | Recommendation[]>;
```

The recommendations list.

### remove()

```ts
remove: (value) => void;
```

Removes a recommendation by value.

#### Parameters

##### value

`string`

#### Returns

`void`

### reset()

```ts
reset: () => void;
```

Resets the recommendations engine.

#### Returns

`void`

### seen()

```ts
seen: (values?) => void;
```

Marks recommendations as seen.

#### Parameters

##### values?

`string`[]

#### Returns

`void`

### state

```ts
state: Ref<State<RecommendationsEngineContext, AnyEventObject, any, {
  context: RecommendationsEngineContext;
  value: any;
}, ResolveTypegenMeta<TypegenDisabled, AnyEventObject, BaseActionObject, ServiceMap>>, State<RecommendationsEngineContext, AnyEventObject, any, {
  context: RecommendationsEngineContext;
  value: any;
}, ResolveTypegenMeta<TypegenDisabled, AnyEventObject, BaseActionObject, ServiceMap>>>;
```

### stop()

```ts
stop: () => void;
```

Stops the recommendations engine

#### Returns

`void`
