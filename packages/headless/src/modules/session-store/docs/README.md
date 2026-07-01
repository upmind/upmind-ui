# Session Store Module

Multi-session management for the Upmind headless library. Supports simultaneous sessions for guest, client, and staff actors with cross-tab synchronization, impersonation, and automatic persistence.

## What Is This? (ELI5)

Think of the session store like a **phone with multiple user profiles**:

- **Guest session** = Browse without logging in (like guest mode)
- **Client sessions** = Your personal accounts (can have multiple)
- **Staff sessions** = Admin accounts (for support/management)
- **Impersonation** = Staff can "become" a client temporarily, then switch back
- **Cross-tab sync** = All browser tabs stay in sync automatically

The store manages which session is "active" and handles switching between them.

> **🧪 For Testers:** Verify that switching sessions updates the active user, impersonation restores correctly, and logout clears cookies.

> **👩‍💻 For Developers:** Each session is keyed by `actor_id`. The store maintains a `SessionEntry` containing both the token and optional user profile data for UI display.

## Quick Start

```typescript
import { useSessionStore } from "@upmind/headless";

const store = useSessionStore();

// Context (computed values)
const { activeActor, activeSession, activeUser } = store.useContext();

// Meta (state flags)
const { isAuthenticated, isImpersonated } = store.useMeta();

// Actions (mutations)
const { add, activate, remove, logout } = store.useActions();

// Add a session
add(token); // Automatically activates

// Switch between sessions
activate(AccessRoleTypes.CLIENT, "client-123");

// Log out (removes cookie + state)
logout();
```

See [Usage](./usage.md) for complete API reference.

## Features

| Feature               | Status | Notes                                  |
| --------------------- | ------ | -------------------------------------- |
| Multi-session storage | ✅     | Multiple sessions per actor type       |
| Session activation    | ✅     | Switch between sessions                |
| Impersonation         | ✅     | Staff → Client with parent restoration |
| Cross-tab sync        | ✅     | BroadcastChannel for real-time sync    |
| Cookie persistence    | ✅     | Auto-hydrates on page load             |
| User profile storage  | ✅     | Optional user data in `SessionEntry`   |
| Logout subscription   | ✅     | Subscribe to logout events             |

## Key Concepts

### Guaranteed Active Session

**The session store ALWAYS has an active session** — you never need to check for `null`.

Think of it like this: Your app is **never without an identity**. Just like you're always either logged in or browsing as a guest, the session store guarantees an active session at all times:

- **On first load with no cookies** → Guest token is minted automatically
- **After clearing cookies** → New guest token is minted on next page load
- **After logout** → Falls back to guest session (or mints one if needed)

```typescript
const { activeSession } = useSessionStore().useContext();

// activeSession is ALWAYS defined (never null/undefined)
console.log(activeSession.value.access_token); // Always works ✅
```

> **🧪 For Testers:** Clear all cookies and reload the app. Verify that `activeSession` exists and API requests work (guest token was minted automatically).

> **👩‍💻 For Developers:** You can safely destructure `activeSession` without null checks. The store initialization blocks until a session exists.

**Why this matters:**

- **No defensive null checks** in your API calls
- **Simpler component code** - no loading states for "waiting for session"
- **Better UX** - App is immediately usable, even for guests

### Initialization Flow

The session store uses **async initialization with a sync default state**:

```text
1. Store created with default guest state (sync, instant)
   └─> activeActor: GUEST, no token yet

2. Async initialization starts (background)
   ├─> Load cookies (staff/client/guest tokens)
   ├─> If NO sessions exist → mint guest token via auth module
   └─> Load user profiles for all sessions (parallel)

3. Store ready (guaranteed active session)
   └─> activeSession.value is always defined ✅
```

**When does guest token minting happen?**

Guest tokens are minted **only on initial app load** if:

- No cookies exist (first-time visitor)
- All cookies were cleared/expired
- User logged out and no guest session remains

**NOT minted on:**

- Cookie hydration (guest cookie already exists)
- Tab sync (other tab has session)
- Page navigation (session persists)

> **🔧 For Contributors:** `mintGuestToken()` is private and delegates to `useAuth().as('guest')`. The auth module mints the token and stores it via `persistTokenToStorage()`, then session-store retrieves it from storage.

**Code example:**

```typescript
// App initialization
import { storeInitialized } from "@upmind/headless";

// Optional: Wait for initialization to complete
await storeInitialized;
console.log("Session store ready with guaranteed active session");

// Or just use immediately (returns default state until init completes)
const { activeSession } = useSessionStore().useContext();
console.log(activeSession.value); // Works immediately (may be default guest state)
```

### Session Entry Model

Sessions are stored as `SessionEntry` objects (not raw `IToken`):

```typescript
type SessionEntry = {
  token: IToken        // The OAuth token
  user?: SessionUser   // Optional user profile for UI display
}

// State structure
{
  guestSession?: IToken                        // Single guest token
  clientSessions: Record<string, SessionEntry> // Keyed by actor_id
  staffSessions: Record<string, SessionEntry>  // Keyed by actor_id
  activeActor: AccessRoleTypes                 // Current active type
  activeSessionId?: string                     // Current active actor_id
  impersonatedSessions: Record<string, string> // Maps impersonated → parent
}
```

**Why `SessionEntry`?**

- Allows storing user profile alongside token for session switcher UI
- Separates concerns: token for API, user for display
- Enables future extension (preferences, permissions, etc.)

### Active Session

Only **one session is active** at a time:

```typescript
const { activeActor, activeSessionId } = store.useContext();

// activeActor can be: GUEST | CLIENT | STAFF
// activeSessionId is the actor_id of the active session (undefined for guest)
```

### Impersonation Flow

Impersonation is handled via the scoped auth API with `.for()`:

```typescript
import {
  ScopeActorTypes,
  useAuth,
  useSessionStore
} from "@upmind-automation/headless";

const store = useSessionStore();

// Staff impersonating a client
const staffAuth = useAuth()
  .as(ScopeActorTypes.STAFF)
  .for(ScopeActorTypes.CLIENT, "client-456");

const { resolve } = staffAuth.useActions();

// 1. Staff is logged in
// activeActor: STAFF, activeSessionId: 'staff-123'

// 2. Login with staff credentials - mints impersonation token
await resolve({ username: "staff@company.com", password: "password" });
// activeActor: CLIENT, activeSessionId: 'client-456', isImpersonated: true

// 3. End impersonation - logout restores staff session
const { logout } = store.useActions();
logout();
// activeActor: STAFF, activeSessionId: 'staff-123' (restored!)
```

**Client impersonating child client:**

```typescript
// Parent client impersonating child
const clientAuth = useAuth()
  .as(ScopeActorTypes.CLIENT)
  .for(ScopeActorTypes.CLIENT, "child-client-789");

await clientAuth.useActions().resolve(credentials);
```

> **⚠️ Important:** Use `.as().for()` pattern - the auth machine handles impersonation token minting and session management automatically.

### Sub-Composables

The module follows the factory pattern:

| Sub-composable   | Purpose                                                  |
| ---------------- | -------------------------------------------------------- |
| `useActions()`   | Mutations: add, remove, activate, logout, clear          |
| `useContext()`   | Computed values: activeSession, activeUser, allSessions  |
| `useMeta()`      | State flags: isAuthenticated, isImpersonated, canRefresh |
| `useInternals()` | Debug: raw store access                                  |

## Documentation

| Doc                               | Audience                  | Content                              |
| --------------------------------- | ------------------------- | ------------------------------------ |
| **This README**                   | Everyone                  | Overview, concepts, quick start      |
| [Usage](./usage.md)               | All Devs (incl. external) | API reference, examples              |
| [Architecture](./architecture.md) | Internal / Contributors   | State model, data flow, dependencies |
| [Gotchas](./gotchas.md)           | All                       | Edge cases, known issues             |
| [Changelog](./CHANGELOG.md)       | All                       | Version history, migrations          |

## Common Use Cases

### Multi-Session Management

```typescript
const { clientSessions, allSessions } = store.useContext();
const { activate } = store.useActions();

// Display all sessions in dropdown
allSessions.value.forEach(({ id, actor, entry }) => {
  console.log(`${actor}: ${entry.user?.email ?? id}`);
});

// Switch to a different session
activate(AccessRoleTypes.CLIENT, "client-789");
```

### Check Authentication Status

```typescript
const { isAuthenticated, isGuest } = store.useMeta();
const { activeSession } = store.useContext();

// activeSession is ALWAYS defined (guaranteed active session)
console.log(activeSession.value.access_token); // ✅ Always works

if (isAuthenticated.value) {
  // User has client or staff session
  console.log("Logged in as:", activeSession.value.actor_type);
} else if (isGuest.value) {
  // User has guest session (auto-minted if needed)
  console.log("Browsing as guest");
}
// Note: No need for "else" - isGuest covers the fallback case
```

### Subscribe to Logout Events

```typescript
import { useSessionStoreActions } from "@upmind/headless";

const { onLogout } = useSessionStoreActions();

// Subscribe (returns cleanup function)
const unsubscribe = onLogout(actor => {
  console.log(`${actor} logged out`);
  // Clear cached data, redirect, etc.
});

// Later: cleanup
onBeforeUnmount(unsubscribe);
```

### Session Expiry Handling

```typescript
const { isExpired, canRefresh } = store.useMeta();

if (isExpired.value) {
  if (canRefresh.value) {
    // Token expired but refresh token still valid
    await refreshToken();
  } else {
    // Session completely expired
    logout();
  }
}
```

### Testing the Initialization Flow

> **🧪 For Testers:** Use these examples to verify initialization behavior.

#### Test 1: Verify Guest Token Minting

```typescript
// 1. Clear all cookies
document.cookie.split(";").forEach(c => {
  document.cookie =
    c.trim().split("=")[0] + "=;expires=Thu, 01 Jan 1970 00:00:00 UTC";
});

// 2. Reload the page
location.reload();

// 3. Check that a guest session exists
const { activeSession, activeActor } = useSessionStore().useContext();
console.log(activeActor.value); // Should be "guest"
console.log(activeSession.value?.access_token); // Should exist ✅

// 4. Verify API calls work
const { get } = useQuery();
const result = await get({ url: "/some-endpoint" });
// Should succeed with guest token authorization
```

#### Test 2: Verify Session Restoration from Cookies

```typescript
// 1. Log in as client
const auth = useAuth().as("client");
await auth
  .useActions()
  .login({ username: "user@example.com", password: "pass" });

// 2. Check active session
const { activeActor, activeSession } = useSessionStore().useContext();
console.log(activeActor.value); // "client"
console.log(activeSession.value?.actor_id); // "client-123"

// 3. Reload the page
location.reload();

// 4. Verify session restored from cookie
console.log(activeActor.value); // Still "client" ✅
console.log(activeSession.value?.actor_id); // Still "client-123" ✅
```

#### Test 3: Verify Initialization Completes

```typescript
import { storeInitialized } from "@upmind/headless";

// Wait for full initialization (cookies loaded + user data fetched)
await storeInitialized;

const { activeUser } = useSessionStore().useContext();
console.log(activeUser.value?.email); // User profile loaded ✅
```

## Integration

### With Auth Module

The auth module automatically persists tokens to the session store on successful login:

```typescript
import { useAuth } from "@upmind/headless";

const auth = useAuth().as("client");
const { login } = auth.useActions();

// After successful login, token is automatically added to session store
await login({ username: "user@example.com", password: "secret" });

// Session store now has the token
const { activeSession } = useSessionStore().useContext();
console.log(activeSession.value?.access_token);
```

### With Scoped Composables

Session-aware composables use `useActiveSession()` for scope-specific access:

```typescript
import { useActiveSession } from "@upmind/headless";

// Get session for current active scope
const session = useActiveSession().as("self");
const { isAuthenticated } = session.useMeta();

// Get session for specific scope (checks if STAFF session exists)
const staffSession = useActiveSession().as("staff");
const { session: staffToken } = staffSession.useContext();
```

## Migration Guide

### From Old API (setSession, removeSession, etc.)

If you're upgrading from an older version:

```typescript
// OLD API ❌
const { setSession, removeSession, setActiveActor } = useSessionStoreActions();
setSession(token);
removeSession(AccessRoleTypes.CLIENT, "client-123");
setActiveActor(AccessRoleTypes.CLIENT, "client-123");

// NEW API ✅
const { add, remove, activate } = useSessionStoreActions();
add(token);
remove(AccessRoleTypes.CLIENT, "client-123");
activate(AccessRoleTypes.CLIENT, "client-123");
```

See [CHANGELOG.md](./CHANGELOG.md) for complete migration details.

## Playground

A runnable demo is available in the labs playground:

```bash
cd playgrounds/labs
pnpm dev
```

Then navigate to `/session` to see multi-session management in action.

**Playground location:** `playgrounds/labs/src/pages/useActiveSession/`

> **🔧 For Contributors:** When adding new session features, update the playground page to demonstrate them.
