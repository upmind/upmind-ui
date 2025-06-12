[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useSystem

# useSystem()

```ts
function useSystem(): IUseSystem;
```

The `useSystem` composable provides a simple interface to interact with the system API
through a state machine and includes utility methods for fetching data.

## Returns

[`IUseSystem`](../interfaces/IUseSystem.md)

The composable returns an object containing the following values:

- `send`: Sends events to the system state machine.
- `state`: The current state of the system.
- `context`: Contains the state machine's context, including fetched data.
- `errors`: Any errors present in the system context.
- `responses`: The responses from the system, excluding errors.
- `meta`: Metadata with various flags about status of system data like `isLoading` and `isReady`.
