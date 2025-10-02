[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useBasketFields

# useBasketFields()

```ts
function useBasketFields(): object;
```

## Returns

### clear()

```ts
clear: () => void;
```

Clears the fields state.

#### Returns

`void`

### context

```ts
context: ComputedRef<undefined | FieldsContext>;
```

The full fields context object.

### errors

```ts
errors: ComputedRef<undefined | ResponseError>;
```

Any error returned by the fields actor.

### fields

```ts
fields: ComputedRef<undefined | ICustomField[]>;
```

The list of available fields.

### input()

```ts
input: (value) => void;
```

Sends a SET event to update the fields model.

#### Parameters

##### value

`FieldsModel`

The fields model to set.

#### Returns

`void`

Does not return anything.

### isReady()

```ts
isReady: () => Promise<boolean>;
```

Waits for the fields actor to be ready (not loading or error state).

#### Returns

`Promise`\<`boolean`\>

Resolves true if ready, false if error.

### meta

```ts
meta: ComputedRef<{
  hasErrors: boolean;
  hasFields: boolean;
  isAvailable: boolean;
  isComplete: boolean;
  isDirty: boolean;
  isLoading: boolean;
  isProcessing: boolean;
  isValid: boolean;
}>;
```

Meta information about the basket fields state.

### model

```ts
model: ComputedRef<undefined | FieldsModel>;
```

The current fields model.

### schema

```ts
schema: ComputedRef<undefined | JsonSchema>;
```

The fields schema.

### uischema

```ts
uischema: ComputedRef<undefined | UISchemaElement>;
```

The fields UI schema.

### update

```ts
update: DebouncedFunc<(value) => Promise<void>>;
```

Updates the fields if the code has changed.

#### Param

The new fields model to set.

#### Returns

Resolves when updated, rejects on error.
