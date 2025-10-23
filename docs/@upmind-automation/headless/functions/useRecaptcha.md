[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useRecaptcha

# useRecaptcha()

```ts
function useRecaptcha(): object;
```

Composable function to provide functionality for managing reCAPTCHA services.
It includes methods for initialising, generating tokens, checking readiness, and handling reCAPTCHA state.

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
context: ComputedRef<RecaptchaContext | undefined>;
```

Computed property to the recaptcha's state machine context, containing fetched data.

### created

```ts
created: ComputedRef<string | undefined>;
```

The creation date of the current recaptcha token.

### errors

```ts
errors: ComputedRef<ResponseError | undefined>;
```

Any errors from the recaptcha state machine.

### generate()

```ts
generate: (action?) => Promise<string | undefined>;
```

Generates a recaptcha token for the given action.

#### Parameters

##### action?

`string`

Optional action for recaptcha.

#### Returns

`Promise`\<`string` \| `undefined`\>

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
token: ComputedRef<string | undefined>;
```

The current recaptcha token.
