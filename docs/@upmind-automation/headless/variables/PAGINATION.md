[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / PAGINATION

# PAGINATION

```ts
const PAGINATION: object;
```

Default pagination values for API requests.
These values can be used to standardise pagination across different requests.

## Type Declaration

### limit

```ts
limit: number = 10;
```

The default limit for paginated requests, specifying the maximum number of items to return per page.

### offset

```ts
offset: number = 0;
```

The default offset for paginated requests, indicating the starting point for fetching data.
A value of 0 means fetching starts from the first item.
