[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useQuery

# useQuery()

```ts
function useQuery(): object;
```

## Returns

### del()

```ts
del: <T>(__namedParameters) => Promise<T> = deleteRequest;
```

**`Function`**

Syntax sugar for sending a DELETE request to the server with the given URL and options.

#### Type Parameters

##### T

`T` = `object`

#### Parameters

##### \_\_namedParameters

[`RequestParams`](../type-aliases/RequestParams.md)

#### Returns

`Promise`\<`T`\>

A promise that resolves to the response data if the request was successful, or rejects with an error if the request failed.

#### See

[RequestParams](../type-aliases/RequestParams.md)

#### Name

deleteRequest

#### Async

#### Example

```ts
deleteRequest({ url: "/orders", withAccessToken: true });
```

#### Throws

Might throw an error if the request fails.

### get()

```ts
get: <TQueryFnData, TData>(__namedParameters) => Promise<TData> = getRequest;
```

Syntax sugar for sending a GET request to the server with the given URL and options.
NOTE: this does not deal with pagination, it is a simple GET request.

#### Type Parameters

##### TQueryFnData

`TQueryFnData` = `unknown`

##### TData

`TData` = `TQueryFnData`

#### Parameters

##### \_\_namedParameters

`Omit`\<[`QueryParams`](../type-aliases/QueryParams.md)\<`TQueryFnData`, `TData`\>, `"pagination"`\>

#### Returns

`Promise`\<`TData`\>

#### See

[QueryParams](../type-aliases/QueryParams.md)

### getList()

```ts
getList: <TQueryFnData, TData>(__namedParameters) => Promise<QueryResponse<TData>> = listRequest;
```

Syntax sugar for sending a GET request with pagination, filters, and sorting to the server with the given URL and options.

#### Type Parameters

##### TQueryFnData

`TQueryFnData` = `unknown`

##### TData

`TData` = `TQueryFnData`

#### Parameters

##### \_\_namedParameters

[`QueryParams`](../type-aliases/QueryParams.md)\<`TQueryFnData`, `TData`\>

#### Returns

`Promise`\<[`QueryResponse`](../interfaces/QueryResponse.md)\<`TData`\>\>

#### See

[QueryParams](../type-aliases/QueryParams.md)

### head()

```ts
head: <T>(__namedParameters) => Promise<QueryResponse<T>> = headRequest;
```

**`Function`**

Syntax sugar for sending a GET request to the server with the given URL and options.

#### Type Parameters

##### T

`T` = `object`

#### Parameters

##### \_\_namedParameters

[`RequestParams`](../type-aliases/RequestParams.md)

#### Returns

`Promise`\<[`QueryResponse`](../interfaces/QueryResponse.md)\<`T`\>\>

A promise that resolves to the response data if the request was successful, or rejects with an error if the request failed.

#### See

[RequestParams](../type-aliases/RequestParams.md)

#### Name

headRequest

#### Async

#### Example

```ts
headRequest({ url: "/orders", withAccessToken: true });
```

#### Throws

Might throw an error if the request fails.

### list()

```ts
list: <TQueryFnData, TData>(__namedParameters) => UseQueryReturnType<QueryResponse<TData>, Error> & object;
```

Syntax sugar for sending a GET request to the server with the given URL and options.
This method is specifically designed for listing resources with pagination, sorting, and filtering capabilities.

#### Type Parameters

##### TQueryFnData

`TQueryFnData` = `unknown`

##### TData

`TData` = `TQueryFnData`

#### Parameters

##### \_\_namedParameters

[`QueryParams`](../type-aliases/QueryParams.md)\<`TQueryFnData`, `TData`\>

#### Returns

`UseQueryReturnType`\<[`QueryResponse`](../interfaces/QueryResponse.md)\<`TData`\>, `Error`\> & `object`

#### See

[QueryParams](../type-aliases/QueryParams.md)

### listInfinite()

```ts
listInfinite: <TQueryFnData, TData>(__namedParameters) => UseInfiniteQueryReturnType<TData, Error> & object;
```

Syntax sugar for sending a GET request to the server with the given URL and options.
This method is specifically designed for listing resources with infinite scrolling capabilities.

#### Type Parameters

##### TQueryFnData

`TQueryFnData` = `unknown`

##### TData

`TData` = `TQueryFnData`

#### Parameters

##### \_\_namedParameters

[`QueryParams`](../type-aliases/QueryParams.md)\<`TQueryFnData`, `TData`\>

#### Returns

`UseInfiniteQueryReturnType`\<`TData`, `Error`\> & `object`

#### See

[QueryParams](../type-aliases/QueryParams.md)

### mutate()

```ts
mutate: <TData, TError, TVariables, TContext>(method, __namedParameters) => UseMutationReturnType<QueryResponse<TData>, TError, TVariables, TContext, MutationResult<QueryResponse<TData>, TError, TVariables, TContext>>;
```

Syntax sugar for sending a POST request to the server with the given URL and options.

#### Type Parameters

##### TData

`TData` = `unknown`

##### TError

`TError` = `Error`

##### TVariables

`TVariables` = `void`

##### TContext

`TContext` = `unknown`

#### Parameters

##### method

`Omit`\<`Methods`, `"GET"` \| `"HEAD"`\>

The HTTP method to use for the request (e.g., POST, PUT, PATCH, DELETE).

##### \_\_namedParameters

[`MutationParams`](../type-aliases/MutationParams.md)\<[`QueryResponse`](../interfaces/QueryResponse.md)\<`TData`\>, `TError`, `TVariables`, `TContext`\>

#### Returns

`UseMutationReturnType`\<[`QueryResponse`](../interfaces/QueryResponse.md)\<`TData`\>, `TError`, `TVariables`, `TContext`, `MutationResult`\<[`QueryResponse`](../interfaces/QueryResponse.md)\<`TData`\>, `TError`, `TVariables`, `TContext`\>\>

#### See

[MutationParams](../type-aliases/MutationParams.md)

### patch()

```ts
patch: <T>(__namedParameters) => Promise<T> = patchRequest;
```

**`Function`**

Syntax sugar for sending a PATCH request to the server with the given URL and options.

#### Type Parameters

##### T

`T` = `object`

#### Parameters

##### \_\_namedParameters

[`RequestParams`](../type-aliases/RequestParams.md)

#### Returns

`Promise`\<`T`\>

A promise that resolves to the response data if the request was successful, or rejects with an error if the request failed.

#### See

[RequestParams](../type-aliases/RequestParams.md)

#### Name

patchRequest

#### Async

#### Example

```ts
patchRequest({ url: "/orders", withAccessToken: true });
```

#### Throws

Might throw an error if the request fails.

### post()

```ts
post: <T>(__namedParameters) => Promise<T> = postRequest;
```

**`Function`**

Syntax sugar for sending a POST request to the server with the given URL and options.

#### Type Parameters

##### T

`T` = `object`

#### Parameters

##### \_\_namedParameters

[`RequestParams`](../type-aliases/RequestParams.md)

#### Returns

`Promise`\<`T`\>

A promise that resolves to the response data if the request was successful, or rejects with an error if the request failed.

#### See

[RequestParams](../type-aliases/RequestParams.md)

#### Name

postRequest

#### Async

#### Example

```ts
postRequest({ url: "/orders", withAccessToken: true });
```

#### Throws

Might throw an error if the request fails.

### put()

```ts
put: <T>(__namedParameters) => Promise<T> = putRequest;
```

**`Function`**

Syntax sugar for sending a PUT request to the server with the given URL and options.

#### Type Parameters

##### T

`T` = `object`

#### Parameters

##### \_\_namedParameters

[`RequestParams`](../type-aliases/RequestParams.md)

#### Returns

`Promise`\<`T`\>

A promise that resolves to the response data if the request was successful, or rejects with an error if the request failed.

#### See

[RequestParams](../type-aliases/RequestParams.md)

#### Name

putRequest

#### Async

#### Example

```ts
putRequest({ url: "/orders", withAccessToken: true });
```

#### Throws

Might throw an error if the request fails.

### query()

```ts
query: <TQueryFnData, TData>(__namedParameters) => undefined | UseQueryDefinedReturnType<TData, Error>;
```

Syntax sugar for sending a GET request to the server with the given URL and options.
NOTE: this does not deal with pagination, it is a simple GET request.

#### Type Parameters

##### TQueryFnData

`TQueryFnData` = `unknown`

##### TData

`TData` = `TQueryFnData`

#### Parameters

##### \_\_namedParameters

`Omit`\<[`QueryParams`](../type-aliases/QueryParams.md)\<`TQueryFnData`, `TData`\>, `"pagination"`\>

#### Returns

`undefined` \| `UseQueryDefinedReturnType`\<`TData`, `Error`\>

#### See

[QueryParams](../type-aliases/QueryParams.md)

### queryClient

```ts
queryClient: QueryClient;
```

### useUrl()

```ts
useUrl: (path, params, instance?) => URL;
```

Constructs a URL with the given path and query parameters.

#### Parameters

##### path

`string`

The path to append to the base URL.

##### params

`object` = `{}`

The query parameters to include in the URL.

##### instance?

#### Returns

`URL`

The constructed URL as a string.
