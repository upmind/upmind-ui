[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / Email

# Email

Interface representing a comprehensive email object, extending [EmailModel](EmailModel.md)
with additional identifiers, computed display fields, and meta-data about its status.
This is typically used for email addresses retrieved from the API or displayed in the UI.

## Extends

- [`EmailModel`](EmailModel.md)

## Properties

### description

```ts
description: string;
```

A detailed description of the email address.

***

### email

```ts
email: string | null;
```

The email address string, or `null` if not set.

#### Inherited from

[`EmailModel`](EmailModel.md).[`email`](EmailModel.md#email)

***

### id

```ts
id: string;
```

The unique identifier for the email address.

#### Overrides

[`EmailModel`](EmailModel.md).[`id`](EmailModel.md#id)

***

### meta

```ts
meta: object;
```

Meta-information about the email address's status and capabilities.

#### canDelete

```ts
canDelete: boolean;
```

`true` if the user can delete the email address.

#### isDefault

```ts
isDefault: boolean;
```

`true` if this is the client's default email address.

#### isVerified

```ts
isVerified: boolean;
```

`true` if the email address has been verified.

***

### title

```ts
title: string;
```

A display title for the email address (e.g. "Account Email").

***

### type

```ts
type: number;
```

The type of email address, corresponding to keys in [EmailTypes](../variables/EmailTypes.md) (e.g. 1 for "Account").
