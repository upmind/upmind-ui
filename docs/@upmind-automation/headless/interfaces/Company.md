[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / Company

# Company

Interface representing a comprehensive company object, typically retrieved from the API.
It extends [CompanyModel](CompanyModel.md) with additional identifiers, computed display fields,
detailed tax information, and meta-data about the company's status.

## Properties

### addressId

```ts
addressId: string;
```

The unique identifier of the associated address.

***

### default

```ts
default: boolean;
```

`true` if this is the default company for the client.

***

### description

```ts
description: string;
```

A detailed description of the company, often including its address and other contact info.

***

### emailId

```ts
emailId: string | null;
```

The unique identifier of the associated email address.

***

### id

```ts
id: string;
```

The unique identifier for the company.

***

### meta

```ts
meta: object;
```

Meta-information about the company's status and abilities.

#### canDelete

```ts
canDelete: boolean;
```

`true` if the company record can be deleted.

#### hasTax

```ts
hasTax: boolean;
```

`true` if the company has associated tax details.

#### hasTaxValidation

```ts
hasTaxValidation: boolean;
```

`true` if the company's tax details have undergone validation.

#### hasValidTax

```ts
hasValidTax: boolean;
```

`true` if the company's tax details are valid.

#### isDefault

```ts
isDefault: boolean;
```

`true` if this is the client's default company.

#### isVerified

```ts
isVerified: boolean;
```

`true` if the company's details have been verified.

***

### name

```ts
name: string;
```

The name of the company.

***

### phoneId

```ts
phoneId: string;
```

The unique identifier of the associated phone number.

***

### regNumber

```ts
regNumber: string | null;
```

The registration number of the company.

***

### tax

```ts
tax: object;
```

Detailed tax information for the company, e.g. VAT details.

#### checked

```ts
checked: object;
```

Details about when the VAT number was last checked.

##### checked.date

```ts
date: string | null;
```

The date and time when VAT validation was last checked.

##### checked.relative

```ts
relative: string;
```

A human-readable relative time string for when it was last checked.

#### number

```ts
number: string | null;
```

The VAT number of the company.

#### percent

```ts
percent: string | null;
```

The VAT percentage applied.

#### reason

```ts
reason: string | null;
```

The reason why VAT validation failed, if applicable.

#### valid

```ts
valid: 0 | 1 | null;
```

`true` if the VAT number has been successfully validated.

#### with

```ts
with: string | null;
```

The service or method used for VAT validation.

***

### title

```ts
title: string;
```

A display title for the company, computed from its name.
Defaults to "New Company" if the name is not available.
