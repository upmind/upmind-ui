[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useQueryParams

# useQueryParams()

```ts
function useQueryParams(route?): object;
```

Composable function to manage query parameters from a specified or current route.

The `useQueryParams` function retrieves the query parameters for a given route.
If no route is provided, the function will default to using the current route.
It ensures that the route object has safe defaults for its properties
including `name`, `path`, `query`, and `params`.

## Parameters

### route?

[`Route`](../type-aliases/Route.md)

## Returns

`object`

### basketProductId

```ts
basketProductId: any;
```

### bundle

```ts
bundle: any;
```

### categoryId

```ts
categoryId: any;
```

### consumeParam()

```ts
consumeParam: (type, fallback?) => any;
```

#### Parameters

##### type

`string`

##### fallback?

`any`

#### Returns

`any`

### coupon

```ts
coupon: any;
```

### currency

```ts
currency: any;
```

### express

```ts
express: boolean;
```

### getParam()

```ts
getParam: (type, fallback?) => any;
```

#### Parameters

##### type

`string`

##### fallback?

`any`

#### Returns

`any`

### getParams()

```ts
getParams: (type, fallback?) => any;
```

#### Parameters

##### type

`string`

##### fallback?

`any`

#### Returns

`any`

### parse()

```ts
parse: (value) => any = useSafeParse;
```

#### Parameters

##### value

`any`

#### Returns

`any`

### productConfig

```ts
productConfig: ProductProps | undefined;
```

### productConfigs

```ts
productConfigs: ProductProps[];
```

### productId

```ts
productId: any;
```

### products

```ts
products: any;
```
