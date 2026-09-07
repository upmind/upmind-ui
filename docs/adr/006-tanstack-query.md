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

```ts
import { useQuery } from '@upmind-automation/headless'

// packages/headless/src/modules/query/useQuery.ts — the shipped surface
const {
  // the single point of contact with the network
  request,
  // reactive TanStack Query methods
  query,
  list,
  listInfinite,
  mutate,
  // async convenience methods (non-reactive) — note `del`, not `delete`
  get,
  post,
  put,
  patch,
  del,
  head,
  // URL builder
  useUrl
} = useQuery()

export const surface = {
  del,
  get,
  head,
  list,
  listInfinite,
  mutate,
  patch,
  post,
  put,
  query,
  request,
  useUrl
}
```

### The `request` Function

The `request` function is the **underlying fetch implementation** used by all query methods. It:

1. Constructs the URL with query params (pagination, filters, sort)
2. Injects authentication headers via `withAccessToken`
3. Handles automatic token refresh on 401 errors
4. Adds locale, currency, and basket context when requested

```text
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

```ts
import { useQuery } from '@upmind-automation/headless'

const { query, useUrl } = useQuery()

// Auto-inject the session token
query({
  queryKey: ['client', 'emails'],
  url: useUrl('clients/123/emails'),
  withAccessToken: true
})

// Or an explicit token
query({
  queryKey: ['orders', 'claim'],
  url: useUrl('orders/claim'),
  withAccessToken: 'explicit-token-here'
})
```

#### 2. Automatic Token Refresh

```ts
import { canRetryAuthorization, getTokenFromStorage } from '@upmind-automation/headless'
import type { DetailedError } from '@upmind-automation/headless'
import { set } from 'lodash-es'

declare function doFetch<T>(args: { url: URL; init: RequestInit }): Promise<T>
declare function refreshToken(): Promise<unknown>

// On 401: refresh the token, re-stamp the header, retry ONCE, else propagate.
export async function request<T>(url: URL, init: RequestInit): Promise<T> {
  let attempts = 0

  return doFetch<T>({ url, init }).catch(async (error: DetailedError) => {
    attempts++

    if (canRetryAuthorization(url, error, { attempts, max: 1 })) {
      return refreshToken().then(() => {
        set(init, 'headers.Authorization', `Bearer ${getTokenFromStorage()?.access_token}`)
        return doFetch<T>({ url, init })
      })
    }

    throw error
  })
}
```

#### 3. Currency and Basket Awareness

```ts
import { useQuery } from '@upmind-automation/headless'

const { query, useUrl } = useQuery()

query({
  queryKey: ['products'],
  url: useUrl('products'),
  withCurrency: true, // auto-adds the currency filter
  withBasket: true // auto-adds the basket id
})
```

#### 4. Pagination Helpers

```ts
import { useQuery } from '@upmind-automation/headless'

const { list, useUrl } = useQuery()

// The page window is criteria-driven, not an argument to `list()`.
const { data, fetchNextPage, fetchPreviousPage, meta, pagination } = list({
  queryKey: ['invoices'],
  url: useUrl('invoices')
})

export const page = {
  data, // ComputedRef<TData>
  fetchNextPage,
  fetchPreviousPage,
  meta, // { hasNextPage, hasPrevPage, hasPages }
  pagination // { limit, total, page, pages, from, to }
}
```

#### 5. Query Key Conventions

```ts
import type { QueryKey } from '@tanstack/vue-query'

declare const basketId: string
declare const filters: Record<string, unknown>
declare const sort: string[]

// Entity-based keys
export const keys: QueryKey[] = [
  ['client', 'emails'],
  ['basket', basketId, 'products'],
  ['invoices', { filters, sort }]
]
```

---

## Guards and Enabled

Queries support **guards** (async pre-conditions) and **enabled** (reactive conditions):

### Guard Pattern

```ts
import { NotAuthenticatedError, useQuery } from '@upmind-automation/headless'
import type { ComputedRef } from 'vue'

declare const meta: ComputedRef<{ isAuthenticated: boolean }>

const { list, useUrl } = useQuery()

// Guard: async function that must resolve before the query executes
list({
  queryKey: ['client', 'emails'],
  url: useUrl('client/emails'),
  guard: async () => {
    if (!meta.value.isAuthenticated) throw new NotAuthenticatedError()
    return true
  }
})
```

### Enabled Pattern

```ts
import { useQuery } from '@upmind-automation/headless'
import type { ComputedRef } from 'vue'

declare const meta: ComputedRef<{ isAuthenticated: boolean }>
declare const client: ComputedRef<{ id: string } | undefined>

const { list, useUrl } = useQuery()

// Enabled: reactive condition that controls when the query runs
list({
  queryKey: ['client', 'emails', { client }],
  url: useUrl(`clients/${client.value?.id}/emails`),
  enabled: () => meta.value.isAuthenticated && !!client.value?.id
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

```ts
import { useQuery } from '@upmind-automation/headless'

const { query, useUrl } = useQuery()

// Returns reactive refs, auto-refetches, cached
const { data, error, isLoading, refetch } = query({
  queryKey: ['products'],
  url: useUrl('products')
})

// data.value updates automatically
export const reactive = { data, error, isLoading, refetch }
```

**Characteristics:**

- Returns reactive Vue refs
- Automatic caching and deduplication
- Background refetching
- Requires Vue reactivity context

### Async Convenience Methods

Used in **XState machine services** for one-shot async operations:

```ts
import { useQuery } from '@upmind-automation/headless'
import type { IProduct } from '@upmind-automation/types'

const { get, useUrl } = useQuery()

// Returns a Promise, no reactivity
export const products = await get<IProduct[]>({
  queryKey: ['products'],
  url: useUrl('products'),
  withAccessToken: true
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

```ts
import { useQuery } from '@upmind-automation/headless'
import type { IBasket } from '@upmind-automation/types'
import type { AnyEventObject } from '@upmind-automation/headless'

// Machine service example
export async function load(_context: unknown, _event: AnyEventObject) {
  const { get, useUrl } = useQuery()

  // Use the async method, not the reactive one
  return get<IBasket>({
    queryKey: ['basket', 'current'],
    url: useUrl('orders/current'),
    withAccessToken: true
  })
}
```

---

## Vue Scope Handling

TanStack Vue Query requires a **Vue reactivity scope**. Since `useQuery()` is often called **outside of component setup functions** (e.g., in XState services), we manually handle scope:

```ts
import type { QueryKey } from '@tanstack/vue-query'
import { useQuery as vueUseQuery } from '@tanstack/vue-query'
import { effectScope, getCurrentScope } from 'vue'

declare function fetchPage<T>(): Promise<T>

export function list<T>({ queryKey }: { queryKey: QueryKey }) {
  // Reuse the caller's scope when there is a live one; otherwise own a detached
  // one, so a machine service outside setup() still gets working reactivity.
  const currentScope = getCurrentScope()
  const scope = currentScope?.active ? currentScope : effectScope(true)

  return scope.run(() =>
    vueUseQuery({
      queryKey,
      queryFn: async () => fetchPage<T>()
    })
  )
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

```ts
import { invalidateQueryByKey, useQuery } from '@upmind-automation/headless'

type EmailModel = { email: string | null }

// After a mutation, invalidate the related queries
export async function add(data: EmailModel) {
  const { post, useUrl } = useQuery()

  return post({
    data,
    mutationKey: ['client', 'emails', 'add'],
    url: useUrl('client/emails'),
    withAccessToken: true
  }).then(invalidateQueryByKey(['client', 'emails'], { exact: false }))
}
```

---

## URL Builder

```ts
import { useQuery } from '@upmind-automation/headless'

const { useUrl } = useQuery()

// Simple path
useUrl('clients/123/emails')

// With query params
useUrl('products', {
  with: ['category', 'images'],
  limit: 20
})
```

---

## Related Documents

- [ADR 002: Session & Service Architecture](./002-session-and-service-architecture.md)
- [ADR 014: Service Layer Pattern](./014-service-layer-pattern.md)
