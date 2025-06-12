[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / IUseSystemMeta

# IUseSystemMeta

Defines the structure of the metadata object returned from the `useSystem` composable.
It contains various flags that represent the current state of the system process.

## Properties

### hasErrors

```ts
hasErrors: boolean;
```

Indicates if any errors have occurred during the system state machine's process.

---

### isComplete

```ts
isComplete: boolean;
```

Indicates whether the system state machine has completed its operations.

---

### isLoading

```ts
isLoading: boolean;
```

Indicates whether the system state machine is currently in a loading state.

---

### isReady

```ts
isReady: boolean;
```

Indicates whether the system data is fully ready.
