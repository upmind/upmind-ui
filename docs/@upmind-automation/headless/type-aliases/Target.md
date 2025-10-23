[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / Target

# Target

```ts
type Target = 
  | ROUTE
  | {
  guard?: (route, data?) => Promise<boolean>;
  meta?: Record<string, any>;
  name: ROUTE | string;
  resolve?: (route, data?) => Promise<Route>;
};
```

Type alias for a navigational target, which can be either a predefined `ROUTE` enum member
or a more complex object defining guard, resolve, and meta properties.

## Type Declaration

[`ROUTE`](../enumerations/ROUTE.md)

```ts
{
  guard?: (route, data?) => Promise<boolean>;
  meta?: Record<string, any>;
  name: ROUTE | string;
  resolve?: (route, data?) => Promise<Route>;
}
```

### guard()?

```ts
optional guard: (route, data?) => Promise<boolean>;
```

An asynchronous guard function that determines if navigation to this target is allowed.

#### Parameters

##### route

[`Route`](Route.md)

The target route object.

##### data?

`any`

Optional additional data passed to the guard.

#### Returns

`Promise`\<`boolean`\>

A promise resolving to `true` to allow navigation, `false` to prevent it.

### meta?

```ts
optional meta: Record<string, any>;
```

Meta fields associated with this target, providing custom data.

### name

```ts
name: ROUTE | string;
```

The name of the target route. Can be a ROUTE enum member or a custom string.

### resolve()?

```ts
optional resolve: (route, data?) => Promise<Route>;
```

An asynchronous resolve function that can modify the target route object before navigation.

#### Parameters

##### route

[`Route`](Route.md)

The target route object.

##### data?

`any`

Optional additional data passed to the resolver.

#### Returns

`Promise`\<[`Route`](Route.md)\>

A promise resolving to the (potentially modified) target route object.
