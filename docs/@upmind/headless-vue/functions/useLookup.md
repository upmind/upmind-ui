[Upmind](../../packages.md) / [@upmind/headless-vue](../index.md) / useLookup

# useLookup()

```ts
function useLookup(lookup): object
```

## Parameters

• **lookup**: `Function`

## Returns

`object`

### add()

```ts
add: () => any;
```

#### Returns

`any`

### context

```ts
context: ComputedRef<any>;
```

### description

```ts
description: ComputedRef<any>;
```

### edit()

```ts
edit: (id) => any;
```

#### Parameters

• **id**: `any`

#### Returns

`any`

### errors

```ts
errors: ComputedRef<any>;
```

### filter

```ts
filter: DebouncedFunc<(data) => any>;
```

### filters

```ts
filters: ComputedRef<any>;
```

### items

```ts
items: ComputedRef<Pick<any, "id" | "description" | "title">[]>;
```

### meta

```ts
meta: ComputedRef<object>;
```

#### Type declaration

##### hasErrors

```ts
hasErrors: boolean;
```

##### isEditing

```ts
isEditing: boolean;
```

##### isFiltered

```ts
isFiltered: boolean;
```

##### isLoading

```ts
isLoading: boolean;
```

##### isProcessing

```ts
isProcessing: boolean;
```

### refresh()

```ts
refresh: () => any;
```

#### Returns

`any`

### select()

```ts
select: (id) => Promise<void>;
```

#### Parameters

• **id**: `any`

#### Returns

`Promise`\<`void`\>

### selected

```ts
selected: ComputedRef<any>;
```

### selectedActor

```ts
selectedActor: ComputedRef<null | object>;
```

### state

```ts
state: ComputedRef<any>;
```

### title

```ts
title: ComputedRef<any>;
```

### value

```ts
value: ComputedRef<any>;
```
