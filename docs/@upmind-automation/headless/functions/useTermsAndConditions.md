[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useTermsAndConditions

# useTermsAndConditions()

```ts
function useTermsAndConditions(): object;
```

Composable to get the current terms and conditions.

## Returns

The composable methods and state for the terms and conditions.

### data

```ts
data: object = query.data;
```

The reactive data property containing the list of client items.
This is populated by the query and updates automatically when the query state changes.

#### data.\[ComputedRefSymbol\]

```ts
[ComputedRefSymbol]: true;
```

#### data.\[RefSymbol\]

```ts
[RefSymbol]: true;
```

Type differentiator only.
We need this to be in public d.ts but don't want it to show up in IDE
autocomplete, so we use a private Symbol instead.

#### data.effect

```ts
effect: ComputedRefImpl;
```

##### Deprecated

computed no longer uses effect

#### data.value

```ts
value: TermsAndConditions;
```

### error

```ts
error: Ref<Error, Error> | Ref<null, null> = query.error;
```

The current error state of the query.
This will be populated if the query fails to fetch data.

### isReady()

```ts
isReady: () => Promise<boolean>;
```

Resolves when the client items are ready to be used.
Returns true if ready, false if an error occurred.

#### Returns

`Promise`\<`boolean`\>

A promise resolving to true if ready, false if error.

### meta

```ts
meta: ComputedRef<{
  hasError: boolean;
  isAvailable: boolean;
  isComplete: boolean;
  isEmpty: boolean;
  isLoading: boolean;
  isUrl: boolean;
}>;
```

Meta-information about the basket state.

### refresh()

```ts
refresh: (options?) => Promise<QueryObserverResult<TermsAndConditions, Error>> = query.refetch;
```

Refresh the query to get the latest data.
This will refetch the data from the server and update the query state.

#### Parameters

##### options?

`RefetchOptions`

#### Returns

`Promise`\<`QueryObserverResult`\<`TermsAndConditions`, `Error`\>\>
