[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useBasketBilling

# useBasketBilling()

```ts
function useBasketBilling(): object;
```

## Returns

### clear()

```ts
clear: () => void;
```

Clears the billing state.

#### Returns

`void`

### config

```ts
config: ComputedRef<
  | undefined
  | {
  requiresAddress: REQUIRE_ADDRESS_FOR_ORDERS;
  requiresCompany: REQUIRE_COMPANY_FOR_ORDERS;
  requiresPhone: CHECKOUT_REQUIRE_PHONE;
}>;
```

The configuration requirements for billing .. ie doe we require a company, phone, etc.

### context

```ts
context: ComputedRef<undefined | BillingContext>;
```

The full billing context object.

### errors

```ts
errors: ComputedRef<undefined | ResponseError>;
```

Any error returned by the billing actor.

### isReady()

```ts
isReady: () => Promise<boolean>;
```

Waits for the billing actor to be ready (not loading or error state).

#### Returns

`Promise`\<`boolean`\>

Resolves true if ready, false if error.

### meta

```ts
meta: ComputedRef<{
  hasErrors: boolean;
  isAvailable: boolean;
  isComplete: boolean;
  isDirty: boolean;
  isLoading: boolean;
  isProcessing: boolean;
  isValid: boolean;
  needsAddress: boolean | REQUIRE_ADDRESS_FOR_ORDERS;
  needsCompany: boolean | REQUIRE_COMPANY_FOR_ORDERS;
  needsPhone: boolean | CHECKOUT_REQUIRE_PHONE;
}>;
```

Meta information about the basket billing state.

### model

```ts
model: ComputedRef<undefined | BillingModel>;
```

The current billing model.

### schema

```ts
schema: ComputedRef<undefined | JsonSchema>;
```

The billing schema.

### state

```ts
state: ComputedRef<undefined | string[]>;
```

### uischema

```ts
uischema: ComputedRef<undefined | UISchemaElement>;
```

The billing UI schema.

### update()

```ts
update: (value) => Promise<void>;
```

Updates the billing if the code has changed.

#### Parameters

##### value

[`BillingModel`](../interfaces/BillingModel.md)

The new billing model to set.

#### Returns

`Promise`\<`void`\>

Resolves when updated, rejects on error.

### useUnifiedBillingDetail()

```ts
useUnifiedBillingDetail: (type, options) => object = useUnified;
```

Returns the unified address composable for billing details.

A composable that provides a unified interface for managing billing details.
It allows for the creation of personal or company billing details, including phones and addresses.
It uses a state machine to manage the state and actions related to billing details.

#### Parameters

##### type

[`UnifiedType`](../enumerations/UnifiedType.md) = `UnifiedType.PERSONAL`

The type of billing detail to create, either personal or company.

##### options

Optional parameters.

###### clientId?

`string`

The ID of the client for which the billing detail is being created.

#### Returns

An object containing methods

##### addresses

```ts
addresses: ComputedRef<undefined | Address[]>;
```

The list of available addresses.

##### clear()

```ts
clear: () => void;
```

Clears the context.

###### Returns

`void`

##### companies

```ts
companies: ComputedRef<undefined | Company[]>;
```

The list of available companies.

##### context

```ts
context: ComputedRef<undefined | UnifiedContext>;
```

The full context object.

##### description

```ts
description: ComputedRef<undefined | string>;
```

Description of the address

##### errors

```ts
errors: ComputedRef<undefined | string>;
```

Any error object from the context.

##### id

```ts
id: ComputedRef<undefined | string>;
```

The ID of the address

##### input

```ts
input: DebouncedFunc<(model) => Promise<UnifiedModel>>;
```

Inputs a new model, resolving to the updated model. This is debounced to avoid excessive calls.

###### Param

The model to input.

###### Returns

The updated model.

##### isReady()

```ts
isReady: () => Promise<boolean>;
```

Resolves when the service is ready to accept input or perform actions.

###### Returns

`Promise`\<`boolean`\>

Resolves true if ready, false if error.

##### meta

```ts
meta: ComputedRef<{
  hasErrors: boolean;
  isAvailable: boolean;
  isComplete: boolean;
  isDirty: boolean;
  isLoading: boolean;
  isNew: boolean;
  isProcessing: boolean;
  isValid: boolean;
}>;
```

Meta-information about the state.

##### model

```ts
model: ComputedRef<undefined | UnifiedModel>;
```

The current model.

##### phones

```ts
phones: ComputedRef<undefined | Phone[]>;
```

The list of available phones.

##### schema

```ts
schema: ComputedRef<undefined | JsonSchema>;
```

The JSON schema for the form

##### stop()

```ts
stop: () => void;
```

Stops the service.

###### Returns

`void`

##### title

```ts
title: ComputedRef<undefined | string>;
```

Title of the address

##### uischema

```ts
uischema: ComputedRef<undefined | UISchemaElement>;
```

The UI schema for the form

##### update()

```ts
update: (value?) => Promise<UnifiedModel>;
```

Sends the current model to the service for processing.

###### Parameters

###### value?

`UnifiedModel`

The optional new model to set. uses the current model if not provided.

###### Returns

`Promise`\<`UnifiedModel`\>

Resolves when updated model from the service, rejects on error.

##### validationErrors

```ts
validationErrors: ComputedRef<
  | undefined
| ValidationErrorObject<string, Record<string, any>, unknown>[]>;
```

Any validation errors from the context.

#### Returns

The unified address composable.

### wait()

```ts
wait: (value) => Promise<boolean>;
```

Puts the billing actor into a wait state before re-checking for validity.
This is usefull if we are adding a new address or company and need to wait
for the actor to re-validate the billing details.

#### Parameters

##### value

`boolean`

#### Returns

`Promise`\<`boolean`\>

Resolves true if successful, false if error.
