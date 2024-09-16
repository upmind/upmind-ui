[Upmind](../../packages.md) / [@upmind/headless-vue](../index.md) / useBasketFields

# useBasketFields()

```ts
function useBasketFields(actor?): object
```

## Parameters

• **actor?**: `TActor`\<`any`\>

## Returns

`object`

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

`void`
