[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useBrand

# useBrand()

```ts
function useBrand(): object;
```

## Returns

### brandId

```ts
brandId: ComputedRef<undefined | string>;
```

The current brand ID.

### countryId

```ts
countryId: ComputedRef<undefined | string>;
```

The country ID for the brand.

### currencies

```ts
currencies: ComputedRef<ICurrency[]>;
```

The list of all supported currencies for the brand.

### currency

```ts
currency: ComputedRef<undefined | ICurrency>;
```

The current currency object for the brand.

### currencyId

```ts
currencyId: ComputedRef<undefined | string>;
```

The currency ID for the brand.

### defaultPaymentPeriod

```ts
defaultPaymentPeriod: ComputedRef<DefaultPaymentPeriod>;
```

The default payment period for the brand.

### ensureConfig()

```ts
ensureConfig: (keys) => Promise<Record<string, any>>;
```

Ensures the given config keys are loaded and returns their values.

#### Parameters

##### keys

One or more BrandConfigKeys to ensure are loaded.

`BrandConfigKeys` | `BrandConfigKeys`[]

#### Returns

`Promise`\<`Record`\<`string`, `any`\>\>

A promise resolving to a record of config key-value pairs.

#### Throws

If the config keys are not available in the context or if the request times out.

### errors

```ts
errors: ComputedRef<(null | Error)[]>;
```

Any error object from the brand state.

### favicon

```ts
favicon: ComputedRef<undefined | null | IImage>;
```

The current favicon object for the brand.

### getAnalytics()

```ts
getAnalytics: () => Promise<Record<string, any>>;
```

Loads analytics config for the brand (GA/GTM IDs).

#### Returns

`Promise`\<`Record`\<`string`, `any`\>\>

A promise resolving to the analytics config object or undefined.

### getConfig()

```ts
getConfig: (keys) => Record<string, any>;
```

This method will return the requested keys from the config.
It assumes that the keys are already in context in the state machine.
It will not request the keys from the API if they are not already in context.
It will also not wait for the state of the request to be processed/cached
before returning the requested keys.

#### Parameters

##### keys

The keys to request from the config

`BrandConfigKeys` | `BrandConfigKeys`[]

#### Returns

`Record`\<`string`, `any`\>

An object containing the requested keys and their values.

#### Throws

If the keys are not available in the context.

### getConfigValue()

```ts
getConfigValue: <T>(key) => undefined | T;
```

This method will return the requested key VALUE from the config.
It assumes that the key is already in context in the state machine.
It will not request the key from the API if it is not already in context.
It will also not wait for the state of the request to be processed/cached
before returning the requested key.

#### Type Parameters

##### T

`T` = `unknown`

#### Parameters

##### key

`BrandConfigKeys`

The key to request from the config

#### Returns

`undefined` \| `T`

The value of the requested key.

#### Throws

If the key is not available in the context.

### hasModuleEnabled()

```ts
hasModuleEnabled: (code) => boolean;
```

Checks if a module is enabled for the current brand.

#### Parameters

##### code

`string`

The module code to check.

#### Returns

`boolean`

True if the module is enabled, false otherwise.

### hasStorefront

```ts
hasStorefront: ComputedRef<boolean>;
```

Returns boolean indicating if the brand has a storefront URL.
This is derived from the meta, environment and router configuration.

### image

```ts
image: ComputedRef<undefined | null | IImage>;
```

The current image object for the brand.

### includesTax

```ts
includesTax: ComputedRef<boolean>;
```

Whether the brand includes tax by default.

### invalidate()

```ts
invalidate: () => void;
```

Invalidates the brand state and all related queries.
This will clear the current brand state and re-fetch it from the API.
It is useful for clearing the brand state and forcing a re-fetch of all brand data
without resetting the initialized flag.

#### Returns

`void`

#### Throws

If the invalidating fails.

### isReady()

```ts
isReady: () => Promise<boolean>;
```

Resolves when the brand service is ready or errors.
Returns true if ready, false if an error occurred.

#### Returns

`Promise`\<`boolean`\>

A promise resolving to true if ready, false if error.

### isSupportedLanguage()

```ts
isSupportedLanguage: (locale) => boolean;
```

Checks if the given language model is supported by the brand.

#### Parameters

##### locale

`string`

#### Returns

`boolean`

True if the language is supported, false otherwise.

#### Throws

If the languages are not available in the context.

### language

```ts
language: ComputedRef<undefined | ILanguage>;
```

The current language object for the brand.

### languages

```ts
languages: ComputedRef<ILanguage[]>;
```

The list of all supported languages for the brand.

### meta

```ts
meta: ComputedRef<{
  hasError: boolean;
  isAvailable: boolean;
  isComplete: boolean;
  isEmpty: boolean;
  isLoading: boolean;
}>;
```

Meta-information about the brand state.

### name

```ts
name: ComputedRef<undefined | string>;
```

The current brand name.

### refresh()

```ts
refresh: () => Promise<void>;
```

Refreshes the brand state by re-fetching all related queries.
This will invalidate the current brand state and re-fetch it from the API.
It will also reset the initialized flag to force a re-run of the initial load
logic, ensuring all brand data is up to date.

#### Returns

`Promise`\<`void`\>

A promise that resolves when the brand state is refreshed.

#### Throws

If the refresh fails.

### storefrontRoute

```ts
storefrontRoute: ComputedRef<
  | undefined
  | {
  href?: string;
  to?: string | RouteLocationAsRelativeGeneric | RouteLocationAsPathGeneric;
}>;
```

The resolved storefront route within the application.
This is derived from the meta, environment and router configuration.
provided for convenience as a vue router friendly route object.

### storefrontUrl

```ts
storefrontUrl: ComputedRef<string>;
```

The URL of the storefront for the brand.
This is derived from the cart meta or environment variable.

### styles

```ts
styles: ComputedRef<
  | undefined
  | null
  | {
  brand_color: string;
  brand_font?: {
     family: string;
     version: string;
  };
}>;
```

The current styles object for the brand.

### taxType

```ts
taxType: ComputedRef<undefined | BrandTaxTypes>;
```

The tax type for the brand.

### uiCart

```ts
uiCart: ComputedRef<{
  catalogue?: {
     disabled?: boolean;
     facet?: boolean;
  };
  clickwrap_disclaimer?: string;
  description?: string;
  layout?: "default" | "full" | "enclosed";
  storefront_url?: string;
  tagline?: string;
  terms_url?: string;
  ui: UIMeta;
}>;
```

The current cart metaobject for the brand.

### uiTheme

```ts
uiTheme: ComputedRef<{
  variant: undefined | string;
  variants:   | undefined
     | Record<string, ThemeTokens>;
}>;
```

The current theming object for the brand.

### validateCurrency()

```ts
validateCurrency: (model) => Promise<undefined | ICurrency | Partial<ICurrency>>;
```

Validates and returns a supported currency object or the default.

#### Parameters

##### model

`CurrencyModel`

The currency model to validate ({ id?: string, code?: string }).

#### Returns

`Promise`\<`undefined` \| `ICurrency` \| `Partial`\<`ICurrency`\>\>

A promise resolving to a valid currency object or undefined.

#### Throws

If the currencies are not available in the context.

### validateLanguage()

```ts
validateLanguage: (model) => undefined | ILanguage;
```

Validates and returns a supported language object or the default.

#### Parameters

##### model

The language model to validate ({ id?: string, code?: string }).

###### code?

`string`

###### id?

`string`

#### Returns

`undefined` \| `ILanguage`

A promise resolving to a valid language object or undefined.

#### Throws

If the languages are not available in the context.
