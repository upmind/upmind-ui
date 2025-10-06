[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / localStoragePersister

# localStoragePersister

```ts
const localStoragePersister: ReturnType<typeof experimental_createQueryPersister>;
```

A persister object used to synchronize query cache data with the browser's localStorage.

This variable is initialized using the `experimental_createQueryPersister` function
and applies localStorage as the underlying storage mechanism. It helps in persisting
query state across browser sessions.

Note: This implementation uses the `experimental_createQueryPersister` method
and should be treated as an experimental feature which might be subject to changes.

Use this persister to store application query cache data in a persistent medium,
ensuring data retrieval even on browser reloads or closures.
