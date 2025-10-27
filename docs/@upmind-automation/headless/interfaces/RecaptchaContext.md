[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / RecaptchaContext

# RecaptchaContext

Interface representing the context for Google reCAPTCHA integration,
typically managed by an XState machine. It holds the reCAPTCHA site key,
the `grecaptcha` object, the generated token, and any associated errors.

## Properties

### created?

```ts
optional created: Date;
```

The `Date` object representing when the reCAPTCHA token was created.

***

### error?

```ts
optional error: ResponseError;
```

An error object if any issue occurred during reCAPTCHA processing.

***

### grecaptcha?

```ts
optional grecaptcha: any;
```

The global `grecaptcha` object loaded from Google's reCAPTCHA API script.

***

### siteKey

```ts
siteKey: string;
```

The public site key provided by Google for reCAPTCHA.

***

### token?

```ts
optional token: string;
```

The generated reCAPTCHA token, obtained after a successful challenge.
