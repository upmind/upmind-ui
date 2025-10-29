[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / MessageError

# MessageError

Interface representing a structured error object, typically used for displaying
error messages from API responses or internal validation.

## Properties

### data?

```ts
optional data: Record<string, any>;
```

Optional additional data related to the error, e.g. validation specifics.

***

### message?

```ts
optional message: string;
```

The error message string.

***

### type?

```ts
optional type: number;
```

An optional numeric type code for the error.
