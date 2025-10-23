[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / PaginationInfo

# PaginationInfo

Interface representing comprehensive pagination information, typically returned
by an API to describe the current state of paginated results.

## Properties

### from

```ts
from: number;
```

The index of the first item on the current page (1-indexed).

***

### limit

```ts
limit: number;
```

The maximum number of items per page.

***

### page

```ts
page: number;
```

The current page number (1-indexed).

***

### pages

```ts
pages: number;
```

The total number of available pages.

***

### to

```ts
to: number;
```

The index of the last item on the current page (1-indexed).

***

### total

```ts
total: number;
```

The total number of items available across all pages.
