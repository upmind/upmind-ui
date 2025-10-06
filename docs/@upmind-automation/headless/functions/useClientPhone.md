[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useClientPhone

# useClientPhone()

```ts
function useClientPhone(id?, __namedParameters?): object;
```

## Parameters

### id?

`string`

### \_\_namedParameters?

#### allowMultipleEdits?

`boolean`

#### clientId?

`string`

## Returns

### clear()

```ts
clear: () => void;
```

Clears the context.

#### Returns

`void`

### context

```ts
context: ComputedRef<undefined | ClientItemContext<any, any>>;
```

The full context object.

### description

```ts
description: ComputedRef<undefined | string>;
```

Description of the.phone

### errors

```ts
errors: ComputedRef<undefined | string>;
```

Any error object from the context.

### id

```ts
id: ComputedRef<undefined | string>;
```

The ID of the phone

### input

```ts
input: DebouncedFunc<(model) => Promise<PhoneModel>>;
```

Inputs a new model, resolving to the updated model. This is debounced to avoid excessive calls.

#### Param

The model to input.

#### Returns

The updated model.

### isReady()

```ts
isReady: () => Promise<boolean>;
```

Resolves when the service is ready to accept input or perform actions.

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
  isNew: boolean;
  isProcessing: boolean;
  isValid: boolean;
}>;
```

Meta-information about the state.

### model

```ts
model: ComputedRef<any>;
```

The current model.

### schema

```ts
schema: ComputedRef<undefined | JsonSchema>;
```

The JSON schema for the form

### stop()

```ts
stop: () => void;
```

Stops the service.

#### Returns

`void`

### title

```ts
title: ComputedRef<undefined | string>;
```

Title of the phone

### uischema

```ts
uischema: ComputedRef<undefined | UISchemaElement>;
```

The UI schema for the form

### update()

```ts
update: (value?) => Promise<PhoneModel>;
```

Sends the current model to the service for processing.

#### Parameters

##### value?

The optional new model to set. uses the current model if not provided.

`Record`\<`string`, `any`\> | [`PhoneModel`](../interfaces/PhoneModel.md)

#### Returns

`Promise`\<[`PhoneModel`](../interfaces/PhoneModel.md)\>

Resolves when updated model from the service, rejects on error.

### validationErrors

```ts
validationErrors: ComputedRef<
  | undefined
| ValidationErrorObject<string, Record<string, any>, unknown>[]>;
```

Any validation errors from the context.
