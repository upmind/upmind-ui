[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useRoutingFlows

# useRoutingFlows()

```ts
function useRoutingFlows(): object;
```

Composable function to provide a centralised setup and registration mechanism for routing flows within the application.

The `useRoutingFlows` function gathers and manages multiple domain-specific flows, including:
- Catalogue flows
- Basket flows
- Product flows
- Recommendations flows
- Session flows
- Checkout flows
- Order flows

Additionally, it offers functionality to register custom routing flows or merge them with existing default flows.

## Returns

`object`

### basket

```ts
basket: object = basketFlows;
```

#### basket.getFlows()

```ts
getFlows: () => Flow[];
```

##### Returns

[`Flow`](../interfaces/Flow.md)[]

#### basket.register()

```ts
register: (data?) => void;
```

##### Parameters

###### data?

[`Flow`](../interfaces/Flow.md)[]

##### Returns

`void`

### catalogue

```ts
catalogue: object = catalogueFlows;
```

#### catalogue.getFlows()

```ts
getFlows: () => Flow[];
```

##### Returns

[`Flow`](../interfaces/Flow.md)[]

#### catalogue.register()

```ts
register: (data?) => void;
```

##### Parameters

###### data?

[`Flow`](../interfaces/Flow.md)[]

##### Returns

`void`

### checkout

```ts
checkout: object = checkoutFlows;
```

#### checkout.getFlows()

```ts
getFlows: () => Flow[];
```

##### Returns

[`Flow`](../interfaces/Flow.md)[]

#### checkout.register()

```ts
register: (data?) => void;
```

##### Parameters

###### data?

[`Flow`](../interfaces/Flow.md)[]

##### Returns

`void`

### order

```ts
order: object = orderFlows;
```

#### order.getFlows()

```ts
getFlows: () => Flow[];
```

##### Returns

[`Flow`](../interfaces/Flow.md)[]

#### order.register()

```ts
register: (data?) => void;
```

##### Parameters

###### data?

[`Flow`](../interfaces/Flow.md)[]

##### Returns

`void`

### product

```ts
product: object = productFlows;
```

#### product.getFlows()

```ts
getFlows: () => Flow[];
```

##### Returns

[`Flow`](../interfaces/Flow.md)[]

#### product.register()

```ts
register: (data?) => void;
```

##### Parameters

###### data?

[`Flow`](../interfaces/Flow.md)[]

##### Returns

`void`

### recommendations

```ts
recommendations: object = recommendationsFlows;
```

#### recommendations.getFlows()

```ts
getFlows: () => Flow[];
```

##### Returns

[`Flow`](../interfaces/Flow.md)[]

#### recommendations.register()

```ts
register: (data?) => void;
```

##### Parameters

###### data?

[`Flow`](../interfaces/Flow.md)[]

##### Returns

`void`

### register()

```ts
register: (customFlows?) => void;
```

#### Parameters

##### customFlows?

[`Flow`](../interfaces/Flow.md)[] | () => [`Flow`](../interfaces/Flow.md)[]

#### Returns

`void`

### session

```ts
session: object = sessionFlows;
```

#### session.getFlows()

```ts
getFlows: () => Flow[];
```

##### Returns

[`Flow`](../interfaces/Flow.md)[]

#### session.register()

```ts
register: (data?) => void;
```

##### Parameters

###### data?

[`Flow`](../interfaces/Flow.md)[]

##### Returns

`void`
