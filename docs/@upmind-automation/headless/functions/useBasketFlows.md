[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useBasketFlows

# useBasketFlows()

```ts
function useBasketFlows(): object;
```

Composable function to manage the basket-related flows.
It provides mechanisms to define navigation rules (aka flows), manage their states, and register them with the routing system.
Each flow specifies its name, guard logic for conditional transitions, and target routes for navigation.

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
