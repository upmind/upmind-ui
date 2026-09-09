# ADR 007: Headless Architecture

**Date:** January 2024 (Retroactive)
**Status:** Accepted
**Authors:** Upmind Engineering Team

---

## Context

The Upmind platform supports multiple themed applications with varying UI requirements but shared business logic. We needed an architecture that:

1. Separates business logic from UI implementation
2. Enables reuse across different Vue applications
3. Allows UI components to be used independently of business logic
4. Supports future framework migrations if needed

---

## Decision

Adopt a **headless architecture** with three distinct package layers:

```
┌─────────────────────────────────────────────────────────────┐
│                         Apps                                 │
│        cart, cart-nuxt, hosting, velia, webcentral          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    @upmind-automation/client-vue            │
│                  Vue compositions integrating both          │
└─────────────────────────────────────────────────────────────┘
                    │                       │
                    ▼                       ▼
┌─────────────────────────┐   ┌─────────────────────────────┐
│ @upmind/ui              │   │ @upmind-automation/headless │
│   Vue UI components     │   │   Business logic, XState    │
│   Presentational only   │   │   Services, API calls       │
└─────────────────────────┘   └─────────────────────────────┘
                                            │
                                            ▼
                              ┌─────────────────────────────┐
                              │ @upmind-automation/types    │
                              │   Shared TypeScript types   │
                              └─────────────────────────────┘
```

---

## Package Responsibilities

### @upmind-automation/headless

**Purpose:** Pure business logic, framework-agnostic where possible.

**Contains:**

- XState state machines (basket, session, domain, payment, etc.)
- Service functions for API interactions
- Composables for data access
- Query layer (TanStack Query wrapper)
- Utilities and helpers

**Does NOT contain:**

- Vue components
- Styling
- Icons or assets

```ts
// Example: useBasket from headless. The product collection is its own
// composable — there is no `addProduct` on useBasket.
import { useBasket, useBasketProducts } from '@upmind-automation/headless'

const { basket, checkout, meta } = useBasket()
const { products, refresh } = useBasketProducts()

export const surface = { basket, checkout, meta, products, refresh }
```

### @upmind/ui

**Purpose:** Reusable Vue UI components, presentational only.

**Contains:**

- Vue components (buttons, inputs, cards, modals, etc.)
- Component-level CSS
- TypeScript types for component props

**Does NOT contain:**

- Business logic
- API calls
- State management
- Icons (externalized to @upmind-automation/icons)
- Design tokens (externalized to @upmind/tokens)

```vue
<script setup lang="ts">
// The UI package exports `Button`, not `UiButton`.
declare function submit(): void
</script>

<template>
  <button type="button" @click="submit">Submit</button>
</template>
```

### @upmind-automation/client-vue

**Purpose:** Vue integrations combining headless + UI for complete features.

**Contains:**

- Feature components (ProductCard, BasketSummary, CheckoutFlow)
- Composables that wire headless to UI
- Module-specific Vue components

```vue
<script setup lang="ts">
// `ClientBasket` comes from `@upmind-automation/client-vue`; it wires
// `useBasket()` from headless to `@upmind/ui` components internally.
import { useBasket } from '@upmind-automation/headless'

const { basket, meta } = useBasket()
</script>

<template>
  <p v-if="meta.isLoading">Loading…</p>
  <p v-else>{{ basket?.id }}</p>
</template>
```

### @upmind-automation/types

**Purpose:** Shared TypeScript definitions.

**Contains:**

- API response interfaces (IBasket, IClient, IProduct)
- Enum definitions (Contexts, Methods, AccessRoleTypes)
- Shared type utilities

---

## Consequences

### Positive

1. **Separation of concerns** — business logic testable without UI
2. **Reusability** — headless can power different UI implementations
3. **Maintainability** — changes to logic don't affect UI and vice versa
4. **Team scaling** — UI and logic teams can work independently
5. **Testing** — business logic easily unit tested
6. **Future-proofing** — could migrate to React/Solid without rewriting logic

### Negative

1. **Package overhead** — multiple packages to maintain and version
2. **Import complexity** — must know which package exports what
3. **Build coordination** — packages must build in correct order

### Neutral

1. **Learning curve** — developers must understand the layering

---

## Consumption Patterns

### From Apps (Recommended)

```ts
// Integrated components come from client-vue. Importing that package here
// would pull its whole dependency tree into this snippet, so the names are
// declared instead.
declare const ClientBasket: unknown
declare const ClientInvoices: unknown

export const integrated = { ClientBasket, ClientInvoices }
```

### Direct Headless Usage

```ts
// Import composables directly when needed
import { useActiveSession, useBasket } from '@upmind-automation/headless'

const { basket } = useBasket()
const { isAuthenticated } = useActiveSession().useMeta()

export const direct = { basket, isAuthenticated }
```

### UI-Only Usage

```ts
// The UI package is `@upmind/ui` (design-system/packages/ui), and its
// components are `Button` / `Card` / `Modal` — no `Ui` prefix, no
// `@upmind-automation/ui`. Declared here rather than imported, because pulling
// the package in drags its token dependency into this snippet.
declare const Button: unknown
declare const Card: unknown
declare const Modal: unknown

export const ui = { Button, Card, Modal }
```

---

## Dependencies Flow

```
types ← headless ← client-vue ← apps
           ↑              ↑
           │              │
          ui ─────────────┘
           ↑
          icons
```

- `types` has no internal dependencies
- `headless` depends on `types`
- `@upmind/ui` depends on `@upmind/tokens` (icons externalized)
- `client-vue` depends on `headless` and `@upmind/ui`
- `apps` depend on `client-vue` (or directly on headless/ui)

---

## Related Documents

- [ADR 004: Monorepo Structure](./004-monorepo-structure.md)
- [ADR 003: Shared Icons Package](./003-shared-icons-package.md)
- [ADR 005: XState for State Management](./005-xstate-state-management.md)
