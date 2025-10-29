[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useClientEmails

# useClientEmails()

```ts
function useClientEmails(initial): object;
```

Composable function for managing client emails.
It handles fetching, displaying, filtering, and performing actions on client emails,
leveraging an underlying service and TanStack Query for data management.

## Parameters

### initial

[`QueryProps`](../type-aliases/QueryProps.md) = `...`

Optional initial query parameters for loading the email list (e.g. pagination settings). Defaults to pagination limit of 0.

## Returns

The [UseClientEmails](../type-aliases/UseClientEmails.md) API for interacting with client emails.

### data

```ts
data: ComputedRef<
  | never[]
| QueryResponse<Email[]> & Email[]>;
```

The reactive data property containing the list of client items.
This is populated by the query and updates automatically when the query state changes.

### default()

```ts
default: (data) => Email | undefined = getDefault;
```

The default item for the current client.
This is the email that is set as default for the current client.

#### Parameters

##### data

`MaybeRef`\<[`Email`](../interfaces/Email.md)[] \| `null` \| `undefined`\> = `...`

#### Returns

[`Email`](../interfaces/Email.md) \| `undefined`

The default email if found, is otherwise undefined.

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
findOne: (mapping, data, searchableProps) => Email | undefined;
```

Find a single email based on the given param. The param is matched against the title and description.

#### Parameters

##### mapping

The filter to match against the email title and description.

`string` | `Partial`\<[`Email`](../interfaces/Email.md)\>

##### data

`MaybeRef`\<[`Email`](../interfaces/Email.md)[] \| `null` \| `undefined`\> = `...`

##### searchableProps

`string`[] = `[]`

#### Returns

[`Email`](../interfaces/Email.md) \| `undefined`

The email object if found, is otherwise undefined.

### getOne()

```ts
getOne: (id?, data) => Email | undefined;
```

Get a single email by id.

#### Parameters

##### id?

The id of the email to get.

`string` | `number`

##### data?

`MaybeRef`\<[`Email`](../interfaces/Email.md)[] \| `null` \| `undefined`\> = `...`

#### Returns

[`Email`](../interfaces/Email.md) \| `undefined`

The email object if found, is otherwise undefined.

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
refresh: (options?) => Promise<QueryObserverResult<QueryResponse<Email[]>, Error>> = query.refetch;
```

Refresh the query to get the latest data.
This will refetch the data from the server and update the query state.

#### Parameters

##### options?

`RefetchOptions`

#### Returns

`Promise`\<`QueryObserverResult`\<[`QueryResponse`](../interfaces/QueryResponse.md)\<[`Email`](../interfaces/Email.md)[]\>, `Error`\>\>

### remove()

```ts
remove: (id) => void;
```

Remove an email by id.

#### Parameters

##### id

`string`

The id of the email to remove.

#### Returns

`void`

A promise that resolves when the email is removed.

### setDefault()

```ts
setDefault: (id) => void;
```

Set an email as default.

#### Parameters

##### id

`string`

The id of the email to set as default.

#### Returns

`void`

A promise that resolves when the email is set as default.
