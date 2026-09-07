# ADR 002: Session & Service Layer Architecture

**Date:** January 21, 2026
**Status:** Proposed
**Authors:** Dom da Costa
**Related:** [ADR 001: Scope-Based Composables](./001-scope-based-composables.md)

---

## Context

With the introduction of scope-based composables (ADR 001), we need a session and service layer that supports:

1. **Multiple simultaneous actor sessions** — staff, client, guest can all be logged in
2. **Cross-tab synchronization** — logout/refresh in one tab affects others
3. **Actor-specific services** — different endpoints, different tokens
4. **Composable integration** — `.as('staff')` selects the right service and token
5. **Backwards compatibility** — existing `withAccessToken: true` pattern continues to work

### Current Challenges

- Single active session at a time
- Switching actors requires full logout/login cycle
- Session machine is complex (774 lines in `useSession.ts`)
- Guest/client sub-machines handle too many concerns (login, register, recover, 2FA)
- No cross-tab awareness for session changes
- Services hardcoded to single actor context

---

## Decision

### 1. Multi-Session Store (TanStack Store)

Replace the XState session machine with a **reactive store** for session management:

```ts
import { Store } from '@tanstack/vue-store'
import type { ScopeActor, SessionUser } from '@upmind-automation/headless'

interface SessionData {
  token: string
  refreshToken: string
  expiresAt: number
  actorId: string
  profile?: SessionUser
  capabilities?: string[] // staff only
}

interface SessionState {
  sessions: Record<ScopeActor, SessionData | null>
  activeActor: ScopeActor
}

export const sessionStore = new Store<SessionState>({
  activeActor: 'guest',
  sessions: { client: null, guest: null, self: null, user: null }
})
```

### 2. Session Store Composable Pattern

Following our composable conventions from ADR 001:

```ts
import type { Store } from '@tanstack/vue-store'
import type { ScopeActor } from '@upmind-automation/headless'
import { computed } from 'vue'

type SessionData = { token: string }
type SessionState = {
  activeActor: ScopeActor
  sessions: Record<ScopeActor, SessionData | null>
}

declare const store: Store<SessionState>
declare const refreshingActors: Set<ScopeActor>
declare const channel: BroadcastChannel

export function useSessionStore() {
  return {
    // --- direct properties
    sessions: computed(() => store.state.sessions),
    activeActor: computed(() => store.state.activeActor),
    activeSession: computed(() => store.state.sessions[store.state.activeActor]),
    getSession: (actor: ScopeActor) => store.state.sessions[actor],

    // --- sub-composables
    useMeta() {
      return {
        hasSession: (actor: ScopeActor) => computed(() => !!store.state.sessions[actor]),
        isExpired: (_actor: ScopeActor) => computed(() => false),
        isRefreshing: (actor: ScopeActor) => computed(() => refreshingActors.has(actor))
      }
    },

    useActions() {
      return {
        setSession: (actor: ScopeActor, data: SessionData) =>
          store.setState(state => ({ ...state, sessions: { ...state.sessions, [actor]: data } })),
        clearSession: (actor: ScopeActor) =>
          store.setState(state => ({ ...state, sessions: { ...state.sessions, [actor]: null } })),
        switchTo: (actor: ScopeActor) => store.setState(state => ({ ...state, activeActor: actor })),
        refreshSession: async (_actor: ScopeActor) => undefined
      }
    },

    useInternals() {
      return {
        store,
        subscribe: (callback: () => void) => store.subscribe(callback),
        broadcastChannel: channel
      }
    }
  }
}
```

### 3. Cross-Tab Synchronization

Use `BroadcastChannel` for cross-tab session sync:

```ts
import { Store } from '@tanstack/vue-store'
import type { ScopeActor } from '@upmind-automation/headless'

type SessionData = { token: string }
type SessionState = { sessions: Record<ScopeActor, SessionData | null> }

declare const sessionStore: Store<SessionState>

const channel = new BroadcastChannel('upm_session')

// Broadcast changes to other tabs
export function broadcastChange(actor: ScopeActor, session: SessionData | null) {
  channel.postMessage({ actor, session, type: 'SESSION_CHANGE' })
}

// Listen for changes from other tabs
channel.onmessage = event => {
  if (event.data.type === 'SESSION_CHANGE') {
    sessionStore.setState(state => ({
      ...state,
      sessions: { ...state.sessions, [event.data.actor]: event.data.session }
    }))
  }
}
```

**Behavior:**

- Each tab can have a different `activeActor`
- When Tab A logs out `staff` → Tab B's `staff` session is also cleared
- When Tab A refreshes `client` token → Tab B gets the new token

### 4. Cookie Persistence

Sessions persist to cookies (important for SSR, security):

```ts
// The names `session-store.sync.ts` actually syncs. `staff` is spelled `user`
// on the wire, and there is no lead cookie — a lead is a context, not an actor.
export const SESSION_COOKIE_NAMES = [
  'upm_guest_session',
  'upm_client_session',
  'upm_user_session',
  'upm_admin_session'
]
```

Store syncs to cookies on every change.

### 5. Unified Auth Machine (Separate)

Extract login/register/recover/2FA into a **single auth machine**:

```ts
import { createMachine } from '@upmind-automation/headless'
import type { ScopeActor } from '@upmind-automation/headless'
import type { ResponseError } from '@upmind-automation/headless'

type AuthContext = {
  actor: ScopeActor
  error: ResponseError | null
  challenge: unknown | null
}

export const authMachine = createMachine({
  id: 'auth',
  context: {
    actor: 'client',
    error: null,
    challenge: null
  } as AuthContext,
  initial: 'idle',
  states: {
    idle: {
      on: {
        LOGIN: 'login',
        REGISTER: 'register',
        RECOVER: 'recover'
      }
    },
    login: {},
    register: {},
    recover: {},
    success: {
      type: 'final',
      entry: 'persistToSessionStore'
    }
  }
})
```

The auth machine:

- Is configured with which `actor` to authenticate
- Uses actor-specific endpoints
- On success, writes to the session store
- Does NOT manage ongoing session state (that's the store's job)

### 6. Transfer Machine (Separate)

Session transfer is its own machine/composable:

```typescript
function useTransfer() {
  return {
    transferTo: async () => { /* Generate transfer code */ },
    transferFrom: async (code: string) => { /* Consume transfer code */ },
  }
}
```

### 7. Actor-Specific Services

Services are split by actor when endpoints differ:

```
modules/
  clientEmails/
    services/
      client.ts    # /client/emails
      staff.ts     # /admin/clients/{id}/emails
      index.ts     # Resolver
```

#### Service Resolver

```ts
import { ScopeActorTypes } from '@upmind-automation/headless'
import type { ScopeContext } from '@upmind-automation/headless'

type EmailService = { loadList: () => unknown }

declare function createClientEmailService(): EmailService
declare function createStaffEmailService(clientId: string): EmailService
declare function activeActor(): ScopeActorTypes

export function getEmailService(
  actor: ScopeActorTypes,
  context?: ScopeContext
): EmailService {
  const resolvedActor =
    actor === ScopeActorTypes.SELF ? activeActor() : actor

  switch (resolvedActor) {
    case ScopeActorTypes.CLIENT:
      return createClientEmailService()
    case ScopeActorTypes.STAFF:
      if (!context?.id) throw new Error('Staff requires client context')
      return createStaffEmailService(context.id)
    default:
      throw new Error(`Actor ${actor} cannot access emails`)
  }
}
```

#### Actor-Specific Service

```ts
import { ScopeActorTypes, useQuery } from '@upmind-automation/headless'

declare function useSessionStore(): {
  getSession: (actor: ScopeActorTypes) => { token: string } | null
}

export function createStaffEmailService(clientId: string) {
  const { list, post, useUrl } = useQuery()
  const session = useSessionStore()
  const queryKey = ['staff', 'client-emails', clientId]

  const getToken = () => session.getSession(ScopeActorTypes.STAFF)?.token

  return {
    loadList: () =>
      list({
        queryKey,
        url: useUrl(`/admin/clients/${clientId}/emails`),
        withAccessToken: getToken()
      }),

    add: (data: Record<string, unknown>) =>
      post({
        data,
        mutationKey: [...queryKey, 'add'],
        url: useUrl(`/admin/clients/${clientId}/emails`),
        withAccessToken: getToken()
      })
  }
}
```

### 8. Composable Integration

Composables resolve the appropriate service via `.as()`:

```ts
import { ScopeActorTypes } from '@upmind-automation/headless'
import type { ScopeContext } from '@upmind-automation/headless'
import type { ComputedRef } from 'vue'

type Email = { id: string; email: string | null }
type EmailService = {
  add: (data: Email) => Promise<Email>
  remove: (id: string) => Promise<void>
  update: (data: Email) => Promise<Email>
  loadList: () => { data: ComputedRef<Email[]>; pagination: unknown }
}

declare function getEmailService(
  actor: ScopeActorTypes,
  context: ScopeContext | null
): EmailService

export function useClientEmails() {
  return {
    as(actor: ScopeActorTypes) {
      return {
        for(contextType?: ScopeContext['type'], id?: string) {
          const context = contextType && id ? { id, type: contextType } : null
          const service = getEmailService(actor, context)

          const { data, ...query } = service.loadList()

          return {
            data,
            pagination: query.pagination,

            useMeta: () => ({}),
            useActions: () => ({
              add: service.add,
              update: service.update,
              remove: service.remove
            }),
            useInternals: () => ({ service, query })
          }
        }
      }
    }
  }
}
```

### 9. Token Injection via withAccessToken

The existing `withAccessToken` pattern is preserved but evolved:

```ts
import { ScopeActorTypes } from '@upmind-automation/headless'
import type { RequestParams } from '@upmind-automation/headless'

declare function useSessionStore(): {
  getSession: (actor: ScopeActorTypes) => { token: string } | null
}
declare const explicitToken: string

type Token = RequestParams['withAccessToken']

// Current (still works) — uses the activeActor's token
const implicit: Token = true

// New — an explicit token from the session store
const fromStore: Token = useSessionStore().getSession(ScopeActorTypes.STAFF)?.token

// Special cases (a claim link, a transfer code, …)
const explicit: Token = explicitToken

export const tokens = { explicit, fromStore, implicit }
```

---

## Consequences

### Positive

1. **Multi-session support** — staff, client, guest can be logged in simultaneously
2. **Cross-tab sync** — session changes propagate across tabs
3. **Simpler session management** — reactive store vs complex XState
4. **Actor-specific services** — clean separation of endpoints and logic
5. **Backwards compatible** — `withAccessToken: true` still works
6. **Testable** — services and store are easily mockable
7. **Clear integration** — `.as(actor)` → service resolver → correct token

### Negative

1. **Migration effort** — refactoring existing session machine
2. **Two systems temporarily** — during migration, old and new may coexist
3. **Service file proliferation** — some features will have multiple service files

### Neutral

1. **Auth machine still uses XState** — complex flows benefit from state machines
2. **Bundle size** — TanStack Store is lightweight, BroadcastChannel is native

---

## Migration Strategy

### Phase 1: Session Store Foundation

- Create `useSessionStore` with TanStack Store
- Add BroadcastChannel cross-tab sync
- Cookie persistence layer

### Phase 2: Parallel Running

- New store runs alongside existing session machine
- Composables can use either (feature flag)

### Phase 3: Service Evolution

- Migrate services to actor-specific pattern
- Start with one feature (e.g., client emails)
- Validate pattern before expanding

### Phase 4: Auth Machine Extraction

- Extract login/register/recover from guest machine
- Create unified auth machine
- Wire to session store

### Phase 5: Deprecate Old Session

- Remove old session machine
- Remove guest/client sub-machines
- Update all composables to new pattern

---

## When to Split Services

Not all features need actor-specific services:

| Feature | Split? | Reason |
|---------|--------|--------|
| Client Emails | Yes | Different endpoints per actor |
| Invoices | Yes | `/client/invoices` vs `/admin/clients/{id}/invoices` |
| Basket | Maybe | Same endpoint, but claim flow differs |
| Product Catalogue | No | Same endpoint, just visibility differs |
| Brand Config | No | Same for all actors |

---

## Open Considerations

### Capabilities (Future ADR)

Staff capabilities (`emails.send`, `invoices.refund`, etc.) will be addressed in a separate ADR. Options:

- CASL integration
- Custom capability system (port from legacy)

### Playground UI

Per team discussion (Jan 20, 2026):

- Actor selector in top nav
- Brand dropdown (optional filter)
- Context picker
- Composable-focused testing interface

---

## Related Documents

- [ADR 001: Scope-Based Composables](./001-scope-based-composables.md)
- Future: ADR 003 — Capabilities & Authorization
