[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useSessionFlows

# useSessionFlows()

```ts
function useSessionFlows(): object;
```

Composable function to manage session-related flow configurations and provides methods for interaction with the routing engine.

This function initialises a set of predefined flows for handling session management within an application.
The flows include guards and targets for common session-related tasks like authentication, login, registration,
session end, session transfer, password recovery, and more. It also provides methods to retrieve and register
these flows with the routing engine.

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
