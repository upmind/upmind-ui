# ADR 001: Scope-Based Composable Architecture

**Date:** January 19, 2026
**Updated:** January 21, 2026
**Status:** Proposed
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

```typescript
useFeature()
  .as(actor)              // Required — specifies the actor
  .for(contextType, id)   // Optional — specifies the context
  .inBrand(brandId)       // Optional — filters by brand
```

#### Convention: `.as()` before `.for()`

While the builder accepts either order, the **recommended convention** is:

```typescript
// ✅ Recommended: reads like natural language
useClientEmails().as('staff').for('client', clientId)
// "Use client emails AS staff FOR client 123"

// ⚠️ Works, but less readable
useClientEmails().for('client', clientId).as('staff')
```

#### Always Require `.as()`

Even for the "current user" case, `.as('self')` is required:

```typescript
// ✅ Explicit
useBasket().as('self')
useInvoices().as('self')

// ❌ Not allowed — must specify actor
useBasket()  // Error: .as() is required
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

### 4. Actor → Context Availability Matrix

Each actor has specific contexts they can operate on:

| Actor | Default Context | Available `.for()` Contexts |
|-------|-----------------|----------------------------|
| `guest` | Anonymous session | `basket` only |
| `client` | Self (client ID from token) | `contract`, `product`, `invoice`, `ticket` |
| `staff` | Org-wide (no specific entity) | All contexts: `client`, `lead`, `contract`, `product`, `invoice`, `order`, `ticket`, etc. |

> **Note:** There are **no nested contexts**. Each `.for()` call specifies a single, flat context.

### 5. Session Lookup Behavior

When `.as(actor)` is called:

1. Check multi-session store for active token for that actor type
2. If found → use that session
3. If not found → trigger auth flow or return error state

```typescript
// Session store maintains multiple active sessions
{
  guest: { token: '...', expiresAt: ... },
  client: { token: '...', clientId: '123', ... },
  staff: { token: '...', capabilities: [...], ... }
}
```

### 6. Capabilities (Staff Only)

Staff users receive capability codes that determine permissions:

```typescript
// Capabilities come from the /self endpoint
const capabilities = ['emails.send', 'emails.delete', 'invoices.refund', ...]

// Composable actions filtered by capabilities
const { actions } = useClientEmails().as('staff').for('client', id)
// actions.delete is undefined if staff lacks 'emails.delete' capability
```

### 7. Brand as a Parameter

Brand is **not a context** — it's an optional filter:

```typescript
// Org-wide view (all brands)
useInvoices().as('staff')

// Filtered to specific brand
useInvoices().as('staff').inBrand('brand-abc')

// Brand is inherited for singletons (client belongs to one brand)
useClientEmails().as('staff').for('client', clientId)
// Brand is implicit from the client's brand
```

### 8. Singleton Behavior

By default, composables are **singletons per scope key**:

```typescript
// These return the SAME instance (same scope key)
const a = useBasket().as('staff').for('client', '123')
const b = useBasket().as('staff').for('client', '123')
// a === b (same underlying machine/state)

// These return DIFFERENT instances (different scope keys)
const x = useBasket().as('staff').for('client', '123')
const y = useBasket().as('staff').for('client', '456')
// x !== y (different clients = different instances)
```

#### Future: Non-Singleton Instances

For cases requiring isolated state (e.g., multiple forms, parallel operations), a `.withKey()` pattern is under consideration:

```typescript
// Force a unique instance with explicit key
const modal1 = useBasket().as('staff').for('client', id).withKey('modal-1')
const modal2 = useBasket().as('staff').for('client', id).withKey('modal-2')
// modal1 !== modal2 (isolated state)
```

> **Note:** This is a future consideration. Non-singletons will always require an explicit key.

---

## Concrete Examples

### Basket Flow

```typescript
// Guest browsing
useBasket().as('self')
useBasketProducts().as('self')
useBasketBilling().as('self')

// Staff viewing a lead's basket
useBasket().as('staff').for('lead', leadId)

// Staff viewing a client's basket
useBasket().as('staff').for('client', clientId)
```

### Client Data

```typescript
// Client viewing their own data
useClientEmails().as('self')
useClientAddresses().as('self')
usePersonalDetails().as('self')

// Staff viewing a specific client
useClientEmails().as('staff').for('client', clientId)
useClientAddresses().as('staff').for('client', clientId)
```

### Invoices & Orders

```typescript
// Client viewing their invoices
useInvoices().as('self')

// Staff viewing org-wide (all clients, all brands)
useInvoices().as('staff')

// Staff viewing org-wide, filtered by brand
useInvoices().as('staff').inBrand('brand-abc')

// Staff viewing a specific client's invoices
useInvoices().as('staff').for('client', clientId)
```

### Product Catalogue

```typescript
// Public view (guest/client)
useProductCatalogue().as('self')

// Staff view (sees costs, margins, etc.)
useProductCatalogue().as('staff')
```

### Payment Details

```typescript
// Client managing their payment methods
usePaymentDetails().as('self')

// Staff managing a client's payment methods
usePaymentDetails().as('staff').for('client', clientId)
```

---

## Composable Return Shape

Each composable returns a **layered structure** with direct properties and sub-composables:

```typescript
const basket = useBasket().as('staff').for('client', id)

// ═══════════════════════════════════════════════════════════════
// DIRECT PROPERTIES — Data and context (most common access)
// ═══════════════════════════════════════════════════════════════
basket.data           // Core data (items, totals, etc.)
basket.pagination     // { page, perPage, total, hasMore }
basket.error          // Error object if any
basket.items          // Feature-specific shorthand (optional)

// ═══════════════════════════════════════════════════════════════
// SUB-COMPOSABLES — Grouped access for specific concerns
// ═══════════════════════════════════════════════════════════════
basket.useMeta()      // { isLoading, isError, isEmpty, isStale, ... }
basket.useActions()   // { refresh, addProduct, removeProduct, checkout, ... }
basket.useInternals() // { machine, service, subscriptions, ... }
```

### The Three Layers

| Layer | Access | Contains | Who Uses |
|-------|--------|----------|----------|
| **Direct props** | `basket.data`, `basket.pagination` | Data, results, context | Most devs, templates |
| **Meta** | `basket.useMeta()` | Loading states, flags | UI for spinners, empty states |
| **Actions** | `basket.useActions()` | Methods to mutate | Event handlers |
| **Internals** | `basket.useInternals()` | Machine, services, subscriptions | Advanced use, debugging |

### Example Usage

```typescript
// Template usage — direct props
<div v-if="basket.pagination.hasMore">Load more...</div>
<ProductList :items="basket.data.items" />

// Loading states — meta
const { isLoading, isEmpty } = basket.useMeta()
<Spinner v-if="isLoading" />
<EmptyState v-if="isEmpty" />

// User interactions — actions
const { addProduct, checkout } = basket.useActions()
<button @click="addProduct(item)">Add</button>

// Debugging / advanced — internals
const { machine } = basket.useInternals()
console.log(machine.state.value)
```

### Sub-Composables Access

Sub-composables are accessed **from the parent composable only** — no separate registered exports like `useBasketMeta()`. This keeps the API surface small and ensures sub-composables share the same underlying instance.

---

## Consequences

### Positive

1. **Readable API** — Fluent chaining reads like natural language
2. **Predictable pattern** — Every composable works the same way
3. **Explicit actors** — No guessing about session context
4. **Layered access** — Direct props for data, sub-composables for meta/actions/internals
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

```typescript
useBasketAs(actor)
useBasketFor(context)
useBasketForAs(context, actor)
```

**Rejected:** Gets murky about which variant to use when. Chaining is clearer.

### 2. Options Object

```typescript
useBasket({ actor: 'staff', context: { client: id } })
```

**Rejected:** Less readable than fluent chaining.

### 3. Implicit Actor from Session

```typescript
useBasket()  // Infers actor from current session
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

## Meeting Notes Reference

**Jan 20, 2026** — Dominic da Costa, Chris Garner, Dominik Piska, Rhodri Jones

Key decisions:

- Admin and Staff unified as "staff" with capability codes
- "Actor" = who (staff/client/guest), "Context" = what (client/lead/contract/etc.)
- Brand is a parameter, not a context (optional filter)
- Multi-session support for simultaneous actor logins
- Composable-focused playground UI
