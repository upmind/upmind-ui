[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / AddressModel

# AddressModel

Interface representing the data model for an address, suitable for forms
or API payloads. It encapsulates the core geographical details of an address.

## Extended by

- [`Address`](Address.md)

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

***

### id?

```ts
optional id: string;
```

Optional unique identifier for the address. Present if editing an existing address.

***

### name?

```ts
optional name: string | null;
```

Optional name or label for the address (e.g. "My Home Address").
