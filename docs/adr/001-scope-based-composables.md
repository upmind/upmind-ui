# ADR 001: Scope-Based Composable Architecture

**Date:** January 19, 2026
**Status:** Proposed
**Authors:** Dom da Costa, AI Analysis

---

## Context

The Upmind platform requires a composable architecture that supports:

1. **Multiple actor types**: client, guest, lead, staff, admin
2. **Impersonation contexts**: staff-as-client, admin-as-guest, etc.
3. **Different API endpoints**: per actor (client API vs admin API)
4. **Different capabilities**: per actor (price override, cost visibility)
5. **Singleton behavior**: shared state within the same scope
6. **Instance behavior**: isolated state when needed
7. **Simpler API**: flatter access patterns for meta/actions

Current challenges:

- `basket.meta.value.isLoading` is deeply nested
- No pattern for handling actor-specific contexts
- Confusion about when state is shared vs isolated
- Steep learning curve for new developers

---

## Decision

We will implement a **Scope-Based Composable Architecture** with the following patterns:

### 1. Scope Definition

```typescript
type Actor = 'client' | 'guest' | 'lead' | 'staff' | 'admin';
type ContextMode = 'self' | 'impersonating';

interface Scope {
  actor: Actor;
  context: ContextMode;
  targetId?: string;
  targetActor?: Actor;
}
```

### 2. Composable Layers

Each feature will expose multiple composable variants:

| Composable | Returns | Singleton |
|------------|---------|-----------|
| `useFeature()` | Core data | Yes (per scope) |
| `useFeatureMeta()` | Flat reactive flags | Yes |
| `useFeatureActions()` | Methods only | Yes |
| `useFeatureAdvanced()` | Machine access | Yes |
| `useFeatureFor(scope)` | Explicit scope | Yes |
| `useFeatureInstance(scope)` | Isolated state | No |

### 3. Singleton Registry Pattern

Instances are keyed by scope string:

```typescript
const scopeKey = (scope: Scope) =>
  scope.context === 'impersonating'
    ? `${scope.actor}:${scope.targetActor}:${scope.targetId}`
    : `${scope.actor}:self`;
```

- Same scope = same machine instance
- Different scope = different machine instance
- `useXInstance()` = always new instance

### 4. Configuration by Scope

Each scope maps to specific:

- API endpoints
- Capabilities (can override price, can view cost, etc.)
- Available state machine states

---

## Consequences

### Positive

1. **Predictable API** - Developers always know which composable to use
2. **Flat meta access** - `isLoading` instead of `meta.value.isLoading`
3. **Actor flexibility** - Same patterns work for all user types
4. **Scope isolation** - Different actors get isolated state automatically
5. **AI-friendly** - Consistent patterns enable better code generation
6. **Future-proof** - Easy to add new actor types or contexts

### Negative

1. **More composables to export** - 6 variants per feature instead of 1
2. **Migration effort** - Existing code needs refactoring
3. **Learning curve** - New patterns to learn (though simpler than current)

### Neutral

1. **Bundle size** - Minimal impact due to tree-shaking
2. **XState v5 migration** - This architecture is compatible with v5

---

## Alternatives Considered

### 1. Keep Current Pattern

**Rejected because:**

- Nested meta access is confusing
- No actor context support without major refactoring
- New devs struggle with current patterns

### 2. Single Composable with Options

```typescript
useBasket({ scope, returnMeta: true, returnActions: true })
```

**Rejected because:**

- Complex return types
- Harder to tree-shake
- Less predictable API

### 3. Context Provider Only

**Rejected because:**

- Doesn't solve flat meta access
- Doesn't provide explicit scope override
- Less flexible for admin/staff tools

---

## Implementation Plan

See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for detailed rollout.

### Phase 1: Foundation (1 sprint)

- Define Scope types
- Implement ScopeProvider
- Create configuration structure

### Phase 2: Refactor (2-3 sprints)

- Migrate to XState v5
- Split existing composables
- Add scope support to factories

### Phase 3: Actor Contexts (2 sprints)

- Add staff/admin scope endpoints
- Implement impersonation flow

### Phase 4: Polish (1 sprint)

- Update documentation
- Update DEVX.md patterns

---

## Related Documents

- [ARCHITECTURE_PROPOSAL.md](./ARCHITECTURE_PROPOSAL.md) - Full technical specification
- [ANALYSIS.md](./ANALYSIS.md) - Deep codebase analysis
- [DEVX.md](../DEVX.md) - Coding style guide
