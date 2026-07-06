# Session Store Architecture

## Overview

The session-store module is built on TanStack Store and provides multi-session management with cross-tab synchronization. It's a **stateful singleton** (one store per app) that persists to cookies and syncs across browser tabs via BroadcastChannel.

## State Model

```typescript
type SessionState = {
  // Sessions
  guestSession?: IToken; // Single guest token
  clientSessions: Record<string, SessionEntry>; // Multiple client sessions by actor_id
  staffSessions: Record<string, SessionEntry>; // Multiple staff sessions by actor_id

  // Active session tracking
  activeActor: AccessRoleTypes; // GUEST | CLIENT | STAFF
  activeSessionId?: string; // actor_id of active session (undefined for guest)

  // Impersonation tracking
  impersonatedSessions: Record<string, string>; // impersonatedId → parentId
};

// Session entry pairs token with optional user profile
type SessionEntry = {
  token: IToken; // OAuth token (access_token, refresh_token, etc.)
  user?: SessionUser; // Optional user profile for UI (email, fullName, avatar)
};
```

### Design Decisions

**Why `SessionEntry` instead of just `IToken`?**

1. **Separation of concerns** - Token for API auth, user profile for UI display
2. **Session switcher support** - Store display name/avatar alongside token
3. **Future extensibility** - Can add preferences, permissions, etc. without changing structure
4. **Type safety** - Clear distinction between token data and user data

**Why keyed by `actor_id`?**

- Allows multiple sessions per actor type (e.g., client A and client B)
- Natural key for session lookup and activation
- Maps to OAuth token structure

**Why separate `clientSessions` and `staffSessions`?**

- Type safety (know which actors are which)
- Faster lookups (don't need to filter by `actor_type`)
- Clear separation in UI (client dropdown vs staff dropdown)

**Why single `guestSession`?**

- Guests are anonymous - no `actor_id` to key by
- Only one guest session makes sense (no multi-guest scenarios)
- Simpler logic (no need for keyed lookup)

## Data Flow

### Adding a Session

```text
add(token, shouldActivate=true, user?)
  │
  ├─▶ Determine actor type from token.actor_type
  │
  ├─▶ Update appropriate session record:
  │    - GUEST → guestSession = token
  │    - CLIENT → clientSessions[token.actor_id] = { token, user }
  │    - STAFF → staffSessions[token.actor_id] = { token, user }
  │
  ├─▶ Optionally activate (set activeActor and activeSessionId)
  │
  └─▶ Broadcast to other tabs (SET_SESSION message)
```

### Removing a Session

```text
remove(actor, sessionId?)
  │
  ├─▶ Capture current state:
  │    - Is this the active session?
  │    - Does it have a parent (impersonation)?
  │
  ├─▶ Remove from state:
  │    - Delete from clientSessions/staffSessions
  │    - Clean up impersonatedSessions entry
  │
  ├─▶ If active session was removed:
  │    ├─▶ If has parent → restore parent session
  │    └─▶ Else → fall back to next available session
  │
  └─▶ Broadcast to other tabs (REMOVE_SESSION message)
```

### Impersonation Flow

Impersonation is handled via the scoped auth API with `.for()`:

```text
Staff Session Active (staff-123)
  │
  ├─▶ useAuth().as(STAFF).for(CLIENT, 'client-456')
  │    └─▶ Auth machine mints impersonation token
  │
  ├─▶ Token added to session-store automatically
  │    ├─▶ impersonatedSessions['client-456'] = 'staff-123' (registered internally)
  │    └─▶ activeActor = CLIENT, activeSessionId = 'client-456'
  │
  │   ... staff works as client ...
  │
  └─▶ logout() (or remove(CLIENT, 'client-456'))
       │
       ├─▶ Find parent: impersonatedSessions['client-456'] = 'staff-123'
       ├─▶ Activate parent: activate(STAFF, 'staff-123')
       └─▶ Clean up: delete impersonatedSessions['client-456']

       → Staff session restored! ✅
```

**Implementation details:**

- The auth machine's staff services detect `scopeContext` (set via `.for()`)
- When present, it mints an impersonation token instead of a regular staff token
- The session-store's `add()` action detects impersonation tokens and auto-registers the parent
- Parent session is restored when the impersonated session is removed

### Logout Flow

```text
logout(actor?)
  │
  ├─▶ Determine target actor (default to activeActor)
  │
  ├─▶ dumpTokenFromStorage(actor)
  │    ├─▶ Remove cookie
  │    └─▶ Calls remove(actor, sessionId) internally
  │         └─▶ Handles impersonation restoration
  │
  ├─▶ notifyLogoutSubscribers(actor)
  │    └─▶ Call all registered callbacks
  │
  └─▶ Broadcast ({ type: "UNAUTHENTICATED", actor } message)
```

The `dumpTokenFromStorage` function is the **source of truth** for logout - it handles both cookie removal and state removal in correct order.

## Sub-Composables

The module uses the factory pattern with specialized sub-composables:

| Sub-composable      | Purpose                                                | Returns               |
| ------------------- | ------------------------------------------------------ | --------------------- |
| `useSessionStore()` | Main entry point, wires sub-composables                | Factory object        |
| `useActions()`      | Mutations (add, remove, activate, logout, clear)       | Action functions      |
| `useContext()`      | Computed state (activeSession, allSessions, expiresAt) | Reactive refs         |
| `useMeta()`         | State flags (isAuthenticated, isImpersonated, etc.)    | Boolean computed refs |
| `useInternals()`    | Debug access to raw store and channel                  | Internal objects      |

**Why separate?**

- **Performance** - Only subscribe to what you need
- **Clarity** - Clear API surface (read vs write)
- **Testability** - Can test sub-composables independently
- **Tree-shaking** - Unused composables can be removed by bundler

## Cross-Tab Sync

Uses **BroadcastChannel** for real-time sync across browser tabs:

```typescript
// On Tab A
add(token)
  └─▶ Broadcasts: { type: "SET_SESSION", session: token }

// Tab B receives and updates its store state automatically
```

### Sync Message Types

```typescript
type SessionSyncMessage =
  | { type: "SET_SESSION"; session: IToken }
  | { type: "REMOVE_GUEST" }
  | { type: "REMOVE_SESSION"; actor: AccessRoleTypes; sessionId: string }
  | { type: "UNAUTHENTICATED"; actor: AccessRoleTypes }
  | { type: "CLEAR" }
  | {
      type: "IMPERSONATION_REGISTERED";
      impersonatedSessionId: string;
      impersonatorSessionId: string;
    };
```

**Note:** User profiles are **NOT** synced via BroadcastChannel (only tokens). This is intentional:

- Reduces message size
- User profiles are populated by auth module after login
- Each tab can load user data independently if needed

> **⚠️ Broadcasts on every switch, not only login/logout.** The ratified model requires only login and logout to propagate across tabs, applied like-for-like; switching between already-held sessions in one tab must stay tab-local. The current `add()`/`activate()` path broadcasts `SET_SESSION` unconditionally, including on switches — wider than the contract allows. `docs/sdd/FE-2825/design.md` §5.1 separately proposed that the receiver stop trusting the broadcast payload and re-hydrate from the cookie instead; that payload-trust question is real but narrower, and doesn't by itself fix the over-broadcast gap — see [Gotchas §8](./gotchas.md#8-cross-tab-set_session-broadcasts-on-every-session-add-not-only-loginlogout) and [FE-2825-note.md](./FE-2825-note.md).

### Cookie Sync

In addition to BroadcastChannel, the store monitors cookie changes:

```typescript
initCookieSync()  // Start monitoring
  └─▶ CookieStore API listener (or 2s poll fallback)
       └─▶ On change → hydrateFromStorage()
            └─▶ Re-read cookies and update state
```

**Why both BroadcastChannel and cookies?**

- **BroadcastChannel** - Fast, real-time, same-origin only
- **Cookies** - Persistent, server-accessible, survives page reload
- **Together** - Best of both worlds (instant sync + persistence)

## Persistence Strategy

### Cookie Keys

| Actor Type | Cookie Name          | Scope            |
| ---------- | -------------------- | ---------------- |
| Guest      | `upm_guest_session`  | Browser-specific |
| Client     | `upm_client_session` | Domain-wide      |
| Staff      | `upm_user_session`   | Domain-wide      |
| Admin      | `upm_admin_session`  | Domain-wide      |

> **Staff cookie name:** `AccessRoleTypes.STAFF` is the string `"user"` on the wire, so the staff cookie is `upm_user_session` (built as `upm_${actor_type}_session`). `upm_admin_session` is watched by cookie-sync but is **not** hydrated by `getTokenFromStorage`.

**Storage format:** JSON-encoded `IToken` object

### Initialization Sequence

The session store uses **async initialization with guaranteed active session**:

```mermaid
sequenceDiagram
    participant App as Application
    participant Store as Session Store
    participant Cookies as Cookie Storage
    participant Auth as Auth Module
    participant API as API (/self)

    Note over Store: 1. Sync Default State
    App->>Store: Import sessionStore
    Store->>Store: Create with default guest state
    Note over Store: activeActor: GUEST<br/>no token yet

    Note over Store: 2. Async Initialization
    App->>Store: initStore() / isReady() promise starts
    Store->>Cookies: Read upm_user_session (staff)
    Cookies-->>Store: staff token or null
    Store->>Cookies: Read upm_client_session
    Cookies-->>Store: client token or null
    Store->>Cookies: Read upm_guest_session
    Cookies-->>Store: guest token or null

    alt No sessions exist
        Note over Store,Auth: 3. Mint Guest Token
        Store->>Auth: useAuth().as('guest')
        Auth->>API: POST /oauth/token (guest grant)
        API-->>Auth: guest token
        Auth->>Cookies: Store guest token
        Cookies-->>Store: Retrieve minted token
        Store->>Store: Update guestSession
    end

    Note over Store,API: 4. Load User Profiles
    par Load all session users
        Store->>API: GET /self (client token)
        API-->>Store: Client user data
        Store->>API: GET /admin/self (staff token)
        API-->>Store: Staff user data
    end

    Store->>Store: initialise() resolves; isReady() → true
    Note over Store: ✅ Guaranteed active session<br/>with user data
```

**Key points:**

1. **Sync default** - Store is usable immediately (default guest state)
2. **Async hydration** - Cookies loaded in background
3. **Guest token minting** - Only if NO sessions exist (delegates to auth module)
4. **User data loading** - Parallel fetch for all sessions (non-blocking)
5. **Guaranteed completion** - `useSessionStore().useActions().isReady()` resolves `true` when ready (there is **no** `storeInitialized` export)

### Hydration Flow

On app initialization:

```text
sessionStore created
  │
  └─▶ buildInitialState()
       │
       ├─▶ Read upm_client_session cookie
       │    └─▶ If exists → clientSessions[token.actor_id] = { token }
       │
       ├─▶ Read upm_user_session cookie (staff)
       │    └─▶ If exists → staffSessions[token.actor_id] = { token }
       │
       ├─▶ Read upm_guest_session cookie
       │    └─▶ If exists → guestSession = token
       │
       └─▶ If NO sessions exist (and guest allowed) → mintGuestToken() via auth module
```

**Active session selection:**

1. If staff token exists → activate staff
2. Else if client token exists → activate client
3. Else → default to GUEST (with minted token)

## Dependencies

### Session Store Depends On

| Module/Utility        | Usage                                                     |
| --------------------- | --------------------------------------------------------- |
| `auth` (lazy)         | Guest token minting on initialization (circular dep safe) |
| `useCookies`          | Cookie read/write, change listener                        |
| `@tanstack/vue-store` | Reactive state management                                 |
| TanStack Store        | Core store implementation                                 |
| `lodash-es`           | Utility functions (omit, first, keys, toPairs)            |

**Auth Module Dependency:**

The session-store has a **lazy circular dependency** on the auth module:

- `mintGuestToken()` uses dynamic import: `await import("../auth")`
- Only called during initialization if no sessions exist
- Auth module mints token and stores it via `persistTokenToStorage()`
- Session-store then retrieves token from cookie storage

This design avoids circular import issues while ensuring guest tokens are minted correctly.

### Modules That Depend On Session Store

| Module             | Usage                                            |
| ------------------ | ------------------------------------------------ |
| `auth`             | Persists tokens on login, reads for checkSession |
| `useActiveSession` | Scoped session access (staff vs client)          |
| `query`            | Reads active token for API authorization         |
| Most composables   | Check authentication state via `isAuthenticated` |

**Session store is foundational** - nearly all modules read from it for auth state.

## Integration Points

### Auth Module Integration

When user logs in:

```text
useAuth().as('client').useActions().login()
  │
  └─▶ auth.services.client.authenticate()
       │
       ├─▶ POST /oauth/token
       │
       └─▶ persistTokenToStorage(token)
            └─▶ useSessionStoreActions().add(token)
                 └─▶ Session stored + activated ✅
```

When checking existing session:

```text
checkSession(actor)
  │
  ├─▶ Get sessions: clientSessions, staffSessions
  │
  ├─▶ Extract token based on actor:
  │    - STAFF → first(staffSessions).token
  │    - CLIENT → first(clientSessions).token
  │    - GUEST/SELF → staff?.token ?? client?.token
  │
  └─▶ Return token for API usage
```

### Query Module Integration

Every API request:

```text
useQuery().get(url)
  │
  ├─▶ Get active session token
  │    └─▶ useSessionStoreContext().activeSession
  │
  ├─▶ Add Authorization header:
  │    └─▶ Authorization: Bearer {access_token}
  │
  └─▶ Make request
```

### Active Session Integration

`useActiveSession()` is **pure identity — not a scoped composable** (no `.as(actor)`; FE-2945 removed the fold-in-scoping plan). It always reads the currently active identity, whatever the actor:

```typescript
// Always the currently active session (guest, client, or staff)
const session = useActiveSession();
const { isAuthenticated, isStaff, isClient } = session.useMeta();
const { session: token, actor } = session.useContext();
```

## Testing Strategy

### Unit Tests

- **Actions** (`useSessionStore.actions.test.ts`) - Test mutations in isolation
- **Context** (`useSessionStore.context.test.ts`) - Test computed values
- **Meta** (`useSessionStore.meta.test.ts`) - Test state flags
- **Sync** (`sync.test.ts`) - Test cookie sync initialization

### Integration Tests

- **Impersonation** (`impersonation.test.ts`) - Full flow testing (225 lines)
  - Register impersonation
  - Session restoration
  - Multiple impersonations
  - Edge cases (parent no longer exists)

### Test Utilities

- `createMockSession()` - Creates realistic session tokens
- Synthetic fallback when fixtures missing (doesn't require `pnpm dev:record`)
- All tests use mocked `useCookies` and `broadcastSessionChange`

## Performance Considerations

### Why TanStack Store?

- **Fine-grained reactivity** - Only re-render when specific state slices change
- **Selector optimization** - `useStore(store, state => state.activeActor)` subscribes to just that field
- **No unnecessary re-renders** - Unlike Pinia, TanStack doesn't track all fields by default

### Computed Value Caching

All `useContext()` and `useMeta()` returns are Vue `computed()` refs:

```typescript
const activeSession = computed(() => {
  // Only recomputes when activeActor or activeSessionId changes
  const actor = activeActor.value;
  const id = activeSessionId.value;
  return getSessionForActor(actor, id);
});
```

**Result:** Efficient reactivity even with hundreds of components reading session state.

### BroadcastChannel Throttling

Currently **no throttling** - each action immediately broadcasts. For high-frequency updates (e.g., token refresh every second), consider debouncing.

## Security Considerations

### Cookie Security

Cookies are set with:

- `secure: true` (HTTPS only in production)
- `sameSite: 'lax'` (CSRF protection)
- `httpOnly: false` (needs to be readable by JS for hydration)

**Trade-off:** `httpOnly: false` allows XSS to read tokens, but required for SPA functionality.

### Token Exposure

Tokens are:

- ✅ Stored in memory (sessionStore state)
- ✅ Stored in cookies — one per scope, holding only that scope's active session
- ✅ **Also** written to `sessionStorage` (`upm_session_store`) as part of the persisted state — access/refresh/guest tokens for _every_ held session, not just the active one. This is required, not a gap: it's the multi-session cache that makes switching back to a held session instant with zero server round trips. A previously-proposed hardening (FE-2825 §5.2, stripping token secrets from this payload) would break that requirement outright and must not be implemented as specified — see [FE-2825-note.md](./FE-2825-note.md).
- ❌ **Not** stored in localStorage (more XSS vulnerable)
- ✅ Transmitted only over HTTPS (when `secure: true`)

**Accepted tradeoff:** anything able to read `sessionStorage` (most concretely, an XSS payload) can read every held session's tokens, not only the active one — a wider blast radius than reading a single cookie. This is a known, accepted consequence of the multi-session/instant-switch requirement, not an outstanding hardening item. See [Gotchas §7](./gotchas.md#7-sessionstorage-holds-every-sessions-tokens--this-is-the-required-multi-session-cache-not-a-leak).

### Impersonation Safety

- Parent session ID stored in memory only (not in cookie)
- Impersonation state cleared on page reload (must re-impersonate)
- No token leakage between sessions (each entry isolated)

**Design choice:** Impersonation is session-scoped, not persistent. Refresh = back to staff session.

## Future Enhancements

Potential improvements:

1. **Session expiry notifications** - Proactive warnings before token expires
2. **Automatic refresh** - Background token refresh before expiry
3. **Offline queue** - Queue actions when offline, replay on reconnect
4. **Session history** - Track recently used sessions for quick switch
5. **Preferences storage** - Per-session UI preferences
6. **Broadcast throttling** - Debounce high-frequency updates

---

## References

- [TanStack Store Docs](https://tanstack.com/store/latest)
- [BroadcastChannel API](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel)
- [Cookie Store API](https://developer.mozilla.org/en-US/docs/Web/API/Cookie_Store_API)
