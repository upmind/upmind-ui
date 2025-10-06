[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useLocalisation

# useLocalisation()

```ts
function useLocalisation(instance, glob?): object;
```

## Parameters

### instance

`I18n`

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
