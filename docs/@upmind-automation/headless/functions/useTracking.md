[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useTracking

# useTracking()

```ts
function useTracking(): object;
```

Composable function to handle user tracking data. The `useTracking` hook provides mechanisms for initialising,
retrieving, and managing tracking data from cookies. This may include generating and storing
tracking data based on query parameters and providing methods to retrieve or clear this data.

Note that the composable relies on external libraries and configurations such as cookies and URL handling.

## Returns

### get()

```ts
get: () => Promise<unknown> = getTracking;
```

Gets the current tracking cookie values.

#### Returns

`Promise`\<`unknown`\>

Resolves to the tracking values.

### init()

```ts
init: () => Promise<unknown>;
```

Initializes the tracking cookie from query params if not present.

#### Returns

`Promise`\<`unknown`\>

Resolves to the tracking values or null.

### remove()

```ts
remove: () => void;
```

Removes the tracking cookie.

#### Returns

`void`
