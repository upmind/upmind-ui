[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / DomainProduct

# DomainProduct

```ts
type DomainProduct = Product & Omit<DomainModel, "selected"> & object;
```

## Type Declaration

### meta

```ts
meta: ProductSummaryDetail["meta"] & object;
```

#### Type Declaration

##### added?

```ts
optional added: boolean;
```

##### available?

```ts
optional available: boolean;
```

##### disabled?

```ts
optional disabled: boolean;
```

##### owned?

```ts
optional owned: boolean;
```

##### persisted?

```ts
optional persisted: boolean;
```

##### selected?

```ts
optional selected: boolean;
```
