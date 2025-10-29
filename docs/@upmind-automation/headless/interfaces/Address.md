[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / Address

# Address

Interface representing a comprehensive address object, extending [AddressModel](AddressModel.md)
with additional identifiers, contextual information, and meta-data about the address.
This is typically used for addresses retrieved from the API or displayed in the UI.

## Extends

- [`AddressModel`](AddressModel.md)

## Properties

### address

```ts
address: object;
```

An object containing the primary components of a physical address.

#### address1

```ts
address1: string | null;
```

The first line of the address (e.g. street name and number).

#### address2?

```ts
optional address2: string | null;
```

The second line of the address (e.g. flat, suite, or unit number). Optional.

#### city

```ts
city: string | null;
```

The city of the address.

#### countryId

```ts
countryId: string;
```

The ID of the country for the address.

#### postcode

```ts
postcode: string | null;
```

The postal code or Postcode of the address.

#### regionId?

```ts
optional regionId: string | null;
```

The ID of the region for the address. Optional, depending on country.

#### state?

```ts
optional state: string | null;
```

The state or province name for the address. Optional, depending on country.

#### Inherited from

[`AddressModel`](AddressModel.md).[`address`](AddressModel.md#address)

***

### clientId

```ts
clientId: string;
```

The unique identifier of the client to whom this address belongs.

***

### description

```ts
description: string;
```

A detailed description of the address, potentially including full address lines.

***

### id

```ts
id: string;
```

The unique identifier for the address.

#### Overrides

[`AddressModel`](AddressModel.md).[`id`](AddressModel.md#id)

***

### meta

```ts
meta: object;
```

Meta-information about the address's status and capabilities.

#### canDelete

```ts
canDelete: boolean;
```

Indicates whether the user can delete the address.

#### isDefault

```ts
isDefault: boolean;
```

Indicates whether this is the client's default address.

#### isVerified

```ts
isVerified: boolean;
```

Indicates whether the address has been verified.

***

### name?

```ts
optional name: string | null;
```

Optional name or label for the address (e.g. "My Home Address").

#### Inherited from

[`AddressModel`](AddressModel.md).[`name`](AddressModel.md#name)

***

### title

```ts
title: string;
```

A display title for the address (e.g. "Home Address").

***

### type

```ts
type: number | null;
```

The type of address, corresponding to keys in [AddressTypes](../variables/AddressTypes.md) (e.g., 1 for "Home").
