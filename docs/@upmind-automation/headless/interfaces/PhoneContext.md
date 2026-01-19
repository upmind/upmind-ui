[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / PhoneContext

# PhoneContext

Interface representing the context for phone number management within a client item context.
It extends `DataManagerContext` with specific data relevant to phone operations,
such as geographical country context for phone number formatting and validation.

## Template

The type of the phone model, typically [PhoneModel](PhoneModel.md).

## Extends

- `DataManagerContext`\<[`PhoneModel`](PhoneModel.md)\>

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

### country?

```ts
optional country: ICountry;
```

The currently selected ICountry object in the context, used for
phone number formatting and validation rules.

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
optional model: PhoneModel;
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
