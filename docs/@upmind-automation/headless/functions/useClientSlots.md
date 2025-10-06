[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useClientSlots

# useClientSlots()

```ts
function useClientSlots(): object;
```

## Returns

### data

```ts
data: undefined | Ref<ClientTemplateSlot[], ClientTemplateSlot[]> = query.data;
```

The reactive data property containing the list of client area templates.
This is populated by the query and can be used in templates.

### error

```ts
error: undefined | Ref<null, null> | Ref<Error, Error> = query.error;
```

The current error state of the query.
This will be populated if the query fails to fetch data.

### findOne()

```ts
findOne: (mapping, data, searchableProps) => undefined | ClientTemplateSlot;
```

Find a single client area template based on the given param. The param is matched against the title, code and description.

#### Parameters

##### mapping

The filter to match against the client area template title, code and description.

`string` | `Partial`\<`ClientTemplateSlot`\>

##### data

`MaybeRef`\<`undefined` \| `null` \| `ClientTemplateSlot`[]\> = `...`

##### searchableProps

`string`[] = `[]`

#### Returns

`undefined` \| `ClientTemplateSlot`

The client area template if found, otherwise undefined.

### getOne()

```ts
getOne: (id?, data) => undefined | ClientTemplateSlot;
```

Get a single client area template by id.

#### Parameters

##### id?

The id of the client area template to get.

`string` | `number`

##### data?

`MaybeRef`\<`undefined` \| `null` \| `ClientTemplateSlot`[]\> = `...`

#### Returns

`undefined` \| `ClientTemplateSlot`

The client area template if found, otherwise undefined.

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
  isLoading: boolean;
}>;
```

Meta-information about the client area templates query.

### refresh()

```ts
refresh: () => 
  | undefined
| Promise<QueryObserverResult<ClientTemplateSlot[], Error>>;
```

Refresh the query to get the latest data.
This will refetch the data from the server and update the query state.

#### Returns

  \| `undefined`
  \| `Promise`\<`QueryObserverResult`\<`ClientTemplateSlot`[], `Error`\>\>
