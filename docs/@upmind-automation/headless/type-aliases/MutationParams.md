[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / MutationParams

# MutationParams\<TData, TError, TVariables, TContext\>

```ts
type MutationParams<TData, TError, TVariables, TContext> = RequestParams & Omit<MutationObserverOptions<TData, TError, TVariables, TContext>, "mutationFn">;
```

Type alias defining parameters for TanStack Query's `useMutation` hook,
extending [RequestParams](RequestParams.md) with `MutationObserverOptions` and omitting `mutationFn`,
which is handled internally.

## Type Parameters

### TData

`TData` = `unknown`

The type of data returned by the `mutationFn`.

### TError

`TError` = `DefaultError`

The type of error that can occur.

### TVariables

`TVariables` = `void`

The type of variables passed to the mutation.

### TContext

`TContext` = `unknown`

The type of context used by the mutation.
