[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / IUseBrandMeta

# IUseBrandMeta

Defines the structure of the metadata object returned from the `useBrand` composable.
It contains various flags that represent the current state of the brand process.

## Properties

### hasErrors

```ts
hasErrors: boolean;
```

Indicates if any errors have occurred during the brand state machine's process.

---

### isComplete

```ts
isComplete: boolean;
```

Indicates whether the brand state machine has completed its operations.

---

### isLoading

```ts
isLoading: boolean;
```

Indicates whether the brand state machine is currently in a loading state.

---

### isReady

```ts
isReady: boolean;
```

Indicates whether the brand data is fully ready.
