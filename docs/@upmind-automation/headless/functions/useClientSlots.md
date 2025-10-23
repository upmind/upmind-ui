[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useClientSlots

# useClientSlots()

```ts
function useClientSlots(): object;
```

Composable function to provide reactive state and methods to manage and interact with client area templates (slots).
This includes state management for query meta-information, error handling, data retrieval,
and operational methods such as fetching and invalidating data.

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
value: ClientTemplateSlot[];
```

### error

```ts
error: Ref<Error, Error> | Ref<null, null> = query.error;
```

The current error state of the query.
This will be populated if the query fails to fetch data.

### findOne()

```ts
findOne: (mapping, data, searchableProps) => ClientTemplateSlot | undefined;
```

Find a single client area template based on the given param. The param is matched against the title, code and description.

#### Parameters

##### mapping

The filter to match against the client area template title, code and description.

`string` | `Partial`\<`ClientTemplateSlot`\>

##### data

`MaybeRef`\<`ClientTemplateSlot`[] \| `null` \| `undefined`\> = `...`

##### searchableProps

`string`[] = `[]`

#### Returns

`ClientTemplateSlot` \| `undefined`

The client area template if found, otherwise undefined.

### getOne()

```ts
getOne: (id?, data) => ClientTemplateSlot | undefined;
```

Get a single client area template by id.

#### Parameters

##### id?

The id of the client area template to get.

`string` | `number`

##### data?

`MaybeRef`\<`ClientTemplateSlot`[] \| `null` \| `undefined`\> = `...`

#### Returns

`ClientTemplateSlot` \| `undefined`

The client area template if found, otherwise undefined.

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
  isLoading: boolean;
}>;
```

Meta-information about the client area templates query.

### refresh()

```ts
refresh: () => Promise<QueryObserverResult<ClientTemplateSlot[], Error>>;
```

Refresh the query to get the latest data.
This will refetch the data from the server and update the query state.

#### Returns

`Promise`\<`QueryObserverResult`\<`ClientTemplateSlot`[], `Error`\>\>
