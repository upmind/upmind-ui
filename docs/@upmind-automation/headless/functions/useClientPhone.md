[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useClientPhone

# useClientPhone()

```ts
function useClientPhone(id?, options?): object;
```

Provides functionalities to manage a client's phone, leveraging an XState machine.
This composable handles phone data, validation, saving, and interaction states.
It's designed for use in contexts like client profile management or checkout phone selection.

## Parameters

### id?

`string`

The unique identifier of the phone to manage. If omitted, it may imply a new phone.

### options?

Optional configuration for the address management.

#### allowMultipleEdits?

`boolean`

If `true`, allows multiple instances of this composable to manage different phones concurrently.

#### clientId?

`string`

The unique identifier of the client to whom this phone belongs.

## Returns

The API for managing the client phone.

### clear()

```ts
clear: () => void;
```

Clears the context.

#### Returns

`void`

### context

```ts
context: ComputedRef<DataManagerContext<any, any> | undefined>;
```

The full context object.

### description

```ts
description: ComputedRef<string | undefined>;
```

Description of the phone

### errors

```ts
errors: ComputedRef<string | undefined>;
```

Any error object from the context.

### id

```ts
id: ComputedRef<string | undefined>;
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

Title of the phone

### uischema

```ts
uischema: ComputedRef<UISchemaElement | undefined>;
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
  | ValidationErrorObject<string, Record<string, any>, unknown>[]
| undefined>;
```

Any validation errors from the context.
