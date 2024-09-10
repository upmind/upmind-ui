[Upmind](../../packages.md) / [@upmind/upflow-vue](../index.md) / useBasketPromotions

# useBasketPromotions()

```ts
function useBasketPromotions(actor?): object
```

## Parameters

• **actor?**: `TActor`\<`any`\>

## Returns

`object`

### add()

```ts
add: () => undefined | void;
```

#### Returns

`undefined` \| `void`

### clear()

```ts
clear: () => undefined | void;
```

#### Returns

`undefined` \| `void`

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
input: (model) => undefined | void;
```

#### Parameters

• **model**: `any`

#### Returns

`undefined` \| `void`

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
remove: (promotion) => undefined | void;
```

#### Parameters

• **promotion**: `any`

#### Returns

`undefined` \| `void`

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
