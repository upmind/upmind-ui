[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / Flow

# Flow

Interface representing a navigational flow within the application, defining a sequence
of routes, guards, and resolution logic for complex user journeys.

## Properties

### guard()?

```ts
optional guard: (route, data?) => Promise<boolean>;
```

An asynchronous guard function that determines if the flow can be initiated or continued.

#### Parameters

##### route

[`Route`](../type-aliases/Route.md)

The current route object.

##### data?

`any`

Optional additional data passed to the guard.

#### Returns

`Promise`\<`boolean`\>

A promise resolving to `true` to allow the flow, `false` to prevent it.

***

### meta?

```ts
optional meta: Record<string, any> & object;
```

Meta fields associated with the flow, including special flags like `replace`.

#### Type Declaration

##### replace?

```ts
optional replace: boolean;
```

If `true`, indicates that the current route in the browser history should be replaced
instead of pushing a new entry when navigating within this flow.

***

### name

```ts
name: string;
```

The name of the flow, which can be a predefined `ROUTE` enum member or a custom string.

***

### resolve()?

```ts
optional resolve: (route, data?) => Promise<Route>;
```

An asynchronous resolve function that can modify the current route object within the flow.

#### Parameters

##### route

[`Route`](../type-aliases/Route.md)

The current route object.

##### data?

`any`

Optional additional data passed to the resolver.

#### Returns

`Promise`\<[`Route`](../type-aliases/Route.md)\>

A promise resolving to the (potentially modified) route object.

***

### targets?

```ts
optional targets: object;
```

Defines the potential next, back, and fallback targets within this flow.

#### back?

```ts
optional back: Target[];
```

An array of possible previous targets the flow can transition back to.

#### fallback?

```ts
optional fallback: Target[];
```

An array of fallback targets to use if `next` or `back` transitions fail.

#### next?

```ts
optional next: Target[];
```

An array of possible next targets the flow can transition to.
