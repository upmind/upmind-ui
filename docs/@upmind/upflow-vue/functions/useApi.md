[Upmind](../../packages.md) / [@upmind/upflow-vue](../index.md) / useApi

# useApi()

```ts
function useApi(): object
```

## Returns

`object`

### context

```ts
context: ComputedRef<any>;
```

### count

```ts
count: ComputedRef<number>;
```

### errors

```ts
errors: ComputedRef<any>;
```

### get()

```ts
get: (params) => Promise<unknown> = api.get;
```

Syntax sugar for sending a GET request to the server with the given URL and options.

#### Parameters

• **params**: `RequestParams`

The request parameters.

#### Returns

`Promise`\<`unknown`\>

A promise that resolves to the response data if the request was successful, or rejects with an error if the request failed.

### meta

```ts
meta: ComputedRef<object>;
```

#### Type declaration

##### hasErrors

```ts
hasErrors: boolean;
```

##### isActive

```ts
isActive: boolean;
```

##### isIdle

```ts
isIdle: boolean;
```

### post()

```ts
post: (params) => Promise<unknown> = api.post;
```

Syntax sugar for sending a POST request to the server with the given URL and options.

#### Parameters

• **params**: `RequestParams`

The request parameters.

#### Returns

`Promise`\<`unknown`\>

A promise that resolves to the response data if the request was successful, or rejects with an error if the request failed.

### requests

```ts
requests: ComputedRef<any>;
```

### send

```ts
send: any;
```

### state

```ts
state: ComputedRef<any>;
```

### useTime()

```ts
useTime: () => object = api.useTime;
```

#### Returns

`object`

##### ERROR

```ts
ERROR: number = 3000;
```

##### IMMIDIATE

```ts
IMMIDIATE: number = 0;
```

##### MILLISECOND

```ts
MILLISECOND: number = 1;
```

##### POLL

```ts
POLL: number = 500;
```

##### WAIT

```ts
WAIT: number = 10;
```

##### DAY

```ts
get DAY(): number
```

###### Returns

`number`

##### HOUR

```ts
get HOUR(): number
```

###### Returns

`number`

##### MINUTE

```ts
get MINUTE(): number
```

###### Returns

`number`

##### MONTH

```ts
get MONTH(): number
```

###### Returns

`number`

##### SECOND

```ts
get SECOND(): number
```

###### Returns

`number`

##### WEEK

```ts
get WEEK(): number
```

###### Returns

`number`

##### YEAR

```ts
get YEAR(): number
```

###### Returns

`number`

### useUrl()

```ts
useUrl: (path, params, instance?) => URL = api.useUrl;
```

Constructs a URL with the given path and query parameters.

#### Parameters

• **path**: `string`

The path to append to the base URL.

• **params**: `Object` = `{}`

The query parameters to include in the URL.

• **instance?**

• **instance.base?**: `string`

• **instance.context?**: `string`

#### Returns

`URL`

The constructed URL as a string.
