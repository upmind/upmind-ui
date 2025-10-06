[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / invalidateQueryByKey

# invalidateQueryByKey()

```ts
function invalidateQueryByKey(queryKey, filters?): <T>(data?) => Promise<undefined | T>;
```

Invalidate a query by its key.
Perfect for invalidating a query after a mutation on a thenable

## Parameters

### queryKey

readonly `unknown`[]

The key of the query to invalidate

### filters?

`InvalidateQueryFilters`\<readonly `unknown`[]\>

Optional filters to apply when invalidating the query

## Returns

A function that takes the data and returns it after invalidating the query

```ts
<T>(data?): Promise<undefined | T>;
```

### Type Parameters

#### T

`T` = `any`

### Parameters

#### data?

`T`

### Returns

`Promise`\<`undefined` \| `T`\>

## Example

```ts
put({ url: "/clients/address/1", data: { name: "New Name" } })
      .then(invalidateQueryByKey(["clients", client.id, "addresses"]))
```
