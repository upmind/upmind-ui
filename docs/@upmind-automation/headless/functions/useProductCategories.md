[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useProductCategories

# useProductCategories()

```ts
function useProductCategories(initial?): object;
```

## Parameters

### initial?

[`QueryProps`](../type-aliases/QueryProps.md)

## Returns

### data

```ts
data: ComputedRef<
  | null
| QueryResponse<ProductCategory[]> & ProductCategory[]>;
```

The reactive data property containing the list of client items.
This is populated by the query and updates automatically when the query state changes.

### dataFlattened

```ts
dataFlattened: ComputedRef<ProductCategory[]>;
```

### error

```ts
error: Ref<null, null> | Ref<Error, Error> = query.error;
```

The current error state of the query.
This will be populated if the query fails to fetch data.

### filter()

```ts
filter: (param?, parent?) => ProductCategory[] = filterAll;
```

Filters the items by name or description.

#### Parameters

##### param?

`string`

The filter string to filter the items with.

##### parent?

`string`

#### Returns

[`ProductCategory`](../type-aliases/ProductCategory.md)[]

An array of items that match the filter.

### findOne()

```ts
findOne: (mapping) => undefined | ProductCategory;
```

Find a single address based on the given param. The param is matched against the title and description.

#### Parameters

##### mapping

The filter to match against the address title and description.

`string` | `Partial`\<[`ProductCategory`](../type-aliases/ProductCategory.md)\>

#### Returns

`undefined` \| [`ProductCategory`](../type-aliases/ProductCategory.md)

The address object if found, is otherwise undefined.

### getChildren()

```ts
getChildren: (parent, flattened?) => ProductCategory[];
```

Get the children of a parent category.

#### Parameters

##### parent

The parent category id to get the children for.

`undefined` | `string`

##### flattened?

`boolean`

#### Returns

[`ProductCategory`](../type-aliases/ProductCategory.md)[]

An array of child categories.

### getOne()

```ts
getOne: (id) => undefined | ProductCategory;
```

Get a single address by id.

#### Parameters

##### id

`string`

The id of the address to get.

#### Returns

`undefined` \| [`ProductCategory`](../type-aliases/ProductCategory.md)

The address object if found, is otherwise undefined.

### getParent()

```ts
getParent: (id) => undefined | string;
```

Get the parent of a category.

#### Parameters

##### id

`string`

The id of the category to get the parent for.

#### Returns

`undefined` \| `string`

The parent category if found, is otherwise undefined.

### getPath()

```ts
getPath: (categoryId?) => ProductCategory[];
```

#### Parameters

##### categoryId?

`string`

#### Returns

[`ProductCategory`](../type-aliases/ProductCategory.md)[]

### invalidate()

```ts
invalidate: <T>(data?) => Promise<undefined | T>;
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

`Promise`\<`undefined` \| `T`\>

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
  isAvailable: boolean;
  isEmpty: boolean;
  isLoading: boolean;
}>;
```

Meta-information about the basket state.

### refresh()

```ts
refresh: (options?) => Promise<QueryObserverResult<QueryResponse<ProductCategory[]>, Error>> = query.refetch;
```

Refresh the query to get the latest data.
This will refetch the data from the server and update the query state.

#### Parameters

##### options?

`RefetchOptions`

#### Returns

`Promise`\<`QueryObserverResult`\<[`QueryResponse`](../interfaces/QueryResponse.md)\<[`ProductCategory`](../type-aliases/ProductCategory.md)[]\>, `Error`\>\>
