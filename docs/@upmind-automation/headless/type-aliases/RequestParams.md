[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / RequestParams

# RequestParams

```ts
type RequestParams = QueryProps & object;
```

Type alias defining the parameters for an API request, combining [QueryProps](QueryProps.md)
with additional request-specific options.

## Type Declaration

### data?

```ts
optional data: unknown;
```

The data payload for the request body (e.g. for POST/PUT requests).

### guard()?

```ts
optional guard: () => Promise<boolean>;
```

An optional asynchronous guard function that must resolve to `true` before the request is made.

#### Returns

`Promise`\<`boolean`\>

### init?

```ts
optional init: RequestInit;
```

Optional standard `RequestInit` options for the fetch API.

### url

```ts
url: URL;
```

The URL for the API request.

### withAccessToken?

```ts
optional withAccessToken: boolean | string | null;
```

`true` to automatically include the access token in the request headers,
or a string representing the token itself, or `null`/`false` to omit.

### withCurrency?

```ts
optional withCurrency: boolean;
```

`true` to automatically include the currency ID in the request headers.

### withoutLocale?

```ts
optional withoutLocale: boolean;
```
