[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / ValidationErrorObject

# ValidationErrorObject\<K, P, S\>

Re-exports the `ErrorObject` type from `ajv` as `ValidationErrorObject` for clarity in form validation contexts.

## See

[Ajv Validation Error Object](https://ajv.js.org/api.html#validation-errors)

## Type Parameters

### K

`K` *extends* `string` = `string`

### P

`P` = `Record`\<`string`, `any`\>

### S

`S` = `unknown`

## Properties

### data?

```ts
optional data: unknown;
```

***

### instancePath

```ts
instancePath: string;
```

***

### keyword

```ts
keyword: K;
```

***

### message?

```ts
optional message: string;
```

***

### params

```ts
params: P;
```

***

### parentSchema?

```ts
optional parentSchema: AnySchemaObject;
```

***

### propertyName?

```ts
optional propertyName: string;
```

***

### schema?

```ts
optional schema: S;
```

***

### schemaPath

```ts
schemaPath: string;
```
