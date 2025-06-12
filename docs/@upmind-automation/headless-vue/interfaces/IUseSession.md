[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / IUseSession

# IUseSession

Represents the session management composable interface in the application.
Provides functionality for managing user sessions, including authentication,
registration, 2FA, and ReCaptcha verification.

## Properties

### client

```ts
client: any;
```

Information about the authenticated client, if available. Represents the logged-in user.

---

### context

```ts
context: any;
```

Context object containing session-specific information such as current user,
authentication status, and other dynamic data.

---

### errors

```ts
errors: any;
```

Any errors encountered during session management operations, such as login or registration failures.

---

### guest

```ts
guest: any;
```

Information about the guest user, if available. Used to handle non-authenticated user interactions.

---

### login

```ts
login: Function;
```

Initiates the login process for a user, typically used in conjunction with a form and model data.

#### Returns

A promise that resolves when the login operation is completed.

---

### logout

```ts
logout: Function;
```

Logs out the currently authenticated user.

#### Returns

A promise that resolves when the logout operation is completed.

---

### meta

```ts
meta: ComputedRef<IUseSessionMeta>;
```

Computed metadata related to the session's state, including loading, ready, and error flags.

---

### model

```ts
model: any;
```

The underlying data model used in session-related forms such as login or registration.

---

### register

```ts
register: Function;
```

Registers a new user, typically used with a form and model data.

#### Returns

A promise that resolves when the registration operation is completed.

---

### reject

```ts
reject: any;
```

Function to reject an ongoing authentication or registration request.

---

### resolve

```ts
resolve: any;
```

Function to resolve an ongoing authentication or registration request.

---

### schema

```ts
schema: any;
```

JSON Schema used to define the structure of session-related forms, like login and registration.

---

### showLogin

```ts
showLogin: Function;
```

Displays the login form for user authentication.

---

### showRegister

```ts
showRegister: Function;
```

Displays the registration form for user sign-up.

---

### state

```ts
state: any;
```

Current state of the session machine.
Can include authentication, registration, and other session-related states.

---

### transfer

```ts
transfer: any;
```

Transfer session data between different parts of the application, such as from guest to client.

---

### uischema

```ts
uischema: any;
```

UI Schema used to configure the presentation and layout of session-related forms.

---

### user

```ts
user: any;
```

User-specific information for the currently authenticated user, including profile and account data.

---

### verify2fa

```ts
verify2fa: Function;
```

Verifies the 2-factor authentication (2FA) code provided by the user.

#### Param

The 2FA code entered by the user.

#### Returns

A promise that resolves when the verification is successful.

---

### verifyReCaptcha

```ts
verifyReCaptcha: Function;
```

Verifies the ReCaptcha challenge response from the user.

#### Param

The ReCaptcha response token from the user.

#### Returns

A promise that resolves when the verification is successful.
