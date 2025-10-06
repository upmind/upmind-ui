[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / RawInfiniteQueryData

# RawInfiniteQueryData\<TPageData\>

```ts
type RawInfiniteQueryData<TPageData> = InfiniteData<InfiniteQueryPage<TPageData>>;
```

The raw data structure provided by TanStack's `useInfiniteQuery`
to the `select` function before transformation.

## Type Parameters

### TPageData

`TPageData`

The type of the data within each page (e.g., IProduct[]).
