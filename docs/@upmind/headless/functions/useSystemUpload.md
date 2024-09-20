[Upmind](../../packages.md) / [@upmind/headless](../index.md) / useSystemUpload

# useSystemUpload()

```ts
function useSystemUpload(field?): object
```

## Parameters

• **field?**: `Object`

## Returns

`object`

### destroy()

```ts
destroy: () => this = service.stop;
```

Stops the interpreter and unsubscribe all listeners.

This will also notify the `onStop` listeners.

#### Returns

`this`

### getSnapshot()

```ts
getSnapshot: () => any;
```

#### Returns

`any`

### service

```ts
service: Interpreter<any, any, AnyEventObject, object, ResolveTypegenMeta<TypegenDisabled, AnyEventObject, BaseActionObject, ServiceMap>>;
```
