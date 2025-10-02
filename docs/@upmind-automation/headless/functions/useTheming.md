[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useTheming

# useTheming()

```ts
function useTheming(provided?): object;
```

Composable for consolidating brand theme information with any provided themes through the upmind initialisation

## Parameters

### provided?

[`Theme`](../interfaces/Theme.md) | [`Theme`](../interfaces/Theme.md)[]

## Returns

Theme composable API

### isReady()

```ts
isReady: () => Promise<boolean>;
```

#### Returns

`Promise`\<`boolean`\>

### meta

```ts
meta: ComputedRef<{
  hasThemes: boolean;
  isAvailable: boolean;
}>;
```

Meta information about the brand theme state.

### themes

```ts
themes: Ref<undefined | object[], undefined | Theme[] | object[]>;
```

The available themes, this will be an array of theme objects.
brand config theme variants will be added/merged to the list of provided themes
