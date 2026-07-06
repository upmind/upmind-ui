# account — Usage

Full API reference for `useAccount`. Every capability carries a 🧪 **For Testers** expected-behaviour statement — these are the assertion source for the account test campaign.

## Getting an instance

```ts
import { useAccount } from "@upmind-automation/headless";

const account = useAccount().as("self"); // active session's actor
// or
const account = useAccount().as("client"); // client scope explicitly
```

`useAccount` is a scoped composable returning four sub-composables:

| Layer     | Access                   | Contains                         |
| --------- | ------------------------ | -------------------------------- |
| Actions   | `account.useActions()`   | mutations + lifecycle            |
| Context   | `account.useContext()`   | reactive form data               |
| Meta      | `account.useMeta()`      | reactive state flags             |
| Internals | `account.useInternals()` | raw `send` / `state` / `service` |

> **🧪 For Testers:** `useAccount` only supports client scope. `ACCOUNT_SCOPE_MATRIX` maps `self` and `guest` to `null` (not actionable), and both `staff` and `client` to `CLIENT`. Requesting an unsupported scope yields no client lifecycle (the instance sits in `unavailable`).

## Actions — `useActions()`

### `register(model)`

Upgrades a guest client to a full registered client.

| Param                | Type                      | Required |
| -------------------- | ------------------------- | -------- |
| `model.email`        | `string`                  | ✅       |
| `model.firstname`    | `string`                  | ✅       |
| `model.lastname`     | `string`                  | ✅       |
| `model.password`     | `string`                  | ✅       |
| `model.phone`        | `IPhoneData`              | —        |
| `model.customFields` | `Record<string, unknown>` | —        |

**Returns:** `Promise<boolean>` — `true` once the machine settles in `available.verified`, `available.unverified`, or `complete`/`done`; `false` on `available.unregistered.error`.

> **🧪 For Testers:** A successful `register()` POSTs to `/clients/{id}/complete_registration` and resolves `true` when the account leaves the guest state (`isGuest` becomes `false`) — landing either in the verify-email step (`showVerifyEmailForm === true`) or fully settled. It is **not** only `true` when verified. The session stays signed in throughout — the upgrade never prompts a re-login. On a validation failure it resolves `false` and `useMeta().hasErrors` is `true`.

### `verify(model)`

Submits the email-verification OTP code for an unverified client.

| Param        | Type               | Required |
| ------------ | ------------------ | -------- |
| `model.code` | `string` (6-digit) | ✅       |

**Returns:** `Promise<boolean>` — `true` when the machine reaches `available.verified`; `false` on `challenging.invalid` or `challenging.error`.

> **🧪 For Testers:** `verify({ code })` POSTs `{ code }` to `/clients/verification_code/verify`; on `2xx` it resolves `true` and `showVerifyEmailForm` becomes `false` immediately — without waiting for a background profile refetch. An empty/missing code resolves `false` with **no request fired**, and `useContext().errors` is populated.

### `resend()`

Resends the verification email. Cooldown-gated.

**Returns:** `void` (fire-and-forget; observe `useMeta()`).

> **🧪 For Testers:** `resend()` is only accepted while `useMeta().canResend` is `true` (resend region idle). It POSTs to `/clients/resend_verification`; on success `resendComplete` becomes `true` and a 15-second cooldown holds `canResend` `false` before it returns to idle. A `409` (already verified) sets `resendFailed`/`hasErrors`.

### `updateGuestEmail(model)`

Autosaves the guest client's order-receipt email.

| Param         | Type     | Required |
| ------------- | -------- | -------- |
| `model.email` | `string` | ✅       |

**Returns:** `Promise<boolean>`.

> **🧪 For Testers:** `updateGuestEmail({ email })` is a **no-op that resolves `true` without any request** when `email` already equals the persisted value. Only a changed value fires the request — a PUT of `{ email }` to `/clients/{id}`.

### `showGuestEmail()`

Switches the guest form surface to the order-receipt email schema.

> **🧪 For Testers:** After `showGuestEmail()`, `useMeta().showGuestEmailForm` is `true` and `showGuestUpgradeForm` is `false`; the context `schema`/`uischema` become the guest-email form's.

### `set(model)`

Sets the active form model (triggers parse → validate).

> **🧪 For Testers:** `set(model)` re-parses and re-validates the active form. A valid model leaves `validationErrors` empty; an invalid one populates `useContext().validationErrors`. Model changes are ignored (no-op) while `isProcessing` is `true` (a request in flight).

### `cancel()`

Cancels the active form, returning it to `checking`.

> **🧪 For Testers:** `cancel()` resets the active form back to an editable, re-validating state; in-flight requests are unaffected.

### `destroy()`

Stops the service and removes the instance from the scope registry.

> **🧪 For Testers:** `destroy()` stops the XState service **and** removes the scope-registry entry, so the next `useAccount().as(...)` call for the same scope mints a fresh instance (not a stale cached one). Call on component unmount.

## Context — `useContext()`

| Property           | Type                                                               | Meaning                                     |
| ------------------ | ------------------------------------------------------------------ | ------------------------------------------- |
| `errors`           | `string \| undefined`                                              | Active form error message (`error.message`) |
| `model`            | `CompleteRegistrationModel \| GuestEmailModel \| VerifyEmailModel` | Active form data                            |
| `schema`           | `JsonSchema`                                                       | Active form JSON schema                     |
| `uischema`         | `UISchemaElement`                                                  | Active form UI schema                       |
| `validationErrors` | `ErrorObject[]`                                                    | Field-level AJV errors (`error.data`)       |

> **🧪 For Testers:** `model`/`schema`/`uischema` reflect the _active_ form — they swap when `formType` changes (upgrade → email → verify). `validationErrors` is populated only after a failed validation (`error.data`); a successful validation leaves it empty.

## Meta — `useMeta()`

| Flag                       | True when                                                           |
| -------------------------- | ------------------------------------------------------------------- |
| `isGuest`                  | machine in `available.unregistered` (aliased from `isUnregistered`) |
| `showGuestUpgradeForm`     | unregistered **and** `formType === REGISTER`                        |
| `showGuestEmailForm`       | unregistered **and** `formType === EMAIL`                           |
| `showVerifyEmailForm`      | machine in `available.unverified.challenging`                       |
| `canShowForms`             | any of upgrade / verify / guest-email form is active                |
| `isCompletingRegistration` | in `available.unregistered.registering`                             |
| `isResending`              | in `available.unverified.resend.processing`                         |
| `resendComplete`           | in `available.unverified.resend.complete`                           |
| `resendFailed`             | in `available.unverified.resend.error`                              |
| `canResend`                | in `available.unverified.resend.available`                          |
| `isProcessing`             | any verify / register / update / resend request in flight           |
| `hasErrors`                | any form error state (unregistered / challenging / resend error)    |

> **🧪 For Testers:** `isGuest` and `showVerifyEmailForm` are mutually exclusive — a guest is never in the verify challenge. `isProcessing` is `true` during any of the four in-flight sub-states and `false` otherwise. `canShowForms` is `false` when the instance is `unavailable` (non-client actor).

## Internals — `useInternals()`

Exposes `actorScope`, raw `send`, `service`, and `state` for testing/debugging. Not for production consumers.

## Types

```ts
import {
  useAccount,
  ClientFormType, // { REGISTER: "register", EMAIL: "email" }
  ACCOUNT_SCOPE_MATRIX,
  AccountContextTypes, // { CLIENT }
  type UseAccount,
  type UseAccountActions,
  type UseAccountContext,
  type UseAccountMeta,
  type UseAccountInternals,
  type AccountScopeMatrix,
  type CompleteRegistrationModel,
  type GuestEmailModel,
  type VerifyEmailModel
} from "@upmind-automation/headless";
```
