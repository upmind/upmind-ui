# Auth Module Usage

API reference for `useAuth`, `useVerifyEmail`, and the exported register schemas. All examples are copy-paste ready.

## Getting an instance

```typescript
import { useAuth } from "@upmind-automation/headless";

const clientAuth = useAuth().as("client"); // customer flows
const staffAuth = useAuth().as("staff"); // admin login
const impersonation = useAuth().as("staff").for("client", clientId); // staff acting as a client
```

Each instance returns four sub-composables: `useActions()`, `useContext()`, `useMeta()`, `useInternals()`.

## Actions — `useActions()`

### `start(flow?)` _(client)_ / `start()` _(staff)_

Enter an auth flow. Clients can start `"login"` (default), `"register"`, or `"recover"`; staff only login.

```typescript
const { start } = auth.useActions();
await start("register"); // resolves true once the flow's form is ready
```

**Returns:** `Promise<boolean>` — `false` if the flow could not start (e.g. guarded off) within 60s.

### `resolve(model?)`

Smart submit — routes to the right operation for the current state:

| Current state | What resolve does                                              |
| ------------- | -------------------------------------------------------------- |
| 2FA challenge | verifies the code (`{ token: "123456" }`)                      |
| login flow    | authenticates (`{ username, password }`)                       |
| register flow | registers (`{ username, firstname, lastname, password, ... }`) |
| recover flow  | requests a reset email (`{ username }`)                        |

```typescript
const ok = await auth.useActions().resolve({
  username: "jane@example.com",
  password: "s3cret-pass"
});
// ok === true → authenticated (or, for recover, email sent)
// ok === false → failed; read useContext().errors
```

**Returns:** `Promise<boolean>` — resolves when the flow settles (success or error state), never rejects.

### `set(model)`

Update the form model. Triggers parse + schema validation; watch `isValid` / `validationErrors`.

```typescript
auth.useActions().set({ username: "jane@example.com" });
```

### `reject()`

Cancel the current operation (sends `CANCEL`). From a 2FA challenge this restores the pre-challenge model; from a flow it returns to `idle`.

### `registerAsGuest()` _(client only)_

Drive the two-step guest-customer registration (`POST clients/register/guest` → `guest_customer` grant). Gated by the machine's `canRegisterAsGuest` guard (brand config `GUEST_CHECKOUT_ENABLED`).

```typescript
const ok = await auth.useActions().registerAsGuest();
// true  → guest-customer minted and authenticated
// false → guard blocked it (machine stayed idle) or the grant failed
```

### `isReady()`

Wait until the machine finished its initial session check. Client instances settle in `idle`/`login`/`register`/`recover`/`authenticated`; staff in `idle`/`login`/`authenticated`.

```typescript
await auth.useActions().isReady();
```

### `onDone(callback)` / `onError(callback)`

`onDone` fires **only on success** (machine reaches the final `authenticated` state) with `{ token }`. `onError` fires at most once when the attempt settles in a failure state, with the context error. Register **both** for unattended flows — an `onDone`-only wait hangs forever on failure.

```typescript
const { onDone, onError } = auth.useActions();
onDone(({ token }) => console.log("authenticated", token.actor_type));
onError(error => console.warn("auth failed", error));
```

### `destroy()`

Stop the machine and remove the instance from the scope registry. Call on component unmount. Instances also self-destroy when their actor logs out (session-store `onLogout`).

## Context — `useContext()`

| Property                                                                      | Type            | What it is                                        |
| ----------------------------------------------------------------------------- | --------------- | ------------------------------------------------- |
| `model`                                                                       | `AuthModel`     | current form data                                 |
| `schema` / `uischema`                                                         | JSON Forms      | validation + rendering schema for the active flow |
| `errors`                                                                      | `string`        | message from the last failed operation            |
| `validationErrors`                                                            | `ErrorObject[]` | AJV-style field errors (populated on 422s too)    |
| `session`                                                                     | `IToken`        | token minted by this flow (once authenticated)    |
| `currentState`                                                                | `string`        | raw machine state value (debugging)               |
| `scopeActor` / `scopeContext` / `scopeMatrix` / `availableActors` / `brandId` | —               | scope wiring                                      |

## Meta — `useMeta()`

All flags are reactive computeds.

| Flag                                                                              | True when                                                                                 |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `isAuthenticated`                                                                 | flow completed; token handed to session store                                             |
| `is2faRequired` / `show2fa`                                                       | password accepted, waiting for the second factor                                          |
| `isIdle` / `isAvailable`                                                          | no flow active                                                                            |
| `isLoading`                                                                       | initial session check, or register lookups loading                                        |
| `isChecking`                                                                      | form model being parsed/validated                                                         |
| `isValid`                                                                         | current model passes schema validation                                                    |
| `hasErrors`                                                                       | last submit failed (login/register/recover)                                               |
| `isProcessing` / `isAuthenticating`                                               | request in flight                                                                         |
| `isRegisteringAsGuest`                                                            | two-step guest registration in flight                                                     |
| `showLoginForm` / `showRegisterForm` / `showRecoverPasswordForm` / `canShowForms` | which form to render                                                                      |
| `canLogin` / `canRegister` / `canRecover`                                         | capability for this scope (register/recover are self-only — false under a `scopeContext`) |
| `canRegisterAsGuest`                                                              | brand has guest checkout enabled                                                          |

## Full login example (with 2FA branch)

```typescript
const auth = useAuth().as("client");
const actions = auth.useActions();
const { is2faRequired, isAuthenticated } = auth.useMeta();
const { errors } = auth.useContext();

await actions.start("login");
const first = await actions.resolve({ username, password });

if (!first && is2faRequired.value) {
  // password accepted — now the code
  const second = await actions.resolve({ token: codeFromUser });
  if (!second) console.warn("bad code", errors.value);
}
```

> **🧪 For Testers:** With valid credentials on a 2FA account, the first submit leaves the user _not_ authenticated and prompts for a code; entering the correct code authenticates; an incorrect code shows an error and stays on the verification step. A user without 2FA authenticates on the first submit.

## Registration example

```typescript
const auth = useAuth().as("client");
await auth.useActions().start("register"); // loads brand custom fields into the schema

const ok = await auth.useActions().resolve({
  username: "jane@example.com", // used as both email and username
  firstname: "Jane",
  lastname: "Doe",
  password: "s3cret-pass"
});
```

> **🧪 For Testers:** Registering with an email that already has an account fails with a field-level "already in use" error and does not authenticate. Registering with a fresh email creates the account **and** logs the user in (the module chains the login call automatically).

## Email verification — `useVerifyEmail()`

For the landing page of an emailed verification link (`?client_id=…&email_id=…&hash=…`):

```typescript
import { useVerifyEmail } from "@upmind-automation/headless";

useVerifyEmail().verifyFromLink();
// reads the URL params, PATCHes check_verify, refreshes /self, redirects to "/" immediately
```

Fire-and-forget: it never throws, and the redirect happens synchronously — success or failure surfaces via the refreshed session state, not a return value.

> **🧪 For Testers:** Opening a valid verification link marks the email verified (the account's unverified banner/standing clears after the session refreshes). Opening a link with missing or mangled params leaves the email unverified — and no verify request reaches the API when any param is absent.

## Register schemas — `useRegisterSchema` / `useRegisterUischema`

The registration JSON schema + UI schema, optionally extended with custom fields. Exported for reuse (the `account` module's guest-upgrade form consumes them).

```typescript
import {
  useRegisterSchema,
  useRegisterUischema
} from "@upmind-automation/headless";

const schema = useRegisterSchema(customFields);
const uischema = useRegisterUischema(customFields);
```

> **👩‍💻 For Developers:** The service and machine files are `@internal` — import only from the module barrel. If you need session state (is the user logged in? who are they?), that is `useActiveSession` / `useSessionStore` (session-store), not this module.
