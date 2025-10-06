[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / Flow

# Flow

## Properties

### guard()?

```ts
optional guard: (route, data?) => Promise<boolean>;
```

#### Parameters

##### route

[`Route`](../type-aliases/Route.md)

##### data?

`any`

#### Returns

`Promise`\<`boolean`\>

***

### meta?

```ts
optional meta: Record<string, any> & object;
```

#### Type Declaration

##### replace?

```ts
optional replace: boolean;
```

***

### name

```ts
name: string;
```

***

### resolve()?

```ts
optional resolve: (route, data?) => Promise<Route>;
```

#### Parameters

##### route

[`Route`](../type-aliases/Route.md)

##### data?

`any`

#### Returns

`Promise`\<[`Route`](../type-aliases/Route.md)\>

***

### targets?

```ts
optional targets: object;
```

#### back?

```ts
optional back: Target[];
```

#### fallback?

```ts
optional fallback: Target[];
```

#### next?

```ts
optional next: Target[];
```
