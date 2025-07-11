[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useBasketPromotions

# useBasketPromotions()

```ts
function useBasketPromotions(actorRef?): object;
```

## Parameters

• **actorRef?**: `ActorRef`\<`any`, `any`\>

## Returns

`object`

### clear()

```ts
clear: () => any;
```

#### Returns

`any`

### context

```ts
context: ComputedRef<any>;
```

### errors

```ts
errors: ComputedRef<any>;
```

### input()

```ts
input: model => any;
```

#### Parameters

• **model**: `any`

#### Returns

`any`

### meta

```ts
meta: ComputedRef<object>;
```

#### Type declaration

##### hasErrors

```ts
hasErrors: boolean;
```

##### hasPromotions

```ts
hasPromotions: boolean;
```

##### isComplete

```ts
isComplete: any;
```

##### isDirty

```ts
isDirty: boolean;
```

##### isLoading

```ts
isLoading: boolean;
```

##### isProcessing

```ts
isProcessing: boolean;
```

##### isValid

```ts
isValid: boolean;
```

### model

```ts
model: ComputedRef<any>;
```

### promotions

```ts
promotions: ComputedRef<any>;
```

### remove()

```ts
remove: promotion => Promise<void>;
```

#### Parameters

• **promotion**: `any`

#### Returns

`Promise`\<`void`\>

### schema

```ts
schema: ComputedRef<any>;
```

### state

```ts
state: ComputedRef<any>;
```

### uischema

```ts
uischema: ComputedRef<any>;
```

### add()

#### Returns

`Promise`\<`void`\>
