[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useBasketCurrency

# useBasketCurrency()

```ts
function useBasketCurrency(): object;
```

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
context: ComputedRef<undefined | CurrencyContext>;
```

The full currency context object.

### currencies

```ts
currencies: ComputedRef<undefined | ICurrency[]>;
```

The list of available currencies.

### currencyCode

```ts
currencyCode: ComputedRef<undefined | ISO_4217_CURRENCY_CODE>;
```

The current currency code.

### currencyId

```ts
currencyId: ComputedRef<undefined | string>;
```

### errors

```ts
errors: ComputedRef<undefined | ResponseError>;
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
model: ComputedRef<undefined | CurrencyModel>;
```

The current currency model.

### schema

```ts
schema: ComputedRef<undefined | JsonSchema>;
```

The currency schema.

### uischema

```ts
uischema: ComputedRef<undefined | UISchemaElement>;
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
