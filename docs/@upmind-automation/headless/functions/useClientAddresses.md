[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useClientAddresses

# useClientAddresses()

```ts
function useClientAddresses(initial): object;
```

Composable function for managing client addresses.
It handles fetching, displaying, filtering, and performing actions on client addresses,
leveraging an underlying service and TanStack Query for data management.

## Parameters

### initial

[`QueryProps`](../type-aliases/QueryProps.md) = `...`

Optional initial query parameters for loading the address list. Defaults to pagination limit of 0.

## Returns

The [UseClientAddresses](../type-aliases/UseClientAddresses.md) API for interacting with client addresses.

### data

```ts
data: ComputedRef<
  | never[]
| QueryResponse<Address[]> & Address[]>;
```

The reactive data property containing the list of client items.
This is populated by the query and updates automatically when the query state changes.

### default()

```ts
default: (data) => Address | undefined = getDefault;
```

The default item for the current client.
This is the company that is set as default for the current client.

#### Parameters

##### data

`MaybeRef`\<[`Address`](../interfaces/Address.md)[] \| `null` \| `undefined`\> = `...`

#### Returns

[`Address`](../interfaces/Address.md) \| `undefined`

The default address if found, is otherwise undefined.

### error

```ts
error: Ref<Error, Error> | Ref<null, null> = query.error;
```

The current error state of the query.
This will be populated if the query fails to fetch data.

### filters

```ts
filters: object;
```

Filters for the query.
These filters can be used to modify the query parameters before fetching the data.

#### filters.query()

```ts
query: (value?) => void = filterQuery;
```

##### Parameters

###### value?

`string`

##### Returns

`void`

### findOne()

```ts
findOne: (mapping, data, searchableProps) => Address | undefined;
```

Find a single address based on the given param. The param is matched against the title and description.

#### Parameters

##### mapping

The filter to match against the address title and description.

`string` | `Partial`\<[`Address`](../interfaces/Address.md)\>

##### data

`MaybeRef`\<[`Address`](../interfaces/Address.md)[] \| `null` \| `undefined`\> = `...`

##### searchableProps

`string`[] = `[]`

#### Returns

[`Address`](../interfaces/Address.md) \| `undefined`

The address object if found, is otherwise undefined.

### getOne()

```ts
getOne: (id?, data) => Address | undefined;
```

Get a single address by id.

#### Parameters

##### id?

The id of the address to get.

`string` | `number`

##### data?

`MaybeRef`\<[`Address`](../interfaces/Address.md)[] \| `null` \| `undefined`\> = `...`

#### Returns

[`Address`](../interfaces/Address.md) \| `undefined`

The address object if found, is otherwise undefined.

### invalidate()

```ts
invalidate: <T>(data?) => Promise<T | undefined>;
```

Invalidate the query cache for client items.
This will trigger a refetch of the items when the next query is made.

#### Type Parameters

##### T

`T` = `any`

#### Parameters

##### data?

`T`

#### Returns

`Promise`\<`T` \| `undefined`\>

### isReady()

```ts
isReady: () => Promise<boolean>;
```

Resolves when the client items are ready to be used.
Returns true if ready, false if an error occurred.

#### Returns

`Promise`\<`boolean`\>

A promise resolving to true if ready, false if error.

### meta

```ts
meta: ComputedRef<{
  hasError: boolean;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  isAvailable: boolean;
  isEmpty: boolean;
  isLoading: boolean;
}>;
```

Meta-information about the basket state.

### nextPage()

```ts
nextPage: () => void = query.fetchNextPage;
```

Go to the next page of items.
Increments the page number by 1 if pagination is enabled and the current offset is less than the total number of items.
This will only work if the current offset is less than the total number of items.

#### Returns

`void`

### pagination

```ts
pagination: ComputedRef<PaginationInfo> = query.pagination;
```

Indicates if pagination is available
If pagination is not set, it defaults to false.
Otherwise, it returns the pagination object from the query parameters.

#### Returns

The pagination object if available, otherwise false.

### prevPage()

```ts
prevPage: () => void = query.fetchPreviousPage;
```

Go to the previous page of items.
Decrements the page number by 1 if pagination is enabled and the current offset is greater than or equal to the limit.
This will only work if the current offset is greater than or equal to the limit.

#### Returns

`void`

### refresh()

```ts
refresh: (options?) => Promise<QueryObserverResult<QueryResponse<Address[]>, Error>> = query.refetch;
```

Refresh the query to get the latest data.
This will refetch the data from the server and update the query state.

#### Parameters

##### options?

`RefetchOptions`

#### Returns

`Promise`\<`QueryObserverResult`\<[`QueryResponse`](../interfaces/QueryResponse.md)\<[`Address`](../interfaces/Address.md)[]\>, `Error`\>\>

### remove()

```ts
remove: (id) => void;
```

Remove an address by id.

#### Parameters

##### id

`string`

The id of the address to remove.

#### Returns

`void`

A promise that resolves when the address is removed.

### setDefault()

```ts
setDefault: (id) => void;
```

Set an address as default.

#### Parameters

##### id

`string`

The id of the address to set as default.

#### Returns

`void`

A promise that resolves when the address is set as default.
