[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / PageRoute

# PageRoute

Interface representing details about a page route, typically including both the target route
and the route from which the navigation originated.

## Properties

### from?

```ts
optional from: object;
```

Details about the route from which navigation originated.

#### fullPath

```ts
fullPath: string;
```

The full path of the originating route.

#### name?

```ts
optional name: string | symbol;
```

The name of the originating route, if available.

#### params?

```ts
optional params: Record<string, string | string[]>;
```

Parameters associated with the originating route.

***

### to?

```ts
optional to: object;
```

Details about the target route.

#### fullPath

```ts
fullPath: string;
```

The full path of the target route.

#### name?

```ts
optional name: string | symbol;
```

The name of the target route, if available.

#### params?

```ts
optional params: Record<string, string | string[]>;
```

Parameters associated with the target route.
