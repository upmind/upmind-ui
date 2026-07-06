# account

> The post-auth **standing** module: guest → unverified → verified.

## What Is This?

Think of `account` as the paperwork desk you visit _after_ you're through the door.

- **auth** is the bouncer — it checks your ID and lets you in (login, register, 2FA, guest passes).
- **session-store** is your wristband — it says who you are right now and keeps your token fed.
- **account** is the desk where you _finish signing up_: turn a guest pass into a full membership, and prove your email is really yours.

`useAccount` reads the client the session already holds and works out where they sit on the standing arc:

- **Unregistered (guest)** — checked out without registering. Can upgrade to a full client, or just save an order-receipt email.
- **Unverified** — a full client who still owes email verification (only when the brand enforces it).
- **Verified** — done. Nothing owed.

## Quick Start

```ts
import { useAccount } from "@upmind-automation/headless";

// Resolve the active session's account (SELF → the logged-in actor)
const account = useAccount().as("self");

const { isGuest, showVerifyEmailForm, canResend } = account.useMeta();
const { register, verify, resend } = account.useActions();

// Upgrade a guest to a full client
await register({ email, firstname, lastname, password });

// Verify an unverified client's email
const ok = await verify({ code: "123456" });
```

> **🧪 For Testers:** `useAccount().as('self')` resolves the active actor; when the active actor is not a client (guest with no client, or staff), the instance routes to `unavailable` and exposes no standing forms (`canShowForms` is `false`).

## Features

| Capability          | Sub-composable                            | What it does                                                                   |
| ------------------- | ----------------------------------------- | ------------------------------------------------------------------------------ |
| Route standing      | `useMeta()`                               | `isGuest`, `showGuestUpgradeForm`, `showVerifyEmailForm`, `showGuestEmailForm` |
| Upgrade guest       | `useActions().register()`                 | `POST /clients/{id}/complete_registration`                                     |
| Save guest email    | `useActions().updateGuestEmail()`         | `PUT /clients/{id}` (autosave, no-op if unchanged)                             |
| Verify by code      | `useActions().verify()`                   | `POST /clients/verification_code/verify`                                       |
| Resend verification | `useActions().resend()`                   | `POST /clients/resend_verification` (cooldown-gated)                           |
| Switch form         | `useActions().showGuestEmail()` / `set()` | Toggle guest-email vs upgrade form; set the model                              |
| Read form state     | `useContext()`                            | `model`, `schema`, `uischema`, `errors`, `validationErrors`                    |

## Key Concepts

### Standing is derived, not stored

There is no `status` field. The arc is reconstructed from three booleans on the client record:

- `is_guest` → guest vs full
- primary email `verified` → unverified vs verified
- brand `enforceEmailVerification` → whether an unverified full client must verify at all

> **🧪 For Testers:** A full client with an unverified email on a brand that does **not** enforce verification routes to `verified` (no verify form). Flip `enforceEmailVerification` on and the same client routes to `unverified`.

### Guest is checked first

The router checks `is_guest` before it ever looks at email verification. A guest with an unverified email is treated as a guest to upgrade, never as an unverified client to verify.

> **🧪 For Testers:** A client with `is_guest: true` always yields `isGuest === true` and never `showVerifyEmailForm === true`, regardless of the email's verified flag.

### One shared form surface

The guest state hosts two forms — the **upgrade** (register) form and the **order-receipt email** form — on one surface, discriminated by `formType` (`ClientFormType.REGISTER` / `ClientFormType.EMAIL`). `showGuestEmail()` switches to the email form; the upgrade form is the default.

> **🧪 For Testers:** In the guest state, `showGuestUpgradeForm` is `true` by default and `showGuestEmailForm` becomes `true` after calling `showGuestEmail()`; the two are mutually exclusive.

## Documentation

- [architecture.md](./architecture.md) — machine, data flow, relationship to auth + session-store, and why `useAccount` is the canonical scoped-composable exemplar.
- [usage.md](./usage.md) — full API reference with examples.
- [gotchas.md](./gotchas.md) — the sharp edges (verify no-op, 409 semantics, scoping).
- [foundation.md](./foundation.md) — framework-neutral platform spec (for teams rebuilding on the Upmind back end).
- [CHANGELOG.md](./CHANGELOG.md)

## Playground

None yet. Drive the arc through the cart's verify-email overlay and the guest-upgrade / order-receipt-email forms.
