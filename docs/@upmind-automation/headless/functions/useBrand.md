[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useBrand

# useBrand()

```ts
function useBrand(): object
```

## Returns

`object`

### getBrandId()

```ts
getBrandId: () => any;
```

#### Returns

`any`

### getConfig()

```ts
getConfig: (keys) => Promise<Pick<any, BrandConfigKeys>>;
```

#### Parameters

• **keys**: [`BrandConfigKeys`](../enumerations/BrandConfigKeys.md) \| [`BrandConfigKeys`](../enumerations/BrandConfigKeys.md)[]

#### Returns

`Promise`\<`Pick`\<`any`, [`BrandConfigKeys`](../enumerations/BrandConfigKeys.md)\>\>

### getCountry()

```ts
getCountry: () => any;
```

#### Returns

`any`

### getCurrencies()

```ts
getCurrencies: () => any;
```

#### Returns

`any`

### getCurrency()

```ts
getCurrency: () => any;
```

#### Returns

`any`

### getCurrencyId()

```ts
getCurrencyId: () => any;
```

#### Returns

`any`

### getSnapshot()

```ts
getSnapshot: () => any;
```

#### Returns

`any`

### hasModuleEnabled()

```ts
hasModuleEnabled: (code) => boolean;
```

#### Parameters

• **code**: `any`

#### Returns

`boolean`

### isModuleReady()

```ts
isModuleReady: (module) => Promise<State<BrandContext, AnyEventObject, any, object, ResolveTypegenMeta<TypegenDisabled, AnyEventObject, BaseActionObject, ServiceMap>>>;
```

#### Parameters

• **module**: `any`

#### Returns

`Promise`\<`State`\<`BrandContext`, `AnyEventObject`, `any`, `object`, `ResolveTypegenMeta`\<`TypegenDisabled`, `AnyEventObject`, `BaseActionObject`, `ServiceMap`\>\>\>

### isReady()

```ts
isReady: () => Promise<State<BrandContext, AnyEventObject, any, object, ResolveTypegenMeta<TypegenDisabled, AnyEventObject, BaseActionObject, ServiceMap>>>;
```

#### Returns

`Promise`\<`State`\<`BrandContext`, `AnyEventObject`, `any`, `object`, `ResolveTypegenMeta`\<`TypegenDisabled`, `AnyEventObject`, `BaseActionObject`, `ServiceMap`\>\>\>

### service

```ts
service: Interpreter<BrandContext, any, AnyEventObject, object, ResolveTypegenMeta<TypegenDisabled, AnyEventObject, BaseActionObject, ServiceMap>>;
```

### validateCurrency()

```ts
validateCurrency: (model) => Promise<any>;
```

#### Parameters

• **model**

• **model.code?**: `string`

• **model.id?**: `string`

#### Returns

`Promise`\<`any`\>
