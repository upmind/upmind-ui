[Upmind](../../packages.md) / [@upmind/upflow-vue](../index.md) / useFeedback

# useFeedback()

```ts
function useFeedback(): object
```

## Returns

`object`

### add()

```ts
add: (data) => void;
```

#### Parameters

• **data**: `any`

#### Returns

`void`

### addError()

```ts
addError: (message, display, delay, maxAge) => void;
```

#### Parameters

• **message**: `any`

• **display**: `messageDisplays` = `messageDisplays.TOAST`

• **delay**: `number` = `0`

• **maxAge**: `number` = `...`

#### Returns

`void`

### addSuccess()

```ts
addSuccess: (message, display, delay, maxAge) => void;
```

#### Parameters

• **message**: `any`

• **display**: `messageDisplays` = `messageDisplays.TOAST`

• **delay**: `number` = `0`

• **maxAge**: `number` = `...`

#### Returns

`void`

### dismiss()

```ts
dismiss: (id) => void;
```

#### Parameters

• **id**: `string`

#### Returns

`void`

### events

```ts
events: ComputedRef<never[]>;
```

### messages

```ts
messages: ComputedRef<object[]>;
```

### meta

```ts
meta: ComputedRef<object>;
```

#### Type declaration

##### hasEvents

```ts
hasEvents: boolean = !isEmpty(events.value);
```

##### hasNotifications

```ts
hasNotifications: boolean = !isEmpty(notifications.value);
```

##### hasToasts

```ts
hasToasts: boolean = !isEmpty(toasts.value);
```

##### isEmpty

```ts
isEmpty: boolean;
```

##### isProcessing

```ts
isProcessing: boolean;
```

### notifications

```ts
notifications: ComputedRef<never[]>;
```

### state

```ts
state: ComputedRef<StateValue>;
```

### toasts

```ts
toasts: ComputedRef<never[]>;
```

### trackEvent()

```ts
trackEvent: (data) => void;
```

#### Parameters

• **data**: `Object`

#### Returns

`void`

### useTime()

```ts
useTime: () => object = utils.useTime;
```

#### Returns

`object`

##### ERROR

```ts
ERROR: number = 3000;
```

##### IMMIDIATE

```ts
IMMIDIATE: number = 0;
```

##### MILLISECOND

```ts
MILLISECOND: number = 1;
```

##### POLL

```ts
POLL: number = 500;
```

##### WAIT

```ts
WAIT: number = 10;
```

##### DAY

```ts
get DAY(): number
```

###### Returns

`number`

##### HOUR

```ts
get HOUR(): number
```

###### Returns

`number`

##### MINUTE

```ts
get MINUTE(): number
```

###### Returns

`number`

##### MONTH

```ts
get MONTH(): number
```

###### Returns

`number`

##### SECOND

```ts
get SECOND(): number
```

###### Returns

`number`

##### WEEK

```ts
get WEEK(): number
```

###### Returns

`number`

##### YEAR

```ts
get YEAR(): number
```

###### Returns

`number`
