[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useLocale

# useLocale()

```ts
function useLocale(): object;
```

Composable function to provide locale-related utilities and state management for internationalisation (i18n).

This module is responsible for controlling and updating the current locale, determining supported languages,
and applying fallback logic for selecting appropriate locales based on user or system preferences.

Note: Changing the locale is restricted while the user is authenticated to prevent inconsistencies, as
the locale is tied to the account's preferred language.

## Returns

### isReady()

```ts
isReady: () => Promise<boolean>;
```

#### Returns

`Promise`\<`boolean`\>

### locale

```ts
locale: ComputedRef<string>;
```

The current locale (reactive).

### meta

```ts
meta: ComputedRef<{
  hasLocale: boolean;
  isAvailable: boolean;
}>;
```

Meta-information about the i18n state.

### setDefaultLocale()

```ts
setDefaultLocale: (value?) => Promise<void>;
```

Sets the default locale based on all fallback logic.

#### Parameters

##### value?

`string`

#### Returns

`Promise`\<`void`\>

Resolves with the default locale.

### setLocale()

```ts
setLocale: (code) => Promise<string>;
```

Sets the current locale asynchronously.

#### Parameters

##### code

`string`

#### Returns

`Promise`\<`string`\>

Resolves with the new locale.

### supportedLanguages

```ts
supportedLanguages: ComputedRef<ILanguage[]>;
```

The list of supported languages, filtered by the brand's supported languages.

### UpmindSupportedLocales

```ts
UpmindSupportedLocales: typeof SupportedLocaleCodes;
```

The supported locales (reactive).
