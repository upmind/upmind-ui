[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useRouteQueryParams

# useRouteQueryParams()

```ts
function useRouteQueryParams(route): object;
```

Parses and retrieves query parameters and route parameters from a given route object.
This utility allows for flexible handling of parameters, offering functionality
to consume, retrieve, and parse structured data from query and route parameters.

## Parameters

### route

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
