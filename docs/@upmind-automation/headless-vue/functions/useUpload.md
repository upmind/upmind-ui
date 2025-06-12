[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useUpload

# useUpload()

```ts
function useUpload(field): object;
```

## Parameters

• **field**: `any`

## Returns

`object`

### add()

```ts
add: value => Promise<unknown>;
```

#### Parameters

• **value**: `string`

#### Returns

`Promise`\<`unknown`\>

### created

```ts
created: ComputedRef<null | Date>;
```

### destroy()

```ts
destroy: () => (this = upload.destroy);
```

Stops the interpreter and unsubscribe all listeners.

This will also notify the `onStop` listeners.

#### Returns

`this`

### errors

```ts
errors: ComputedRef<any>;
```

### file

```ts
file: ComputedRef<any>;
```

### getImage()

```ts
getImage: (type, typeId, isDefault) =>
  State<
    any,
    AnyEventObject,
    any,
    object,
    ResolveTypegenMeta<
      TypegenDisabled,
      AnyEventObject,
      BaseActionObject,
      ServiceMap
    >
  >;
```

#### Parameters

• **type**: `any`

• **typeId**: `any`

• **isDefault**: `any`

#### Returns

`State`\<`any`, `AnyEventObject`, `any`, `object`, `ResolveTypegenMeta`\<`TypegenDisabled`, `AnyEventObject`, `BaseActionObject`, `ServiceMap`\>\>

### getImageByHash()

```ts
getImageByHash: (hash) => void;
```

#### Parameters

• **hash**: `any`

#### Returns

`void`

### meta

```ts
meta: ComputedRef<object>;
```

#### Type declaration

##### hasErrors

```ts
hasErrors: boolean;
```

##### hasFile

```ts
hasFile: boolean;
```

##### isComplete

```ts
isComplete: boolean;
```

##### isLoading

```ts
isLoading: boolean;
```

##### isProcessing

```ts
isProcessing: boolean;
```

### name

```ts
name: ComputedRef<any>;
```

### remove()

```ts
remove: () => void;
```

#### Returns

`void`

### src

```ts
src: ComputedRef<any>;
```

### state

```ts
state: ComputedRef<StateValue>;
```
