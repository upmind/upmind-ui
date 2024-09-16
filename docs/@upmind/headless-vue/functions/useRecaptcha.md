[Upmind](../../packages.md) / [@upmind/headless-vue](../index.md) / useRecaptcha

# useRecaptcha()

```ts
function useRecaptcha(): object
```

## Returns

`object`

### clear()

```ts
clear: () => void;
```

#### Returns

`void`

### created

```ts
created: ComputedRef<null | Date>;
```

### destroy()

```ts
destroy: () => this;
```

Stops the interpreter and unsubscribe all listeners.

This will also notify the `onStop` listeners.

#### Returns

`this`

### errors

```ts
errors: ComputedRef<undefined>;
```

### generate()

```ts
generate: (action?) => Promise<any>;
```

#### Parameters

• **action?**: `String`

#### Returns

`Promise`\<`any`\>

### meta

```ts
meta: ComputedRef<object>;
```

#### Type declaration

##### hasErrors

```ts
hasErrors: boolean;
```

##### hasToken

```ts
hasToken: boolean;
```

##### isAvailable

```ts
isAvailable: boolean;
```

##### isLoading

```ts
isLoading: boolean;
```

##### isProcessing

```ts
isProcessing: boolean;
```

### state

```ts
state: ComputedRef<StateValue>;
```

### token

```ts
token: ComputedRef<undefined>;
```
