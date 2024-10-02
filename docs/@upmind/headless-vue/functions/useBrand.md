[Upmind](../../packages.md) / [@upmind/headless-vue](../index.md) / useBrand

# useBrand()

```ts
function useBrand(): any
```

A composable that provides a simplified interface for interacting with the Brand API state machine.
It uses the `useUpmindBrand` composable to access the state machine service and provides helpers
for managing state, sending events, and accessing context data and errors.

## Returns

`any`

The composable returns an object containing the following values:
- `send`: Function to send events to the brand state machine.
- `state`: The current state of the brand state machine.
- `context`: The brand's state machine context, including config and settings.
- `errors`: Any errors encountered during the state machine's process.
- `responses`: Structured responses from the state machine context, excluding errors.
- `meta`: Metadata with various flags about status of brand data like `isLoading` and `isReady`.
- `isReady`: Method that checks if the brand data is fully ready.
- `getConfig`: Method that retrieves the brand configuration.
- `getAnayltics`: Method that fetches the analytics configuration keys (`ANALYTICS_GA_MEASUREMENT_ID` and `ANALYTICS_GTM_CONTAINER_ID`).
