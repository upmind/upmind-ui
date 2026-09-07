# ADR 010: Lodash for Utility Operations

**Date:** January 2024 (Retroactive)
**Status:** Accepted
**Authors:** Upmind Engineering Team

---

## Context

JavaScript provides native array and object methods, but:

1. Inconsistent behavior across edge cases
2. Verbose chaining for complex operations
3. Missing utility functions (debounce, throttle, deep clone)
4. No tree-shaking for native methods

We needed a standardized utility library for consistency.

---

## Decision

**Mandate Lodash-es** for all utility, array, and object operations across the codebase.

---

## Rules

### ✅ DO: Use Lodash for Array/Object Operations

```ts
import { filter, find, get, isNil, map, omitBy } from 'lodash-es'

type Item = { id: string; status: string }

declare const items: Item[]
declare const data: Record<string, unknown>
declare const id: string
declare const defaultValue: string

// Array operations
const ids = map(items, 'id')
const active = filter(items, { status: 'active' })
const match = find(items, item => item.id === id)

// Object operations
const value = get(data, 'deeply.nested.value', defaultValue)
const cleaned = omitBy(data, isNil)
```

### ❌ DON'T: Use Native Array Methods

```ts
type Item = { id: string; status: string }

declare const items: Item[]
declare const id: string

// WRONG — native methods are not allowed
export const ids = items.map(item => item.id)
export const active = items.filter(item => item.status === 'active')
export const match = items.find(item => item.id === id)
```

### ✅ DO: Use Lodash Utilities

```ts
import { cloneDeep, debounce, throttle } from 'lodash-es'

declare function search(term: string): void
declare function onScroll(event: Event): void
declare const original: Record<string, unknown>

const debouncedSearch = debounce(search, 300)
const throttledScroll = throttle(onScroll, 100)
const copy = cloneDeep(original)
```

### ⚠️ EXCEPTION: State/Context Access

Do NOT use `lodash.get` for XState state/context access:

```ts
import { useContext } from '@upmind-automation/headless'
import type { UseActor } from '@upmind-automation/headless'
import type { IBasket } from '@upmind-automation/types'
import { get } from 'lodash-es'

declare const state: UseActor['state']

// WRONG
export const wrong = get(state, 'context.basket')

// CORRECT — use the Upmind utilities
export const basket = useContext<IBasket>(state, 'basket')
```

---

## Why Lodash-es?

### Tree-Shaking

```ts
// lodash-es supports ES modules and tree-shaking
import { filter, map } from 'lodash-es' // only what is used lands in the bundle

// NOT lodash (CommonJS, no tree-shaking) — `import _ from 'lodash'` pulls the
// whole library in. Shown as prose because the package is not a dependency here.
const shaken = [filter, map]

export const count = shaken.length
```

### Bundle Impact

| Import Style | Bundle Size |
| ------------ | ----------- |
| `import _ from 'lodash'` | ~70KB |
| `import { map } from 'lodash-es'` | ~2KB |

---

## Common Lodash Functions Used

### Collections

| Function | Purpose |
| -------- | ------- |
| `map` | Transform array items |
| `filter` | Filter array items |
| `find` | Find first match |
| `findIndex` | Find index of first match |
| `reduce` | Reduce to single value |
| `forEach` | Iterate (no return) |
| `some` | Check if any match |
| `every` | Check if all match |
| `compact` | Remove falsy values |
| `uniq` | Remove duplicates |
| `sortBy` | Sort by key/function |
| `groupBy` | Group by key |

### Objects

| Function | Purpose |
| -------- | ------- |
| `get` | Safe deep access |
| `set` | Safe deep set |
| `has` | Check property exists |
| `omit` | Remove keys |
| `pick` | Select keys |
| `omitBy` | Remove by predicate |
| `isEmpty` | Check if empty |
| `isNil` | Check null/undefined |
| `isObject` | Check is object |
| `isString` | Check is string |
| `cloneDeep` | Deep clone |
| `merge` | Deep merge |

### Utilities

| Function | Purpose |
| -------- | ------- |
| `debounce` | Debounce function calls |
| `throttle` | Throttle function calls |
| `memoize` | Cache function results |
| `camelCase` | Convert to camelCase |
| `kebabCase` | Convert to kebab-case |
| `toNumber` | Convert to number |

---

## Consequences

### Positive

1. **Consistency** — same patterns across entire codebase
2. **Reliability** — battle-tested edge case handling
3. **Bundle efficiency** — tree-shaking with lodash-es
4. **Developer productivity** — rich utility library
5. **Code review** — easier to review consistent patterns

### Negative

1. **Dependency** — external library dependency
2. **Learning curve** — developers must know Lodash API

### Neutral

1. **Bundle size** — minimal with tree-shaking

---

## Enforcement

This rule is enforced via:

- Code review (documented in `.agent/rules/code-style.md` §Lodash Usage)
- ESLint rules (where possible)
- AI agent training

---

## Related Documents

- [`.agent/rules/code-style.md`](/.agent/rules/code-style.md) — Coding standards (§Lodash Usage; replaces DEVX.md)
- [ADR 011: Composable Coding Standards](./011-composable-coding-standards.md)
