[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / DomainModel

# DomainModel

```ts
type DomainModel = object;
```

Represents the core data model for a domain name, including its parts and type.
This is used internally to manage the state of domains being processed.

## Properties

### domain

```ts
domain: string;
```

The full domain name (e.g. "example.com").

***

### selected?

```ts
optional selected: boolean;
```

`true` if the user currently selects this domain.

***

### sld

```ts
sld: string;
```

The Second-Level Domain (SLD) part of the domain (e.g. "example").

***

### tld

```ts
tld: string;
```

The Top-Level Domain (TLD) part of the domain (e.g. ".com").

***

### type?

```ts
optional type: DomainTypes;
```

The [DomainTypes](../enumerations/DomainTypes.md) defining the current management flow for this domain.
