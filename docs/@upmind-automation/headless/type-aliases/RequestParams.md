[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / RequestParams

# RequestParams

```ts
type RequestParams = QueryProps & object;
```

## Type Declaration

### data?

```ts
optional data: unknown;
```

### guard()?

```ts
optional guard: () => Promise<boolean>;
```

#### Returns

`Promise`\<`boolean`\>

### init?

```ts
optional init: RequestInit;
```

### url

```ts
url: URL;
```

### withAccessToken?

```ts
optional withAccessToken: boolean | string | null;
```

### withCurrency?

```ts
optional withCurrency: boolean;
```
