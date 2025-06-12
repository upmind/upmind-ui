[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useBasketCurrency

# useBasketCurrency()

```ts
function useBasketCurrency(actorRef?): object;
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

### currencies

```ts
currencies: ComputedRef<any>;
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

##### hasCurrency

```ts
hasCurrency: boolean;
```

##### hasErrors

```ts
hasErrors: boolean;
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

### update()

#### Parameters

• **model**: `any`

#### Returns

`Promise`\<`void`\>
