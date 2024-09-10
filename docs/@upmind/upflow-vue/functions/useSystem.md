[Upmind](../../packages.md) / [@upmind/upflow-vue](../index.md) / useSystem

# useSystem()

```ts
function useSystem(): object
```

## Returns

`object`

### context

```ts
context: ComputedRef<SystemContext>;
```

### errors

```ts
errors: ComputedRef<any>;
```

### fetch()

```ts
fetch: (key, value?) => Promise<any>;
```

#### Parameters

• **key**: `string`

• **value?**: `any`

#### Returns

`Promise`\<`any`\>

### meta

```ts
meta: ComputedRef<object>;
```

#### Type declaration

##### hasErrors

```ts
hasErrors: boolean;
```

##### isComplete

```ts
isComplete: boolean;
```

##### isLoading

```ts
isLoading: boolean;
```

##### isReady

```ts
isReady: boolean;
```

### responses

```ts
responses: ComputedRef<Pick<SystemContext, 
  | "currencies"
  | "countries"
  | "languages"
  | "statuses"
  | "billingCycles"
  | "departments"
  | "regions"
  | "systemIPAddresses"
| "taxBusinessTypes">>;
```

### send()

```ts
send: (event, payload?) => State<SystemContext, AnyEventObject, any, object, ResolveTypegenMeta<Typegen0, AnyEventObject, BaseActionObject, ServiceMap>>;
```

Sends an event to the running interpreter to trigger a transition.

An array of events (batched) can be sent as well, which will send all
batched events to the running interpreter. The listeners will be
notified only **once** when all events are processed.

#### Parameters

• **event**: `Event`\<`AnyEventObject`\> \| `SingleOrArray`\<`Event`\<`AnyEventObject`\>\>

The event(s) to send

• **payload?**: `EventData`

#### Returns

`State`\<`SystemContext`, `AnyEventObject`, `any`, `object`, `ResolveTypegenMeta`\<`Typegen0`, `AnyEventObject`, `BaseActionObject`, `ServiceMap`\>\>

### state

```ts
state: ComputedRef<StateValue>;
```
