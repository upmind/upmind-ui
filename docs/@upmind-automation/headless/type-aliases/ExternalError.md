[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / ExternalError

# ExternalError

```ts
type ExternalError = object;
```

Type alias for external error structures, typically from validation or API responses.

## Properties

### attributes?

```ts
optional attributes: ValidationErrorObject[];
```

Array of Ajv [ErrorObject](../interfaces/ValidationErrorObject.md) for attribute-related errors.

***

### options?

```ts
optional options: ValidationErrorObject[];
```

Array of Ajv [ErrorObject](../interfaces/ValidationErrorObject.md) for option-related errors.

***

### provisionFields?

```ts
optional provisionFields: ValidationErrorObject[];
```

Array of Ajv [ErrorObject](../interfaces/ValidationErrorObject.md) for provision field errors.

***

### term?

```ts
optional term: ValidationErrorObject[];
```

Array of Ajv [ErrorObject](../interfaces/ValidationErrorObject.md) for term-related errors.
