[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useBasketCurrency

# useBasketCurrency()

```ts
function useBasketCurrency(): object;
```

Interacts with the basket currency context and actor.
Provides state, context, and methods for managing basket currency data.
The functionality includes checking readiness, fetching meta-information,
accessing context and models, and performing actions like updating or clearing currency data.

## Returns

### clear()

```ts
clear: () => void;
```

Clears the currency state.

#### Returns

`void`

### context

```ts
context: ComputedRef<CurrencyContext | undefined>;
```

The full currency context object.

### currencies

```ts
currencies: ComputedRef<ICurrency[] | undefined>;
```

The list of available currencies.

### currencyCode

```ts
currencyCode: ComputedRef<ISO_4217_CURRENCY_CODE | undefined>;
```

The current currency code.

### currencyId

```ts
currencyId: ComputedRef<string | undefined>;
```

### errors

```ts
errors: ComputedRef<ResponseError | undefined>;
```

Any error returned by the currency actor.

### input()

```ts
input: (value) => Promise<CurrencyModel>;
```

Sends a SET event to update the currency model.

#### Parameters

##### value

`CurrencyModel`

The currency model to set.

#### Returns

`Promise`\<`CurrencyModel`\>

Does not return anything.

### isReady()

```ts
isReady: () => Promise<boolean>;
```

Waits for the currency actor to be ready (not loading or error state).

#### Returns

`Promise`\<`boolean`\>

Resolves true if ready, false if error.

### meta

```ts
meta: ComputedRef<{
  hasCurrency: boolean;
  hasErrors: boolean;
  isAvailable: boolean;
  isComplete: boolean;
  isDirty: boolean;
  isLoading: boolean;
  isProcessing: boolean;
  isValid: boolean;
}>;
```

Meta-information about the basket currency state.

### model

```ts
model: ComputedRef<CurrencyModel | undefined>;
```

The current currency model.

### schema

```ts
schema: ComputedRef<JsonSchema | undefined>;
```

The currency schema.

### uischema

```ts
uischema: ComputedRef<UISchemaElement | undefined>;
```

The currency UI schema.

### update()

```ts
update: (value?) => Promise<void>;
```

Updates the currency if the code has changed.

#### Parameters

##### value?

`CurrencyModel`

The new currency model to set.

#### Returns

`Promise`\<`void`\>

Resolves when updated, rejects on error.
