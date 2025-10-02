[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useTracking

# useTracking()

```ts
function useTracking(): object;
```

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
