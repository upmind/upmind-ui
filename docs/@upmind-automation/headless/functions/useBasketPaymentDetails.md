[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useBasketPaymentDetails

# useBasketPaymentDetails()

```ts
function useBasketPaymentDetails(): object;
```

## Returns

### amount

```ts
amount: ComputedRef<undefined | number>;
```

The payment amount, if applicable.

### clear()

```ts
clear: () => void;
```

Clears the payment details state.

#### Returns

`void`

### context

```ts
context: ComputedRef<
  | undefined
| PaymentDetailsContext>;
```

The full payment details context object.

### errors

```ts
errors: ComputedRef<undefined | ResponseError>;
```

Any error returned by the payment details actor.

### gateway

```ts
gateway: ComputedRef<undefined | Actor>;
```

The payment gateway actor.

### gateways

```ts
gateways: ComputedRef<undefined | Gateway[]>;
```

The available gateways.

### input()

```ts
input: (value) => void;
```

Sends a SET event to update the payment details model.

#### Parameters

##### value

[`PaymentDetailModel`](../interfaces/PaymentDetailModel.md)

The payment details model to set.

#### Returns

`void`

Does not return anything.

### isReady()

```ts
isReady: () => Promise<boolean>;
```

Waits for the payment details actor to be ready (not loading or error state).

#### Returns

`Promise`\<`boolean`\>

Resolves true if ready, false if error.

### meta

```ts
meta: ComputedRef<{
  hasErrors: boolean;
  hasGateway: boolean;
  isAvailable: boolean;
  isComplete: boolean;
  isDirty: boolean;
  isFree: boolean;
  isLoading: boolean;
  isProcessing: boolean;
  isValid: boolean;
}>;
```

Meta information about the basket payment details state.

### model

```ts
model: ComputedRef<undefined | PaymentDetailModel>;
```

The current payment details model.

### schema

```ts
schema: ComputedRef<undefined | JsonSchema>;
```

The payment details schema.

### uischema

```ts
uischema: ComputedRef<undefined | UISchemaElement>;
```

The payment details UI schema.

### update()

```ts
update: (value?) => Promise<void>;
```

Updates the payment details if the model has changed.

#### Parameters

##### value?

[`PaymentDetailModel`](../interfaces/PaymentDetailModel.md)

The new payment details model to set.

#### Returns

`Promise`\<`void`\>

Resolves when updated, rejects on error.
