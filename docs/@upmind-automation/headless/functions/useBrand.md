[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useBrand

# useBrand()

```ts
function useBrand(): object;
```

Composable function to access and manage brand-related data and configurations.
It fetches modules, brand configurations, brand settings, and organisation configurations
to provide a unified interface for brand-related information.

## Returns

An object containing brand data, meta-information, and utility methods.

### brandId

```ts
brandId: ComputedRef<string>;
```

The unique identifier of the current brand.

### countryId

```ts
countryId: ComputedRef<string>;
```

The country identifier associated with the brand.

### currencies

```ts
currencies: ComputedRef<ICurrency[]>;
```

An array of all supported currencies for the brand.

### currency

```ts
currency: ComputedRef<ICurrency | undefined>;
```

The current currency object representing the brand's default or selected currency.

### currencyId

```ts
currencyId: ComputedRef<string>;
```

The identifier of the brand's default currency.

### defaultPaymentPeriod

```ts
defaultPaymentPeriod: ComputedRef<DefaultPaymentPeriod>;
```

The default payment period configured for the brand.

### ensureConfig()

```ts
ensureConfig: (keys) => Promise<Record<string, any>>;
```

Ensures that the specified brand configuration keys are fetched and available in the context.

#### Parameters

##### keys

One or more BrandConfigKeys to ensure are loaded.

`BrandConfigKeys` | `BrandConfigKeys`[]

#### Returns

`Promise`\<`Record`\<`string`, `any`\>\>

A promise resolving to a record of the requested configuration key-value pairs.

#### Throws

If the config keys are not available in the context or if the request times out.

### errors

```ts
errors: ComputedRef<(Error | null)[]>;
```

An array of errors encountered during brand data fetching.

### favicon

```ts
favicon: ComputedRef<IImage | null | undefined>;
```

The favicon URL for the brand.

### getAnalytics()

```ts
getAnalytics: () => Promise<Record<string, any>>;
```

Fetches analytics configuration related to Google Analytics (GA) and Google Tag Manager (GTM) IDs.

#### Returns

`Promise`\<`Record`\<`string`, `any`\>\>

A promise resolving to an object containing analytics configuration.

### getConfig()

```ts
getConfig: (keys) => Record<string, any>;
```

Retrieves specific brand configuration keys from the context.
Assumes the keys are already loaded and available. Does not initiate a fetch if data is missing.

#### Parameters

##### keys

One or more BrandConfigKeys to retrieve.

`BrandConfigKeys` | `BrandConfigKeys`[]

#### Returns

`Record`\<`string`, `any`\>

An object containing the requested keys and their corresponding values. Returns an empty object if keys are not found.

### getConfigValue()

```ts
getConfigValue: <T>(key) => T | undefined;
```

Retrieves a specific brand configuration value by its key.
Assumes the key is already loaded and available in the context. Does not initiate a fetch if the key is missing.

#### Type Parameters

##### T

`T` = `unknown`

The expected type of the configuration value.

#### Parameters

##### key

`BrandConfigKeys`

The BrandConfigKeys to retrieve the value for.

#### Returns

`T` \| `undefined`

The value of the requested key, or `undefined` if not found.

### hasModuleEnabled()

```ts
hasModuleEnabled: (code) => boolean;
```

Checks if a specific module is enabled for the current brand.

#### Parameters

##### code

`string`

The module code to check.

#### Returns

`boolean`

`true` if the module is enabled, `false` otherwise.

### hasStorefront

```ts
hasStorefront: ComputedRef<boolean>;
```

A boolean indicating whether the brand has a configured storefront.

### iconStyles

```ts
iconStyles: ComputedRef<{
  variant: string | undefined;
}>;
```

The current icons styles for the brand.

### image

```ts
image: ComputedRef<IImage | null>;
```

The primary image or logo URL for the brand.

### includesTax

```ts
includesTax: ComputedRef<boolean>;
```

`true` if tax is included by default in prices, `false` otherwise.

### invalidate()

```ts
invalidate: () => void;
```

Invalidates the brand state and all related queries.
This clears the current brand state and forces a re-fetch of all brand data,
useful for synchronising state without necessarily re-initialising everything.

#### Returns

`void`

`void`

#### Throws

If the invalidation process fails.

### isReady()

```ts
isReady: () => Promise<boolean>;
```

Resolves when the brand service is ready or encounters an error.

#### Returns

`Promise`\<`boolean`\>

A promise is resolving to `true` if ready, `false` if an error occurred.

### isSupportedLanguage()

```ts
isSupportedLanguage: (locale) => boolean;
```

Checks if the brand supports a given language locale.

#### Parameters

##### locale

`string`

The language locale string to check (e.g. "en").

#### Returns

`boolean`

`true` if the locale is supported, `false` otherwise.

#### Throws

If the language data is not available in the context.

### language

```ts
language: ComputedRef<ILanguage | undefined>;
```

The current language object for the brand, determined by settings or defaults.

### languages

```ts
languages: ComputedRef<ILanguage[]>;
```

An array of all supported languages for the brand.

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

Meta-information about the current brand state.

### name

```ts
name: ComputedRef<string>;
```

The name of the current brand.

### refresh()

```ts
refresh: () => Promise<void>;
```

Refreshes the brand state by re-fetching all related queries.
This invalidates the current brand state and fetches it again from the API,
ensuring all brand data is up to date.

#### Returns

`Promise`\<`void`\>

A promise that resolves when the brand state has been refreshed.

#### Throws

If the refresh operation fails.

### storefrontRoute

```ts
storefrontRoute: ComputedRef<
  | {
  href?: string;
  to?: string | RouteLocationAsRelativeGeneric | RouteLocationAsPathGeneric;
}
| undefined>;
```

The resolved Vue Router route object for navigating to the storefront.
Provides either a `to` object for internal navigation or `href` for external links.

### storefrontUrl

```ts
storefrontUrl: ComputedRef<string>;
```

The URL of the brand's storefront. Derived from instance config, cart meta, or defaults.

### styles

```ts
styles: ComputedRef<
  | {
  brand_color: string;
  brand_font?: {
     family: string;
     version: string;
  };
  tokens?: string;
}
| null>;
```

The style configuration object for the brand's UI.

### taxType

```ts
taxType: ComputedRef<BrandTaxTypes>;
```

The tax type configured for the brand

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

Cart-specific meta-information from the brand settings.

### uiTheme

```ts
uiTheme: ComputedRef<{
  tokens: string;
  variant: string | undefined;
}>;
```

The UI theme configuration for the brand, including theme variants and the currently selected variant.

### validateCurrency()

```ts
validateCurrency: (model) => Promise<ICurrency | Partial<ICurrency> | undefined>;
```

Validates a given currency model against the brand's supported currencies.
Returns the matching currency or the brand's default currency if the provided model is invalid or not found.

#### Parameters

##### model

`CurrencyModel`

The currency model to validate (containing `id` or `code`).

#### Returns

`Promise`\<`ICurrency` \| `Partial`\<`ICurrency`\> \| `undefined`\>

A promise resolving to a valid ICurrency object, a partial ICurrency, or `undefined`.

#### Throws

If the currency data is not available in the context.

### validateLanguage()

```ts
validateLanguage: (model) => ILanguage | undefined;
```

Validates a given language model against the brand's supported languages.
Returns the matching language or the brand's default language if the provided model is invalid or not found.

#### Parameters

##### model

The language model to validate (containing `id` or `code`).

###### code?

`string`

###### id?

`string`

#### Returns

`ILanguage` \| `undefined`

A promise resolving to a valid ILanguage object or `undefined`.

#### Throws

If the language data is not available in the context.
