[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useClientTemplate

# useClientTemplate()

```ts
function useClientTemplate(params): object;
```

## Parameters

### params

#### code?

`ClientTemplateSlotCodes`

#### objectId?

`string`

## Returns

### data

```ts
data: undefined | Ref<ClientAreaTemplate, ClientAreaTemplate> = query.data;
```

The reactive data property containing the list of client area templates.
This is populated by the query and can be used in templates.

### error

```ts
error: undefined | Ref<null, null> | Ref<Error, Error> = query.error;
```

The current error state of the query.
This will be populated if the query fails to fetch data.

### invalidate()

```ts
invalidate: <T>(data?) => Promise<undefined | T>;
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

`Promise`\<`undefined` \| `T`\>

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
refresh: () => 
  | undefined
| Promise<QueryObserverResult<ClientAreaTemplate, Error>>;
```

Refresh the query to get the latest data.
This will refetch the data from the server and update the query state.

#### Returns

  \| `undefined`
  \| `Promise`\<`QueryObserverResult`\<`ClientAreaTemplate`, `Error`\>\>
