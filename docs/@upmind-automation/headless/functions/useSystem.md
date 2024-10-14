[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useSystem

# useSystem()

```ts
function useSystem(): object
```

## Returns

`object`

### fetchCountries()

```ts
fetchCountries: () => Promise<any>;
```

#### Returns

`Promise`\<`any`\>

### fetchDepartments()

```ts
fetchDepartments: () => Promise<any>;
```

#### Returns

`Promise`\<`any`\>

### fetchLanguages()

```ts
fetchLanguages: () => Promise<any>;
```

#### Returns

`Promise`\<`any`\>

### fetchRegions()

```ts
fetchRegions: (country?) => Promise<any>;
```

#### Parameters

• **country?**: `string` \| `ICountry`

#### Returns

`Promise`\<`any`\>

### fetchStatuses()

```ts
fetchStatuses: () => Promise<any>;
```

#### Returns

`Promise`\<`any`\>

### getBillingCycle()

```ts
getBillingCycle: (value) => any;
```

#### Parameters

• **value**: `any`

#### Returns

`any`

### getBillingCycles()

```ts
getBillingCycles: () => any;
```

#### Returns

`any`

### getCountries()

```ts
getCountries: () => any;
```

#### Returns

`any`

### getCountry()

```ts
getCountry: (value?) => any;
```

#### Parameters

• **value?**: `string`

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
getCurrency: (value?) => any;
```

#### Parameters

• **value?**: `string`

#### Returns

`any`

### getDepartment()

```ts
getDepartment: (value) => any;
```

#### Parameters

• **value**: `any`

#### Returns

`any`

### getDepartments()

```ts
getDepartments: () => any;
```

#### Returns

`any`

### getLanguage()

```ts
getLanguage: (value) => any;
```

#### Parameters

• **value**: `any`

#### Returns

`any`

### getLanguages()

```ts
getLanguages: () => any;
```

#### Returns

`any`

### getRegion()

```ts
getRegion: (values, country) => any;
```

#### Parameters

• **values**: `string` \| `string`[]

• **country**: `string` \| `ICountry`

#### Returns

`any`

### getRegions()

```ts
getRegions: (value) => any;
```

#### Parameters

• **value**: `string` \| `ICountry`

#### Returns

`any`

### getSnapshot()

```ts
getSnapshot: () => any;
```

#### Returns

`any`

### getStatus()

```ts
getStatus: (value) => any;
```

#### Parameters

• **value**: `any`

#### Returns

`any`

### getStatuses()

```ts
getStatuses: () => any;
```

#### Returns

`any`

### isReady()

```ts
isReady: () => Promise<State<BrandContext, AnyEventObject, any, object, ResolveTypegenMeta<TypegenDisabled, AnyEventObject, BaseActionObject, ServiceMap>>>;
```

#### Returns

`Promise`\<`State`\<`BrandContext`, `AnyEventObject`, `any`, `object`, `ResolveTypegenMeta`\<`TypegenDisabled`, `AnyEventObject`, `BaseActionObject`, `ServiceMap`\>\>\>

### service

```ts
service: Interpreter<SystemContext, any, AnyEventObject, object, ResolveTypegenMeta<TypegenDisabled, AnyEventObject, BaseActionObject, ServiceMap>>;
```
