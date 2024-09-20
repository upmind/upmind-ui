[Upmind](../../packages.md) / [@upmind/headless](../index.md) / useSession

# useSession()

```ts
function useSession(): object
```

## Returns

`object`

### authSubscription()

```ts
authSubscription: (_context, _event) => (callback, onReceive) => Promise<() => void>;
```

#### Parameters

• **\_context**: `any`

• **\_event**: `any`

#### Returns

`Function`

##### Parameters

• **callback**: `any`

• **onReceive**: `any`

##### Returns

`Promise`\<() => `void`\>

### getHistory()

```ts
getHistory: () => any;
```

#### Returns

`any`

### getSnapshot()

```ts
getSnapshot: () => State<SessionContext, AnyEventObject, any, object, ResolveTypegenMeta<TypegenDisabled, AnyEventObject, BaseActionObject, ServiceMap>>;
```

#### Returns

`State`\<`SessionContext`, `AnyEventObject`, `any`, `object`, `ResolveTypegenMeta`\<`TypegenDisabled`, `AnyEventObject`, `BaseActionObject`, `ServiceMap`\>\>

### getToken()

```ts
getToken: () => null | string;
```

#### Returns

`null` \| `string`

### getUser()

```ts
getUser: () => Promise<any>;
```

#### Returns

`Promise`\<`any`\>

### getUserId()

```ts
getUserId: () => Promise<any>;
```

#### Returns

`Promise`\<`any`\>

### isAuthenticated()

```ts
isAuthenticated: () => Promise<any>;
```

#### Returns

`Promise`\<`any`\>

### reauth()

```ts
reauth: () => State<SessionContext, AnyEventObject, any, object, ResolveTypegenMeta<TypegenDisabled, AnyEventObject, BaseActionObject, ServiceMap>>;
```

#### Returns

`State`\<`SessionContext`, `AnyEventObject`, `any`, `object`, `ResolveTypegenMeta`\<`TypegenDisabled`, `AnyEventObject`, `BaseActionObject`, `ServiceMap`\>\>

### service

```ts
service: Interpreter<SessionContext, any, AnyEventObject, object, ResolveTypegenMeta<TypegenDisabled, AnyEventObject, BaseActionObject, ServiceMap>>;
```

### transfer()

```ts
transfer: () => Promise<any>;
```

#### Returns

`Promise`\<`any`\>
