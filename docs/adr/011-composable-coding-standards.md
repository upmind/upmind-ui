# ADR 011: Composable Coding Standards

**Date:** January 2024 (Retroactive)
**Status:** Accepted
**Authors:** Upmind Engineering Team

---

## Context

With multiple developers contributing to the codebase, we needed:

1. Consistent composable structure across all modules
2. Predictable return types for consumers
3. Clear documentation standards
4. Enforceable patterns for code review

---

## Decision

Establish strict composable coding standards documented in **DEVX.md** and enforced via code review.

> [!NOTE]
> This ADR summarizes the key decisions. See [DEVX.md](/DEVX.md) for the complete style guide.

---

## Key Standards

### 1. Return Object Structure

Group returns in this order:

```typescript
return {
  // --- state
  isReady,
  meta,
  value,

  // --- context
  basket,
  errors,

  // --- methods
  add,
  remove,
  refresh,
}
```

### 2. JSDoc Placement

JSDoc **only** above properties in the return object:

```typescript
return {
  /**
   * Waits for the machine to be ready.
   * @returns {Promise<boolean>}
   */
  isReady,

  /**
   * Adds an item to the basket.
   * @param {Product} product - The product to add.
   */
  add,
}
```

### 3. Meta Object Pattern

```typescript
/**
 * @typedef {Object} BasketMeta
 * @property {boolean} isLoading - True while loading
 * @property {boolean} hasItems - True if basket has items
 * @property {boolean} canCheckout - True if checkout allowed
 */
const meta = computed(() => ({
  isLoading: stateMatches(state, ['loading']),
  hasItems: !isEmpty(basket.value?.products),
  canCheckout: basket.value?.products?.length > 0,
}))
```

### 4. isReady Pattern

```typescript
async function isReady(): Promise<boolean> {
  return waitFor(
    service,
    state => !stateMatches(state, ['loading']),
    { timeout: Infinity }
  ).then(state => {
    if (stateMatches(state, ['error'])) return false
    return true
  })
}
```

### 5. Export Return Type

```typescript
export const useBasket = () => {
  // ...
  return { /* ... */ }
}

export type UseBasket = ReturnType<typeof useBasket>
```

---

## Do / Don't Summary

| ✅ Do | ❌ Don't |
| ----- | -------- |
| Use Lodash for array/object ops | Use native JS methods |
| Use `stateMatches()` | Access `state.matches` directly |
| Use `useContext()` | Access `state.context` directly |
| JSDoc above return properties | JSDoc above function declarations |
| Export return type | Return untyped objects |
| Group returns by section | Mix return order |
| Define computed above return | Define inline in return |

---

## State/Context Utilities

Always use Upmind utilities:

```typescript
// ✅ CORRECT
import { useContext, stateMatches, contextValue } from '@/utils'

const basket = useContext(state, 'basket')
const isLoading = stateMatches(state, ['loading'])

// ❌ WRONG
const basket = state.value.context.basket
const isLoading = state.value.matches('loading')
```

---

## Consequences

### Positive

1. **Consistency** — all composables follow same structure
2. **Discoverability** — predictable API shape
3. **Documentation** — JSDoc generates accurate docs
4. **Onboarding** — new developers know what to expect
5. **Code review** — clear checklist for reviewers

### Negative

1. **Rigidity** — less flexibility in structure
2. **Overhead** — more boilerplate per composable

### Neutral

1. **Learning curve** — developers must read DEVX.md

---

## Enforcement

- **Code review** — reviewers check against DEVX.md
- **AI agents** — instructed to follow patterns
- **Reference implementations** — `useDomain`, `useBasket`, `useBrand`

---

## Related Documents

- [DEVX.md](/DEVX.md) — Complete style guide
- [ADR 005: XState State Management](./005-xstate-state-management.md)
- [ADR 001: Scope-Based Composables](./001-scope-based-composables.md)
