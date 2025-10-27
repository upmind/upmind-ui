[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / PaymentDetailsArgs

# PaymentDetailsArgs

Interface representing the arguments required to initialise payment details context.
These details provide the necessary context for payment forms and gateway interactions.

## Extended by

- [`PaymentDetailsContext`](PaymentDetailsContext.md)

## Properties

### address

```ts
address: IAddress;
```

The IAddress object representing the billing address associated with the payment.

***

### amount

```ts
amount: number;
```

The total amount of the payment.

***

### clientId

```ts
clientId: string;
```

The unique identifier of the client managing their payment details.

***

### currency

```ts
currency: ICurrency;
```

The ICurrency object representing the currency of the payment.

***

### orderId

```ts
orderId: string;
```

The unique identifier of the order for which payment details are being managed.
