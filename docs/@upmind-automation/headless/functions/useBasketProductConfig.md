[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useBasketProductConfig

# useBasketProductConfig()

```ts
function useBasketProductConfig(id, rawBasket, errorExternal?): object;
```

## Parameters

• **id**: `string`

• **rawBasket**: [`Basket`](../interfaces/Basket.md)

• **errorExternal?**: `any`

## Returns

`object`

### getSnapshot()

```ts
getSnapshot: () =>
  State<
    unknown,
    AnyEventObject,
    any,
    object,
    ResolveTypegenMeta<
      TypegenDisabled,
      AnyEventObject,
      BaseActionObject,
      ServiceMap
    >
  >;
```

#### Returns

`State`\<`unknown`, `AnyEventObject`, `any`, `object`, `ResolveTypegenMeta`\<`TypegenDisabled`, `AnyEventObject`, `BaseActionObject`, `ServiceMap`\>\>

### isReady()

```ts
isReady: () =>
  Promise<
    State<
      unknown,
      AnyEventObject,
      any,
      object,
      ResolveTypegenMeta<
        TypegenDisabled,
        AnyEventObject,
        BaseActionObject,
        ServiceMap
      >
    >
  >;
```

#### Returns

`Promise`\<`State`\<`unknown`, `AnyEventObject`, `any`, `object`, `ResolveTypegenMeta`\<`TypegenDisabled`, `AnyEventObject`, `BaseActionObject`, `ServiceMap`\>\>\>

### refresh()

```ts
refresh: basket =>
  Promise<
    State<
      unknown,
      AnyEventObject,
      any,
      object,
      ResolveTypegenMeta<
        TypegenDisabled,
        AnyEventObject,
        BaseActionObject,
        ServiceMap
      >
    >
  >;
```

#### Parameters

• **basket**: [`Basket`](../interfaces/Basket.md)

#### Returns

`Promise`\<`State`\<`unknown`, `AnyEventObject`, `any`, `object`, `ResolveTypegenMeta`\<`TypegenDisabled`, `AnyEventObject`, `BaseActionObject`, `ServiceMap`\>\>\>

### remove()

```ts
remove: () => Promise<any>;
```

#### Returns

`Promise`\<`any`\>

### service

```ts
service: Interpreter<
  unknown,
  any,
  AnyEventObject,
  object,
  ResolveTypegenMeta<
    TypegenDisabled,
    AnyEventObject,
    BaseActionObject,
    ServiceMap
  >
>;
```

### stop()

```ts
stop: () =>
  Interpreter<
    unknown,
    any,
    AnyEventObject,
    object,
    ResolveTypegenMeta<
      TypegenDisabled,
      AnyEventObject,
      BaseActionObject,
      ServiceMap
    >
  >;
```

#### Returns

`Interpreter`\<`unknown`, `any`, `AnyEventObject`, `object`, `ResolveTypegenMeta`\<`TypegenDisabled`, `AnyEventObject`, `BaseActionObject`, `ServiceMap`\>\>

### update()

```ts
update: () => Promise<ActorRef<any>>;
```

#### Returns

`Promise`\<`ActorRef`\<`any`, `any`\>\>
