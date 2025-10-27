[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useLocalisation

# useLocalisation()

```ts
function useLocalisation(instance?, glob?): object;
```

Composable function to manage and initialise localisation settings in headless with an associated i18n instance and optionally globbed messages.
Provides utilities to configure, load locale messages, and manage the application's locale state.

## Parameters

### instance?

`I18n`\<\{
\}, \{
\}, \{
\}, `string`, `boolean`\>

### glob?

[`GlobbedFiles`](../type-aliases/GlobbedFiles.md)

## Returns

### isReady()

```ts
isReady: () => Promise<boolean>;
```

#### Returns

`Promise`\<`boolean`\>

### meta

```ts
meta: ComputedRef<{
  isAvailable: boolean;
  isLoading: boolean;
}>;
```

Meta information about the brand theme state.
