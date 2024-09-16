[Upmind](../../packages.md) / [@upmind/headless](../index.md) / useApi

# useApi()

```ts
function useApi(): object
```

## Returns

`object`

### del()

```ts
del: (params) => Promise<unknown> = deleteRequest;
```

Syntax sugar for sending a DELETE request to the server with the given URL and options.

#### Parameters

• **params**: `RequestParams`

The request parameters.

#### Returns

`Promise`\<`unknown`\>

A promise that resolves to the response data if the request was successful, or rejects with an error if the request failed.

### generateHash()

```ts
generateHash: (url, init, useCache?, queue?) => string;
```

#### Parameters

• **url**: `URL`

• **init**: `RequestInit`

• **useCache?**: `null` \| `boolean`

• **queue?**: `string`[]

#### Returns

`string`

### get()

```ts
get: (params) => Promise<unknown> = getRequest;
```

Syntax sugar for sending a GET request to the server with the given URL and options.

#### Parameters

• **params**: `RequestParams`

The request parameters.

#### Returns

`Promise`\<`unknown`\>

A promise that resolves to the response data if the request was successful, or rejects with an error if the request failed.

### getSnapshot()

```ts
getSnapshot: () => any;
```

#### Returns

`any`

### head()

```ts
head: (params) => Promise<unknown> = headRequest;
```

Syntax sugar for sending a GET request to the server with the given URL and options.

#### Parameters

• **params**: `RequestParams`

The request parameters.

#### Returns

`Promise`\<`unknown`\>

A promise that resolves to the response data if the request was successful, or rejects with an error if the request failed.

### patch()

```ts
patch: (params) => Promise<unknown> = patchRequest;
```

Syntax sugar for sending a PATCH request to the server with the given URL and options.

#### Parameters

• **params**: `RequestParams`

The request parameters.

#### Returns

`Promise`\<`unknown`\>

A promise that resolves to the response data if the request was successful, or rejects with an error if the request failed.

### post()

```ts
post: (params) => Promise<unknown> = postRequest;
```

Syntax sugar for sending a POST request to the server with the given URL and options.

#### Parameters

• **params**: `RequestParams`

The request parameters.

#### Returns

`Promise`\<`unknown`\>

A promise that resolves to the response data if the request was successful, or rejects with an error if the request failed.

### put()

```ts
put: (params) => Promise<unknown> = putRequest;
```

Syntax sugar for sending a PUT request to the server with the given URL and options.

#### Parameters

• **params**: `RequestParams`

The request parameters.

#### Returns

`Promise`\<`unknown`\>

A promise that resolves to the response data if the request was successful, or rejects with an error if the request failed.

### service

```ts
service: Interpreter<object, any, AnyEventObject, object, ResolveTypegenMeta<Typegen0, AnyEventObject, BaseActionObject, ServiceMap>>;
```

#### Type declaration

##### requests

```ts
requests: object = {};
```

### useTime()

```ts
useTime: () => object;
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
useUrl: (path, params, instance?) => URL;
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
