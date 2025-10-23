[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / AddressContext

# AddressContext

Interface representing the context for address management within a client item context.
It extends `ClientItemContext` with specific data relevant to address operations,
such as geographical lookups.

## Template

The type of the address model, typically [AddressModel](AddressModel.md).

## Extends

- `ClientItemContext`\<[`AddressModel`](AddressModel.md)\>

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

### countries

```ts
countries: ICountry[];
```

An array of all available countries in the system for selection in address forms.

***

### country?

```ts
optional country: ICountry;
```

The currently selected country object in the context.

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
optional model: AddressModel;
```

#### Inherited from

```ts
ClientItemContext.model
```

***

### regions?

```ts
optional regions: IRegion[];
```

An array of regions available for the selected country.
Used for address form fields.

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
