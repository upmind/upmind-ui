[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / QueryParams

# QueryParams\<TQueryFnData, TData\>

```ts
type QueryParams<TQueryFnData, TData> = RequestParams & Omit<QueryObserverOptions<TQueryFnData, DefaultError, TData>, "queryFn" | "initialData">;
```

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TData

`TData` = `TQueryFnData`
