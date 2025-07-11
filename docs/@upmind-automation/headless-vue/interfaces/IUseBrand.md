[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / IUseBrand

# IUseBrand

Interface for the `useBrand` composable.
This interface provides various methods and properties for managing brand data
and interacting with the brand state machine in the application.

## Properties

### context

```ts
context: ComputedRef<any>;
```

Computed property to the brand's state machine context, containing configuration data and settings.

---

### errors

```ts
errors: ComputedRef<any>;
```

Computed property to any errors encountered during the brand state machine's process.

---

### getAnayltics()

```ts
getAnayltics: () => Promise<any>;
```

Fetch the analytics configuration keys (`ANALYTICS_GA_MEASUREMENT_ID` and `ANALYTICS_GTM_CONTAINER_ID`).

#### Returns

`Promise`\<`any`\>

A promise that resolves to the analytics configuration data.

---

### getConfig

```ts
getConfig: any;
```

Get brand configuration.

#### Returns

The configuration data for the brand.

---

### isReady

```ts
isReady: any;
```

Method that checks if the brand data is fully ready.

#### Returns

Returns true if the brand data is ready.

---

### meta

```ts
meta: ComputedRef<IUseBrandMeta>;
```

Computed property to metadata flags about brand data.

---

### responses

```ts
responses: ComputedRef<any>;
```

Computed property to the structured responses from the state machine context, excluding errors.

---

### send()

```ts
send: (event) => void;
```

Function to send events to the brand state machine.

#### Parameters

• **event**: `any`

The event to send.

#### Returns

`void`

---

### state

```ts
state: ComputedRef<any>;
```

Computed property to the current state of the brand state machine.
