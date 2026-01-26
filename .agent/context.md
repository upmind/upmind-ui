# Repository Context

## Overview

**Upmind Monorepo** is a pnpm workspace containing packages and applications for the Upmind billing, sales, and automation platform.

## Architecture

```
monorepo/
├── packages/           # Shared libraries
│   ├── headless/       # XState state machines & business logic (framework-agnostic)
│   ├── client-vue/     # Vue composables wrapping headless
│   ├── ui/             # Vue component library (Tailwind + CVA)
│   ├── types/          # TypeScript types (git submodule)
│   ├── i18n/           # Internationalization
│   └── icons/          # Icon assets
├── apps/               # Deployable applications
│   ├── cart/           # Main shopping cart (Vue + Vite)
│   ├── cart-nuxt/      # Nuxt.js cart variant
│   ├── hosting/        # Client-specific cart
│   ├── velia/          # Client-specific cart
│   └── webcentral/     # Client-specific cart
└── playgrounds/        # Development/demo environments
    └── labs/           # UI exploration playground
```

## Package Dependency Flow

```
types → headless → client-vue → ui → apps
         ↓
        i18n
```

## Key Technologies

| Technology | Purpose |
|------------|---------|
| **XState v4** | State machines for business logic |
| **Vue 3** | UI framework (Composition API) |
| **Tailwind CSS v4** | Styling |
| **CVA** | Component variant management |
| **TanStack Query** | Data fetching & caching |
| **pnpm** | Package manager (workspaces) |
| **Vite** | Build tool |

---

## Headless Package (`@upmind-automation/headless`)

Framework-agnostic business logic built with XState v4 state machines.

### Modules

- `basket` - Shopping cart, checkout flow
- `basketProduct` - Product configuration
- `brand` - Organization settings
- `client` - User management
- `domain` - Domain search/purchase (DAC)
- `payment` / `paymentDetails` - Payment processing
- `product` / `productCatalogue` - Products
- `session` - Authentication
- `system` - App configuration

### Machine Pattern

```typescript
export default createMachine({
  id: "featureManager",
  context: {} as FeatureContext,
  states: { ... }
}, {
  actions: { ... },
  guards: { ... },
  services
});
```

### Spawned Actors

Machines spawn child actors: `spawnBilling`, `spawnCurrency`, `spawnPromotions`

### Smart Merge Pattern

```typescript
const mergeArrayById = (newArr, oldArr) =>
  map(newArr, item => {
    const old = find(oldArr, ["id", item.id]);
    return old ? defaultsDeep({}, item, old) : item;
  });
```

---

## Client-Vue Package (`@upmind-automation/client-vue`)

Vue 3 composables wrapping headless, making XState machines reactive.

### Composable Structure (DEVX.md compliant)

```typescript
export const useFeature = () => {
  // --- state
  async function isReady(): Promise<boolean> { ... }
  const meta = computed(() => ({ ... }));

  // --- context
  const context = useContext<T>(state, "property");

  // --- methods
  function doAction() { ... }

  // -----------------------------------------------------------------------------
  return {
    // --- state
    isReady,
    meta,
    // --- context
    context,
    // --- methods
    doAction
  };
};

export type UseFeature = ReturnType<typeof useFeature>;
```

---

## Core Business Domains

- **Products & Catalogue** - Browsing, categories, recommendations
- **Basket & Checkout** - Cart, promotions, billing, payments
- **Domains** - Domain search, purchase, DAC
- **Client & Session** - Authentication, user management
- **Invoices & Orders** - Order history, billing

## Development Commands

```bash
pnpm start          # Start all packages with start scripts
pnpm build          # Build all packages
pnpm lint           # Lint all packages
pnpm test           # Run tests
pnpm clean          # Clean all node_modules/dist
```

## Related Documentation

- [DEVX.md](../DEVX.md) - Coding style guide
- [.agent/coding-preferences.md](./coding-preferences.md) - AI coding preferences
- [.agent/review-preferences.md](./review-preferences.md) - Code review standards
