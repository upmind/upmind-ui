[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / EmailModel

# EmailModel

Interface representing the data model for an email address, suitable for forms
or API payloads.

## Extended by

- [`Email`](Email.md)

## Properties

### email

```ts
email: string | null;
```

The email address string, or `null` if not set.

***

### id?

```ts
optional id: string;
```

Optional unique identifier for the email address. Present if editing an existing email.
