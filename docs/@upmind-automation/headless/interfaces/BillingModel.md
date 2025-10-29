[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / BillingModel

# BillingModel

Interface representing the data model for billing information, typically used in checkout forms.
This model holds the identifiers for the selected address, company, and phone.

## Properties

### addressId?

```ts
optional addressId: string | null;
```

The unique identifier of the selected address for billing, or `null` if no address is selected.

***

### companyId?

```ts
optional companyId: string | null;
```

The unique identifier of the selected company for billing, or `null` if no company is selected.

***

### phoneId?

```ts
optional phoneId: string | null;
```

The unique identifier of the selected phone number for billing, or `null` if no phone is selected.
