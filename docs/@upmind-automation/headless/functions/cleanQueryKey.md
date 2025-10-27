[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / cleanQueryKey

# cleanQueryKey()

```ts
function cleanQueryKey(queryKey): any[];
```

Cleans a query key by removing empty values, objects, and arrays.
This is useful for preventing unnecessary data from being included in query keys,
which can help in cache management and improve the accuracy of query matching.

## Parameters

### queryKey

`any`[]

The query key array to clean.

## Returns

`any`[]

The cleaned query key array with empty values removed.
