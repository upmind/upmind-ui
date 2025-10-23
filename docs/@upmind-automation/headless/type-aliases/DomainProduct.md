[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / DomainProduct

# DomainProduct

```ts
type DomainProduct = Product & Omit<DomainModel, "selected"> & object;
```

Represents a [Product](Product.md) specifically for domain management, augmented with domain-specific
meta-information like availability, ownership, and selection status.
It extends [Product](Product.md) and omits `selected` from `DomainModel` to merge `meta`.

## Type Declaration

### meta

```ts
meta: ProductSummaryDetail["meta"] & object;
```

Domain-specific meta-information, extending base [ProductSummaryDetail.meta](ProductSummaryDetail.md#meta).

#### Type Declaration

##### added?

```ts
optional added: boolean;
```

`true` if the domain has been added to the basket.

##### available?

```ts
optional available: boolean;
```

`true` if the domain is available for registration.

##### disabled?

```ts
optional disabled: boolean;
```

`true` if the domain is disabled or not selectable.

##### owned?

```ts
optional owned: boolean;
```

`true` if the client already owns the domain.

##### persisted?

```ts
optional persisted: boolean;
```

`true` if the domain has been persisted in some way (e.g. saved).

##### selected?

```ts
optional selected: boolean;
```

`true` if the user selects this specific domain in the list.
