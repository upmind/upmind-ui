[Upmind](../../packages.md) / [@upmind/headless](../index.md) / useDomain

# useDomain()

```ts
function useDomain(__namedParameters): object
```

## Parameters

• **\_\_namedParameters** = `...`

• **\_\_namedParameters.model?**: `string` \| `string`[]

• **\_\_namedParameters.parentId?**: `Object`

• **\_\_namedParameters.sync?**: `boolean`

• **\_\_namedParameters.type?**: [`DomainTypes`](../enumerations/DomainTypes.md)

## Returns

`object`

### destroy()

```ts
destroy: () => Interpreter<DomainContext, any, AnyEventObject, object, ResolveTypegenMeta<TypegenDisabled, AnyEventObject, BaseActionObject, ServiceMap>>;
```

#### Returns

`Interpreter`\<[`DomainContext`](../interfaces/DomainContext.md), `any`, `AnyEventObject`, `object`, `ResolveTypegenMeta`\<`TypegenDisabled`, `AnyEventObject`, `BaseActionObject`, `ServiceMap`\>\>

### getSnapshot()

```ts
getSnapshot: () => State<DomainContext, AnyEventObject, any, object, ResolveTypegenMeta<TypegenDisabled, AnyEventObject, BaseActionObject, ServiceMap>> = service.getSnapshot;
```

#### Returns

`State`\<[`DomainContext`](../interfaces/DomainContext.md), `AnyEventObject`, `any`, `object`, `ResolveTypegenMeta`\<`TypegenDisabled`, `AnyEventObject`, `BaseActionObject`, `ServiceMap`\>\>

### service

```ts
service: Interpreter<DomainContext, any, AnyEventObject, object, ResolveTypegenMeta<TypegenDisabled, AnyEventObject, BaseActionObject, ServiceMap>>;
```
