[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useProductCatalogue

# useProductCatalogue()

```ts
function useProductCatalogue(initial?): object;
```

A composable function that manages the product catalogue.
It provides methods to filter, sort, and retrieve products from the catalogue.

## Parameters

### initial?

[`QueryProps`](../type-aliases/QueryProps.md) & `object`

Initial query parameters for the product catalogue.

## Returns

The [UseProductCatalogue](../type-aliases/UseProductCatalogue.md) composable methods and state for the product catalogue.

### data

```ts
data: ComputedRef<
  | QueryResponse<Product[]> & Product[]
| null>;
```

The reactive data property containing the list of client items.
This is populated by the query and updates automatically when the query state changes.

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

#### filters.coupons()

```ts
coupons: (value?) => void = filterCoupons;
```

##### Parameters

###### value?

`string`[]

##### Returns

`void`

#### filters.currency()

```ts
currency: (value?) => void = filterCurrency;
```

##### Parameters

###### value?

`ISO_4217_CURRENCY_CODE`

##### Returns

`void`

#### filters.ids()

```ts
ids: (value?) => void = filterIds;
```

##### Parameters

###### value?

`string`[]

##### Returns

`void`

#### filters.productCategory()

```ts
productCategory: (value?) => void = filterCategory;
```

##### Parameters

###### value?

`string`

##### Returns

`void`

#### filters.query

```ts
query: DebouncedFunc<(value?) => void> = filterQuery;
```

### findOne()

```ts
findOne: (mapping) => undefined;
```

Find a single address based on the given param. The param is matched against the title and description.

#### Parameters

##### mapping

The filter to match against the address title and description.

`string` | `Partial`\<[`Product`](../type-aliases/Product.md)\>

#### Returns

`undefined`

The address object if found, is otherwise undefined.

### getOne()

```ts
getOne: (id) => undefined;
```

Get a single address by id.

#### Parameters

##### id

The id of the address to get.

`string` | `undefined`

#### Returns

`undefined`

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
meta: ComputedRef<
  | {
  hasError: boolean;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  isAvailable: boolean;
  isEmpty: boolean;
  isLoading: boolean;
}
  | {
  hasError: boolean;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  isAvailable: boolean;
  isEmpty: boolean;
  isLoading: boolean;
}>;
```

Meta-information about the basket state.

### nextPage

```ts
nextPage: 
  | (options?) => Promise<InfiniteQueryObserverResult<InfiniteData<Product[], unknown>, Error>>
  | () => void = query.fetchNextPage;
```

Go to the next page of items.
Increments the page number by 1 if pagination is enabled and the current offset is less than the total number of items.
This will only work if the current offset is less than the total number of items.

#### Param

The new pagination parameters to set.

#### Returns

### pagination

```ts
pagination: ComputedRef<PaginationInfo> = query.pagination;
```

Indicates if pagination is available
If pagination is not set, it defaults to false.
Otherwise, it returns the pagination object from the query parameters.

#### Returns

The pagination object if available, otherwise false.

### prevPage

```ts
prevPage: 
  | (options?) => Promise<InfiniteQueryObserverResult<InfiniteData<Product[], unknown>, Error>>
  | () => void = query.fetchPreviousPage;
```

Go to the previous page of items.
Decrements the page number by 1 if pagination is enabled and the current offset is greater than or equal to the limit.
This will only work if the current offset is greater than or equal to the limit.

#### Param

The new pagination parameters to set.

#### Returns

### refresh

```ts
refresh: 
  | (options?) => Promise<QueryObserverResult<InfiniteData<Product[], unknown>, Error>>
  | (options?) => Promise<QueryObserverResult<QueryResponse<Product[]>, Error>> = query.refetch;
```

Refresh the query to get the latest data.
This will refetch the data from the server and update the query state.

#### Returns

### sort()

```ts
sort: (property?, direction?) => void;
```

Sorts the query by the given property and direction.
If no property is provided, it clears the sort.

#### Parameters

##### property?

[`ProductSortableProperties`](../enumerations/ProductSortableProperties.md)

The property to sort by.

##### direction?

[`RequestSortDirection`](../enumerations/RequestSortDirection.md)

The direction to sort by.

#### Returns

`void`
