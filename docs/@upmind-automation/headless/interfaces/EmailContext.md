[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / EmailContext

# EmailContext

Interface representing the context for email management within a client item context.
It extends `ClientItemContext` with specific data relevant to email operations.

## Template

The type of the email model, typically [EmailModel](EmailModel.md).

## Extends

- `ClientItemContext`\<[`EmailModel`](EmailModel.md)\>

## Properties

### allowMultipleEdits?

```ts
optional allowMultipleEdits: boolean;
```

#### Inherited from

```ts
ClientItemContext.allowMultipleEdits
```

***

### autoupdate?

```ts
optional autoupdate: boolean;
```

#### Inherited from

```ts
ClientItemContext.autoupdate
```

***

### baseModel?

```ts
optional baseModel: any;
```

#### Inherited from

```ts
ClientItemContext.baseModel
```

***

### clientId?

```ts
optional clientId: string;
```

#### Inherited from

```ts
ClientItemContext.clientId
```

***

### config?

```ts
optional config: Record<BrandConfigKeys, boolean>;
```

#### Inherited from

```ts
ClientItemContext.config
```

***

### description?

```ts
optional description: string;
```

#### Inherited from

```ts
ClientItemContext.description
```

***

### error?

```ts
optional error: ResponseError;
```

#### Inherited from

```ts
ClientItemContext.error
```

***

### id?

```ts
optional id: string;
```

#### Inherited from

```ts
ClientItemContext.id
```

***

### model?

```ts
optional model: EmailModel;
```

#### Inherited from

```ts
ClientItemContext.model
```

***

### schema?

```ts
optional schema: JsonSchema;
```

#### Inherited from

```ts
ClientItemContext.schema
```

***

### title?

```ts
optional title: string;
```

#### Inherited from

```ts
ClientItemContext.title
```

***

### uischema?

```ts
optional uischema: UISchemaElement;
```

#### Inherited from

```ts
ClientItemContext.uischema
```
