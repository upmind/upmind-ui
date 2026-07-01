# Composable Architecture Proposal

**Created:** January 19, 2026
**Status:** Draft for Review
**Authors:** Dom da Costa, AI Analysis

---

## Executive Summary

This document proposes a unified composable architecture pattern that addresses:

- Multiple actor types (client, guest, lead, staff, admin)
- Impersonation contexts (staff-as-client, admin-as-guest, etc.)
- Singleton vs instance-based composables
- Different endpoints/services per actor context
- Predictable, easy-to-understand API

---

## Problem Statement

Current challenges:

1. **Complex meta access**: `basket.meta.value.isLoading` is deeply nested
2. **Actor contexts incoming**: Staff/admin impersonation, lead tracking
3. **Different endpoints per actor**: Admin APIs differ from client APIs
4. **Onboarding difficulty**: XState + custom patterns create steep learning curve
5. **Singleton vs instance confusion**: When is state shared?

---

## Proposed Solution: Scope-Based Composables

### Core Concept: Scope

```typescript
Scope = Actor + Context + (optional) TargetId

Examples:
- { actor: 'client', context: 'self' }           // Normal client
- { actor: 'staff', context: 'impersonating',
    targetActor: 'client', targetId: '123' }     // Staff viewing client
- { actor: 'admin', context: 'self' }            // Admin user
```

---

## Type Definitions

### Actor Types

```typescript
export type Actor =
  | 'client'     // Logged-in customer
  | 'guest'      // Unauthenticated user
  | 'lead'       // Pre-conversion prospect
  | 'staff'      // Staff member
  | 'admin';     // Administrator

export type ContextMode = 'self' | 'impersonating';

export interface Scope {
  actor: Actor;
  context: ContextMode;
  targetId?: string;        // When impersonating
  targetActor?: Actor;      // What type they're impersonating as
}
```

### Pre-defined Scopes

```typescript
export const SCOPE = {
  CLIENT: { actor: 'client', context: 'self' },
  GUEST: { actor: 'guest', context: 'self' },
  LEAD: { actor: 'lead', context: 'self' },
  STAFF: { actor: 'staff', context: 'self' },
  ADMIN: { actor: 'admin', context: 'self' },
} as const;

// Factory for impersonation
export function impersonateAs(
  sourceActor: 'staff' | 'admin',
  targetActor: Actor,
  targetId: string
): Scope {
  return {
    actor: sourceActor,
    context: 'impersonating',
    targetActor,
    targetId,
  };
}
```

---

## Composable Layers

### Layer Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        useBasket()                               │
│  Core composable - data, context values                         │
└─────────────────────────────────────────────────────────────────┘
         │
         ├── useBasketMeta()      → Flat flags: isLoading, canCheckout...
         ├── useBasketActions()   → Methods: add, remove, checkout...
         └── useBasketAdvanced()  → Escape hatch: machine, send, service
```

### API Surface

| Composable | Returns | Singleton | Use Case |
|------------|---------|-----------|----------|
| `useBasket()` | Core data | Yes (per scope) | Default usage |
| `useBasketMeta()` | Flat reactive flags | Yes | UI state binding |
| `useBasketActions()` | Just methods | Yes | Action-only needs |
| `useBasketAdvanced()` | Machine access | Yes | Debugging, power users |
| `useBasketFor(scope)` | Core with explicit scope | Yes | Admin/staff apps |
| `useBasketInstance(scope)` | Isolated state | No | Multi-instance needs |

---

## Singleton Registry Pattern

### How Instance Sharing Works

Composables use a **registry pattern** that keys instances by scope. This means:

- **Same scope = same machine instance** (singleton behavior)
- **Different scope = different machine instance** (isolated state)
- **`useXInstance()` = always new** (explicit non-singleton)

### Registry Implementation

```typescript
// Internal registry keyed by scope string
const instances = new Map<string, FeatureInstance>();

function scopeKey(scope: Scope): string {
  if (scope.context === 'impersonating') {
    // Unique per: actor + target type + target ID
    return `${scope.actor}:${scope.targetActor}:${scope.targetId}`;
  }
  // Unique per: actor only
  return `${scope.actor}:self`;
}

export function createBasketComposable(scope: Scope) {
  const key = scopeKey(scope);

  // SINGLETON: Return existing if same scope
  if (instances.has(key)) {
    return instances.get(key)!;
  }

  // NEW: Create and store for future calls
  const config = getBasketConfig(scope);
  const machine = createBasketMachine(config, scope);
  machine.start();

  const instance = { scope, machine, config };
  instances.set(key, instance);

  return instance;
}

// Cleanup when needed (logout, context switch)
export function destroyInstance(scope: Scope) {
  const key = scopeKey(scope);
  const instance = instances.get(key);
  if (instance) {
    instance.machine.stop();
    instances.delete(key);
  }
}
```

### Instance Sharing Examples

| Call | Scope Key | Instance |
|------|-----------|----------|
| `useBasket()` (client app) | `client:self` | Instance A |
| `useBasket()` (another component) | `client:self` | Instance A ✅ **same** |
| `useBasketMeta()` | `client:self` | Instance A ✅ **same** |
| `useBasketActions()` | `client:self` | Instance A ✅ **same** |
| `useBasketFor(SCOPE.ADMIN)` | `admin:self` | Instance B |
| `useBasketFor(impersonate('staff','client','123'))` | `staff:client:123` | Instance C |
| `useBasketFor(impersonate('staff','client','456'))` | `staff:client:456` | Instance D |
| `useBasketInstance(SCOPE.CLIENT)` | N/A (bypasses registry) | **Always new** |

### Key Behaviors

1. **All composable variants share the same machine for the same scope**

   ```typescript
   // These all use the SAME machine instance:
   const { products } = useBasket();
   const { isLoading } = useBasketMeta();
   const { add } = useBasketActions();
   ```

2. **Different scopes are isolated**

   ```typescript
   // These are DIFFERENT machine instances:
   const clientBasket = useBasketFor(SCOPE.CLIENT);
   const adminBasket = useBasketFor(SCOPE.ADMIN);
   ```

3. **Impersonation creates per-target instances**

   ```typescript
   // Viewing two different clients = two different machines
   const client123 = useBasketFor(impersonateAs('staff', 'client', '123'));
   const client456 = useBasketFor(impersonateAs('staff', 'client', '456'));
   ```

4. **Explicit instances bypass the registry**

   ```typescript
   // These are always NEW, independent machines
   const quote1 = useBasketInstance(SCOPE.CLIENT);
   const quote2 = useBasketInstance(SCOPE.CLIENT);
   // quote1 and quote2 have separate state
   ```

### When to Use Each Pattern

| Pattern | Use When |
|---------|----------|
| Default composables | Normal app usage, shared state needed |
| `useXFor(scope)` | Admin/staff with explicit context |
| `useXInstance()` | Comparing items side-by-side, wizards, isolated widgets |

---

## Implementation Examples

### 1. Core Composable

```typescript
// packages/headless/src/basket/useBasket.ts

export function useBasket() {
  const { scope } = useAppScope(); // From context provider
  const { state } = createBasketComposable(scope);

  // --- context (data only, no meta)
  const basket = useContext<IBasket>(state, 'basket');
  const products = useContext<BasketProduct[]>(state, 'products');
  const currency = useContext<string>(state, 'currency');
  const totals = useContext<ITotals>(state, 'totals');

  return {
    basket,
    products,
    currency,
    totals,
  };
}
```

### 2. Meta Composable (Flat Flags)

```typescript
// packages/headless/src/basket/useBasketMeta.ts

export function useBasketMeta() {
  const { scope } = useAppScope();
  const { state, config } = createBasketComposable(scope);

  return {
    /** Machine is loading */
    isLoading: computed(() => stateMatches(state, 'loading')),

    /** Machine is processing an action */
    isProcessing: computed(() => stateMatches(state, 'processing')),

    /** Basket has products */
    hasProducts: computed(() => contextValue(state, 'products')?.length > 0),

    /** Machine is in error state */
    hasError: computed(() => stateMatches(state, 'error')),

    /** Basket is ready for checkout */
    canCheckout: computed(() =>
      stateMatches(state, 'ready') &&
      contextValue(state, 'products')?.length > 0
    ),

    /** User can override prices (staff/admin only) */
    canOverridePrice: computed(() => config.capabilities.canOverridePrice),

    /** User can view cost prices (staff/admin only) */
    canViewCost: computed(() => config.capabilities.canViewCost),
  };
}
```

### 3. Actions Composable

```typescript
// packages/headless/src/basket/useBasketActions.ts

export function useBasketActions() {
  const { scope } = useAppScope();
  const { send, config } = createBasketComposable(scope);

  return {
    add: (product: AddProductPayload) => send({ type: 'ADD', product }),
    remove: (id: string) => send({ type: 'REMOVE', id }),
    clear: () => send({ type: 'CLEAR' }),
    applyPromotion: (code: string) => send({ type: 'APPLY_PROMO', code }),
    setCurrency: (currency: string) => send({ type: 'SET_CURRENCY', currency }),
    checkout: () => send({ type: 'CHECKOUT' }),
    refresh: () => send({ type: 'REFRESH' }),

    // Scope-specific actions (only available for some actors)
    ...(config.capabilities.canOverridePrice && {
      overridePrice: (productId: string, price: number) =>
        send({ type: 'OVERRIDE_PRICE', productId, price }),
    }),
  };
}
```

### 4. Advanced (Escape Hatch)

```typescript
// packages/headless/src/basket/useBasketAdvanced.ts

export function useBasketAdvanced() {
  const { scope } = useAppScope();
  const { state, send, service } = createBasketComposable(scope);

  return {
    state,
    send,
    service,
    isReady: () => waitFor(service, s => stateMatches(s, 'ready')),
    subscribe: service.subscribe.bind(service),
  };
}
```

### 5. Explicit Scope Variants

```typescript
// For explicit scope control (admin/staff apps)

export function useBasketFor(scope: Scope) {
  return createBasketComposable(scope);
}

export function useBasketMetaFor(scope: Scope) {
  const { state, config } = createBasketComposable(scope);
  // ... same as useBasketMeta but uses explicit scope
}

export function useBasketActionsFor(scope: Scope) {
  const { send, config } = createBasketComposable(scope);
  // ... same as useBasketActions but uses explicit scope
}
```

### 6. Instance (Non-Singleton)

```typescript
// For isolated state (comparing quotes, wizards, etc.)

export function useBasketInstance(scope: Scope) {
  // Does NOT use registry, always creates new
  const config = getBasketConfig(scope);
  const machine = createBasketMachine(config, scope);
  return { scope, machine, config };
}
```

---

## Configuration by Scope

### Config Structure

```typescript
interface BasketConfig {
  endpoints: {
    getBasket: string;
    addProduct: string;
    removeProduct: string;
    checkout: string;
  };
  capabilities: {
    canApplyPromotion: boolean;
    canOverridePrice: boolean;
    canViewCost: boolean;
  };
  states: string[];
}
```

### Example Configurations

| Scope Key | Endpoints Base | Can Override Price | Can View Cost |
|-----------|---------------|-------------------|---------------|
| `client:self` | `/api/v1/basket` | ❌ | ❌ |
| `guest:self` | `/api/v1/basket` | ❌ | ❌ |
| `admin:self` | `/api/admin/v1/orders/draft` | ✅ | ✅ |
| `staff:impersonating:client` | `/api/staff/v1/clients/:id/basket` | ✅ | ✅ |

---

## App-Level Scope Provider

```typescript
// packages/client-vue/src/providers/ScopeProvider.ts

export function provideScopeContext(initialScope: Scope) {
  const currentScope = ref<Scope>(initialScope);

  const context = {
    scope: computed(() => currentScope.value),
    actor: computed(() => currentScope.value.actor),
    isImpersonating: computed(() => currentScope.value.context === 'impersonating'),
    targetId: computed(() => currentScope.value.targetId),

    setScope(scope: Scope) { currentScope.value = scope; },

    impersonate(targetActor: Actor, targetId: string) {
      currentScope.value = {
        actor: currentScope.value.actor,
        context: 'impersonating',
        targetActor,
        targetId,
      };
    },

    stopImpersonating() {
      currentScope.value = {
        actor: currentScope.value.actor,
        context: 'self',
      };
    },
  };

  provide(SCOPE_KEY, context);
  return context;
}

export function useAppScope() {
  return inject(SCOPE_KEY);
}
```

### App Setup

```typescript
// apps/cart/src/main.ts
provideScopeContext(SCOPE.CLIENT);

// apps/admin/src/main.ts
provideScopeContext(SCOPE.ADMIN);

// apps/portal/src/main.ts (staff)
provideScopeContext(SCOPE.STAFF);
```

---

## Decision Tree: What to Use

```
┌─────────────────────────────────────────────────────────────────┐
│           What kind of app/component am I building?             │
└─────────────────────────────────────────────────────────────────┘
                              │
           ┌──────────────────┴──────────────────┐
           ▼                                      ▼
   Client-facing app                       Admin/Staff app
   (cart, portal)                          (admin panel)
           │                                      │
           ▼                                      ▼
   Use DEFAULTS:                           Use EXPLICIT SCOPE:
   useBasket()                             useBasketFor(SCOPE.ADMIN)
   useBasketMeta()                         useBasketFor(impersonateAs(...))
   useBasketActions()                              │
           │                                      │
           └──────────────┬───────────────────────┘
                          │
                          ▼
            ┌─────────────────────────┐
            │  Need isolated state?   │
            │  (multiple instances)   │
            └─────────────────────────┘
                          │
              ┌───────────┴───────────┐
              ▼                       ▼
             No                      Yes
              │                       │
              ▼                       ▼
         Use normal              useBasketInstance()
         composables             (creates new each time)
```

---

## Quick Reference

| Scenario | Composable to Use |
|----------|-------------------|
| Cart app (customer) | `useBasket()`, `useBasketMeta()` |
| Portal app (logged in) | `useBasket()`, `useBasketMeta()` |
| Guest checkout | `useBasket()` (auto-detected) |
| Admin own orders | `useBasketFor(SCOPE.ADMIN)` |
| Staff viewing client | `useBasketFor(impersonateAs('staff', 'client', id))` |
| Comparing two quotes | `useBasketInstance()` × 2 |
| Isolated widget | `useBasketInstance()` |

---

## Usage Example: Admin Viewing Client

```vue
<script setup lang="ts">
import {
  impersonateAs,
  useBasketFor,
  useBasketMetaFor,
  useBasketActionsFor
} from '@upmind-automation/headless';

const props = defineProps<{ clientId: string }>();

const scope = impersonateAs('staff', 'client', props.clientId);

const { products, totals } = useBasketFor(scope);
const { isLoading, canCheckout, canOverridePrice } = useBasketMetaFor(scope);
const { add, remove, overridePrice, checkout } = useBasketActionsFor(scope);
</script>

<template>
  <AdminHeader>Client Basket: {{ clientId }}</AdminHeader>

  <LoadingState v-if="isLoading" />

  <div v-else>
    <ProductList :products="products">
      <template #price="{ product }" v-if="canOverridePrice">
        <PriceOverrideInput
          :value="product.price"
          @update="overridePrice(product.id, $event)"
        />
      </template>
    </ProductList>

    <TotalsSummary :totals="totals" :show-cost="true" />

    <Button @click="checkout" :disabled="!canCheckout">
      Create Order for Client
    </Button>
  </div>
</template>
```

---

## Migration Path

### Phase 1: Foundation

- [ ] Define Scope types
- [ ] Implement ScopeProvider
- [ ] Create config structure

### Phase 2: Refactor Existing

- [ ] Migrate to XState v5
- [ ] Split existing composables into Meta/Actions/Advanced
- [ ] Add scope support to factories

### Phase 3: Actor Contexts

- [ ] Add staff scope endpoints
- [ ] Add admin scope endpoints
- [ ] Implement impersonation flow

### Phase 4: Polish

- [ ] Type-safe scope resolution
- [ ] Documentation
- [x] Composable standards captured in `.agent/rules/` (`code-style.md`, `code-composables.md`, `code-composables-scoped.md`) — DEVX.md retired

---

## Benefits

| Benefit | Description |
|---------|-------------|
| **Predictable API** | Always know what composable to use |
| **Flat meta access** | `isLoading` not `meta.value.isLoading` |
| **Actor flexibility** | Same patterns for all user types |
| **Scope isolation** | Different actors, different machines |
| **Singleton control** | Explicit when you want instances |
| **AI-friendly** | Consistent patterns for code generation |

---

## Open Questions

1. **Scope persistence**: Should scope survive page reload?
2. **Scope transitions**: How to handle login/logout?
3. **Scope validation**: Prevent staff from impersonating admin?
4. **Caching**: Per-scope or shared?

---

## Related Documents

- [`.agent/rules/code-style.md`](/.agent/rules/code-style.md) - Coding standards (replaces DEVX.md)
- [ANALYSIS.md](../.gemini/antigravity/brain/.../ANALYSIS.md) - Deep analysis
