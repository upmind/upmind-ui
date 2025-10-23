[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useOrderFlows

# useOrderFlows()

```ts
function useOrderFlows(): object;
```

Composable function to provide a mechanism to manage and retrieve order-related navigation flows
used within the routing engine of an application. It defines and organises flow rules that enforce
navigation guards and targets based on specific conditions, such as order validation and query parameters.

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
