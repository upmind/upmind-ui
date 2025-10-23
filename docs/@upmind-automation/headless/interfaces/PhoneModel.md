[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / PhoneModel

# PhoneModel

Interface representing the data model for a phone number, suitable for forms
or API payloads.

## Properties

### id?

```ts
optional id: string;
```

Optional unique identifier for the phone number. Present if editing an existing phone number.

***

### phone

```ts
phone: object;
```

An object containing the various components of the phone number.

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
