[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / QueryParams

# QueryParams\<TQueryFnData, TData\>

```ts
type QueryParams<TQueryFnData, TData> = RequestParams & Omit<QueryObserverOptions<TQueryFnData, DefaultError, TData>, "queryFn" | "initialData">;
```

Type alias defining parameters for TanStack Query's `useQuery` hook,
extending [RequestParams](RequestParams.md) with `QueryObserverOptions` and omitting
`queryFn` and `initialData`, which are handled internally.

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

The type of data returned by the `queryFn`.

### TData

`TData` = `TQueryFnData`

The type of data after the `select` transformation.
