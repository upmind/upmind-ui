# ADR 001: Scope-Based Composable Architecture

**Date:** January 19, 2026
**Updated:** January 21, 2026
**Status:** Proposed — Amended 2026-08-19 (`.withId(id)`, self-default actor) and 2026-09-15 (`.for()` / `.withId()` split, instance keying as a platform seam). An amendment supersedes the original text where the two conflict.
**Authors:** Dom da Costa, Chris Garner, Dominik Piska, Rhodri Jones

---

## Context

The Upmind platform requires a composable architecture that supports:

1. **Multiple actor types**: staff, client, guest
2. **Contextual operations**: staff acting on behalf of clients, leads, etc.
3. **Multi-brand filtering**: optional brand scope for org-wide vs brand-specific views
4. **Multi-session support**: multiple actor sessions active simultaneously
5. **Capability-based permissions**: staff capabilities determine available actions
6. **Clean, readable API**: fluent chaining that reads like natural language

### Current Challenges

- Deeply nested access patterns (`basket.meta.value.isLoading`)
- No pattern for handling actor-specific contexts
- "Admin" vs "Staff" confusion (now unified as "staff" with capabilities)
- Brand switching complexity across tabs
- Steep learning curve for new developers

---

## Decision

We will implement a **Fluent Chaining Composable Architecture** with the following patterns:

### 1. Core Concepts

| Concept | Definition | Examples |
|---------|------------|----------|
| **Actor** | *Who* is performing the action | `staff`, `client`, `guest`, `self` |
| **Context** | *What* entity they're acting upon | `{ type: 'client', id: '123' }` |
| **Brand** | Optional filter (not a context) | Defaults to org-wide if omitted |

> **Key Insight:** `self` means "use the current session actor" — this keeps the pattern consistent while allowing the common case.

### 2. Fluent Chaining Pattern

```ts
import {
  AuthContextTypes,
  ScopeActorTypes,
  useAuth
} from '@upmind-automation/headless'

// `useAuth` is the one shipped module whose matrix gives STAFF a context, so it
// is the one that offers all three links.
useAuth()
  .as(ScopeActorTypes.STAFF) // Required — specifies the actor
  .for(AuthContextTypes.CLIENT, 'client-123') // Optional — the context
  .inBrand('brand-abc') // Optional — filters by brand
```

#### Convention: `.as()` before `.for()`

The shipped builder offers `.for()` only after `.as()`, which is also the convention that reads best:

```ts
import {
  ClientEmailsContextTypes,
  ScopeActorTypes,
  useClientEmails
} from '@upmind-automation/headless'

const clientId = 'client-123'

// Recommended: reads like natural language
useClientEmails()
  .as(ScopeActorTypes.CLIENT)
  .for(ClientEmailsContextTypes.CLIENT, clientId)

// @ts-expect-error — `.for()` is offered only after `.as()`
useClientEmails().for(ClientEmailsContextTypes.CLIENT, clientId)
```

#### Always Require `.as()`

Even for the "current user" case, `.as(ScopeActorTypes.SELF)` is required:

```ts
import {
  ScopeActorTypes,
  useClientEmails,
  usePersonalDetails
} from '@upmind-automation/headless'

// Explicit
export const emails = useClientEmails().as(ScopeActorTypes.SELF)
export const profile = usePersonalDetails().as(ScopeActorTypes.SELF)

// @ts-expect-error — without `.as()` the call yields the builder, not the composable
useClientEmails().useMeta()
```

This solidifies the pattern and makes every call self-documenting.

### 3. Type Definitions

```typescript
type Actor = 'self' | 'staff' | 'client' | 'guest'

type ContextType =
  | 'client'
  | 'lead'
  | 'contract'
  | 'product'
  | 'invoice'
  | 'order'
  | 'ticket'
  | 'basket'

interface Context {
  type: ContextType
  id: string
}
```

> ⚠️ **`Context.id` SUPERSEDED by Amendment (2026-09-15)** — an id is no longer
> universal. It is required for a *retarget* context and forbidden for a
> *selector* context, per that context member's declaration in the matrix. See
> [Amendment (2026-09-15)](#amendment-2026-09-15-for-carries-the-context-withid-carries-the-id).

### 4. Actor → Context Availability Matrix

Each actor has specific contexts they can operate on:

| Actor | Default Context | Available `.for()` Contexts |
|-------|-----------------|----------------------------|
| `guest` | Anonymous session | `basket` only |
| `client` | Self (client ID from token) | `contract`, `product`, `invoice`, `ticket` |
| `staff` | Org-wide (no specific entity) | All contexts: `client`, `lead`, `contract`, `product`, `invoice`, `order`, `ticket`, etc. |

> **Note:** There are **no nested contexts**. Each `.for()` call specifies a single, flat context.

#### Amendment (2026-09-15): `.for()` carries the context, `.withId()` carries the id

`.withId(id)` shipped in the 2026-08-19 amendment below to hold the ONE record a
single-record read opens. That left `.for(type, id)` still taking an id it no
longer owns. This amendment closes the split:

1. **`.for(type)` carries the CONTEXT. `.withId(id)` carries the ID.** An id
   never rides in `.for()`. A single-member context type that exists only to
   smuggle an owner id is a misuse, not a context.
2. **Two context patterns, declared per context member in the matrix, mutually
   exclusive:**

   | Pattern | Shape | The id means | Example |
   | --- | --- | --- | --- |
   | **Retarget** | `.for(type, id)` — id REQUIRED | the entity the actor acts upon | `.as(STAFF).for(CLIENT, clientId)` |
   | **Selector** | `.for(type)` — id FORBIDDEN | *(none — the type IS the whole answer)* | `.as(CLIENT).for(CANCEL_REQUEST)` |

   The matrix declares which pattern each context member is, and `.for()`
   overloads on that declaration. Passing an id to a selector, or omitting one
   on a retarget, is a compile-time error.

   **Rejected: an optional id.** It lets both shapes compile everywhere, so it
   enforces neither. The two patterns are mutually exclusive by design.

3. **Instance keying is a platform seam, not a module concern.**
   `createScopedComposable` owns registration; `generateScopeKey` owns the key.
   A module never mints its own instance axis beside them — no registration name
   computed per variant, no module-local registration cache, no hand-derived key
   that re-encodes what the scope key already carries. A module needing a second
   instance axis declares it as a context member.
4. **Where the platform blocks the native shape, STOP and escalate to the
   operator** — never route around it. State what is missing and why, in plain
   language the operator can rule on without the author's context. A framing only
   the author follows makes the operator default to the recommendation, and that
   is not a decision.

**Forcing incident — FE-3034 (2026-09-15).** Asked to read a second
custom-fields catalogue, the story shipped a `client-custom-fields@<objectType>`
registration name, a module-local registration `Map`, and a hand-rolled
`catalogueQueryKey` — all duplicating the registry. The scope-native answer was a
context member, unreachable only because `.for(type, id)` demanded an id. Every
gate stayed green throughout.

**Second receipt — FE-3111.** Closed as done while `client-personal-details`
still passes a client id through `.for(PROFILE, id)`, with `PROFILE` still in its
matrix. Half its named scope never shipped, and nothing caught it.

Enforcement and follow-ups (cited, not restated): the rule amendment and the
`scope-based/no-private-instance-axis` ESLint rule live in
`.claude/rules/code-composables.companion.md`; **FE-3239** carries the `.for()`
signature change; **FE-3240** carries the three modules still smuggling an owner
id. Audit: `docs/sdd/FE-3034/review-scope-axis.md`.

### 5. Session Lookup Behavior

When `.as(actor)` is called:

1. Check multi-session store for active token for that actor type
2. If found → use that session
3. If not found → trigger auth flow or return error state

```ts
import type { SessionState } from '@upmind-automation/headless'

// One guest token alongside client and staff sessions, each keyed by session id.
declare const sessions: SessionState

export const guest = sessions.guestSession
export const clients = sessions.clientSessions
export const staff = sessions.staffSessions
```

### 6. Capabilities (Staff Only)

Staff users receive capability codes that determine permissions:

```ts
import { ScopeActorTypes, useClientEmails } from '@upmind-automation/headless'

// Capability-gated actions are not shipped yet, so the codes are declared here
// rather than read off a session.
declare const capabilities: string[]

const actions = useClientEmails().as(ScopeActorTypes.SELF).useActions()

export const remove = capabilities.includes('emails.delete')
  ? actions.destroy
  : undefined
```

### 7. Brand as a Parameter

Brand is **not a context** — it's an optional filter:

```ts
import {
  AuthContextTypes,
  ScopeActorTypes,
  useAuth
} from '@upmind-automation/headless'

const clientId = 'client-123'

// Org-wide view (all brands)
useAuth().as(ScopeActorTypes.STAFF)

// Filtered to a specific brand
useAuth().as(ScopeActorTypes.STAFF).inBrand('brand-abc')

// Brand is implicit from the context entity's own brand
useAuth().as(ScopeActorTypes.STAFF).for(AuthContextTypes.CLIENT, clientId)
```

### 8. Singleton Behavior

By default, composables are **singletons per scope key**:

```ts
import {
  ClientEmailsContextTypes,
  ScopeActorTypes,
  useClientEmails
} from '@upmind-automation/headless'

const scoped = () => useClientEmails().as(ScopeActorTypes.CLIENT)

// These return the SAME instance (same scope key)
const a = scoped().for(ClientEmailsContextTypes.CLIENT, '123')
const b = scoped().for(ClientEmailsContextTypes.CLIENT, '123')

// These return DIFFERENT instances (different scope keys)
const x = scoped().for(ClientEmailsContextTypes.CLIENT, '123')
const y = scoped().for(ClientEmailsContextTypes.CLIENT, '456')

export const same = a === b
export const different = x !== y
```

#### Future: Non-Singleton Instances

For cases requiring isolated state (e.g., multiple forms, parallel operations), a `.withKey()` pattern is under consideration:

```ts
import {
  ClientEmailsContextTypes,
  ScopeActorTypes,
  useClientEmails
} from '@upmind-automation/headless'

const id = 'client-123'
const scoped = useClientEmails()
  .as(ScopeActorTypes.CLIENT)
  .for(ClientEmailsContextTypes.CLIENT, id)

// @ts-expect-error — `.withKey()` never shipped; see the amendment below
export const modal1 = scoped.withKey('modal-1')
// @ts-expect-error — `.withKey()` never shipped; see the amendment below
export const modal2 = scoped.withKey('modal-2')
```

> **Note:** `.withKey()` was never built — see the amendment below for what shipped instead.

#### Amendment (2026-08-19): shipped as `.withId(id)`, self is the default actor

The sketch above shipped under a different name, and its role narrowed along the way:

- **`.withId(id)` marks the ONE record a single-record read opens** — offered at every
  builder position, before `.as()` or after it. It folds `id:<value>` into the scope key,
  so the SAME id resolves to the SAME cached instance: two callers reading record `'123'`
  share one instance, they are not each given an isolated one. Isolated, uncacheable state
  per call — the concern this section was written for — is what `.fresh()` already
  provides (see Singleton Behavior above). `.withId(id)` is a different concern: keying an
  instance by WHICH RECORD it reads, not by call site.
- **A caller that never names an actor resolves to `self`.** This is a deliberate default
  for the single-record case, not a relaxation of the general "Always Require `.as()`"
  rule above — see the `@decision` on `finalize` in
  `packages/headless/src/modules/scope/scope.builder.ts` for the reasoning; cited here
  rather than restated.

First shipped consumer: `useClientReceivedEmail().withId(id)` in the
`client-email-history` module.

---

## Concrete Examples

### Basket Flow

```ts
import { ScopeActorTypes } from '@upmind-automation/headless'

// Basket is not scope-adopted yet (see Implementation Status), so its target
// builder is declared here rather than imported.
type BasketScope = { for(type: 'client' | 'lead', id: string): unknown }
declare function useBasket(): { as(actor: ScopeActorTypes): BasketScope }
declare function useBasketProducts(): { as(actor: ScopeActorTypes): BasketScope }
declare function useBasketBilling(): { as(actor: ScopeActorTypes): BasketScope }

const leadId = 'lead-123'
const clientId = 'client-123'

// Guest browsing
useBasket().as(ScopeActorTypes.GUEST)
useBasketProducts().as(ScopeActorTypes.GUEST)
useBasketBilling().as(ScopeActorTypes.GUEST)

// Staff viewing a lead's basket
useBasket().as(ScopeActorTypes.STAFF).for('lead', leadId)

// Staff viewing a client's basket
useBasket().as(ScopeActorTypes.STAFF).for('client', clientId)
```

### Client Data

```ts
import {
  ClientAddressesContextTypes,
  ClientEmailsContextTypes,
  ScopeActorTypes,
  useClientAddresses,
  useClientEmails,
  usePersonalDetails
} from '@upmind-automation/headless'

const clientId = 'client-123'

// Client viewing their own data
useClientEmails().as(ScopeActorTypes.SELF)
useClientAddresses().as(ScopeActorTypes.SELF)
usePersonalDetails().as(ScopeActorTypes.SELF)

// Addressing one specific client record. STAFF is `null as never` in both
// matrices today, so CLIENT is the actor that resolves.
useClientEmails()
  .as(ScopeActorTypes.CLIENT)
  .for(ClientEmailsContextTypes.CLIENT, clientId)
useClientAddresses()
  .as(ScopeActorTypes.CLIENT)
  .for(ClientAddressesContextTypes.CLIENT, clientId)
```

### Invoices & Orders

```ts
import { ScopeActorTypes } from '@upmind-automation/headless'

// Invoices are not scope-adopted yet (see Implementation Status) — the target
// builder is declared, not imported.
declare function useInvoices(): {
  as(actor: ScopeActorTypes): {
    for(type: 'client', id: string): unknown
    inBrand(brandId: string): unknown
  }
}

const clientId = 'client-123'

// Client viewing their invoices
useInvoices().as(ScopeActorTypes.CLIENT)

// Staff viewing org-wide (all clients, all brands)
useInvoices().as(ScopeActorTypes.STAFF)

// Staff viewing org-wide, filtered by brand
useInvoices().as(ScopeActorTypes.STAFF).inBrand('brand-abc')

// Staff viewing a specific client's invoices
useInvoices().as(ScopeActorTypes.STAFF).for('client', clientId)
```

### Product Catalogue

```ts
import { ScopeActorTypes } from '@upmind-automation/headless'

// Not scope-adopted yet (see Implementation Status) — declared, not imported.
declare function useProductCatalogue(): {
  as(actor: ScopeActorTypes): unknown
}

// Public view (guest/client)
useProductCatalogue().as(ScopeActorTypes.CLIENT)

// Staff view (sees costs, margins, etc.)
useProductCatalogue().as(ScopeActorTypes.STAFF)
```

### Payment Details

```ts
import { ScopeActorTypes } from '@upmind-automation/headless'

// Not scope-adopted yet (see Implementation Status) — declared, not imported.
declare function usePaymentDetails(): {
  as(actor: ScopeActorTypes): { for(type: 'client', id: string): unknown }
}

const clientId = 'client-123'

// Client managing their payment methods
usePaymentDetails().as(ScopeActorTypes.CLIENT)

// Staff managing a client's payment methods
usePaymentDetails().as(ScopeActorTypes.STAFF).for('client', clientId)
```

---

## Composable Return Shape

Each composable returns a **layered structure** of four sub-composables:

```ts
import { ScopeActorTypes, useClientEmails } from '@upmind-automation/headless'

const emails = useClientEmails().as(ScopeActorTypes.SELF)

// CONTEXT — data, pagination, captured error, finders
const { data, error, pagination } = emails.useContext()

// META — state flags
const { isLoading, isEmpty } = emails.useMeta()

// ACTIONS — everything that mutates or refetches
const { refresh, destroy } = emails.useActions()

// INTERNALS — advanced use, debugging
const { actorScope, query } = emails.useInternals()

export const layers = {
  actions: { destroy, refresh },
  context: { data, error, pagination },
  internals: { actorScope, query },
  meta: { isEmpty, isLoading }
}
```

### The Three Layers

| Layer | Access | Contains | Who Uses |
|-------|--------|----------|----------|
| **Context** | `emails.useContext()` | Data, pagination, captured error, finders | Most devs, templates |
| **Meta** | `emails.useMeta()` | Loading states, flags | UI for spinners, empty states |
| **Actions** | `emails.useActions()` | Methods to mutate | Event handlers |
| **Internals** | `emails.useInternals()` | Actor scope, raw query, diagnostics | Advanced use, debugging |

### Example Usage

```vue
<script setup lang="ts">
import { ScopeActorTypes, useClientEmails } from '@upmind-automation/headless'

const emails = useClientEmails().as(ScopeActorTypes.SELF)
const { data, pagination } = emails.useContext()
const { isEmpty, isLoading } = emails.useMeta()
const { refresh } = emails.useActions()
</script>

<template>
  <p v-if="isLoading">Loading…</p>
  <p v-else-if="isEmpty">No emails yet</p>
  <ul v-else>
    <li v-for="email in data" :key="email.id">{{ email.email }}</li>
  </ul>
  <p>Page {{ pagination.page }} of {{ pagination.pages }}</p>
  <button @click="refresh()">Refresh</button>
</template>
```

### Sub-Composables Access

Sub-composables are accessed **from the parent composable only** — no separate registered exports like `useBasketMeta()`. This keeps the API surface small and ensures sub-composables share the same underlying instance.

---

## Consequences

### Positive

1. **Readable API** — Fluent chaining reads like natural language
2. **Predictable pattern** — Every composable works the same way
3. **Explicit actors** — No guessing about session context
4. **Layered access** — four sub-composables: context, meta, actions, internals
5. **Small API surface** — Sub-composables accessed from parent only
6. **Type-safe contexts** — TypeScript enforces valid actor/context combinations
7. **Multi-session ready** — Architecture supports simultaneous actor sessions
8. **Capability-aware** — Staff actions automatically filtered by permissions

### Negative

1. **Always requires `.as()`** — Slightly more verbose for simple cases
2. **Migration effort** — Existing composables need refactoring
3. **Builder complexity** — Internal implementation requires careful design

### Neutral

1. **Bundle size** — Minimal impact due to tree-shaking
2. **XState v5 compatible** — Pattern works with v5 migration

---

## Alternatives Considered

### 1. Separate Composable Variants

```ts
import type { ScopeActor, ScopeContext } from '@upmind-automation/headless'

// The rejected sketch — none of these variants ever shipped.
declare function useBasketAs(actor: ScopeActor): unknown
declare function useBasketFor(context: ScopeContext): unknown
declare function useBasketForAs(context: ScopeContext, actor: ScopeActor): unknown

declare const actor: ScopeActor
declare const context: ScopeContext

useBasketAs(actor)
useBasketFor(context)
useBasketForAs(context, actor)
```

**Rejected:** Gets murky about which variant to use when. Chaining is clearer.

### 2. Options Object

```ts
import { ScopeActorTypes } from '@upmind-automation/headless'
import type { ScopeActor, ScopeContext } from '@upmind-automation/headless'

// The rejected sketch — an options object instead of the fluent chain.
declare function useBasket(options: {
  actor: ScopeActor
  context: ScopeContext
}): unknown

const id = 'client-123'

useBasket({ actor: ScopeActorTypes.STAFF, context: { id, type: 'client' } })
```

**Rejected:** Less readable than fluent chaining.

### 3. Implicit Actor from Session

```ts
// The rejected sketch — no actor named, inferred from the current session.
declare function useBasket(): unknown

useBasket()
```

**Rejected:** Less explicit, harder to reason about. Always requiring `.as()` is clearer.

---

## Playground UI Concept

The team agreed on a composable-focused playground:

```
┌────────────────────────────────────────────────────────────┐
│  [Actor: Staff ▼]  [Brand: All ▼]  [Context: Client 123 ▼] │
├──────────────┬─────────────────────────────────────────────┤
│ Composables  │                                             │
│ ─────────────│  useClientEmails()                          │
│ useBasket    │    .as('staff')                             │
│ useClient... │    .for('client', '123')                    │
│ useConfig    │                                             │
│ useInvoices  │  ┌──────────────────────────────────────┐   │
│ useOrders    │  │ Data: [...]                          │   │
│ usePayment...│  │ isLoading: false                     │   │
│ useProduct...│  │ Actions: refresh, create, delete     │   │
│              │  └──────────────────────────────────────┘   │
└──────────────┴─────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Foundation

- Multi-session store supporting simultaneous actor tokens
- Fluent builder factory
- Type definitions for Actor, Context, Capabilities

### Phase 2: Migration

- Refactor existing composables to new pattern
- Add `.as()`, `.for()`, `.inBrand()` support
- Flatten meta access

### Phase 3: Staff/Admin Contexts

- Staff-specific API endpoints
- Capability filtering for actions
- Impersonation flows

### Phase 4: Playground

- Composable-focused testing UI
- Actor/Brand/Context selectors
- Live composable output display

---

## Related Documents

- [`.agent/rules/code-composables-scoped.md`](/.agent/rules/code-composables-scoped.md) — Scoped composable patterns (supersedes DEVX.md for this area)
- [`.agent/rules/code-composables.md`](/.agent/rules/code-composables.md) — Composable contract
- [`.agent/rules/code-style.md`](/.agent/rules/code-style.md) — Coding standards
- Session management architecture (TBD)

---

## Implementation Status

*As of July 2026.* Adoption is **partial and in progress**, not complete.

- **Reference implementations (pattern proven):** `auth/`, `session-store/`, and the `scope/` primitive itself carry the four-layer return + `createScopedComposable`.
- **Pilot (this ADR's proving ground):** `client-email` was the first feature-module adoption (FE-2824). It exposed a critical failure mode now governed by [ADR 029](./029-agent-plugin-seat-separation-and-anti-cosplay.md): the scope *shape* can be present (actor matrix incl. `STAFF`, four-layer return) while an actor is **behaviourally unwired** — services hardwired the session's own client id and the `.for('client', id)` target was dropped, so the `staff` actor was cosmetic. **Correctness of a scope adoption is defined by the actor×context matrix behaving against the vue-app legacy — not by the matrix's mere existence.**
- **Remaining feature modules:** conventional (pre-scope) composables; adoption is fanned out per-module (FE-2824 sub-epic), each gated by the parity oracle in ADR 029.
- **Open (unchanged):** the direct-props vs four-layer sketch in this ADR is superseded by the four-layer return as canonical (see `scoped-composables` rule + the `auth/` reference); session-management architecture still TBD.

---

## Meeting Notes Reference

**Jan 20, 2026** — Dominic da Costa, Chris Garner, Dominik Piska, Rhodri Jones

Key decisions:

- Admin and Staff unified as "staff" with capability codes
- "Actor" = who (staff/client/guest), "Context" = what (client/lead/contract/etc.)
- Brand is a parameter, not a context (optional filter)
- Multi-session support for simultaneous actor logins
- Composable-focused playground UI
