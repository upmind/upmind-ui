[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useProductFlows

# useProductFlows()

```ts
function useProductFlows(): object;
```

Composable function to provide functionality to manage and execute product flows used in e-commerce applications.

This function defines and manages a set of flows related to product-related operations
such as adding, editing, and resolving products in the shopping basket. It includes guard
conditions and resolution logic for determining the next actions, along with navigation
targets for each flow. The hooks leveraged within the flows enable interaction with the
routing engine, basket system, and other modules for product and recommendation handling.

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
