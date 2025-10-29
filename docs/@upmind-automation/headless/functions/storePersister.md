[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / storePersister

# storePersister()

```ts
function storePersister<TState, TUpdater>(store, options?): object;
```

Creates a persister for the given store that synchronises its state with localStorage
This persister will handle the serialisation and deserialization of the store state
and will also update the store state with the data from localStorage when it is retrieved.
This is useful for persisting the store state across browser sessions.

## Type Parameters

### TState

`TState`

The type of the store's state.

### TUpdater

`TUpdater` *extends* `AnyUpdater`

The type of the store's updater function.

## Parameters

### store

`Store`\<`TState`, `TUpdater`\>

The store to persist the data to

### options?

Optional options to configure the persister

#### append?

`string` \| `boolean`

If true, the data will be appended to the store state instead of replacing it
                      If a string is provided, the data will be appended to the store state under that key

## Returns

`object`

A persister function that can be used with the query client

### persisterFn()

```ts
persisterFn: <T, TQueryKey>(queryFn, ctx, query) => Promise<T>;
```

#### Type Parameters

##### T

`T`

##### TQueryKey

`TQueryKey` *extends* readonly `unknown`[]

#### Parameters

##### queryFn

(`context`) => `T` \| `Promise`\<`T`\>

##### ctx

###### client

`QueryClient`

###### direction?

`unknown`

**Deprecated**

if you want access to the direction, you can add it to the pageParam

###### meta

`Record`\<`string`, `unknown`\> \| `undefined`

###### pageParam?

`unknown`

###### queryKey

`TQueryKey`

###### signal

`AbortSignal`

##### query

`Query`

#### Returns

`Promise`\<`T`\>

### persisterGc()

```ts
persisterGc: () => Promise<void>;
```

#### Returns

`Promise`\<`void`\>

### persistQuery()

```ts
persistQuery: (query) => Promise<void>;
```

#### Parameters

##### query

`Query`

#### Returns

`Promise`\<`void`\>

### persistQueryByKey()

```ts
persistQueryByKey: (queryKey, queryClient) => Promise<void>;
```

#### Parameters

##### queryKey

readonly `unknown`[]

##### queryClient

`QueryClient`

#### Returns

`Promise`\<`void`\>

### restoreQueries()

```ts
restoreQueries: (queryClient, filters?) => Promise<void>;
```

#### Parameters

##### queryClient

`QueryClient`

##### filters?

`Pick`\<`QueryFilters`\<readonly `unknown`[]\>, `"queryKey"` \| `"exact"`\>

#### Returns

`Promise`\<`void`\>

### retrieveQuery()

```ts
retrieveQuery: <T>(queryHash, afterRestoreMacroTask?) => Promise<T | undefined>;
```

#### Type Parameters

##### T

`T`

#### Parameters

##### queryHash

`string`

##### afterRestoreMacroTask?

(`persistedQuery`) => `void`

#### Returns

`Promise`\<`T` \| `undefined`\>
