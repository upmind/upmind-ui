# ADR 006: TanStack Query for Data Fetching

**Date:** January 2024 (Retroactive)
**Status:** Accepted
**Authors:** Upmind Engineering Team

---

## Context

The platform needed a robust data fetching solution that provides:

1. Automatic caching and cache invalidation
2. Background refetching and stale-while-revalidate
3. Pagination and infinite scroll support
4. Mutation handling with optimistic updates
5. Request deduplication
6. Integration with Vue 3 reactivity

---

## Decision

Adopt **TanStack Query (Vue Query)** as the primary data fetching and caching layer, wrapped in a custom `useQuery()` composable.

### Core Composable

```typescript
// packages/headless/src/modules/query/useQuery.ts
export const useQuery = () => {
  return {
    // Underlying fetch function (used by all methods)
    request<T>({ url, withAccessToken, ... }): Promise<QueryResponse<T>>,

    // Reactive TanStack Query methods
    query<T>({ url, queryKey, select, ... }),      // Single resource
    list<T>({ url, queryKey, pagination, ... }),   // Paginated list
    listInfinite<T>({ url, queryKey, ... }),       // Infinite scroll
    mutate<T>(method, { url, data, ... }),         // Mutations

    // Async convenience methods (non-reactive)
    get<T>(...),
    post<T>(...),
    put<T>(...),
    patch<T>(...),
    delete<T>(...),
  }
}
```

### The `request` Function

The `request` function is the **underlying fetch implementation** used by all query methods. It:

1. Constructs the URL with query params (pagination, filters, sort)
2. Injects authentication headers via `withAccessToken`
3. Handles automatic token refresh on 401 errors
4. Adds locale, currency, and basket context when requested

```typescript
// All methods ultimately call request()
query()       → internally calls → request()
list()        → internally calls → request()
get()         → internally calls → request()
post()        → internally calls → request()
```

> [!IMPORTANT]
> `request()` is the single point of contact with the network. All authentication, retry logic, and header injection happens here.

---

### Key Features

#### 1. Authentication Integration

```typescript
// Auto-inject session token
query({
  url: useUrl('/clients/123/emails'),
  withAccessToken: true,  // Uses session token
})

// Or explicit token
query({
  url: useUrl('/orders/claim'),
  withAccessToken: 'explicit-token-here',
})
```

#### 2. Automatic Token Refresh

```typescript
// On 401, automatically:
// 1. Refresh the token
// 2. Retry the request
// 3. If refresh fails, trigger reauth
return doFetch({ url, init }).catch(async error => {
  if (canRetryAuthorization(url, error, { attempts, max: 1 })) {
    return refreshToken().then(() => doFetch({ url, init }))
  }
  if (error.code === 401) {
    useSession().reauth()
  }
  throw error
})
```

#### 3. Currency and Basket Awareness

```typescript
query({
  url: useUrl('/products'),
  withCurrency: true,  // Auto-adds currency_code param
  withBasket: true,    // Auto-adds basket_id param
})
```

#### 4. Pagination Helpers

```typescript
const { data, pagination, meta, fetchNextPage, fetchPreviousPage } = list({
  url: useUrl('/invoices'),
  pagination: { limit: 20, offset: 0 },
})

// Returns:
// pagination: { limit, total, page, pages, from, to }
// meta: { hasNextPage, hasPrevPage, hasPages }
```

#### 5. Query Key Conventions

```typescript
// Entity-based keys
queryKey: ['client', 'emails']
queryKey: ['basket', basketId, 'products']
queryKey: ['invoices', { filters, sort }]
```

---

## Guards and Enabled

Queries support **guards** (async pre-conditions) and **enabled** (reactive conditions):

### Guard Pattern

```typescript
// Guard: async function that must resolve before query executes
list({
  url: useUrl('/client/emails'),
  guard: async () => {
    // Wait for authentication
    if (!meta.value.isAuthenticated) {
      throw new NotAuthenticatedError()
    }
    return true
  },
  // ...
})
```

### Enabled Pattern

```typescript
// Enabled: reactive condition that controls when query runs
list({
  url: useUrl(`/clients/${client.value?.id}/emails`),
  enabled: () => meta.value.isAuthenticated && !!client.value?.id,
  // Query won't run until enabled returns true
})
```

| Pattern | Type | When to Use |
| ------- | ---- | ----------- |
| `guard` | Async function | Pre-flight checks, throw on failure |
| `enabled` | Reactive getter | Conditional execution based on state |

---

## Reactive vs Async Methods

The composable exposes **two types of methods** for different use cases:

### Reactive Methods (TanStack Query)

Used in **Vue composables** for reactive data binding:

```typescript
// Returns reactive refs, auto-refetches, cached
const { data, isLoading, error, refetch } = query({
  url: useUrl('/products'),
  queryKey: ['products'],
})

// data.value updates automatically
```

**Characteristics:**

- Returns reactive Vue refs
- Automatic caching and deduplication
- Background refetching
- Requires Vue reactivity context

### Async Convenience Methods

Used in **XState machine services** for one-shot async operations:

```typescript
// Returns a Promise, no reactivity
const products = await get<IProduct[]>({
  url: useUrl('/products'),
  queryKey: ['products'],
  withAccessToken: true,
})
```

**Characteristics:**

- Returns Promise (awaitable)
- No reactive binding
- Used by machine services
- Fire-once semantics

### Why Both?

| Scenario | Use |
| -------- | --- |
| Component displaying data | `query()`, `list()` (reactive) |
| XState service loading data | `get()`, `post()` (async) |
| Form submission | `post()`, `patch()` (async) |
| Background sync in machine | `get()` (async) |

```typescript
// Machine service example
async function load(context: Context) {
  // Use async method, not reactive
  return get<IBasket>({
    url: useUrl('orders/current'),
    queryKey: ['basket', 'current'],
    withAccessToken: true,
  })
}
```

---

## Vue Scope Handling

TanStack Vue Query requires a **Vue reactivity scope**. Since `useQuery()` is often called **outside of component setup functions** (e.g., in XState services), we manually handle scope:

```typescript
function list<T>({ ... }) {
  // Check if we're in an active Vue scope
  const currentScope = getCurrentScope()
  const scope = currentScope?.active ? currentScope : effectScope(true)

  // Run TanStack Query within the scope
  const response = scope.run(() =>
    vueUseQuery({
      queryKey,
      queryFn: async () => { ... },
    })
  )

  return response
}
```

> [!NOTE]
> This scope handling is necessary because machine services invoke queries outside Vue's setup lifecycle. Without it, Vue reactivity would not work correctly.

---

## Consequences

### Positive

1. **Automatic caching** — reduces redundant API calls
2. **Stale-while-revalidate** — better perceived performance
3. **Consistent patterns** — all data fetching uses same API
4. **Type safety** — generic types throughout
5. **Devtools support** — TanStack Query devtools for debugging
6. **Request deduplication** — identical requests merged
7. **Flexible usage** — reactive and async methods for different contexts

### Negative

1. **Cache invalidation complexity** — must manage query keys carefully
2. **Bundle size** — TanStack Query adds ~12KB gzipped
3. **Learning curve** — developers must understand cache behavior
4. **Scope handling** — manual scope management outside components

### Neutral

1. **Wrapper abstraction** — custom `useQuery()` adds indirection but provides consistency

---

## Cache Invalidation Patterns

```typescript
import { invalidateQueryByKey } from '../query'

// After mutation, invalidate related queries
async function add(data: EmailModel) {
  return post({ ... })
    .then(invalidateQueryByKey(['client', 'emails'], { exact: false }))
}
```

---

## URL Builder

```typescript
const { useUrl } = useQuery()

// Simple path
useUrl('/clients/123/emails')

// With query params
useUrl('/products', {
  with: ['category', 'images'],
  limit: 20
})
```

---

## Related Documents

- [ADR 002: Session & Service Architecture](./002-session-and-service-architecture.md)
- [ADR 014: Service Layer Pattern](./014-service-layer-pattern.md)
