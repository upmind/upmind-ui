[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useClientTemplate

# useClientTemplate()

```ts
function useClientTemplate(params): object;
```

Composable function to manage the query, the state, and the context for client area templates.
Allows fetching, monitoring, and refreshing the data for client area templates.

## Parameters

### params

#### code?

`ClientTemplateSlotCodes`

#### objectId?

`string`

## Returns

### data

```ts
data: object = query.data;
```

The reactive data property containing the list of client area templates.
This is populated by the query and can be used in templates.

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
value: ClientAreaTemplate;
```

### error

```ts
error: Ref<Error, Error> | Ref<null, null> = query.error;
```

The current error state of the query.
This will be populated if the query fails to fetch data.

### invalidate()

```ts
invalidate: <T>(data?) => Promise<T | undefined>;
```

Invalidate the query cache for the client area templates.
This will trigger a refetch of the items when the next query is made.

#### Type Parameters

##### T

`T` = `any`

#### Parameters

##### data?

`T`

#### Returns

`Promise`\<`T` \| `undefined`\>

### isReady()

```ts
isReady: () => Promise<boolean>;
```

Resolves when the client area templates are ready to be used.
Returns true if ready, false if an error occurred.

#### Returns

`Promise`\<`boolean`\>

A promise resolving to true if ready, false if error.

### meta

```ts
meta: ComputedRef<{
  hasError: boolean;
  isAvailable: boolean;
  isEmpty: boolean;
  isIframe: boolean;
  isLoading: boolean;
}>;
```

Meta-information about the client area templates query.

### refresh()

```ts
refresh: (options?) => Promise<QueryObserverResult<ClientAreaTemplate, Error>> = query.refetch;
```

Refresh the query to get the latest data.
This will refetch the data from the server and update the query state.

#### Parameters

##### options?

`RefetchOptions`

#### Returns

`Promise`\<`QueryObserverResult`\<`ClientAreaTemplate`, `Error`\>\>
