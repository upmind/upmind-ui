[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useDomain

# useDomain()

```ts
function useDomain(value, options?): object;
```

Composable for managing domain selection and search logic using XState and Vue.
Provides state, context, and helpers for domain-related flows (DAC, existing, basket).

## Parameters

### value

Initial domain(s) to use as the model.

`string` | `string`[]

### options?

Optional configuration for the domain type.

#### type

[`DomainTypes`](../enumerations/DomainTypes.md)

The type of domain to manage (e.g., "dac", "existing", "basket").
                    If not provided, defaults to all available domain types.

## Returns

Domain management API (state, computed, and methods)

### add()

```ts
add: (value) => void;
```

Add a domain value to the model.

#### Parameters

##### value

`string`

The domain value to add.

#### Returns

`void`

### addToBasket()

```ts
addToBasket: () => Promise<void>;
```

Add all selected domains to the basket.

#### Returns

`Promise`\<`void`\>

### available

```ts
available: ComputedRef<undefined | DomainProduct[]>;
```

List of available domains.

### basket

```ts
basket: ComputedRef<undefined | DomainProduct[]>;
```

List of domains in the basket.

### choices

```ts
choices: ComputedRef<object[]>;
```

List of available choices.

### choose()

```ts
choose: (value) => void;
```

Choose a domain value.

#### Parameters

##### value

`string`

The domain value to choose.

#### Returns

`void`

### context

```ts
context: ComputedRef<undefined | DomainContext>;
```

### errors

```ts
errors: ComputedRef<undefined | ResponseError>;
```

Any errors encountered.

### isReady()

```ts
isReady: () => Promise<boolean>;
```

Resolves when the brand service is ready or errors.
Returns true if ready, false if an error occurred.

#### Returns

`Promise`\<`boolean`\>

A promise resolving to true if ready, false if error.

### isSelected()

```ts
isSelected: (value) => boolean;
```

Check if a domain value is selected in the model.

#### Parameters

##### value

`string`

The domain value to check.

#### Returns

`boolean`

True if the value is selected, false otherwise.

### meta

```ts
meta: ComputedRef<{
  hasErrors: boolean;
  hasMoreSearchResults: boolean;
  isLoading: boolean;
  isSearching: boolean;
  isSearchingMore: boolean;
  isSyncing: boolean;
  isValid: boolean;
  showBasket: boolean;
  showChoices: boolean;
  showDac: boolean;
  showExisting: boolean;
  showSelected: boolean;
}>;
```

Meta information about the domain state.

### model

```ts
model: ComputedRef<string[]>;
```

The current model (selected domains).

### owned

```ts
owned: ComputedRef<undefined | DomainProduct[]>;
```

List of owned domains.

### pagination

```ts
pagination: ComputedRef<{
  limit: number;
  offset: number;
  total: number;
}>;
```

Get the current pagination state.

#### Returns

The current pagination state.

### query

```ts
query: ComputedRef<undefined | string>;
```

The current search query.

### remove()

```ts
remove: (value) => void;
```

Remove a domain value from the model.

#### Parameters

##### value

`string`

The domain value to remove.

#### Returns

`void`

### reset()

```ts
reset: () => void;
```

Reset the domain state.

#### Returns

`void`

### search

```ts
search: DebouncedFunc<(query) => void>;
```

Search for domains by query string.

#### Param

The search query string.

#### Returns

### searchMore()

```ts
searchMore: () => void;
```

Fetch more search results (pagination).

#### Returns

`void`

### select()

```ts
select: (value) => void;
```

Select a domain value.

#### Parameters

##### value

`string`

The domain value to select.

#### Returns

`void`

### selected

```ts
selected: ComputedRef<undefined | string>;
```

The currently selected domain.

### stop()

```ts
stop: () => boolean;
```

Stop the domain service.

#### Returns

`boolean`

### toggle()

```ts
toggle: (value) => void;
```

Toggle a domain value in the model.

#### Parameters

##### value

`string`

The domain value to toggle.

#### Returns

`void`

### type

```ts
type: ComputedRef<undefined | DomainTypes>;
```

The current domain type.

### update()

```ts
update: (model) => void;
```

Update the model with a new value or array of values.

#### Parameters

##### model

The new value or array of values to update the model with.

`string` | `string`[]

#### Returns

`void`
