# ADR 009: Shared Types Package

**Date:** January 2024 (Retroactive)
**Status:** Accepted
**Authors:** Upmind Engineering Team

---

## Context

With multiple packages and applications in the monorepo, we needed:

1. Consistent TypeScript types across all packages
2. Single source of truth for API response structures
3. Shared enums and constants
4. Type safety across package boundaries

---

## Decision

Create a dedicated **@upmind-automation/types** package containing all shared TypeScript definitions.

---

## Package Structure

```
packages/types/
├── src/
│   ├── index.ts           # Main export
│   ├── api/               # API response types
│   │   ├── basket.ts      # IBasket, IBasketProduct
│   │   ├── client.ts      # IClient, IEmail, IAddress
│   │   ├── product.ts     # IProduct, ICategory
│   │   └── ...
│   ├── enums/             # Shared enumerations
│   │   ├── contexts.ts    # Contexts (GUEST, CLIENT, STAFF)
│   │   ├── methods.ts     # HTTP Methods (GET, POST, etc.)
│   │   └── ...
│   └── common/            # Utility types
├── package.json
└── vite.config.ts
```

---

## Key Types

### API Response Types

```typescript
// Prefixed with 'I' for interface
export interface IBasket {
  id: string
  status: BasketStatus
  products: IBasketProduct[]
  currency: ICurrency
  totals: IBasketTotals
  // ...
}

export interface IClient {
  id: string
  name: string
  emails: IEmail[]
  addresses: IAddress[]
  // ...
}

export interface IProduct {
  id: string
  name: string
  prices: IPrice[]
  category: ICategory
  // ...
}
```

### Enumerations

```typescript
export enum Contexts {
  GUEST = 'guest',
  CLIENT = 'client',
  STAFF = 'staff',
  ADMIN = 'admin',
  LEAD = 'lead',
}

export enum Methods {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
  HEAD = 'HEAD',
}

export enum AccessRoleTypes {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}
```

---

## Usage

### In Other Packages

```typescript
// packages/headless/src/modules/basket/types.ts
import type { IBasket, IBasketProduct } from '@upmind-automation/types'

export interface BasketContext {
  basket: IBasket | null
  errors: Record<string, any>
}
```

### In Services

```typescript
// packages/headless/src/modules/basket/services.ts
import type { IBasket } from '@upmind-automation/types'

async function load(): Promise<IBasket> {
  return get<IBasket>({ url: useUrl('orders/current'), ... })
}
```

---

## Consequences

### Positive

1. **Single source of truth** — types defined once, used everywhere
2. **Type safety** — compile-time checks across packages
3. **IDE support** — autocomplete and type hints work correctly
4. **API alignment** — types match backend API responses
5. **Refactoring** — change type in one place, affects all consumers

### Negative

1. **Build dependency** — types must build before other packages
2. **Versioning** — breaking type changes affect all consumers

### Neutral

1. **Maintenance** — types must be kept in sync with API changes

---

## Naming Conventions

| Pattern | Usage | Example |
| ------- | ----- | ------- |
| `I` prefix | API response interfaces | `IBasket`, `IClient` |
| `Enum` | Enumeration types | `Contexts`, `Methods` |
| No prefix | Internal/derived types | `BasketContext`, `ClientProfile` |

---

## Related Documents

- [ADR 004: Monorepo Structure](./004-monorepo-structure.md)
- [ADR 007: Headless Architecture](./007-headless-architecture.md)
