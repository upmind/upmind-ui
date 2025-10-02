[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useBasketPaymentGateway

# useBasketPaymentGateway()

```ts
function useBasketPaymentGateway(): object;
```

## Returns

### clear()

```ts
clear: () => void;
```

Clears the payment gateway state.

#### Returns

`void`

### clickwrap

```ts
clickwrap: ComputedRef<undefined | string>;
```

The payment gateway clickwrap disclaimer.

### code

```ts
code: ComputedRef<undefined | string>;
```

The payment gateway code.

### context

```ts
context: ComputedRef<undefined | GatewayContext>;
```

The full payment gateway context object.

### errors

```ts
errors: ComputedRef<undefined | string>;
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
  isProcessing: boolean;
  isRenderless: boolean;
  isValid: boolean;
  needsPayment: boolean;
}>;
```

Meta information about the payment gateway state.

### model

```ts
model: ComputedRef<any>;
```

The current payment gateway model.

### render()

```ts
render: (container?) => Promise<boolean>;
```

Renders the payment gateway using the renderer function.

#### Parameters

##### container?

`HTMLElement`

The container element to render into.

#### Returns

`Promise`\<`boolean`\>

Resolves true if rendered, rejects on error.

### renderer

```ts
renderer: ComputedRef<undefined | Function>;
```

The payment gateway renderer.

### schema

```ts
schema: ComputedRef<undefined | JsonSchema>;
```

The payment gateway schema.

### type

```ts
type: ComputedRef<undefined | GatewayTypes>;
```

The payment gateway type.

### uischema

```ts
uischema: ComputedRef<undefined | UISchemaElement>;
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
  | undefined
| ValidationErrorObject<string, Record<string, any>, unknown>[]>;
```

Validation errors encountered during payment gateway operations.
Typically contains an array of error objects with details about the validation issues.

#### See

https://ajv.js.org/guide/validation-errors.html#validation-error-object
