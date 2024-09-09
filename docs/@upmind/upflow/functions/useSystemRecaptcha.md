[Upmind](../../packages.md) / [@upmind/upflow](../index.md) / useSystemRecaptcha

# useSystemRecaptcha()

```ts
function useSystemRecaptcha(): object
```

## Returns

`object`

### clear()

```ts
clear: () => void;
```

#### Returns

`void`

### destroy()

```ts
destroy: () => this = service.stop;
```

Stops the interpreter and unsubscribe all listeners.

This will also notify the `onStop` listeners.

#### Returns

`this`

### generate()

```ts
generate: (action?) => Promise<any>;
```

#### Parameters

• **action?**: `String`

#### Returns

`Promise`\<`any`\>

### getSnapshot()

```ts
getSnapshot: () => State<object, AnyEventObject, any, object, ResolveTypegenMeta<Typegen0, AnyEventObject, BaseActionObject, ServiceMap>> = service.getSnapshot;
```

#### Returns

`State`\<`object`, `AnyEventObject`, `any`, `object`, `ResolveTypegenMeta`\<`Typegen0`, `AnyEventObject`, `BaseActionObject`, `ServiceMap`\>\>

##### created

```ts
created: undefined = undefined;
```

##### error

```ts
error: undefined = undefined;
```

##### grecaptcha

```ts
grecaptcha: undefined = undefined;
```

##### token

```ts
token: undefined = undefined;
```

### isReady()

```ts
isReady: () => Promise<State<object, AnyEventObject, any, object, ResolveTypegenMeta<Typegen0, AnyEventObject, BaseActionObject, ServiceMap>>>;
```

#### Returns

`Promise`\<`State`\<`object`, `AnyEventObject`, `any`, `object`, `ResolveTypegenMeta`\<`Typegen0`, `AnyEventObject`, `BaseActionObject`, `ServiceMap`\>\>\>

### service

```ts
service: Interpreter<object, any, AnyEventObject, object, ResolveTypegenMeta<Typegen0, AnyEventObject, BaseActionObject, ServiceMap>>;
```

#### Type declaration

##### created

```ts
created: undefined = undefined;
```

##### error

```ts
error: undefined = undefined;
```

##### grecaptcha

```ts
grecaptcha: undefined = undefined;
```

##### token

```ts
token: undefined = undefined;
```
