[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useClientEmail

# useClientEmail()

```ts
function useClientEmail(id?, options?): object;
```

Provides functionalities to manage a client's email, leveraging an XState machine.
This composable handles email data, validation, saving, and interaction states.
It's designed for use in contexts like client profile management or checkout email selection.

## Parameters

### id?

`string`

The unique identifier of the email to manage. If omitted, it may imply a new email.

### options?

Optional configuration for the email management.

#### allowMultipleEdits?

`boolean`

If `true`, allows multiple instances of this composable to manage different emails concurrently.

#### clientId?

`string`

The unique identifier of the client to whom this email belongs.

## Returns

The API for managing the client email.

### clear()

```ts
clear: () => void;
```

Clears the context.

#### Returns

`void`

### context

```ts
context: ComputedRef<ClientItemContext<any, any> | undefined>;
```

The full context object.

### description

```ts
description: ComputedRef<string | undefined>;
```

Description of the email

### errors

```ts
errors: ComputedRef<string | undefined>;
```

Any error object from the context.

### id

```ts
id: ComputedRef<string | undefined>;
```

The ID of the email

### input

```ts
input: DebouncedFunc<(model) => Promise<EmailModel>>;
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
schema: ComputedRef<JsonSchema | undefined>;
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
title: ComputedRef<string | undefined>;
```

Title of the email

### uischema

```ts
uischema: ComputedRef<UISchemaElement | undefined>;
```

The UI schema for the form

### update()

```ts
update: (value?) => Promise<EmailModel>;
```

Sends the current model to the service for processing.

#### Parameters

##### value?

The optional new model to set. uses the current model if not provided.

`Record`\<`string`, `any`\> | [`EmailModel`](../interfaces/EmailModel.md)

#### Returns

`Promise`\<[`EmailModel`](../interfaces/EmailModel.md)\>

Resolves when updated model from the service, rejects on error.

### validationErrors

```ts
validationErrors: ComputedRef<
  | ValidationErrorObject<string, Record<string, any>, unknown>[]
| undefined>;
```

Any validation errors from the context.
