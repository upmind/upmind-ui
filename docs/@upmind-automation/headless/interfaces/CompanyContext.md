[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / CompanyContext

# CompanyContext

Interface representing the context for company management within a client item context.
It extends `DataManagerContext` with specific data relevant to company operations,
such as associated addresses, emails, phones, and geographical lookups.

## Template

The type of the company model, typically [CompanyModel](CompanyModel.md).

## Extends

- `DataManagerContext`\<[`CompanyModel`](CompanyModel.md)\>

## Properties

### addresses

```ts
addresses: Address[];
```

An array of all [Address](Address.md) records associated with the client.

***

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

An array of all available ICountry objects in the system.

***

### country?

```ts
optional country: ICountry;
```

The currently selected ICountry object in the context.

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

### emails

```ts
emails: Email[];
```

An array of all [Email](Email.md) records associated with the client.

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

### minimal?

```ts
optional minimal: boolean;
```

`true` if the context is in a minimal mode, potentially showing fewer fields or details.

***

### model?

```ts
optional model: CompanyModel;
```

#### Inherited from

```ts
DataManagerContext.model
```

***

### phones

```ts
phones: Phone[];
```

An array of all [Phone](Phone.md) records associated with the client.

***

### regions?

```ts
optional regions: IRegion[];
```

An array of IRegion objects available for the selected country.

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
