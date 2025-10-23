[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / QueryClient

# QueryClient

## Extends

- `QueryClient`

## Properties

### isRestoring?

```ts
optional isRestoring: Ref<boolean, boolean>;
```

## Methods

### cancelQueries()

```ts
cancelQueries<TQueryFnData, TError, TTaggedQueryKey, TInferredQueryFnData, TInferredError>(filters?, options?): Promise<void>;
```

#### Type Parameters

##### TQueryFnData

`TQueryFnData` = `unknown`

##### TError

`TError` = `Error`

##### TTaggedQueryKey

`TTaggedQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

##### TInferredQueryFnData

`TInferredQueryFnData` = `InferDataFromTag`\<`TQueryFnData`, `TTaggedQueryKey`\>

##### TInferredError

`TInferredError` = `InferErrorFromTag`\<`TError`, `TTaggedQueryKey`\>

#### Parameters

##### filters?

`QueryFilters`\<`TTaggedQueryKey`\>

##### options?

`MaybeRefDeep`\<`CancelOptions`\>

#### Returns

`Promise`\<`void`\>

#### Overrides

```ts
QueryClient$1.cancelQueries
```

***

### clear()

```ts
clear(): void;
```

#### Returns

`void`

#### Inherited from

```ts
QueryClient$1.clear
```

***

### defaultMutationOptions()

```ts
defaultMutationOptions<T>(options?): T;
```

#### Type Parameters

##### T

`T` *extends* `MutationOptions`\<`any`, `any`, `any`, `any`\>

#### Parameters

##### options?

`T`

#### Returns

`T`

#### Inherited from

```ts
QueryClient$1.defaultMutationOptions
```

***

### defaultQueryOptions()

```ts
defaultQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey, TPageParam>(options): DefaultedQueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>;
```

#### Type Parameters

##### TQueryFnData

`TQueryFnData` = `unknown`

##### TError

`TError` = `Error`

##### TData

`TData` = `TQueryFnData`

##### TQueryData

`TQueryData` = `TQueryFnData`

##### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

##### TPageParam

`TPageParam` = `never`

#### Parameters

##### options

`QueryObserverOptions`\<`TQueryFnData`, `TError`, `TData`, `TQueryData`, `TQueryKey`, `TPageParam`\> | `DefaultedQueryObserverOptions`\<`TQueryFnData`, `TError`, `TData`, `TQueryData`, `TQueryKey`\>

#### Returns

`DefaultedQueryObserverOptions`\<`TQueryFnData`, `TError`, `TData`, `TQueryData`, `TQueryKey`\>

#### Inherited from

```ts
QueryClient$1.defaultQueryOptions
```

***

### ensureInfiniteQueryData()

```ts
ensureInfiniteQueryData<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options): Promise<InfiniteData<TData, TPageParam>>;
```

#### Type Parameters

##### TQueryFnData

`TQueryFnData`

##### TError

`TError` = `Error`

##### TData

`TData` = `TQueryFnData`

##### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

##### TPageParam

`TPageParam` = `unknown`

#### Parameters

##### options

`EnsureInfiniteQueryDataOptions`\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

#### Returns

`Promise`\<`InfiniteData`\<`TData`, `TPageParam`\>\>

#### Inherited from

```ts
QueryClient$1.ensureInfiniteQueryData
```

***

### ensureQueryData()

#### Call Signature

```ts
ensureQueryData<TQueryFnData, TError, TData, TQueryKey>(options): Promise<TData>;
```

##### Type Parameters

###### TQueryFnData

`TQueryFnData`

###### TError

`TError` = `Error`

###### TData

`TData` = `TQueryFnData`

###### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

##### Parameters

###### options

`EnsureQueryDataOptions`\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

##### Returns

`Promise`\<`TData`\>

##### Overrides

```ts
QueryClient$1.ensureQueryData
```

#### Call Signature

```ts
ensureQueryData<TQueryFnData, TError, TData, TQueryKey>(options): Promise<TData>;
```

##### Type Parameters

###### TQueryFnData

`TQueryFnData`

###### TError

`TError` = `Error`

###### TData

`TData` = `TQueryFnData`

###### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

##### Parameters

###### options

`MaybeRefDeep`\<`EnsureQueryDataOptions`\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `never`\>\>

##### Returns

`Promise`\<`TData`\>

##### Overrides

```ts
QueryClient$1.ensureQueryData
```

***

### fetchInfiniteQuery()

#### Call Signature

```ts
fetchInfiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options): Promise<InfiniteData<TData, TPageParam>>;
```

##### Type Parameters

###### TQueryFnData

`TQueryFnData` = `unknown`

###### TError

`TError` = `Error`

###### TData

`TData` = `TQueryFnData`

###### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

###### TPageParam

`TPageParam` = `unknown`

##### Parameters

###### options

`FetchInfiniteQueryOptions`\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

##### Returns

`Promise`\<`InfiniteData`\<`TData`, `TPageParam`\>\>

##### Overrides

```ts
QueryClient$1.fetchInfiniteQuery
```

#### Call Signature

```ts
fetchInfiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options): Promise<InfiniteData<TData, TPageParam>>;
```

##### Type Parameters

###### TQueryFnData

`TQueryFnData`

###### TError

`TError` = `Error`

###### TData

`TData` = `TQueryFnData`

###### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

###### TPageParam

`TPageParam` = `unknown`

##### Parameters

###### options

`MaybeRefDeep`\<`FetchInfiniteQueryOptions`\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>\>

##### Returns

`Promise`\<`InfiniteData`\<`TData`, `TPageParam`\>\>

##### Overrides

```ts
QueryClient$1.fetchInfiniteQuery
```

***

### fetchQuery()

#### Call Signature

```ts
fetchQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options): Promise<TData>;
```

##### Type Parameters

###### TQueryFnData

`TQueryFnData`

###### TError

`TError` = `Error`

###### TData

`TData` = `TQueryFnData`

###### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

###### TPageParam

`TPageParam` = `never`

##### Parameters

###### options

`FetchQueryOptions`\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

##### Returns

`Promise`\<`TData`\>

##### Overrides

```ts
QueryClient$1.fetchQuery
```

#### Call Signature

```ts
fetchQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options): Promise<TData>;
```

##### Type Parameters

###### TQueryFnData

`TQueryFnData`

###### TError

`TError` = `Error`

###### TData

`TData` = `TQueryFnData`

###### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

###### TPageParam

`TPageParam` = `never`

##### Parameters

###### options

`MaybeRefDeep`\<`FetchQueryOptions`\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>\>

##### Returns

`Promise`\<`TData`\>

##### Overrides

```ts
QueryClient$1.fetchQuery
```

***

### getDefaultOptions()

```ts
getDefaultOptions(): DefaultOptions;
```

#### Returns

`DefaultOptions`

#### Inherited from

```ts
QueryClient$1.getDefaultOptions
```

***

### getMutationCache()

```ts
getMutationCache(): MutationCache;
```

#### Returns

`MutationCache`

#### Inherited from

```ts
QueryClient$1.getMutationCache
```

***

### getMutationDefaults()

```ts
getMutationDefaults(mutationKey): MutationObserverOptions<any, any, any, any>;
```

#### Parameters

##### mutationKey

`MaybeRefDeep`\<readonly `unknown`[]\>

#### Returns

`MutationObserverOptions`\<`any`, `any`, `any`, `any`\>

#### Overrides

```ts
QueryClient$1.getMutationDefaults
```

***

### getQueriesData()

```ts
getQueriesData<TData>(filters): [readonly unknown[], TData | undefined][];
```

#### Type Parameters

##### TData

`TData` = `unknown`

#### Parameters

##### filters

`MaybeRefDeep`\<`QueryFilters`\<readonly `unknown`[]\>\>

#### Returns

\[readonly `unknown`[], `TData` \| `undefined`\][]

#### Overrides

```ts
QueryClient$1.getQueriesData
```

***

### getQueryCache()

```ts
getQueryCache(): QueryCache;
```

#### Returns

`QueryCache`

#### Inherited from

```ts
QueryClient$1.getQueryCache
```

***

### getQueryData()

#### Call Signature

```ts
getQueryData<TData, TTaggedQueryKey>(queryKey): InferDataFromTag<TData, TTaggedQueryKey> | undefined;
```

Imperative (non-reactive) way to retrieve data for a QueryKey.
Should only be used in callbacks or functions where reading the latest data is necessary, e.g. for optimistic updates.

Hint: Do not use this function inside a component, because it won't receive updates.
Use `useQuery` to create a `QueryObserver` that subscribes to changes.

##### Type Parameters

###### TData

`TData` = `unknown`

###### TTaggedQueryKey

`TTaggedQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

##### Parameters

###### queryKey

`TTaggedQueryKey`

##### Returns

`InferDataFromTag`\<`TData`, `TTaggedQueryKey`\> \| `undefined`

##### Overrides

```ts
QueryClient$1.getQueryData
```

#### Call Signature

```ts
getQueryData<TData>(queryKey): TData | undefined;
```

##### Type Parameters

###### TData

`TData` = `unknown`

##### Parameters

###### queryKey

`MaybeRefDeep`\<readonly `unknown`[]\>

##### Returns

`TData` \| `undefined`

##### Overrides

```ts
QueryClient$1.getQueryData
```

***

### getQueryDefaults()

```ts
getQueryDefaults(queryKey): OmitKeyof<QueryObserverOptions<any, any, any, any, any>, "queryKey">;
```

#### Parameters

##### queryKey

`MaybeRefDeep`\<readonly `unknown`[]\>

#### Returns

`OmitKeyof`\<`QueryObserverOptions`\<`any`, `any`, `any`, `any`, `any`\>, `"queryKey"`\>

#### Overrides

```ts
QueryClient$1.getQueryDefaults
```

***

### getQueryState()

```ts
getQueryState<TData, TError>(queryKey): QueryState<TData, TError> | undefined;
```

#### Type Parameters

##### TData

`TData` = `unknown`

##### TError

`TError` = `Error`

#### Parameters

##### queryKey

`MaybeRefDeep`\<readonly `unknown`[]\>

#### Returns

`QueryState`\<`TData`, `TError`\> \| `undefined`

#### Overrides

```ts
QueryClient$1.getQueryState
```

***

### invalidateQueries()

```ts
invalidateQueries<TQueryFnData, TError, TTaggedQueryKey, TInferredQueryFnData, TInferredError>(filters?, options?): Promise<void>;
```

#### Type Parameters

##### TQueryFnData

`TQueryFnData` = `unknown`

##### TError

`TError` = `Error`

##### TTaggedQueryKey

`TTaggedQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

##### TInferredQueryFnData

`TInferredQueryFnData` = `InferDataFromTag`\<`TQueryFnData`, `TTaggedQueryKey`\>

##### TInferredError

`TInferredError` = `InferErrorFromTag`\<`TError`, `TTaggedQueryKey`\>

#### Parameters

##### filters?

`InvalidateQueryFilters`\<`TTaggedQueryKey`\>

##### options?

`MaybeRefDeep`\<`InvalidateOptions`\>

#### Returns

`Promise`\<`void`\>

#### Overrides

```ts
QueryClient$1.invalidateQueries
```

***

### isFetching()

```ts
isFetching(filters?): number;
```

#### Parameters

##### filters?

`MaybeRefDeep`\<`QueryFilters`\<readonly `unknown`[]\>\>

#### Returns

`number`

#### Overrides

```ts
QueryClient$1.isFetching
```

***

### isMutating()

```ts
isMutating(filters?): number;
```

#### Parameters

##### filters?

`MaybeRefDeep`\<`MutationFilters`\<`unknown`, `Error`, `unknown`, `unknown`\>\>

#### Returns

`number`

#### Overrides

```ts
QueryClient$1.isMutating
```

***

### mount()

```ts
mount(): void;
```

#### Returns

`void`

#### Inherited from

```ts
QueryClient$1.mount
```

***

### prefetchInfiniteQuery()

#### Call Signature

```ts
prefetchInfiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options): Promise<void>;
```

##### Type Parameters

###### TQueryFnData

`TQueryFnData`

###### TError

`TError` = `Error`

###### TData

`TData` = `TQueryFnData`

###### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

###### TPageParam

`TPageParam` = `unknown`

##### Parameters

###### options

`FetchInfiniteQueryOptions`\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

##### Returns

`Promise`\<`void`\>

##### Overrides

```ts
QueryClient$1.prefetchInfiniteQuery
```

#### Call Signature

```ts
prefetchInfiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options): Promise<void>;
```

##### Type Parameters

###### TQueryFnData

`TQueryFnData`

###### TError

`TError` = `Error`

###### TData

`TData` = `TQueryFnData`

###### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

###### TPageParam

`TPageParam` = `unknown`

##### Parameters

###### options

`MaybeRefDeep`\<`FetchInfiniteQueryOptions`\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>\>

##### Returns

`Promise`\<`void`\>

##### Overrides

```ts
QueryClient$1.prefetchInfiniteQuery
```

***

### prefetchQuery()

#### Call Signature

```ts
prefetchQuery<TQueryFnData, TError, TData, TQueryKey>(options): Promise<void>;
```

##### Type Parameters

###### TQueryFnData

`TQueryFnData` = `unknown`

###### TError

`TError` = `Error`

###### TData

`TData` = `TQueryFnData`

###### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

##### Parameters

###### options

`FetchQueryOptions`\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

##### Returns

`Promise`\<`void`\>

##### Overrides

```ts
QueryClient$1.prefetchQuery
```

#### Call Signature

```ts
prefetchQuery<TQueryFnData, TError, TData, TQueryKey>(options): Promise<void>;
```

##### Type Parameters

###### TQueryFnData

`TQueryFnData` = `unknown`

###### TError

`TError` = `Error`

###### TData

`TData` = `TQueryFnData`

###### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

##### Parameters

###### options

`MaybeRefDeep`\<`FetchQueryOptions`\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `never`\>\>

##### Returns

`Promise`\<`void`\>

##### Overrides

```ts
QueryClient$1.prefetchQuery
```

***

### refetchQueries()

```ts
refetchQueries<TQueryFnData, TError, TTaggedQueryKey, TInferredQueryFnData, TInferredError>(filters?, options?): Promise<void>;
```

#### Type Parameters

##### TQueryFnData

`TQueryFnData` = `unknown`

##### TError

`TError` = `Error`

##### TTaggedQueryKey

`TTaggedQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

##### TInferredQueryFnData

`TInferredQueryFnData` = `InferDataFromTag`\<`TQueryFnData`, `TTaggedQueryKey`\>

##### TInferredError

`TInferredError` = `InferErrorFromTag`\<`TError`, `TTaggedQueryKey`\>

#### Parameters

##### filters?

`RefetchQueryFilters`\<`TTaggedQueryKey`\>

##### options?

`MaybeRefDeep`\<`RefetchOptions`\>

#### Returns

`Promise`\<`void`\>

#### Overrides

```ts
QueryClient$1.refetchQueries
```

***

### removeQueries()

```ts
removeQueries<TQueryFnData, TError, TTaggedQueryKey, TInferredQueryFnData, TInferredError>(filters?): void;
```

#### Type Parameters

##### TQueryFnData

`TQueryFnData` = `unknown`

##### TError

`TError` = `Error`

##### TTaggedQueryKey

`TTaggedQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

##### TInferredQueryFnData

`TInferredQueryFnData` = `InferDataFromTag`\<`TQueryFnData`, `TTaggedQueryKey`\>

##### TInferredError

`TInferredError` = `InferErrorFromTag`\<`TError`, `TTaggedQueryKey`\>

#### Parameters

##### filters?

`QueryFilters`\<`TTaggedQueryKey`\>

#### Returns

`void`

#### Overrides

```ts
QueryClient$1.removeQueries
```

***

### resetQueries()

```ts
resetQueries<TQueryFnData, TError, TTaggedQueryKey, TInferredQueryFnData, TInferredError>(filters?, options?): Promise<void>;
```

#### Type Parameters

##### TQueryFnData

`TQueryFnData` = `unknown`

##### TError

`TError` = `Error`

##### TTaggedQueryKey

`TTaggedQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

##### TInferredQueryFnData

`TInferredQueryFnData` = `InferDataFromTag`\<`TQueryFnData`, `TTaggedQueryKey`\>

##### TInferredError

`TInferredError` = `InferErrorFromTag`\<`TError`, `TTaggedQueryKey`\>

#### Parameters

##### filters?

`QueryFilters`\<`TTaggedQueryKey`\>

##### options?

`MaybeRefDeep`\<`ResetOptions`\>

#### Returns

`Promise`\<`void`\>

#### Overrides

```ts
QueryClient$1.resetQueries
```

***

### resumePausedMutations()

```ts
resumePausedMutations(): Promise<unknown>;
```

#### Returns

`Promise`\<`unknown`\>

#### Inherited from

```ts
QueryClient$1.resumePausedMutations
```

***

### setDefaultOptions()

```ts
setDefaultOptions(options): void;
```

#### Parameters

##### options

`MaybeRefDeep`\<`DefaultOptions`\<`Error`\>\>

#### Returns

`void`

#### Overrides

```ts
QueryClient$1.setDefaultOptions
```

***

### setMutationDefaults()

```ts
setMutationDefaults<TData, TError, TVariables, TContext>(mutationKey, options): void;
```

#### Type Parameters

##### TData

`TData` = `unknown`

##### TError

`TError` = `Error`

##### TVariables

`TVariables` = `void`

##### TContext

`TContext` = `unknown`

#### Parameters

##### mutationKey

`MaybeRefDeep`\<readonly `unknown`[]\>

##### options

`MaybeRefDeep`\<`MutationObserverOptions`\<`TData`, `TError`, `TVariables`, `TContext`\>\>

#### Returns

`void`

#### Overrides

```ts
QueryClient$1.setMutationDefaults
```

***

### setQueriesData()

```ts
setQueriesData<TData>(
   filters, 
   updater, 
   options?): [readonly unknown[], TData | undefined][];
```

#### Type Parameters

##### TData

`TData`

#### Parameters

##### filters

`MaybeRefDeep`\<`QueryFilters`\<readonly `unknown`[]\>\>

##### updater

`Updater`\<`TData` \| `undefined`, `TData` \| `undefined`\>

##### options?

`MaybeRefDeep`\<`SetDataOptions`\>

#### Returns

\[readonly `unknown`[], `TData` \| `undefined`\][]

#### Overrides

```ts
QueryClient$1.setQueriesData
```

***

### setQueryData()

#### Call Signature

```ts
setQueryData<TQueryFnData, TTaggedQueryKey, TInferredQueryFnData>(
   queryKey, 
   updater, 
   options?): NoInfer<TInferredQueryFnData> | undefined;
```

##### Type Parameters

###### TQueryFnData

`TQueryFnData` = `unknown`

###### TTaggedQueryKey

`TTaggedQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

###### TInferredQueryFnData

`TInferredQueryFnData` = `InferDataFromTag`\<`TQueryFnData`, `TTaggedQueryKey`\>

##### Parameters

###### queryKey

`TTaggedQueryKey`

###### updater

`Updater`\<`NoInfer`\<`TInferredQueryFnData`\> \| `undefined`, `NoInfer`\<`TInferredQueryFnData`\> \| `undefined`\>

###### options?

`MaybeRefDeep`\<`SetDataOptions`\>

##### Returns

`NoInfer`\<`TInferredQueryFnData`\> \| `undefined`

##### Overrides

```ts
QueryClient$1.setQueryData
```

#### Call Signature

```ts
setQueryData<TQueryFnData, TData>(
   queryKey, 
   updater, 
   options?): NoInfer<TData> | undefined;
```

##### Type Parameters

###### TQueryFnData

`TQueryFnData`

###### TData

`TData` = `NoUnknown`\<`TQueryFnData`\>

##### Parameters

###### queryKey

`MaybeRefDeep`\<readonly `unknown`[]\>

###### updater

`Updater`\<`NoInfer`\<`TData`\> \| `undefined`, `NoInfer`\<`TData`\> \| `undefined`\>

###### options?

`MaybeRefDeep`\<`SetDataOptions`\>

##### Returns

`NoInfer`\<`TData`\> \| `undefined`

##### Overrides

```ts
QueryClient$1.setQueryData
```

***

### setQueryDefaults()

```ts
setQueryDefaults<TQueryFnData, TError, TData, TQueryData>(queryKey, options): void;
```

#### Type Parameters

##### TQueryFnData

`TQueryFnData` = `unknown`

##### TError

`TError` = `Error`

##### TData

`TData` = `TQueryFnData`

##### TQueryData

`TQueryData` = `TQueryFnData`

#### Parameters

##### queryKey

`MaybeRefDeep`\<readonly `unknown`[]\>

##### options

`MaybeRefDeep`\<`Omit`\<`UseQueryOptions`\<`TQueryFnData`, `TError`, `TData`, `TQueryData`, readonly `unknown`[]\>, `"queryKey"`\>\>

#### Returns

`void`

#### Overrides

```ts
QueryClient$1.setQueryDefaults
```

***

### unmount()

```ts
unmount(): void;
```

#### Returns

`void`

#### Inherited from

```ts
QueryClient$1.unmount
```
