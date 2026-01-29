[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / AddressContext

# AddressContext

Interface representing the context for address management within a client item context.
It extends `DataManagerContext` with specific data relevant to address operations,
such as geographical lookups.

## Template

The type of the address model, typically [AddressModel](AddressModel.md).

## Extends

- `DataManagerContext`\<[`AddressModel`](AddressModel.md)\>

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
optional model: AddressModel;
```

#### Inherited from

```ts
DataManagerContext.model
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
