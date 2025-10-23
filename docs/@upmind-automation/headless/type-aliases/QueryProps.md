[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / QueryProps

# QueryProps

```ts
type QueryProps = object;
```

Type alias defining common properties for API queries, including sorting, filtering, and pagination.

## Properties

### filters?

```ts
optional filters: RequestFilters;
```

Optional filtering parameters, represented as a record of key-value pairs.

***

### pagination?

```ts
optional pagination: RequestPagination;
```

Optional pagination parameters, defining `limit` and `offset`.

***

### sort?

```ts
optional sort: [RequestSortDirection, string];
```

Optional sorting parameters: `[direction, property]`.
`direction` can be [RequestSortDirection.ASC](../enumerations/RequestSortDirection.md#asc) or [RequestSortDirection.DESC](../enumerations/RequestSortDirection.md#desc).
