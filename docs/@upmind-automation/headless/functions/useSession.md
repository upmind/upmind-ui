[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useSession

# useSession()

```ts
function useSession(): object;
```

Composable function to manage session-related logic using Vue.
It provides state, context and helpers for session, login and registration processes.

## Returns

Session management API (see below for details)

### client

```ts
client: ComputedRef<undefined | Actor>;
```

Information about the authenticated client, if available. Represents the logged-in user.

### context

```ts
context: ComputedRef<undefined | SessionContext>;
```

Context object containing session-specific information such as current user,
authentication status, and other dynamic data.

### errors

```ts
errors: ComputedRef<undefined | string>;
```

Any errors message(s) encountered during session management operations, such as login or registration failures.

### getHistory()

```ts
getHistory: () => undefined | string[];
```

#### Returns

`undefined` \| `string`[]

### getToken()

```ts
getToken: () => null | string;
```

#### Returns

`null` \| `string`

### getTransferDetails()

```ts
getTransferDetails: () => undefined | SessionTransfer;
```

Retrieves the transfer details, such as the transfer code and redirect URL.

#### Returns

`undefined` \| [`SessionTransfer`](../interfaces/SessionTransfer.md)

A promise that resolves with the transfer details.

### guest

```ts
guest: ComputedRef<undefined | Actor>;
```

Information about the guest user, if available. Used to handle non-authenticated user interactions.

### isAuthenticated()

```ts
isAuthenticated: () => Promise<User>;
```

Promise that resolves when the session is fully initialized and authenticated.
Typically used to wait for guarding routes or other authenticated-dependent operations.

#### Returns

`Promise`\<[`User`](../interfaces/User.md)\>

A promise that resolves with the current user when the session is ready.

### isReady()

```ts
isReady: () => Promise<boolean>;
```

Promise that resolves when the session is ready to be used.
Typically used to wait for initialization and loading of session data.

#### Returns

`Promise`\<`boolean`\>

### login()

```ts
login: (model) => Promise<boolean>;
```

Initiates the login process for a user, typically used in conjunction with a form and model data.

#### Parameters

##### model

`any`

#### Returns

`Promise`\<`boolean`\>

A promise that resolves when the login operation is completed.

### logout()

```ts
logout: () => Promise<boolean>;
```

Logs out the currently authenticated user.

#### Returns

`Promise`\<`boolean`\>

A promise that resolves when the logout operation is completed.

### meta

```ts
meta: ComputedRef<{
  canShowForms: boolean;
  hasErrors: boolean;
  hasExpired: boolean;
  isAuthenticated: boolean;
  isAvailable: boolean;
  isLoading: boolean;
  isProcessing: boolean;
  isTransferring: boolean;
  show2fa: boolean;
  showLoginForm: boolean;
  showReCaptcha: boolean;
  showRecoverPasswordForm: boolean;
  showRegisterForm: boolean;
}>;
```

Computed metadata related to the session's state, including loading, ready, and error flags.

### model

```ts
model: ComputedRef<any>;
```

The underlying data model used in session-related forms such as login or registration.

### reauth()

```ts
reauth: () => State<SessionContext, AnyEventObject, any, {
  context: SessionContext;
  value: any;
}, ResolveTypegenMeta<TypegenDisabled, AnyEventObject, BaseActionObject, ServiceMap>>;
```

#### Returns

`State`\<`SessionContext`, `AnyEventObject`, `any`, \{
  `context`: `SessionContext`;
  `value`: `any`;
\}, `ResolveTypegenMeta`\<`TypegenDisabled`, `AnyEventObject`, `BaseActionObject`, `ServiceMap`\>\>

### recover()

```ts
recover: (model) => Promise<boolean>;
```

Recovers the password for a user, typically used with form and model data.

#### Parameters

##### model

`any`

#### Returns

`Promise`\<`boolean`\>

A promise that resolves when the password recovery operation is completed.

### register()

```ts
register: (model) => Promise<boolean>;
```

Registers a new user, typically used with a form and model data.

#### Parameters

##### model

`any`

#### Returns

`Promise`\<`boolean`\>

A promise that resolves when the registration operation is completed.

### reject()

```ts
reject: () => Promise<any>;
```

Function to reject an ongoing authentication or registration request.

Function to reject an ongoing authentication or registration request.

#### Returns

`Promise`\<`any`\>

### resolve()

```ts
resolve: (model) => Promise<any>;
```

Function to resolve an ongoing authentication or registration request.

Function to resolve an ongoing authentication or registration request.

#### Parameters

##### model

`any`

#### Returns

`Promise`\<`any`\>

### schema

```ts
schema: ComputedRef<undefined | JsonSchema>;
```

JSON Schema used to define the structure of session-related forms, like login and registration.

### setModel()

```ts
setModel: (data) => void;
```

Sets the model for the session, typically used to update or initialize the data model

#### Parameters

##### data

`any`

#### Returns

`void`

### showLogin()

```ts
showLogin: () => Promise<boolean>;
```

Displays the login form for user authentication.

#### Returns

`Promise`\<`boolean`\>

### showRecoverPassword()

```ts
showRecoverPassword: () => Promise<boolean>;
```

Displays the Send reset form for password recovery.

#### Returns

`Promise`\<`boolean`\>

### showRegister()

```ts
showRegister: () => Promise<boolean>;
```

Displays the registration form for user sign-up.

#### Returns

`Promise`\<`boolean`\>

### subscribe()

```ts
subscribe: {
  (observer): Subscription;
  (nextListener?, errorListener?, completeListener?): Subscription;
};
```

Subscribes to basket state changes.

#### Call Signature

```ts
(observer): Subscription;
```

##### Parameters

###### observer

`Partial`\<`Observer`\<`State`\<`TContext`, `TEvent`, `any`, `TTypestate`, `TResolvedTypesMeta`\>\>\>

##### Returns

`Subscription`

#### Call Signature

```ts
(
   nextListener?, 
   errorListener?, 
   completeListener?): Subscription;
```

##### Parameters

###### nextListener?

(`state`) => `void`

###### errorListener?

(`error`) => `void`

###### completeListener?

() => `void`

##### Returns

`Subscription`

#### See

https://xstate.js.org/docs/guides/communication.html#service-subscribe

### transferFrom()

```ts
transferFrom: (code, redirect?) => Promise<SessionTransfer>;
```

Transfer session data from another part of the application.

#### Parameters

##### code

`string`

The transfer code used to identify the session.

##### redirect?

`string`

The URL to redirect to after the transfer is complete.

#### Returns

`Promise`\<[`SessionTransfer`](../interfaces/SessionTransfer.md)\>

A promise that resolves with the transfer details.

#### Throws

If the transfer fails or the code is invalid.

### transferred()

```ts
transferred: () => void;
```

Indicates whether the session has been transferred successfully.

#### Returns

`void`

True if the session has been transferred, false otherwise.

### transferTo()

```ts
transferTo: () => Promise<IAuthTransfer>;
```

Transfer session data between different parts of the application, such as from guest to client.

#### Returns

`Promise`\<[`IAuthTransfer`](../interfaces/IAuthTransfer.md)\>

### uischema

```ts
uischema: ComputedRef<undefined | UISchemaElement>;
```

UI Schema used to configure the presentation and layout of session-related forms.

### user

```ts
user: ComputedRef<undefined | User>;
```

User-specific information for the currently authenticated user, including profile and account data.

### userId

```ts
userId: ComputedRef<undefined | string>;
```

### validationErrors

```ts
validationErrors: ComputedRef<
  | undefined
| ValidationErrorObject<string, Record<string, any>, unknown>[]>;
```

Validation errors encountered during session management operations, such as login or registration failures.
Typically contains an array of error objects with details about the validation issues.

#### See

https://ajv.js.org/guide/validation-errors.html#validation-error-object

### verify2fa()

```ts
verify2fa: (code) => Promise<any>;
```

Verifies the 2-factor authentication (2FA) code provided by the user.

#### Parameters

##### code

The 2FA code entered by the user.

###### token

`string`

#### Returns

`Promise`\<`any`\>

A promise that resolves when the verification is successful.
