[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / IUseSessionMeta

# IUseSessionMeta

Represents the metadata for the session state, providing flags that reflect
the current status of the session and its components such as forms, authentication,
and processing states.

## Properties

### canShowForms

```ts
canShowForms: boolean;
```

Indicates whether any forms (login or register) can be shown to the user.

---

### hasExpired

```ts
hasExpired: boolean;
```

Indicates whether the session has expired.

---

### isAuthenticated

```ts
isAuthenticated: boolean;
```

Indicates whether the user is authenticated within the session.

---

### isLoading

```ts
isLoading: boolean;
```

Indicates whether any part of the session (e.g., login, registration, etc.) is currently in a loading state.

---

### isProcessing

```ts
isProcessing: boolean;
```

Indicates whether the session is currently processing an action, such as authentication or registration.

---

### isTransferring

```ts
isTransferring: boolean;
```

Indicates whether the session is currently transferring data, such as during a guest-to-client transition.

---

### show2fa

```ts
show2fa: boolean;
```

Indicates whether the two-factor authentication (2FA) challenge is required and should be shown.

---

### showLoginForm

```ts
showLoginForm: boolean;
```

Indicates whether the login form should be displayed.

---

### showReCaptcha

```ts
showReCaptcha: boolean;
```

Indicates whether the ReCaptcha challenge should be displayed, typically during registration.

---

### showRegisterForm

```ts
showRegisterForm: boolean;
```

Indicates whether the registration form should be displayed.
