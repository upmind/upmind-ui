# Session Store Module Changelog

All notable changes to the session-store module.

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
import { storeInitialized } from "@upmind/headless";
await storeInitialized;
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

- `storeInitialized` export - Promise resolving when initialization completes
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
import { storeInitialized } from "@upmind/headless";
await storeInitialized;
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
import { storeInitialized } from "@upmind/headless";

await storeInitialized;

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
