[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / ReactiveQueryKeys

# ReactiveQueryKeys

```ts
type ReactiveQueryKeys = object;
```

Type alias for reactive query keys used to create dynamic query keys for TanStack Query.
This allows query keys to automatically update based on reactive sources.

## Properties

### currencyCode?

```ts
optional currencyCode: MaybeRef<undefined | string>;
```

A reactive reference to the currency code.

***

### filters?

```ts
optional filters: MaybeRef<undefined | RequestFilters>;
```

A reactive reference to filter parameters.

***

### limit?

```ts
optional limit: MaybeRef<undefined | number>;
```

A reactive reference to the pagination limit.

***

### locale?

```ts
optional locale: MaybeRef<string>;
```

A reactive reference to the locale string.

***

### offset?

```ts
optional offset: MaybeRef<undefined | number>;
```

A reactive reference to the pagination offset.

***

### pageIndex?

```ts
optional pageIndex: MaybeRef<undefined | number>;
```

A reactive reference to the page index for pagination.

***

### sort?

```ts
optional sort: MaybeRef<
  | undefined
  | string[]
| [RequestSortDirection, string]>;
```

A reactive reference to sorting parameters.
