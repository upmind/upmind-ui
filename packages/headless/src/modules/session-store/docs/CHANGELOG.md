# Session Store Module Changelog

All notable changes to the session-store module.

## [Doc correction] - 2026-07-02

Product owner ratified the multi-session model (see `docs/sdd/session-store-functional-requirements.md` if present, or the FE-2825-note): at most 3 cookies (one per scope), the store holds unlimited sessions per scope, and `activate(scope, id)` regenerates that scope's cookie **from** the store. This corrects several docs that had previously stated the reverse authority direction ("cookie is the single source of truth, store maps are a cache") and framed the multi-session sessionStorage cache as a security gap. See `foundation.md` Lessons, `gotchas.md` §6–§8, `architecture.md` Security Considerations, and `FE-2825-note.md` for the corrected framing.

- **Known code/doc conflict, flagged for a future code fix (not fixed here):** the code comment at `session-store.store.ts:106-108` ("The cookie is the single source of truth for an authenticated session; the store maps are a cache") states the authority direction backwards relative to the ratified model. The comment (and the `reconcileToCookies` behaviour it describes) should be revisited by whoever next touches that function — the model's authority direction is store → cookie for the active session, not cookie → store.
- **Known implementation defect (separate from the doc correction above):** `reconcileToCookies`, wired into every `updateSession` write, currently collapses `clientSessions`/`staffSessions` to at most one entry (whichever the current cookie backs) on every write — including writes from the store's own `add()`/`activate()` actions. This makes "the store holds unlimited sessions per scope" false in the shipped code today. Tracked as a product defect against the model; see `gotchas.md` §6.

## [Baseline] - 2026-07-02

Documentation baseline captured alongside the workshop foundation doc. Records the module's current shipped state after the FE-2825 hand-port (Tranche 6 of FE-2774) and the FE-2945 identity reshaping.

### Current architecture

- **`useActiveSession()` / `useSession(sessionId)` are pure identity** — both return the four sub-composables relative to the active session, with **no `.as(actor)` scoping**. FE-2945 reversed the earlier plan to fold auth-standing into `useSession`.
- **Guest minting delegates to `auth`** via a lazy dynamic import (`await import("../auth")`), retrying up to 3 times and throwing a fatal boot error on exhaustion. The static import runs the other way (auth → session-store), so the dynamic import breaks the cycle at load time.
- **Cookie of record** per actor: `upm_guest_session`, `upm_client_session`, `upm_user_session` (staff — `AccessRoleTypes.STAFF` is `"user"` on the wire), `upm_admin_session` (watched, not hydrated).
- **BE surface**: `POST /oauth/access_token` (guest grant, boot), `GET /self` (client identity), `GET /admin/self` (staff identity).

### Corrections to prior docs

- **`storeInitialized` does not exist** — never exported. Await readiness via `useSessionStore().useActions().isReady()` (or `initStore()`'s returned promise). Earlier references were stale.
- Staff cookie is `upm_user_session`, not `upm_staff_session`.
- `allSessions` is a `Record<actor_id, SessionEntry>` where `SessionEntry` is `{ scope, token, user }` — not an array of `{ id, actor, entry }`.

### Known gaps vs FE-2825 design (see gotchas.md §7–8)

- **Metadata-only sessionStorage persistence** (FE-2825 §5.2) is **not** applied — `persistStoreState` writes token secrets to `upm_session_store`.
- **`SET_SESSION` broadcast re-hydration + payload slimming** (FE-2825 §5.1) is **not** applied — the receiver still trusts the broadcast payload.

## [Unreleased]

### Breaking Changes

#### API Method Renames

The action methods have been renamed for clarity and consistency:

| Old Method          | New Method   | Notes                          |
| ------------------- | ------------ | ------------------------------ |
| `setSession()`      | `add()`      | Unified guest + client/staff   |
| `setGuestSession()` | `add()`      | Now uses same method as others |
| `removeSession()`   | `remove()`   | Simpler name                   |
| `setActiveActor()`  | `activate()` | More descriptive               |

**Migration:**

```typescript
// Before
const { setSession, removeSession, setActiveActor } = useSessionStoreActions();
setSession(token);
setGuestSession(guestToken);
removeSession(AccessRoleTypes.CLIENT, "client-123");
setActiveActor(AccessRoleTypes.CLIENT, "client-123");

// After
const { add, activate, remove } = useSessionStoreActions();
add(token); // Works for all actor types
add(guestToken); // Same method for guest
remove(AccessRoleTypes.CLIENT, "client-123");
activate(AccessRoleTypes.CLIENT, "client-123");
```

#### Data Model Change: `SessionEntry` Introduction

Sessions are now stored as `SessionEntry` objects instead of raw `IToken`:

```typescript
// Before
type SessionState = {
  clientSessions: Record<string, IToken>;
  staffSessions: Record<string, IToken>;
};

// After
type SessionEntry = {
  token: IToken;
  user?: SessionUser; // NEW: optional user profile
};

type SessionState = {
  clientSessions: Record<string, SessionEntry>;
  staffSessions: Record<string, SessionEntry>;
};
```

**Impact:** If you directly accessed `clientSessions` or `staffSessions`, you now need to extract `.token`:

```typescript
// Before
const token = clientSessions.value["client-123"];

// After
const token = clientSessions.value["client-123"].token;
const user = clientSessions.value["client-123"].user; // NEW: access user profile
```

**Why?** This allows storing user profile data alongside tokens for session switcher UI components.

#### Guaranteed Active Session Initialization

**BREAKING:** Store initialization is now async, but provides guaranteed active session.

The session store now **ALWAYS** has an active session:

- On first load with no cookies → Guest token is minted automatically
- After clearing cookies → New guest token is minted on page load
- After logout → Falls back to guest (or mints if needed)

**New behavior:**

```typescript
// Store starts with default guest state (sync, instant)
const { activeSession } = useSessionStore().useContext();
console.log(activeSession.value); // Works immediately (may be default state)

// Optional: Wait for full initialization (cookies loaded + user data)
const { isReady } = useSessionStore().useActions();
await isReady();
console.log(activeSession.value); // Guaranteed active session with user data ✅
```

**Migration:**

```typescript
// Before: Had to check for null
const { activeSession } = useSessionStore().useContext();
if (activeSession.value) {
  makeApiCall(activeSession.value.access_token);
}

// After: Always defined
const { activeSession } = useSessionStore().useContext();
makeApiCall(activeSession.value.access_token); // ✅ Always works
```

**Why?** Eliminates defensive null checks and simplifies app initialization. The store is usable immediately with sync default state, then async hydration completes in background.

### Added

#### Impersonation Support

Staff can now impersonate clients with automatic parent session restoration:

```typescript
const { add, registerImpersonation, remove } = useSessionStoreActions();

// Register impersonation BEFORE adding session
registerImpersonation("client-456");
add(clientToken); // Staff becomes client

// Later: end impersonation
remove(AccessRoleTypes.CLIENT, "client-456");
// Staff session is automatically restored!
```

**New APIs:**

- `registerImpersonation(sessionId)` - Call before `add()` to track parent session
- `impersonatedSessions` state - Maps impersonated sessionId → parent sessionId
- Automatic parent restoration in `remove()` action
- `isImpersonated` meta flag - Returns `true` when active session has a parent

**Full flow tested in:** `__tests__/impersonation.test.ts`

#### Automatic Guest Token Minting

Guest tokens are now minted automatically when no sessions exist:

```typescript
// 1. Clear all cookies
// 2. Reload app
// 3. Guest token is automatically minted on initialization

const { activeSession } = useSessionStore().useContext();
console.log(activeSession.value?.actor_type); // "guest" ✅
console.log(activeSession.value?.access_token); // Auto-minted token ✅
```

**When minting occurs:**

- First-time visitor (no cookies)
- After clearing all cookies
- After logout with no remaining sessions

**Implementation:**

- Delegates to auth module via `useAuth().as('guest')`
- Waits for auth completion via `isReady()`
- Retrieves minted token from cookie storage
- Happens during `createInitialState()` (not on cookie hydration)

**New APIs:**

- `isReady()` action - resolves once initialization completes (no `storeInitialized` export exists)
- `mintGuestToken()` private function - Delegates to auth module

#### User Profile Storage

Sessions can now include user profile data for display:

```typescript
const { add } = useSessionStoreActions();
const { activeUser } = useSessionStoreContext();

// Add session with user profile
add(token, true, {
  id: "user-123",
  email: "user@example.com",
  fullName: "John Doe",
  avatar: {
    caption: "JD",
    src: "https://example.com/avatar.jpg"
  }
});

// Access user profile
console.log(activeUser.value?.fullName); // "John Doe"
```

**New APIs:**

- `SessionUser` type - Minimal user info for UI display
- `activeUser` context computed - User profile for active session
- `allSessions` context computed - All sessions with user data for dropdowns
- `add()` third parameter - Optional `user` profile

#### Logout Subscription System

Subscribe to logout events for cleanup and side effects:

```typescript
const { onLogout } = useSessionStoreActions();

const unsubscribe = onLogout(actor => {
  console.log(`${actor} logged out`);
  // Clear caches, analytics, etc.
});

// Cleanup
onBeforeUnmount(unsubscribe);
```

**New APIs:**

- `onLogout(callback)` - Subscribe to logout events
- `notifyLogoutSubscribers(actor)` - Internal notification system
- Returns unsubscribe function for cleanup

#### Enhanced Logout Action

New `logout()` action with automatic impersonation restoration:

```typescript
const { logout } = useSessionStoreActions();

// Log out of active session
logout();

// Log out of specific actor
logout(AccessRoleTypes.CLIENT);

// If impersonating, parent session is restored automatically
```

**Improvements:**

- Removes cookie AND state (was separate before)
- Restores parent session if impersonating
- Notifies subscribers
- Broadcasts to other tabs

### Changed

#### User Loading Moved to Session Store

**Breaking Change:** Auth module no longer returns user data.

Previously, the auth module would load user data immediately after authentication and return it alongside the token. This caused duplicate user loading logic between auth and session-store modules.

**Before:**

```typescript
const auth = useAuth().as("client");
const { login } = auth.useActions();
const { token, user } = await login(credentials);
console.log(user.email); // ✅ User data available
```

**After:**

```typescript
const auth = useAuth().as("client");
const { login } = auth.useActions();
const { token } = await login(credentials);

// Get user data from session store (loads async in background)
const { activeUser } = useSessionStore().useContext();
console.log(activeUser.value?.email); // ✅ Available after background load

// Or wait for initialization to complete
const { isReady } = useSessionStore().useActions();
await isReady();
console.log(activeUser.value?.email); // ✅ Guaranteed to be loaded
```

**Why this change?**

- **Single responsibility**: Auth module handles authentication, session-store handles session lifecycle
- **No duplicate logic**: User loading happens in one place only
- **Better performance**: User loading doesn't block token persistence
- **More flexible**: User loading can be enhanced without touching auth module

**Migration:**

1. Remove destructuring of `user` from auth result: `const { token, user }` → `const { token }`
2. Get user data from session store instead: `useSessionStore().useContext().activeUser`
3. TypeScript will catch most cases since `AuthResult` no longer has `user` property

**Impact:**

- `AuthResult` type no longer includes `user?: unknown`
- `authenticate()` and `verify2fa()` in all auth services now return only `{ token }`
- `loadUser()` function removed from auth services (client, staff, guest)
- Session store's `add()` action now auto-loads user data in background when not provided

#### Context Computed Values

- `activeSession` now extracts `.token` from `SessionEntry` automatically
- `clientSessions` and `staffSessions` now typed as `Record<string, SessionEntry>`

#### Sync Messages

New broadcast message type for impersonation:

```typescript
type SessionSyncMessage = {
  type: "IMPERSONATION_REGISTERED";
  impersonatedSessionId: string;
  impersonatorSessionId: string;
};
// ... existing types
```

Cross-tab sync now supports impersonation state propagation.

### Fixed

- Parent session restoration on impersonation end
- Session activation when removing active session (now falls back correctly)
- User profile preservation during token refresh

---

## Migration Guide

### From v1.x to v2.x (Unreleased)

**Step 1: Update Action Method Names**

Find and replace across your codebase:

- `setSession` → `add`
- `setGuestSession` → `add`
- `removeSession` → `remove`
- `setActiveActor` → `activate`

**Step 2: Update Direct State Access**

If you access `clientSessions` or `staffSessions` directly:

```typescript
// Before
const sessions = useSessionStoreContext();
const token = sessions.clientSessions.value["client-123"];

// After
const sessions = useSessionStoreContext();
const token = sessions.clientSessions.value["client-123"].token;
const user = sessions.clientSessions.value["client-123"].user; // Optional
```

**Step 3: Remove Defensive Null Checks on Active Session**

The session store now guarantees an active session exists:

```typescript
// Before: Had to check for null
const { activeSession } = useSessionStore().useContext();
if (!activeSession.value) {
  console.error("No session!");
  return;
}
makeApiCall(activeSession.value.access_token);

// After: Always defined
const { activeSession } = useSessionStore().useContext();
makeApiCall(activeSession.value.access_token); // ✅ No null check needed
```

#### Step 4: Optional - Wait for Initialization

If you need user profile data immediately:

```typescript
// NEW: Wait for full initialization (cookies + user data)
const { isReady } = useSessionStore().useActions();

await isReady();

const { activeUser } = useSessionStore().useContext();
console.log(activeUser.value?.fullName); // User profile loaded ✅
```

#### Step 5: Review Impersonation Logic

If you implemented custom impersonation, migrate to built-in support:

```typescript
// Before (custom implementation)
const previousActor = activeActor.value;
add(newToken);
// ... manually track parent

// After (built-in)
registerImpersonation(newSessionId);
add(newToken);
// Parent automatically restored on remove()
```

**Step 4: Test Session Switching**

Verify that:

- [ ] Session activation works with new `activate()` method
- [ ] Logout clears both cookie and state
- [ ] Impersonation restores parent session correctly
- [ ] User profiles display in session switcher (if used)

---

## Version History

### [Unreleased] - 2026-02-10

Initial module documentation. See sections above for complete change list.

<!--
Future releases will be documented here with semantic versioning:

### [2.0.0] - YYYY-MM-DD
### [1.1.0] - YYYY-MM-DD
### [1.0.0] - YYYY-MM-DD
-->
