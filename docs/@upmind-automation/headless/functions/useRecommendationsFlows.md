[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useRecommendationsFlows

# useRecommendationsFlows()

```ts
function useRecommendationsFlows(): object;
```

Composable function to provide functionality to manage and register recommendation flows for a routing engine.

The `useRecommendationsFlows` function creates a configuration for recommendation-based routing flows
that includes route guards to validate conditions and defines possible navigation targets.
It also allows for the retrieval and dynamic registration of additional flows.

## Returns

`object`

### getFlows()

```ts
getFlows: () => Flow[];
```

#### Returns

[`Flow`](../interfaces/Flow.md)[]

### register()

```ts
register: (data?) => void;
```

#### Parameters

##### data?

[`Flow`](../interfaces/Flow.md)[]

#### Returns

`void`
