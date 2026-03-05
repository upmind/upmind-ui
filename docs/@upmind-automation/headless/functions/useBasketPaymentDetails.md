[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useBasketPaymentDetails

# useBasketPaymentDetails()

```ts
function useBasketPaymentDetails(): object;
```

Retrieves the payment details related to the basket by using the actor model.

This function leverages the basket's paymentDetails actor to collect
and manage payment-related data. It combines the context of the basket
with the payment details actor to simplify access to payment details.

## Returns

### address

```ts
address: ComputedRef<IAddress | undefined>;
```

The full address to be used for the order

### amount

```ts
amount: ComputedRef<number | undefined>;
```

The payment amount, if applicable.

### clear()

```ts
clear: () => void;
```

Clears the payment details state.

#### Returns

`void`

### clickwrap

```ts
clickwrap: ComputedRef<string | undefined>;
```

The payment details clickwrap disclaimer.

### context

```ts
context: ComputedRef<
  | PaymentDetailsContext
| undefined>;
```

The full payment details context object.

### currency

```ts
currency: ComputedRef<ICurrency | undefined>;
```

The payment currency

### errors

```ts
errors: ComputedRef<ResponseError | undefined>;
```

Any error returned by the payment details actor.

### gateway

```ts
gateway: ComputedRef<Actor | undefined>;
```

The payment gateway actor.

### gateways

```ts
gateways: ComputedRef<IBrandGateway[] | undefined>;
```

The available gateways.

### input()

```ts
input: (value) => Promise<void>;
```

Sends a SET event to update the payment details model.

#### Parameters

##### value

[`PaymentDetailModel`](../type-aliases/PaymentDetailModel.md)

The payment details model to set.

#### Returns

`Promise`\<`void`\>

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
  hasSelectedGateway: boolean;
  hasGateways: boolean;
  hasStoredPaymentMethods: boolean;
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
model: ComputedRef<
  | PaymentDetailModel
| undefined>;
```

The current payment details model.

### schema

```ts
schema: ComputedRef<JsonSchema | undefined>;
```

The payment details schema.

### state

```ts
state: ComputedRef<string[] | undefined>;
```

### storedPaymentMethods

```ts
storedPaymentMethods: ComputedRef<PaymentDetail[] | undefined>;
```

The stored payment methods available.

### uischema

```ts
uischema: ComputedRef<UISchemaElement | undefined>;
```

The payment details UI schema.

### update()

```ts
update: (value?) => Promise<void>;
```

Updates the payment details if the model has changed.

#### Parameters

##### value?

[`PaymentDetailModel`](../type-aliases/PaymentDetailModel.md)

The new payment details model to set.

#### Returns

`Promise`\<`void`\>

Resolves when updated, rejects on error.

### useStoredPayment()

```ts
useStoredPayment: (model) => void;
```

Updates the payment details with the stored Payment method ID.

#### Parameters

##### model

[`PaymentDetailModel`](../type-aliases/PaymentDetailModel.md)

The payment details model to use for checkout.

#### Returns

`void`

Does not return anything.

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
