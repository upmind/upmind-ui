[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useProductRecommendations

# useProductRecommendations()

```ts
function useProductRecommendations(pid): object;
```

A composable function that manages the product recommendations
for a specific product. It uses the recommendation engine
to fetch and manage the recommendations.
NB: Only recommendations that originate from the specified product will be available.
This is useful for displaying recommendations on the product detail page, or after adding to the basket

## Parameters

### pid

`string`

The product id to get recommendations for

## Returns

An object containing state, context, errors, recommendations, and methods to manage recommendations.

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
basketItem: ComputedRef<ActorRef<any, any> | undefined>;
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
  | RecommendationsEngineContext
| undefined>;
```

The current context

### errors

```ts
errors: ComputedRef<ResponseError | undefined>;
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
recommendations: ComputedRef<Recommendation[]> = productRecommendations;
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
