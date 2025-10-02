[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / DomainContext

# DomainContext

```ts
type DomainContext = BasketHelperContext<DomainProduct> & object;
```

## Type Declaration

### authHelper?

```ts
optional authHelper: ActorRef<any>;
```

### baseModel?

```ts
optional baseModel: DomainModel[];
```

### basketHelper?

```ts
optional basketHelper: ActorRef<any>;
```

### basketId?

```ts
optional basketId: string;
```

### brandId?

```ts
optional brandId: string;
```

### choices

```ts
choices: DomainTypes[];
```

### controller?

```ts
optional controller: AbortController;
```

### currency?

```ts
optional currency: string;
```

### error?

```ts
optional error: ResponseError;
```

### lookups

```ts
lookups: object;
```

#### lookups.basket

```ts
basket: DomainProduct[];
```

#### lookups.history

```ts
history: DomainProduct[];
```

#### lookups.owned

```ts
owned: DomainProduct[];
```

#### lookups.searched

```ts
searched: DomainProduct[];
```

### model?

```ts
optional model: DomainModel[];
```

### preferredCycle?

```ts
optional preferredCycle: number;
```

### promotions?

```ts
optional promotions: IBasketPromotion[];
```

### search?

```ts
optional search: object;
```

#### search.limit

```ts
limit: number;
```

#### search.offset

```ts
offset: number;
```

#### search.query?

```ts
optional query: string;
```

#### search.total

```ts
total: number;
```

### tlds?

```ts
optional tlds: string[];
```

### total?

```ts
optional total: number;
```

### type?

```ts
optional type: DomainProps["type"];
```
