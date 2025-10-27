[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useRoutingEngine

# useRoutingEngine()

```ts
function useRoutingEngine(): object;
```

Composable function to provide a routing engine to handle route management, navigation, and state control within the application.

This composable enables integration with internationalisation, session, and basket states, and allows for advanced
route resolution and flow management.

## Returns

`object`

### back()

```ts
back: (route, event?) => Promise<any>;
```

#### Parameters

##### route

[`Route`](../type-aliases/Route.md)

##### event?

`any`

#### Returns

`Promise`\<`any`\>

### currentFlow

```ts
currentFlow: ComputedRef<Flow | undefined>;
```

### currentRoute

```ts
currentRoute: ComputedRef<Route | undefined>;
```

### errors

```ts
errors: ComputedRef<ResponseError | undefined>;
```

### exists()

```ts
exists: (name) => boolean;
```

#### Parameters

##### name

[`ROUTE`](../enumerations/ROUTE.md)

#### Returns

`boolean`

### flows

```ts
flows: ComputedRef<Flow[] | undefined>;
```

### guard()

```ts
guard: (route) => Promise<Route | RouteLocationGeneric>;
```

#### Parameters

##### route

`RouteLocationGeneric`

#### Returns

`Promise`\<[`Route`](../type-aliases/Route.md) \| `RouteLocationGeneric`\>

### init()

```ts
init: (instance) => void;
```

#### Parameters

##### instance

`Router`

#### Returns

`void`

### isReady()

```ts
isReady: () => Promise<boolean>;
```

#### Returns

`Promise`\<`boolean`\>

### isResolved()

```ts
isResolved: (route) => Promise<boolean>;
```

#### Parameters

##### route

`string`

#### Returns

`Promise`\<`boolean`\>

### meta

```ts
meta: ComputedRef<{
  hasFlows: boolean;
  isAvailable: boolean;
  isLoading: boolean;
  isProcessing: boolean;
  isUnavailable: boolean;
}>;
```

### navigate()

```ts
navigate: (target, data?) => Promise<void>;
```

#### Parameters

##### target

`string`

##### data?

`any`

#### Returns

`Promise`\<`void`\>

### navigateBack()

```ts
navigateBack: (event?) => Promise<void>;
```

#### Parameters

##### event?

`any`

#### Returns

`Promise`\<`void`\>

### navigateNext()

```ts
navigateNext: (event?) => Promise<void>;
```

#### Parameters

##### event?

`any`

#### Returns

`Promise`\<`void`\>

### next()

```ts
next: (route, event?) => Promise<any>;
```

#### Parameters

##### route

[`Route`](../type-aliases/Route.md)

##### event?

`any`

#### Returns

`Promise`\<`any`\>

### refresh()

```ts
refresh: () => void;
```

#### Returns

`void`

### register()

```ts
register: (flows) => void;
```

#### Parameters

##### flows

[`Flow`](../interfaces/Flow.md)[]

#### Returns

`void`

### resolve()

```ts
resolve: (name, route, event?) => Promise<any>;
```

#### Parameters

##### name

`string`

##### route

[`Route`](../type-aliases/Route.md)

##### event?

`any`

#### Returns

`Promise`\<`any`\>

### router

```ts
router: Router;
```

### stop()

```ts
stop: () => void;
```

#### Returns

`void`
