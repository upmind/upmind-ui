[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / FormComposable

# FormComposable

Interface representing the API of a generic form composable.
This contract defines common methods and properties expected from composables
that manage form state, data, and interactions, typically backed by an XState machine.

## Properties

### clear()

```ts
clear: () => void;
```

Clears the current state and data of the form, typically resetting it to an empty or initial state.

#### Returns

`void`

`void`

***

### context()

```ts
context: () => any;
```

Retrieves the current context (extended state) of the underlying XState machine or equivalent.

#### Returns

`any`

The current context object.

***

### errors()

```ts
errors: () => any;
```

Retrieves any error objects associated with the form's state or validation.

#### Returns

`any`

An object or array containing form errors.

***

### getModel()

```ts
getModel: () => Function;
```

Retrieves a function that returns the current data model of the form.

#### Returns

`Function`

A function that, when called, returns the current form's data model.

***

### input()

```ts
input: (value) => Promise<any>;
```

Processes input changes to the form's data model.
This method is typically called in response to user input events on form fields.

#### Parameters

##### value

`any`

The new value or partial value to apply to the form's data model.

#### Returns

`Promise`\<`any`\>

A promise that resolves when the input has been processed and the model updated.

***

### isReady()

```ts
isReady: () => Promise<boolean>;
```

Returns a promise that resolves when the form composable is ready for interaction.
This typically means its internal state machine has reached an 'available' state.

#### Returns

`Promise`\<`boolean`\>

A promise is resolving to `true` when ready.

***

### schema

```ts
schema: any;
```

The JSON Schema defining the structure and validation rules for the form.

***

### setDefault()

```ts
setDefault: (value) => Promise<any>;
```

Sets the default values for the form's data model.
This typically resets the form to a predefined state.

#### Parameters

##### value

`any`

The object containing the default values to set.

#### Returns

`Promise`\<`any`\>

A promise that resolves when the default values have been set.

***

### state()

```ts
state: () => any;
```

Retrieves the current state of the underlying XState machine or equivalent state representation.

#### Returns

`any`

The current state object.

***

### stop()

```ts
stop: () => void;
```

Stops any underlying services or processes managed by the form composable.
This should be called to clean up resources, e.g. on a component unmounted.

#### Returns

`void`

`void`

***

### uischema

```ts
uischema: any;
```

The UI Schema defining the presentation and layout of the form fields.

***

### update()

```ts
update: () => Promise<any>;
```

Triggers an update or re-evaluation of the form's state or data.
This might involve re-validating the form or re-fetching dependent data.

#### Returns

`Promise`\<`any`\>

A promise that resolves when the update operation is complete.
