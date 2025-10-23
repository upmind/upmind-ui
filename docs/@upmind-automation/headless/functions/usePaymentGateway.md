[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / usePaymentGateway

# usePaymentGateway()

```ts
function usePaymentGateway(actor): object;
```

A composable function that provides access to the payment gateway actor.

## Parameters

### actor

`ComputedRef`\<`Actor` \| `undefined`\>

A computed ref to the payment gateway actor.

## Returns

An object containing the payment gateway state and methods.

### clear()

```ts
clear: () => void;
```

Clears the payment gateway state.

#### Returns

`void`

### clickwrap

```ts
clickwrap: ComputedRef<string | undefined>;
```

The payment gateway clickwrap disclaimer.

### context

```ts
context: ComputedRef<GatewayContext | undefined>;
```

The full payment gateway context object.

### errors

```ts
errors: ComputedRef<string | undefined>;
```

Any errors message(s) encountered during payment gateway operations.

### input()

```ts
input: (value) => void;
```

Sends a SET event to update the payment gateway model.

#### Parameters

##### value

`any`

The payment gateway model to set.

#### Returns

`void`

Does not return anything.

### instructions

```ts
instructions: ComputedRef<any>;
```

The payment gateway instructions.

### isReady()

```ts
isReady: () => Promise<boolean>;
```

Waits for the payment gateway actor to be ready (not loading or error state).

Waits for the payment gateway actor to be ready (not loading or error state).

#### Returns

`Promise`\<`boolean`\>

Resolves true if ready, false if error.

#### Returns

Resolves true if ready, false if error.

### meta

```ts
meta: ComputedRef<{
  hasErrors: boolean;
  hasInstructions: boolean;
  hasRenderer: boolean;
  isAvailable: boolean;
  isComplete: boolean;
  isDirty: boolean;
  isLoading: boolean;
  isNotSupported: boolean;
  isProcessing: boolean;
  isRendering: boolean;
  isRenderless: boolean;
  isUnavailable: boolean;
  isValid: boolean;
  needsPayment: boolean;
}>;
```

Meta information about the payment gateway state.

### model

```ts
model: ComputedRef<GatewayData | undefined>;
```

The current payment gateway model.

### render()

```ts
render: (container) => Promise<void>;
```

Renders the payment gateway using the renderer function.

#### Parameters

##### container

The container element to render into.

`HTMLElement` | `null`

#### Returns

`Promise`\<`void`\>

Resolves true if rendered, rejects on error.

### schema

```ts
schema: ComputedRef<JsonSchema | undefined>;
```

The payment gateway schema.

### state

```ts
state: ComputedRef<string[] | undefined>;
```

### uischema

```ts
uischema: ComputedRef<UISchemaElement | undefined>;
```

The payment gateway UI schema.

### update()

```ts
update: (value) => Promise<void>;
```

Updates the payment gateway if the model has changed.

#### Parameters

##### value

`any`

The new payment gateway model to set.

#### Returns

`Promise`\<`void`\>

Resolves when updated, rejects on error.

### validationErrors

```ts
validationErrors: ComputedRef<
  | ValidationErrorObject<string, Record<string, any>, unknown>[]
| undefined>;
```

Validation errors encountered during payment gateway operations.
Typically contains an array of error objects with details about the validation issues.

#### See

https://ajv.js.org/guide/validation-errors.html#validation-error-object
