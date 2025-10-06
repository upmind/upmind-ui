[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useLocale

# useLocale()

```ts
function useLocale(): object;
```

## Returns

### isReady()

```ts
isReady: () => Promise<boolean>;
```

Checks if the i18n system is ready.

#### Returns

`Promise`\<`boolean`\>

Resolves true if ready.

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
  isLoading: boolean;
}>;
```

Meta-information about the i18n state.

### setDefaultLocale()

```ts
setDefaultLocale: (value) => Promise<void>;
```

Sets the default locale based on all fallback logic.

#### Parameters

##### value

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
