[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / MutationParams

# MutationParams\<TData, TError, TVariables, TContext\>

```ts
type MutationParams<TData, TError, TVariables, TContext> = RequestParams & Omit<MutationObserverOptions<TData, TError, TVariables, TContext>, "mutationFn">;
```

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = `DefaultError`

### TVariables

`TVariables` = `void`

### TContext

`TContext` = `unknown`
