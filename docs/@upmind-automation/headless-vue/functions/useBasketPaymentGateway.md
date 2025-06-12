[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useBasketPaymentGateway

# useBasketPaymentGateway()

```ts
function useBasketPaymentGateway(): object;
```

## Returns

`object`

### clear()

```ts
clear: () => any;
```

#### Returns

`any`

### code

```ts
code: ComputedRef<any>;
```

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

### instructions

```ts
instructions: ComputedRef<any>;
```

### meta

```ts
meta: ComputedRef<object>;
```

#### Type declaration

##### hasErrors

```ts
hasErrors: boolean;
```

##### hasInstructions

```ts
hasInstructions: boolean;
```

##### hasRenderer

```ts
hasRenderer: boolean;
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

##### isRenderless

```ts
isRenderless: boolean;
```

##### isValid

```ts
isValid: boolean;
```

### model

```ts
model: ComputedRef<any>;
```

### renderer

```ts
renderer: ComputedRef<any>;
```

### schema

```ts
schema: ComputedRef<any>;
```

### state

```ts
state: ComputedRef<any>;
```

### type

```ts
type: ComputedRef<any>;
```

### uischema

```ts
uischema: ComputedRef<any>;
```

### render()

#### Parameters

• **container**: `null` \| `HTMLElement` = `null`

#### Returns

`Promise`\<`unknown`\>

### update()

#### Parameters

• **model**: `any`

#### Returns

`void`
