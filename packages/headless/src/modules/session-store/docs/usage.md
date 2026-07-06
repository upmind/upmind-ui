# Session Store — Usage

API reference for the session-store composables and the persistence surface. For the mental model, read the [README](./README.md) first; for edge cases, see [Gotchas](./gotchas.md).

> **👩‍💻 For Developers:** `useActiveSession()` is the recommended entry point for reading identity. `useSessionStore()` is the lower-level store — use it for mutations (add / activate / remove) and boot (`initStore`). `useSession(sessionId)` exists for API symmetry and is currently identical to `useActiveSession()` (see [Identity, not scoping](#usesessionsessionid--identity-not-scoping)).

---

## `useActiveSession()`

Returns the four standard sub-composables, all relative to the **currently active** session. It is **not** a scoped composable — there is no `.as(actor)`. Whatever identity is active (guest, client, or staff) is what you read.

```typescript
import { useActiveSession } from "@upmind-automation/headless";

const session = useActiveSession();

const { activeUser, actor, session: token, expiresAt } = session.useContext();
const { isAuthenticated, isGuest, isExpired, canRefresh } = session.useMeta();
const { logout, onLogout, isReady } = session.useActions();
```

### `useContext()`

| Property     | Type                       | Description                                             |
| ------------ | -------------------------- | ------------------------------------------------------- |
| `activeUser` | `Ref<SessionUser \| null>` | Display profile for the active session (null for guest) |
| `actor`      | `Ref<AccessRoleTypes>`     | Active actor: `GUEST` \| `CLIENT` \| `STAFF`            |
| `session`    | `Ref<IToken \| undefined>` | Active session token                                    |
| `sessionId`  | `Ref<string \| undefined>` | Active `actor_id` (undefined for guest)                 |
| `expiresAt`  | `Ref<number \| null>`      | Access-token expiry, Unix epoch ms                      |

### `useMeta()`

| Flag                   | Description                                                                                   |
| ---------------------- | --------------------------------------------------------------------------------------------- |
| `isAuthenticated`      | Active actor is client or staff (not guest)                                                   |
| `isGuest`              | Active actor is guest                                                                         |
| `isClient` / `isStaff` | Active actor is client / staff                                                                |
| `isGuestClient`        | Active session is a client whose `isGuest` flag is set (guest customer, not fully registered) |
| `isUnverified`         | Client, brand enforces email verification, and the primary email is unverified                |
| `isImpersonated`       | Active session has a parent (is being impersonated)                                           |
| `isExpired`            | Access token has passed its expiry                                                            |
| `isAboutToExpire`      | Access token expires within 5 minutes                                                         |
| `canRefresh`           | A usable refresh token exists (not past `refresh_expires_in`)                                 |
| `isAvailable`          | Store has finished initialising                                                               |
| `isLoading`            | Store is syncing with storage / validating tokens                                             |

### `useActions()`

```typescript
const { isAuthenticated, isReady, logout, onLogout } =
  useActiveSession().useActions();

// Await the active session becoming an authenticated user with profile loaded.
// Resolves to SessionUser; REJECTS if the active actor is a guest.
const user = await isAuthenticated(); // use in router guards / async callbacks

await isReady(); // resolves true once the store is initialised
logout(); // ends the active session
const stop = onLogout(actor => {
  /* ... */
}); // fires on any logout; returns unsubscribe
```

> **⚠️** `useActions().isAuthenticated()` is an **async** function that races a 60-second timeout and throws on a guest/unauthenticated session — distinct from `useMeta().isAuthenticated` which is a synchronous reactive flag. Use the meta flag in templates; use the action in guards where you need to _await_ a resolved user.

> **🧪 For Testers:** With a client session active, `useActions().isAuthenticated()` resolves to the loaded user. With only a guest session, it rejects with a "login to continue" error (spec: FE-2825 identity contract). `useMeta().isAuthenticated` is `false` for guest, `true` for client/staff.

### `useSession(sessionId)` — identity, not scoping

`useSession(sessionId)` returns the identical four sub-composables as `useActiveSession()`. The `sessionId` argument is accepted for API symmetry but is **not** used to scope — both resolve to the active identity. FE-2945 reversed an earlier plan to fold auth-standing into `useSession`; it is pure identity with zero scoping.

```typescript
import { useSession } from "@upmind-automation/headless";
const { isAuthenticated } = useSession("client-123").useMeta(); // === useActiveSession()
```

---

## `useSessionStore()`

The lower-level multi-session store. Use it to mutate the session set and to boot the store.

```typescript
import { useSessionStore } from "@upmind-automation/headless";

const store = useSessionStore();
const { activeActor, activeSession, allSessions } = store.useContext();
const { hasMultipleSessions, isScopeAllowed } = store.useMeta();
const { add, activate, remove, logout } = store.useActions();
```

### `initStore(config?)`

Boots the store. Called once by app setup (`useUpmind`), not by feature code. `config.allowedScopes` restricts which actor types the app instance may activate.

```typescript
import { AccessRoleTypes } from "@upmind-automation/types";

// Storefront: client + guest only
await useSessionStore().initStore({
  allowedScopes: [AccessRoleTypes.CLIENT, AccessRoleTypes.GUEST]
});

// Admin console: staff only
await useSessionStore().initStore({ allowedScopes: [AccessRoleTypes.STAFF] });

// Default: all scopes
await useSessionStore().initStore();
```

> **🧪 For Testers:** After `initStore()` resolves, an active session always exists — a guest token is minted if no cookie-backed session is present (spec: FE-2825 §6 guest-mint seam; README "Guaranteed Active Session"). With `allowedScopes: [STAFF]`, adding a client token stores it but must **not** activate it.

### `useActions()`

| Action                  | Signature                                                           | Description                                                                                                                                                                                          |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `add`                   | `add(token, shouldActivate = true, user?, event?) => Promise<void>` | Store a token under its actor; optionally activate. Loads the display user in the background if not supplied. `event` (`"login"`/`"sign_up"`) busts the cached profile and fires the analytics event |
| `activate`              | `activate(actor, sessionId?)`                                       | Move the active pointer. No-op if the scope is disallowed                                                                                                                                            |
| `get`                   | `get(actor, sessionId?) => IToken \| undefined`                     | Read a stored token (first for the actor if no id)                                                                                                                                                   |
| `remove`                | `remove(actor, sessionId?)`                                         | Drop a session from state (does **not** remove the cookie — use `logout` for that). Restores the parent if it was an impersonation                                                                   |
| `logout`                | `logout(actor?)`                                                    | Remove cookie **and** state for the actor (default: active); restores parent if impersonating                                                                                                        |
| `clear`                 | `clear()`                                                           | Wipe all sessions, reset to guest                                                                                                                                                                    |
| `registerImpersonation` | `registerImpersonation(impersonatedSessionId)`                      | Link the current active session as the parent — call **before** `add` of the impersonated token                                                                                                      |
| `updateUser`            | `updateUser(actor, sessionId, user)`                                | Replace a session's display user without refetching                                                                                                                                                  |
| `getExpiresAt`          | `getExpiresAt(token?) => number \| null`                            | Expiry timestamp from `created_at + expires_in`                                                                                                                                                      |
| `refresh`               | `refresh()`                                                         | Re-hydrate state from cookies + storage (used after email verification etc.)                                                                                                                         |
| `isReady`               | `isReady() => Promise<boolean>`                                     | Resolves true once initialised                                                                                                                                                                       |
| `onLogout`              | `onLogout(cb) => () => void`                                        | Subscribe to logout events; returns unsubscribe                                                                                                                                                      |

```typescript
const { add, activate, remove, logout, clear } = useSessionStore().useActions();

await add(token); // store + activate
activate(AccessRoleTypes.CLIENT, "client-123"); // switch active session
remove(AccessRoleTypes.CLIENT, "client-123"); // drop from state (cookie stays)
logout(); // drop active session + its cookie
```

> **🧪 For Testers:** `add(token)` with no `user` triggers a background `/self` load — `activeUser` populates asynchronously. `add(token, false)` stores without activating: `activeActor` is unchanged. `remove` leaves the cookie; `logout` removes it — verify the `upm_{actor}_session` cookie afterwards (spec: source `dumpTokenFromStorage`).

### `useContext()`

| Property                           | Type                                              | Description                                         |
| ---------------------------------- | ------------------------------------------------- | --------------------------------------------------- |
| `activeActor`                      | `Ref<AccessRoleTypes>`                            | Active actor type                                   |
| `activeSession`                    | `Ref<IToken \| undefined>`                        | Active token                                        |
| `activeSessionId`                  | `Ref<string \| undefined>`                        | Active `actor_id`                                   |
| `activeUser`                       | `Ref<SessionUser \| null>`                        | Active display user                                 |
| `allSessions`                      | `Ref<Record<string, SessionEntry>>`               | Client + staff sessions merged, keyed by `actor_id` |
| `clientSessions` / `staffSessions` | `Ref<Record<string, SessionEntry>>`               | Scope-filtered session maps                         |
| `guestSession`                     | `Ref<IToken \| undefined>`                        | The single guest token                              |
| `impersonatedSession`              | `Ref<{ impersonatedId, impersonatorId } \| null>` | Active impersonation, if any                        |
| `impersonatedSessions`             | `Ref<Record<string, string>>`                     | impersonated id → parent id                         |
| `expiresAt`                        | `Ref<number \| null>`                             | Active-session expiry                               |

`allSessions` is a **record keyed by `actor_id`**, and each value is a `SessionEntry` (`{ scope, token, user }`):

```typescript
import { values } from "lodash-es";
const { allSessions } = useSessionStore().useContext();

// Render a session switcher
values(allSessions.value).forEach(entry => {
  console.log(entry.scope, entry.user?.email ?? entry.token.actor_id);
});
```

### `useMeta()`

| Flag                                                       | Description                                     |
| ---------------------------------------------------------- | ----------------------------------------------- |
| `hasClientSession` / `hasStaffSession` / `hasGuestSession` | At least one session of that actor exists       |
| `hasMultipleSessions`                                      | More than one client+staff session total        |
| `hasImpersonatedSessions`                                  | At least one impersonation link exists          |
| `isAvailable`                                              | Store initialised                               |
| `isLoading`                                                | Syncing / validating                            |
| `isScopeAllowed(actor)`                                    | The actor scope is permitted by `allowedScopes` |

---

## Persistence surface (curated re-exports)

These are exported from the barrel for cross-module consumers (chiefly `auth`).

| Export                  | Signature                                       | Use                                                                                                                                        |
| ----------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `persistTokenToStorage` | `(token, opts?: { event? }) => Promise<IToken>` | Write a token to its `upm_{actor}_session` cookie (8h) and sync it into the store via `add`. The path `auth` uses after a successful grant |
| `getTokenFromStorage`   | `(actor_type?) => Token`                        | Read a token from cookies. With no actor, returns staff → client → guest (first present)                                                   |
| `dumpTokenFromStorage`  | `(actor_type) => void`                          | Remove a token cookie and its store state; fires the logout analytics event for client/staff                                               |
| `mapSessionUser`        | `(self: ISelf) => SessionUser`                  | Map a `/self` response into the display-user view-model                                                                                    |
| `authSubscription`      | XState callback-actor factory                   | Emits `SESSION` / `AUTHENTICATED` / `UNAUTHENTICATED` to a machine as the active identity changes                                          |

```typescript
import {
  persistTokenToStorage,
  getTokenFromStorage
} from "@upmind-automation/headless";

// After a grant (what auth does):
await persistTokenToStorage(token, { event: "login" });

// Read the current client token straight from the cookie:
const clientToken = getTokenFromStorage(AccessRoleTypes.CLIENT);
```

> **🧪 For Testers:** `persistTokenToStorage(token)` writes the `upm_{actor}_session` cookie **and** adds the session to the store — assert both. Passing `{ event: "login" }` invalidates the cached `/self` so a change made elsewhere (e.g. a freshly verified email) is seen, not the stale snapshot (spec: source `add` login-invalidation branch). `persistTokenToStorage` with a token missing `access_token` throws.

---

## Impersonation

Impersonation is driven through `auth`'s scoped API; session-store records and restores the parent link.

```typescript
import {
  ScopeActorTypes,
  useAuth,
  useSessionStore
} from "@upmind-automation/headless";

// Staff, currently active as staff-123, impersonates a client
const staffAuth = useAuth()
  .as(ScopeActorTypes.STAFF)
  .for(ScopeActorTypes.CLIENT, "client-456");
await staffAuth.useActions().resolve(credentials);
// → activeActor: CLIENT, activeSessionId: "client-456", isImpersonated: true

// End impersonation — parent staff session is restored
useSessionStore().useActions().logout();
// → activeActor: STAFF, activeSessionId: "staff-123"
```

> **🧪 For Testers:** Ending an impersonated session restores the parent identity **only if the parent session still exists**; the parent link is memory-only, so a page reload during impersonation loses it (spec: architecture "Impersonation Safety", source `remove` parent-restore branch).
