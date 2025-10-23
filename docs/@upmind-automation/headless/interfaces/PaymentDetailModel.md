[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / PaymentDetailModel

# PaymentDetailModel

Interface representing the data model for selecting a payment detail.
This model captures the chosen payment type and gateway.

## Properties

### gateway\_id?

```ts
optional gateway_id: string;
```

The unique identifier of the selected payment gateway.

***

### type?

```ts
optional type: PaymentType;
```

The type of payment selected (e.g. `PaymentType.CARD`, `PaymentType.PAY_LATER`).
