[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useCheckoutFlows

# useCheckoutFlows()

```ts
function useCheckoutFlows(): object;
```

Composable function to manage the checkout-related flows.
It provides mechanisms to define navigation rules, manage their states, and register them with the routing system.
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
