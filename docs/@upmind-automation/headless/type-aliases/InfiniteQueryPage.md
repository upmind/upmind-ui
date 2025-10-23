[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / InfiniteQueryPage

# InfiniteQueryPage\<TData\>

```ts
type InfiniteQueryPage<TData> = object;
```

Represents the structure of a single page returned from an infinite query's `queryFn`.
This type is used internally by the `useInfiniteQuery` hook.

## Type Parameters

### TData

`TData`

The type of the data array for the page.

## Properties

### nextOffset

```ts
nextOffset: number | undefined;
```

The offset for fetching the next page, or `undefined` if there are no more pages.

***

### pageData

```ts
pageData: TData;
```

The actual data payload for this specific page.
