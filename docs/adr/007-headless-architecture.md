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
│ @upmind-automation/ui   │   │ @upmind-automation/headless │
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

```typescript
// Example: useBasket from headless
import { useBasket } from '@upmind-automation/headless'

const { basket, meta, addProduct, checkout } = useBasket()
```

### @upmind-automation/ui

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

```vue
<!-- Example: Pure UI component -->
<UiButton variant="primary" @click="submit">
  Submit
</UiButton>
```

### @upmind-automation/client-vue

**Purpose:** Vue integrations combining headless + UI for complete features.

**Contains:**

- Feature components (ProductCard, BasketSummary, CheckoutFlow)
- Composables that wire headless to UI
- Module-specific Vue components

```vue
<!-- Example: Integrated component -->
<ClientBasket />
<!-- Internally uses useBasket() from headless + UI components -->
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

```typescript
// Import from client-vue for integrated components
import { ClientBasket, ClientInvoices } from '@upmind-automation/client-vue'
```

### Direct Headless Usage

```typescript
// Import composables directly when needed
import { useBasket, useSession } from '@upmind-automation/headless'

const { basket, addProduct } = useBasket()
```

### UI-Only Usage

```typescript
// Import UI components for custom integrations
import { UiButton, UiCard, UiModal } from '@upmind-automation/ui'
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
- `ui` depends on nothing (icons externalized)
- `client-vue` depends on `headless` and `ui`
- `apps` depend on `client-vue` (or directly on headless/ui)

---

## Related Documents

- [ADR 004: Monorepo Structure](./004-monorepo-structure.md)
- [ADR 003: Shared Icons Package](./003-shared-icons-package.md)
- [ADR 005: XState for State Management](./005-xstate-state-management.md)
