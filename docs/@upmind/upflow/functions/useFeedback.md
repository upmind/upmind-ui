[Upmind](../../packages.md) / [@upmind/upflow](../index.md) / useFeedback

# useFeedback()

```ts
function useFeedback(): object
```

## Returns

`object`

### add()

```ts
add: (message) => void;
```

#### Parameters

• **message**: `Message`

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

### getMessage()

```ts
getMessage: (id) => any;
```

#### Parameters

• **id**: `any`

#### Returns

`any`

### getMessages()

```ts
getMessages: () => any;
```

#### Returns

`any`

### getSnapshot()

```ts
getSnapshot: () => any;
```

#### Returns

`any`

### service

```ts
service: Interpreter<object, any, AnyEventObject, object, ResolveTypegenMeta<Typegen0, AnyEventObject, BaseActionObject, ServiceMap>>;
```

#### Type declaration

##### messages

```ts
messages: never[] = [];
```

### trackEvent()

```ts
trackEvent: (data) => void;
```

#### Parameters

• **data**: `Object`

#### Returns

`void`
