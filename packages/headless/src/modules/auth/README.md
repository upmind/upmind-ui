# auth module

> **Status:** T1 scaffold landed (FE-2826). Machine, services, composables, and full barrel land in T2.

## What Is This?

Think of `auth` like a bouncer at a club. The bouncer knows the rules for each type of guest — regular customer (client), staff member, anonymous visitor (guest) — and applies the right check-in flow for each.

- **Login** — customer shows ID → bouncer checks → waves through
- **Register** — new visitor fills a form → bouncer creates a record → waves through
- **2FA** — extra check: "What's the code on your phone?"
- **Guest** — anonymous visitor gets a wristband (GUEST token) just to browse

## Module Boundaries (FE-2826 design invariants)

| Invariant | What it means                                                                                                                       |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **F1**    | Composables never call endpoints — services own all server work                                                                     |
| **F2**    | `clientLifecycle` machine + its services live in `session-store/`, NOT `auth/`                                                      |
| **F3**    | `registerAsGuest` routes THROUGH `auth.machine` guest path, guarded by `canRegisterAsGuest`                                         |
| **F4**    | `updateGuestEmail` is PUT `clients/{id}` `{email}`                                                                                  |
| **F5**    | Single `isGuest` mapper in `session-store/session-store.mappers.mapSessionUser` — `auth.mappers.mapClient` does NOT carry `isGuest` |
| **F6**    | `session/` is deleted WHOLESALE only in T6, never before                                                                            |

## Public Surface (post-T2)

```typescript
import {
  useAuth, // Main scoped composable
  useVerifyEmail, // URL-hash email verification flow (M2)
  mapClient, // IClient → Client view model (M7)
  mapIClient // Client → IClient (lossy)
} from "@upmind-automation/headless";
import type { Client, Account } from "@upmind-automation/headless";
```

## Quick Start (post-T2)

```typescript
const auth = useAuth().as("client");

// Login
await auth.useActions().login({ username: "...", password: "..." });

// Scoped state flags
const { isLoading, isAuthenticated } = auth.useMeta();

// Form data
const { model, schema, error } = auth.useContext();
```

## Actor Scopes

| Actor    | Purpose                                                   |
| -------- | --------------------------------------------------------- |
| `guest`  | Anonymous boot mint — GET `access_token grant_type=guest` |
| `client` | Customer login / register / recover / 2FA                 |
| `staff`  | Admin login; impersonation → child-client token           |

## Hotfix Mechanics Hosted Here

| Mechanic                         | Symbol                                                 | File                                                             |
| -------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------- |
| M2 — verify-email link           | `useVerifyEmail`, `verifyFromLink`                     | `useVerifyEmail.ts`, `auth.services.client.email.ts`             |
| M5 — two-step guest registration | `registerAsGuest` (named export)                       | `auth.services.client.ts` (client-scope: mints a guest-customer) |
| M7 — `mapClient` / `mapIClient`  | `mapClient`, `mapIClient`, `mapAccount`, `mapInitials` | `auth.mappers.ts`                                                |

Mechanics M1/M3/M4/M6 live in `session-store/` (per F2 — they are client session-lifecycle, not authentication).

## File Layout

```
auth/
├── auth.types.ts                # All types: AuthContext, Client, Account, etc.
├── auth.mappers.ts              # Form-to-API mappers + Client view-model mappers
├── auth.schemas.ts              # Schema barrel
├── auth.schemas.login.ts        # Login JSON/UI schema
├── auth.schemas.register.ts     # Registration JSON/UI schema
├── auth.schemas.recover.ts      # Recovery JSON/UI schema
├── auth.schemas.twofa.ts        # 2FA JSON/UI schema
├── auth.machine.ts              # XState auth machine (T2)
├── auth.services.ts             # Shared services factory (T2)
├── auth.services.client.ts      # Client-specific auth services + registerAsGuest (M5, T2)
├── auth.services.client.email.ts # verifyFromLink / checkVerifyEmail (M2, T2)
├── auth.services.guest.ts       # Guest auth services (anonymous mint; no registration)
├── auth.services.staff.ts       # Staff auth services (T2)
├── useAuth.ts                   # Main scoped composable (T2)
├── useAuth.actions.ts           # Actions factory (T2)
├── useAuth.actions.client.ts    # Client-specific actions (T2)
├── useAuth.actions.staff.ts     # Staff-specific actions (T2)
├── useAuth.context.ts           # Context factory (T2)
├── useAuth.internals.ts         # Internals sub-composable (T2)
├── useAuth.meta.ts              # Meta factory (T2)
├── useVerifyEmail.ts            # URL-hash verify-email composable (M2, T2)
├── index.ts                     # Public barrel (boot stub in T1; full barrel in T2)
└── README.md                    # This file
```

## Dependencies

- `@upmind-automation/types` — `IClient`, `IToken`, `AccessRoleTypes`, `GrantTypes`
- `session-store` — `useSessionStore`, `persistTokenToStorage` (one-way, no circular)
- `brand` — `useBrand` (schema generators, `canRegisterAsGuest` guard)
- `system` — `useSystem` (country code for registration schema)
- `query` — `useQuery` (all HTTP; services only, never composables — F1)
- `scope` — `ScopeActorTypes`, `ScopeContext`

## State Machine Boundaries

`auth.machine.authenticated` is and must remain `type: "final"`. This is a topology invariant — `mintGuestToken()` in `session-store.services.ts` resolves via `service.onDone` because `authenticated` is `type:"final"`. Any child of `type:"final"` is forbidden by XState semantics. Client session-lifecycle states (`available.{checking,unregistered,unverified,verified}`) live in `session-store/clientLifecycle.machine.ts`, spawned by session-store (F2).

> **For Testers:** The `canRegisterAsGuest` guard (F3b) is non-bypassable — the only way to create a guest-customer CLIENT token is through `auth.machine`'s guest-register path. A direct call to the service would bypass the `GUEST_CHECKOUT_ENABLED` guard; the machine transition is the enforcement point.

> **For Developers:** `mapClient` does NOT populate `isGuest`. If you need `isGuest` on a user object, read from `useActiveSession().useContext().activeUser.isGuest` — that value flows from `mapSessionUser` in `session-store/session-store.mappers.ts` (F5).
