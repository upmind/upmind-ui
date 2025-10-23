[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / CompanyModel

# CompanyModel

Interface representing the data model for a company, suitable for forms
or API payloads. It encapsulates core company details and their associated
address, email, and phone references.

## Properties

### address?

```ts
optional address: object;
```

Optional full address model. Mutually exclusive with `addressId`.

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

### addressId?

```ts
optional addressId: string;
```

Optional unique identifier of the associated address. Mutually exclusive with the ` address ` object.

***

### default?

```ts
optional default: boolean;
```

`true` if this is the default company for the client.

***

### email?

```ts
optional email: string | null;
```

Optional email address string. Mutually exclusive with `emailId`.

***

### emailId?

```ts
optional emailId: string | null;
```

Optional unique identifier of the associated email. Mutually exclusive with the ` email ` string.

***

### id?

```ts
optional id: string;
```

Optional unique identifier for the company. Present if editing an existing company.

***

### name?

```ts
optional name: string;
```

The name of the company.

***

### phone?

```ts
optional phone: object;
```

Optional phone model. Mutually exclusive with `phoneId`.

#### country

```ts
country: string | null;
```

The two-letter ISO country code, or `null`.

#### countryCallingCode

```ts
countryCallingCode: string | null;
```

The country calling code, or `null`.

#### nationalNumber

```ts
nationalNumber: string | null;
```

The national number part of the phone number, or `null`.

#### number

```ts
number: string | null;
```

The full international phone number string, or `null`.

***

### phoneId?

```ts
optional phoneId: string;
```

Optional unique identifier of the associated phone. Mutually exclusive with `phone` object.

***

### regNumber?

```ts
optional regNumber: string | null;
```

The registration number of the company.

***

### tax?

```ts
optional tax: object;
```

Optional tax details for the company, e.g. VAT number.

#### number?

```ts
optional number: string | null;
```

The VAT (Value Added Tax) number of the company.
