[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / Phone

# Phone

Interface representing a comprehensive phone object, extending [PhoneModel](PhoneModel.md)
with additional identifiers, computed display fields, and meta-data about its status.
This is typically used for phone numbers retrieved from the API or displayed in the UI.

## Properties

### description?

```ts
optional description: string;
```

An optional detailed description of the phone number.

***

### id

```ts
id: string;
```

The unique identifier for the phone number.

***

### meta

```ts
meta: object;
```

Meta-information about the phone number's status and capabilities.

#### canDelete

```ts
canDelete: boolean;
```

`true` if the user can delete the phone number.

#### isDefault

```ts
isDefault: boolean;
```

`true` if this is the client's default phone number.

#### isVerified

```ts
isVerified: boolean;
```

`true` if the phone number has been verified.

***

### phone

```ts
phone: object;
```

The [PhoneModel](PhoneModel.md) object containing the parsed phone number details.

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

### title?

```ts
optional title: string;
```

An optional display title for the phone number.

***

### type

```ts
type: number | null;
```

The type of phone number (e.g. 1 for "Mobile", 2 for "Home").
