[Upmind](../../../../packages.md) / [@upmind/upflow](../../../index.md) / [utils](../index.md) / useUrlParams

# useUrlParams()

```ts
function useUrlParams(): object
```

## Returns

`object`

### getParamFromUrl()

```ts
getParamFromUrl: (name) => null | string;
```

Here we retrieve a search param from the URL

#### Parameters

• **name**: `string`

#### Returns

`null` \| `string`

### syncParamToUrl()

```ts
syncParamToUrl: (name, value?) => void;
```

Here we sync a search param to the URL

#### Parameters

• **name**: `string`

• **value?**: `string`

#### Returns

`void`
