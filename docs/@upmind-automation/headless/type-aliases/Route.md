[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / Route

# Route

```ts
type Route = object;
```

Type alias for a generic route object, providing common properties found in router configurations.

## Properties

### meta?

```ts
optional meta: Record<string, any>;
```

Meta fields associated with the route, for custom data.

***

### name?

```ts
optional name: string;
```

The name of the route.

***

### params?

```ts
optional params: Record<string, string | string[]>;
```

Route parameters, e.g., `/users/:id` would have `{ id: 'some-id' }`.

***

### path?

```ts
optional path: string;
```

The path segment of the route.

***

### query?

```ts
optional query: Record<string, any>;
```

Query parameters, e.g., `/search?q=query` would have `{ q: 'query' }`.
