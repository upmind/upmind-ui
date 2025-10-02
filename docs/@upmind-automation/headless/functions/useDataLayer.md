[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useDataLayer

# useDataLayer()

```ts
function useDataLayer(dataLayer): object;
```

Composable for managing the data layer for tracking and analytics.

## Parameters

### dataLayer

`string` = `"dataLayer"`

The name of the data layer to be used.

## Returns

Grouped and documented returns for data layer management.

### dataLayer()

```ts
dataLayer: (args) => TrackingEvent = dataLayerEvent;
```

Creates a new tracking event for the data layer.

#### Parameters

##### args

`Record`\<`string`, `any`\> = `{}`

Arguments for the tracking event.

#### Returns

`TrackingEvent`

The tracking event instance.

### id

```ts
id: string;
```

The name/id of the data layer.

### init()

```ts
init: () => Promise<void>;
```

Initializes the data layer with default consent settings and initial push.

#### Returns

`Promise`\<`void`\>

Resolves when initialization is complete.
