[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / CompanyContext

# CompanyContext

Interface representing the context for company management within a client item context.
It extends `ClientItemContext` with specific data relevant to company operations,
such as associated addresses, emails, phones, and geographical lookups.

## Template

The type of the company model, typically [CompanyModel](CompanyModel.md).

## Extends

- `ClientItemContext`\<[`CompanyModel`](CompanyModel.md)\>

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
ClientItemContext.description
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
ClientItemContext.model
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
