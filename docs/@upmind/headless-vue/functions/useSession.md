[Upmind](../../packages.md) / [@upmind/headless-vue](../index.md) / useSession

# useSession()

```ts
function useSession(inspector?): object
```

## Parameters

• **inspector?**: `Function`

## Returns

`object`

### client

```ts
client: ComputedRef<any>;
```

### context

```ts
context: ComputedRef<SessionContext>;
```

### errors

```ts
errors: ComputedRef<any>;
```

### guest

```ts
guest: ComputedRef<any>;
```

### login()

```ts
login: (model) => void;
```

#### Parameters

• **model**: `any`

#### Returns

`void`

### logout()

```ts
logout: () => void;
```

#### Returns

`void`

### meta

```ts
meta: ComputedRef<object>;
```

#### Type declaration

##### canShowForms

```ts
canShowForms: any;
```

##### hasExpired

```ts
hasExpired: boolean;
```

##### isAuthenticated

```ts
isAuthenticated: boolean;
```

##### isLoading

```ts
isLoading: any;
```

##### isProcessing

```ts
isProcessing: any;
```

##### isTransferring

```ts
isTransferring: any;
```

##### show2fa

```ts
show2fa: any;
```

##### showLoginForm

```ts
showLoginForm: any;
```

##### showReCaptcha

```ts
showReCaptcha: any;
```

##### showRegisterForm

```ts
showRegisterForm: any;
```

### model

```ts
model: ComputedRef<any>;
```

### register()

```ts
register: (model) => void;
```

#### Parameters

• **model**: `any`

#### Returns

`void`

### reject()

```ts
reject: () => void;
```

#### Returns

`void`

### resolve()

```ts
resolve: (model) => void;
```

#### Parameters

• **model**: `any`

#### Returns

`void`

### schema

```ts
schema: ComputedRef<any>;
```

### showLogin()

```ts
showLogin: () => void;
```

#### Returns

`void`

### showRegister()

```ts
showRegister: () => void;
```

#### Returns

`void`

### state

```ts
state: ComputedRef<StateValue>;
```

### transfer()

```ts
transfer: () => Promise<any>;
```

#### Returns

`Promise`\<`any`\>

### uischema

```ts
uischema: ComputedRef<any>;
```

### user

```ts
user: ComputedRef<any>;
```

### verify2fa()

```ts
verify2fa: (__namedParameters) => void;
```

#### Parameters

• **\_\_namedParameters**: `any`

#### Returns

`void`

### verifyReCaptcha()

```ts
verifyReCaptcha: (token) => void;
```

#### Parameters

• **token**: `any`

#### Returns

`void`
