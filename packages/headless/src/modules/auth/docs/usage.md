# Auth Module Usage

API reference for `useAuth`, `useVerifyEmail`, `useVerifyRegistration`, and the exported register schemas. All examples are copy-paste ready.

## Getting an instance

```ts
import {
  AuthContextTypes,
  ScopeActorTypes,
  useAuth
} from "@upmind-automation/headless";

const clientId = "825d96e7-63ed-0913-46c4-174825283406";

const clientAuth = useAuth().as(ScopeActorTypes.CLIENT); // customer flows
const staffAuth = useAuth().as(ScopeActorTypes.STAFF); // admin login
// staff acting as a client
const impersonation = useAuth()
  .as(ScopeActorTypes.STAFF)
  .for(AuthContextTypes.CLIENT, clientId);
```

Each instance returns four sub-composables: `useActions()`, `useContext()`, `useMeta()`, `useInternals()`.

## Actions — `useActions()`

### `start(flow?)` _(client)_ / `start()` _(staff)_

Enter an auth flow. Clients can start `AuthFlowTypes.LOGIN` (the default), `AuthFlowTypes.REGISTER`, or `AuthFlowTypes.RECOVER`; staff only login. The parameter is the **enum**, not a bare string — `start("register")` does not typecheck.

```ts
import {
  AuthFlowTypes,
  ScopeActorTypes,
  useAuth
} from "@upmind-automation/headless";

const auth = useAuth().as(ScopeActorTypes.CLIENT);

const { start } = auth.useActions();
await start(AuthFlowTypes.REGISTER); // resolves true once the form is ready
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

```ts
import { ScopeActorTypes, useAuth } from "@upmind-automation/headless";

const auth = useAuth().as(ScopeActorTypes.CLIENT);

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

```ts
import { ScopeActorTypes, useAuth } from "@upmind-automation/headless";

const auth = useAuth().as(ScopeActorTypes.CLIENT);

auth.useActions().set({ username: "jane@example.com" });
```

### `reject()`

Cancel the current operation (sends `CANCEL`). From a 2FA challenge this restores the pre-challenge model; from a flow it returns to `idle`.

### `registerAsGuest()` _(client only)_

Drive the two-step guest-customer registration (`POST clients/register/guest` → `guest_customer` grant). Gated by the machine's `canRegisterAsGuest` guard (brand config `GUEST_CHECKOUT_ENABLED`).

```ts
import { ScopeActorTypes, useAuth } from "@upmind-automation/headless";

const auth = useAuth().as(ScopeActorTypes.CLIENT);

// `useActions()` is typed as the UNION of the staff and client action sets, so
// the client-only members need narrowing before they are reachable. This `in`
// check is what the live Register.vue consumer does.
const actions = auth.useActions();
if ("registerAsGuest" in actions) {
  const ok = await actions.registerAsGuest();
  // true  → guest-customer minted and authenticated
  // false → guard blocked it (machine stayed idle) or the grant failed
  console.log(ok);
}
```

### `isReady()`

Wait until the machine finished its initial session check. Client instances settle in `idle`/`login`/`register`/`recover`/`authenticated`; staff in `idle`/`login`/`authenticated`.

```ts
import { ScopeActorTypes, useAuth } from "@upmind-automation/headless";

const auth = useAuth().as(ScopeActorTypes.CLIENT);

await auth.useActions().isReady();
```

### `onDone(callback)` / `onError(callback)`

`onDone` fires **only on success** (machine reaches the final `authenticated` state) with `{ token }`. `onError` fires at most once when the attempt settles in a failure state, with the context error. Register **both** for unattended flows — an `onDone`-only wait hangs forever on failure.

```ts
import { ScopeActorTypes, useAuth } from "@upmind-automation/headless";

const auth = useAuth().as(ScopeActorTypes.CLIENT);

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

```ts
import {
  AuthFlowTypes,
  ScopeActorTypes,
  useAuth
} from "@upmind-automation/headless";

declare const username: string;
declare const password: string;
declare const codeFromUser: string;

const auth = useAuth().as(ScopeActorTypes.CLIENT);
const actions = auth.useActions();
const { is2faRequired } = auth.useMeta();
const { errors } = auth.useContext();

await actions.start(AuthFlowTypes.LOGIN);
const first = await actions.resolve({ username, password });

if (!first && is2faRequired.value) {
  // password accepted — now the code
  const second = await actions.resolve({ token: codeFromUser });
  if (!second) console.warn("bad code", errors.value);
}
```

> **🧪 For Testers:** With valid credentials on a 2FA account, the first submit leaves the user _not_ authenticated and prompts for a code; entering the correct code authenticates; an incorrect code shows an error and stays on the verification step. A user without 2FA authenticates on the first submit.

## Registration example

```ts
import {
  AuthFlowTypes,
  ScopeActorTypes,
  useAuth
} from "@upmind-automation/headless";

const auth = useAuth().as(ScopeActorTypes.CLIENT);
// loads brand custom fields into the schema
await auth.useActions().start(AuthFlowTypes.REGISTER);

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

```ts
import { useVerifyEmail } from "@upmind-automation/headless";

useVerifyEmail().verifyFromLink();
// reads the URL params, PATCHes check_verify, refreshes /self, redirects to "/" immediately
```

Fire-and-forget: it never throws, and the redirect happens synchronously — success or failure surfaces via the refreshed session state, not a return value.

> **🧪 For Testers:** Opening a valid verification link marks the email verified (the account's unverified banner/standing clears after the session refreshes). Opening a link with missing or mangled params leaves the email unverified — and no verify request reaches the API when any param is absent.

## Registration activation landing — `useVerifyRegistration()`

For the landing page of a registration-activation link (`?username=…&hash=…&expires=…&redirect=…`). The composable checks the link, verifies it with the API, asks for a password when the account has none, completes the registration and saves the client token. It never navigates: the page reads the outcome and routes.

```ts
import {
  ScopeActorTypes,
  useVerifyRegistration
} from "@upmind-automation/headless";

declare const query: {
  username?: string;
  hash?: string;
  expires?: string;
  redirect?: string;
};
declare function goTo(path: string): void;

const landing = useVerifyRegistration().as(ScopeActorTypes.SELF);
const actions = landing.useActions();
const { currentState, redirect, error } = landing.useContext();
const { isSuccess, isExpiredOrInvalid } = landing.useMeta();

actions.verify(query);
await actions.isReady();

if (isSuccess.value) goTo(redirect.value ?? "/");
else if (isExpiredOrInvalid.value) console.warn(error.value?.message);
// currentState.value === "needsPassword" -> render the set-password form

actions.destroy(); // on unmount
```

Pass the raw link values to `verify()`. A missing `username` or `hash`, or an `expires` in the past, ends in `expiredOrInvalid` with no verify request sent.

### Actions

| Action                   | Effect                                                                                                                                     |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `verify(params)`         | Starts the landing with the raw link values. Handled only in `idle`.                                                                       |
| `set(model)`             | Merges a partial set-password model. While the form shows validation errors, each `set()` re-validates, so a fixed field clears its error. |
| `completeRegistration()` | Submits the set-password form. Validates first; no request is sent while the form is invalid. No effect outside `needsPassword`.           |
| `reset()`                | Runs the link check again from any state except `idle`.                                                                                    |
| `isReady()`              | Resolves once the landing settles at `needsPassword` or an outcome.                                                                        |
| `destroy()`              | Stops the instance and removes it from the registry.                                                                                       |

### Context

`currentState` (`"needsPassword"` is the form view key), `data` (mapped verify answer), `error` (published failure, with the API `apiCode` when the API sent one), `model` (set-password form model, prefilled with the link username), `redirect` (same-app return path, `undefined` when unsafe or absent; navigate without decoding it), `schema` and `uischema` (the set-password form), `sessionId` (the new client session id, set when the grant succeeds), `twoFAProvider` (lower-cased provider, `""` when none, `null` before the verify) and `validationErrors` (pass to `UpmForm` `additionalErrors`).

### Meta

`isVerifying`, `isProcessing`, `isSuccess` (alias `isComplete`), `isExpiredOrInvalid`, `needsPassword`, `needsCompleteStep`, `twoFARequired`, `hasErrors`, `hasValidationErrors`. `needsPassword` is not a view key; branch on `currentState`.

### Failures

A refused link, a past expiry and a failed set-password grant all end in `expiredOrInvalid`. A failed grant for an account that already has a password ends in `completionFailed`. A blocked IP answers 403 with API code `ip_address_disallowed`; test `error.status === 403 && error.apiCode === "ip_address_disallowed"` first and show `error.message` rather than the expired message.

### Waiting for the new user

`success` means the client token is saved, not that the session switch has finished. The new session becomes active after its `/self` request settles. A consumer that needs the user before it navigates waits in two steps. Read the instance-key and signed-in-client caveats in the gotchas first (gotcha 12).

```ts
import {
  ScopeActorTypes,
  useActiveSession,
  useVerifyRegistration
} from "@upmind-automation/headless";
import { until } from "@vueuse/core";

const landing = useVerifyRegistration().as(ScopeActorTypes.SELF);
const { sessionId } = landing.useContext();
const session = useActiveSession();

// 1. wait for the new session to become the active one
await until(session.useContext().sessionId).toBe(sessionId.value);
// 2. then read the outcome of its /self request: the user, or a rejection
const user = await session.useActions().whenAuthenticated();
```

> **🧪 For Testers:** Opening a valid link for an account with no password shows the set-password form; a mismatched confirmation keeps the form up with a field error and sends nothing. Opening a link for an account that has a password signs the user in with no form. A link with a missing value, a past expiry or a refused verify shows the expired state.

> **👩‍💻 For Developers:** Hold the one instance you created. Do not call `.as("self")` again after `success`; see gotcha 12.

## Register schemas — `useRegisterSchema` / `useRegisterUischema`

The registration JSON schema + UI schema, optionally extended with custom fields. Exported for reuse (the `account` module's guest-upgrade form consumes them).

```ts
import {
  useRegisterSchema,
  useRegisterUischema,
  type CustomField
} from "@upmind-automation/headless";

declare const customFields: CustomField[];

const schema = useRegisterSchema(customFields);
const uischema = useRegisterUischema(customFields);
```

> **👩‍💻 For Developers:** The service and machine files are `@internal` — import only from the module barrel. If you need session state (is the user logged in? who are they?), that is `useActiveSession` / `useSessionStore` (session-store), not this module.
