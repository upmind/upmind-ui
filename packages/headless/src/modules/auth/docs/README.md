# Auth Module

## What Is This?

Think of auth like a bouncer at a club. The bouncer knows the rules for each type of guest and applies the right check-in flow:

- **Login** = show your ID → bouncer checks → you're in
- **2FA** = extra check: "What's the code on your phone?"
- **Register** = new visitor fills a form → bouncer creates a record → then checks the ID they just made
- **Guest** = anonymous visitor gets a wristband (guest token) just to browse and hold a basket

The module wraps all credential exchange — login, registration, recovery, 2FA, guest tokens, and link-based email verification — behind one scoped composable, `useAuth()`. It mints tokens and hands them straight to the session layer; it never stores them itself.

## Quick Start

```typescript
import { useAuth } from "@upmind-automation/headless";

const auth = useAuth().as("client");

// Start the login flow, then submit credentials
await auth.useActions().start("login");
const ok = await auth.useActions().resolve({
  username: "jane@example.com",
  password: "s3cret-pass"
});

// Reactive flags for your UI
const { isAuthenticated, is2faRequired, hasErrors } = auth.useMeta();
```

`resolve()` is state-aware: in the login flow it logs in, in the 2FA challenge it verifies the code, in the register flow it registers. One submit handler covers every form.

## Features

| Capability                              | Actor scopes     | How                                              |
| --------------------------------------- | ---------------- | ------------------------------------------------ |
| Username/password login                 | client, staff    | `start("login")` → `resolve(model)`              |
| Two-factor verification                 | client, staff    | `resolve({ token: code })` while `is2faRequired` |
| Registration (with brand custom fields) | client           | `start("register")` → `resolve(model)`           |
| Two-step guest-customer registration    | client (guarded) | `registerAsGuest()`                              |
| Password recovery                       | client, staff    | `start("recover")` → `resolve(model)`            |
| Anonymous guest-token mint              | guest            | machine boots straight into it                   |
| Email verification from a link          | any              | `useVerifyEmail().verifyFromLink()`              |
| Form schemas (JSON Forms)               | all              | `useContext().schema` / `.uischema`              |

## Key Concepts

- **Scoped composable** — `useAuth().as("client")` / `.as("staff")` / `.as("staff").for("client", id)`. The actor decides which services run (password vs admin grant, register allowed vs forbidden).
- **Flow machine, not a session** — each `useAuth()` instance drives one authentication _flow_ to completion. `authenticated` is a final state: once reached, the instance is done and the token has been handed to the session store. Session lifetime, refresh, and identity live in `session-store`.
- **Four-layer return** — `useActions()` (do things), `useContext()` (form model, schemas, errors, token), `useMeta()` (reactive `is*/can*/show*` flags), `useInternals()` (debugging).
- **Validation before wire** — every model change re-validates against the flow's JSON schema; submission validates again before any HTTP fires.

> **🧪 For Testers:** Logging in with a wrong password surfaces an auth error and does not authenticate (`hasErrors` true, `isAuthenticated` false). Logging in with valid credentials on a 2FA-enabled account prompts for a verification code and is _not yet_ authenticated until the correct code is accepted.

> **👩‍💻 For Developers:** Never call the service files directly — they are `@internal`. The machine transitions are the enforcement points (e.g. the guest-checkout guard); a direct service call bypasses them.

> **🔧 For Contributors:** The module is the canonical reference for the scoped-composable + actor-split-services pattern (`.agent/rules/code-composables-scoped.md`, `code-services.md`).

## Documentation

| Doc                                  | What's inside                                                 |
| ------------------------------------ | ------------------------------------------------------------- |
| [architecture.md](./architecture.md) | State machine diagram, data flow, integration points          |
| [usage.md](./usage.md)               | Full API reference with copy-paste examples                   |
| [gotchas.md](./gotchas.md)           | Edge cases: 2FA, guest tokens, refresh, final-state semantics |
| [foundation.md](./foundation.md)     | Platform-level reference (framework-agnostic, for rebuilders) |
| [CHANGELOG.md](./CHANGELOG.md)       | Version history                                               |

## Playground

Auth pages exist under `playgrounds/labs-nuxt/app/pages/auth/` (login, recover, end-to-end index) for manual exercise against staging.
