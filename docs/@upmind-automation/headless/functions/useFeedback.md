[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useFeedback

# useFeedback()

```ts
function useFeedback(): object;
```

## Returns

`object`

### add()

```ts
add: (data) => void;
```

#### Parameters

##### data

`MaybeRef`\<[`Message`](../interfaces/Message.md)\>

#### Returns

`void`

### addError()

```ts
addError: (message, display, delay, maxAge) => void;
```

#### Parameters

##### message

`string` | `Partial`\<[`Message`](../interfaces/Message.md)\>

##### display

[`messageDisplays`](../enumerations/messageDisplays.md) = `messageDisplays.TOAST`

##### delay

`number` = `0`

##### maxAge

`number` = `...`

#### Returns

`void`

### addSuccess()

```ts
addSuccess: (message, display, delay, maxAge) => void;
```

#### Parameters

##### message

`string` | `Partial`\<[`Message`](../interfaces/Message.md)\>

##### display

[`messageDisplays`](../enumerations/messageDisplays.md) = `messageDisplays.TOAST`

##### delay

`number` = `0`

##### maxAge

`number` = `...`

#### Returns

`void`

### addWarning()

```ts
addWarning: (message, display, delay, maxAge) => void;
```

#### Parameters

##### message

`string` | `Partial`\<[`Message`](../interfaces/Message.md)\>

##### display

[`messageDisplays`](../enumerations/messageDisplays.md) = `messageDisplays.TOAST`

##### delay

`number` = `0`

##### maxAge

`number` = `0`

#### Returns

`void`

### dismiss()

```ts
dismiss: (id) => void;
```

#### Parameters

##### id

`string`

#### Returns

`void`

### getMessage()

```ts
getMessage: (id) => any;
```

#### Parameters

##### id

`string`

#### Returns

`any`

### messages

```ts
messages: ComputedRef<object[]>;
```

### meta

```ts
meta: ComputedRef<{
  hasNotifications: boolean;
  hasSystem: boolean;
  hasToasts: boolean;
  isEmpty: boolean;
  isProcessing: boolean;
}>;
```

### notifications

```ts
notifications: ComputedRef<any[]>;
```

### state

```ts
state: ComputedRef<StateValue>;
```

### system

```ts
system: ComputedRef<any[]>;
```

### toasts

```ts
toasts: ComputedRef<any[]>;
```
