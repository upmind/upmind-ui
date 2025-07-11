[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useBasketPaymentDetails

# useBasketPaymentDetails()

```ts
function useBasketPaymentDetails(service?): object;
```

## Parameters

• **service?**: `ActorRef`\<`any`, `any`\>

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

### gateway

```ts
gateway: ComputedRef<any>;
```

### gateways

```ts
gateways: ComputedRef<any>;
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

##### hasGateway

```ts
hasGateway: boolean;
```

##### isAvailable

```ts
isAvailable: boolean;
```

##### isComplete

```ts
isComplete: any;
```

##### isDirty

```ts
isDirty: boolean;
```

##### isFree

```ts
isFree: boolean;
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
