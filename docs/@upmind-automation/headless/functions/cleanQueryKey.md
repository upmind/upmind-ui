[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / cleanQueryKey

# cleanQueryKey()

```ts
function cleanQueryKey(queryKey): any[];
```

## Parameters

### queryKey

`any`[]

The query key to clean

## Returns

`any`[]

The cleaned query key

## Description

Cleans the query key by removing empty values, objects, and arrays.
This is useful to avoid sending unnecessary data in the query key.
