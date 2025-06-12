[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / IUseSystem

# IUseSystem

Interface for the `useSystem` composable.
This interface provides various methods and properties for managing system data
and interacting with the system state machine in the application.

## Properties

### context

```ts
context: ComputedRef<any>;
```

Computed property to the system's state machine context, containing fetched data.

---

### errors

```ts
errors: ComputedRef<any>;
```

Computed property to any errors encountered during the system state machine's process.

---

### fetch()

```ts
fetch: (key, value?) => Promise<any>;
```

Get specific system-related data from Upmind's API.

#### Parameters

• **key**: `string`

The key representing the type of data to fetch (e.g., countries, regions, languages).

• **value?**: `any`

Optional additional data for the fetch operation.

#### Returns

`Promise`\<`any`\>

A promise that resolves to the fetched data.

---

### meta

```ts
meta: ComputedRef<IUseSystemMeta>;
```

Computed property to metadata flags about the system data such as `isLoading` and `isReady`.

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

Function to send events to the system state machine.

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

Computed property to the current state of the system state machine.
