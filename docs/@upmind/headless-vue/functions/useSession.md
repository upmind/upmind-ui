[Upmind](../../packages.md) / [@upmind/headless-vue](../index.md) / useSession

# useSession()

```ts
function useSession(inspector?): any
```

Composable function to manage session-related logic using Vue.
It provides state, context and helpers for session, login and registration processes.

## Parameters

• **inspector?**: `Function`

Optional function that can inspect the session's state and context changes.

## Returns

`any`

Returns an object containing:
- `state`: The current state of the session (e.g., `idle`, `login`, `register`, etc.).
- `context`: The session context holding additional information like form data.
- `errors`: Errors, if any, during the session.
- `meta`: Metadata with various session flags like `isLoading` and `isAuthenticated`.
- `guest`: The state of the guest (unauthenticated user) machine.
- `client`: The state of the client (authenticated user) machine.
- `model`: Current model context in guest state.
- `schema`: Current schema context in guest state.
- `uischema`: Current UI schema context in guest state.
- `user`: User data in client context.
- `reject`: Cancels the current session flow.
- `resolve`: Handles form submission and action resolution based on the current form state (login, register, 2FA).
- `login`: Initiates login action with a model.
- `logout`: Logs out the current user.
- `register`: Initiates the registration process with a model.
- `showLogin`: Shows the login form.
- `showRegister`: Verifies 2FA with the provided token
- `verify2fa(token)`: Verifies 2FA token.
- `verifyReCaptcha(token)`: Verifies ReCaptcha token.
- `transfer`: Transfers the session.
