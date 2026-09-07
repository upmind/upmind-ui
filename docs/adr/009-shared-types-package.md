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
│   ├── models/            # API response types + wire enums
│   │   ├── baskets.ts     # IBasket, IBasketProduct
│   │   ├── clients.ts     # IClient, IEmail, IAddress
│   │   ├── products.ts    # IProduct, ICategory
│   │   ├── contexts.ts    # Contexts (ADMIN, CLIENT, GUEST, STAFF)
│   │   ├── methods.ts     # HTTP Methods (get, post, …)
│   │   └── ...
│   ├── data/              # Shared enumerations (AccessRoleTypes, …)
│   └── store/             # Store-facing types
└── package.json
```

---

## Key Types

### API Response Types

```ts
// Prefixed with 'I' for interface. Narrowed here with `Pick` — the shipped
// interfaces carry the whole API payload, so a rename breaks this block.
import type { IBasket, IClient, IProduct } from '@upmind-automation/types'

export type BasketEssentials = Pick<
  IBasket,
  'id' | 'status' | 'products' | 'currency'
>

export type ClientEssentials = Pick<
  IClient,
  'id' | 'fullname' | 'email' | 'addresses'
>

export type ProductEssentials = Pick<
  IProduct,
  'id' | 'name' | 'prices' | 'category'
>
```

### Enumerations

```ts
// packages/types/src/models/contexts.ts · models/methods.ts · data/enums.ts
export enum Contexts {
  ADMIN = 'admin',
  CLIENT = 'client',
  GUEST = 'guest',
  STAFF = 'staff',
  NO_CONTEXT = ''
}

export enum Methods {
  GET = 'get',
  POST = 'post',
  PATCH = 'patch',
  PUT = 'put',
  DELETE = 'delete'
}

export enum AccessRoleTypes {
  GUEST = 'guest',
  CLIENT = 'client',
  STAFF = 'user'
}
```

---

## Usage

### In Other Packages

```ts
// packages/headless/src/modules/basket/basket.types.ts
import type { IBasket } from '@upmind-automation/types'
import type { ResponseError } from '@upmind-automation/headless'

export interface BasketContext {
  basket: IBasket | null
  errors: ResponseError | null
}
```

### In Services

```ts
// packages/headless/src/modules/basket/basket.services.ts
import { useQuery } from '@upmind-automation/headless'
import type { IBasket } from '@upmind-automation/types'

export async function load(): Promise<IBasket> {
  const { get, useUrl } = useQuery()

  return get<IBasket>({
    queryKey: ['basket', 'current'],
    url: useUrl('orders/current'),
    withAccessToken: true
  })
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
