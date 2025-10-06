[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useRecaptcha

# useRecaptcha()

```ts
function useRecaptcha(): object;
```

## Returns

### clear()

```ts
clear: () => void;
```

Clears the recaptcha state.

#### Returns

`void`

### context

```ts
context: ComputedRef<undefined | RecaptchaContext>;
```

Computed property to the recaptcha's state machine context, containing fetched data.

### created

```ts
created: ComputedRef<undefined | string>;
```

The creation date of the current recaptcha token.

### errors

```ts
errors: ComputedRef<undefined | ResponseError>;
```

Any errors from the recaptcha state machine.

### generate()

```ts
generate: (action?) => Promise<undefined | string>;
```

Generates a recaptcha token for the given action.

#### Parameters

##### action?

`string`

Optional action for recaptcha.

#### Returns

`Promise`\<`undefined` \| `string`\>

Resolves with the recaptcha token.

### init()

```ts
init: (siteKey) => Promise<void>;
```

Initializes the recaptcha service with the provided site key.

#### Parameters

##### siteKey

`string`

The recaptcha site key.

#### Returns

`Promise`\<`void`\>

Resolves when the service is started and site key is set.

### isReady()

```ts
isReady: () => Promise<boolean>;
```

Checks if the recaptcha service is ready.

#### Returns

`Promise`\<`boolean`\>

Resolves true if the service is available, throws otherwise.

### meta

```ts
meta: ComputedRef<{
  hasErrors: boolean;
  hasToken: boolean;
  isAvailable: boolean;
  isInitialised: boolean;
  isLoading: boolean;
  isProcessing: boolean;
}>;
```

Meta information about the recaptcha state.

### stop()

```ts
stop: () => boolean;
```

Stops the recaptcha service.

#### Returns

`boolean`

### token

```ts
token: ComputedRef<undefined | string>;
```

The current recaptcha token.
