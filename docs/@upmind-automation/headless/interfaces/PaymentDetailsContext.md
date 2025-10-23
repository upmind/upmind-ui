[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / PaymentDetailsContext

# PaymentDetailsContext

Interface representing the context for payment details management, typically managed by an XState machine.
It extends [PaymentDetailsArgs](PaymentDetailsArgs.md) with a comprehensive set of properties for handling
available gateways, payment types, stored methods, wallet balance, form schemas, and error states.

## Extends

- [`PaymentDetailsArgs`](PaymentDetailsArgs.md)

## Properties

### address

```ts
address: IAddress;
```

The IAddress object representing the billing address associated with the payment.

#### Inherited from

[`PaymentDetailsArgs`](PaymentDetailsArgs.md).[`address`](PaymentDetailsArgs.md#address)

***

### amount

```ts
amount: number;
```

The total amount of the payment.

#### Inherited from

[`PaymentDetailsArgs`](PaymentDetailsArgs.md).[`amount`](PaymentDetailsArgs.md#amount)

***

### authHelper?

```ts
optional authHelper: ActorRef<any, any>;
```

***

### autoupdate?

```ts
optional autoupdate: boolean;
```

***

### balance?

```ts
optional balance: IWalletBalance;
```

The client's wallet balance details.

***

### baseModel?

```ts
optional baseModel: PaymentDetailModel;
```

***

### clientId

```ts
clientId: string;
```

The unique identifier of the client managing their payment details.

#### Inherited from

[`PaymentDetailsArgs`](PaymentDetailsArgs.md).[`clientId`](PaymentDetailsArgs.md#clientid)

***

### currency

```ts
currency: ICurrency;
```

The ICurrency object representing the currency of the payment.

#### Inherited from

[`PaymentDetailsArgs`](PaymentDetailsArgs.md).[`currency`](PaymentDetailsArgs.md#currency)

***

### error?

```ts
optional error: ResponseError;
```

An error object if any issue occurred during payment details operations.

***

### fields?

```ts
optional fields: any;
```

Optional additional fields relevant to payment processing.

***

### gateway?

```ts
optional gateway: IGateway;
```

The currently selected IGateway object.

***

### gatewayHelper?

```ts
optional gatewayHelper: ActorRef<any, any>;
```

***

### gateways?

```ts
optional gateways: IBrandGateway[];
```

An array of IBrandGateway objects available for the current brand and client.

***

### model?

```ts
optional model: PaymentDetailModel;
```

The current [PaymentDetailModel](../type-aliases/PaymentDetailModel.md) representing the user's selection in the payment details form.

***

### orderId

```ts
orderId: string;
```

The unique identifier of the order for which payment details are being managed.

#### Inherited from

[`PaymentDetailsArgs`](PaymentDetailsArgs.md).[`orderId`](PaymentDetailsArgs.md#orderid)

***

### paymentDetail?

```ts
optional paymentDetail: PaymentDetailData;
```

The raw response data from the actual payment gateway after a transaction attempt.

***

### paymentTypes?

```ts
optional paymentTypes: PaymentType;
```

The allowed PaymentType for the current context.

***

### schema?

```ts
optional schema: JsonSchema;
```

The JSON Schema (`JsonSchema`) defining the structure and validation rules for the payment details form.

***

### storedPaymentMethods?

```ts
optional storedPaymentMethods: PaymentDetail[];
```

An array of stored payment method models available to the client.

***

### uischema?

```ts
optional uischema: UISchemaElement;
```

The UI Schema (`UISchemaElement`) used to configure the presentation and layout of the payment details form.
