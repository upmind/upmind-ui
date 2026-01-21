[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / EmailContext

# EmailContext

Interface representing the context for email management within a client item context.
It extends `DataManagerContext` with specific data relevant to email operations.

## Template

The type of the email model, typically [EmailModel](EmailModel.md).

## Extends

- `DataManagerContext`\<[`EmailModel`](EmailModel.md)\>

## Properties

### allowMultipleEdits?

```ts
optional allowMultipleEdits: boolean;
```

#### Inherited from

```ts
DataManagerContext.allowMultipleEdits
```

***

### autoupdate?

```ts
optional autoupdate: boolean;
```

#### Inherited from

```ts
DataManagerContext.autoupdate
```

***

### baseModel?

```ts
optional baseModel: any;
```

#### Inherited from

```ts
DataManagerContext.baseModel
```

***

### clientId?

```ts
optional clientId: string;
```

#### Inherited from

```ts
DataManagerContext.clientId
```

***

### config?

```ts
optional config: Record<BrandConfigKeys, boolean>;
```

#### Inherited from

```ts
DataManagerContext.config
```

***

### description?

```ts
optional description: string;
```

#### Inherited from

```ts
DataManagerContext.description
```

***

### error?

```ts
optional error: ResponseError;
```

#### Inherited from

```ts
DataManagerContext.error
```

***

### id?

```ts
optional id: string;
```

#### Inherited from

```ts
DataManagerContext.id
```

***

### model?

```ts
optional model: EmailModel;
```

#### Inherited from

```ts
DataManagerContext.model
```

***

### schema?

```ts
optional schema: JsonSchema;
```

#### Inherited from

```ts
DataManagerContext.schema
```

***

### title?

```ts
optional title: string;
```

#### Inherited from

```ts
DataManagerContext.title
```

***

### uischema?

```ts
optional uischema: UISchemaElement;
```

#### Inherited from

```ts
DataManagerContext.uischema
```
