[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / GatewayContext

# GatewayContext

Interface representing the context for a payment gateway, typically managed by an XState machine.
It holds the state for payment forms, gateway integration elements, order details,
and configuration specific to the payment flow.

## Properties

### amount?

```ts
optional amount: number;
```

The numerical amount of the payment.

***

### can\_store?

```ts
optional can_store: boolean;
```

`true` if the selected payment method can be stored for future use.

***

### card?

```ts
optional card: any;
```

Card-specific gateway object or instance.

***

### code?

```ts
optional code: string;
```

A code associated with the payment operation (e.g. a transfer code).

***

### ctx?

```ts
optional ctx: GatewayCtx;
```

The [GatewayCtx](../enumerations/GatewayCtx.md) defining whether the gateway is used for paying or adding a detail.

***

### currency?

```ts
optional currency: ICurrency;
```

The ICurrency object relevant to the payment amount.

***

### element?

```ts
optional element: any;
```

A specific payment UI element (e.g. a card input field).

***

### elements?

```ts
optional elements: any;
```

Gateway-specific UI elements manager (e.g. Stripe Elements).

***

### error?

```ts
optional error: ResponseError;
```

An error object if any issue occurred during payment gateway operations.

***

### gateway?

```ts
optional gateway: IGateway;
```

The IGateway object representing the selected payment gateway.

***

### model?

```ts
optional model: any;
```

The data model of the payment form, holding user input.

***

### must\_auto\_pay?

```ts
optional must_auto_pay: boolean;
```

`true` if auto-payment should be enabled for stored payment details.

***

### must\_store?

```ts
optional must_store: boolean;
```

`true` if the selected payment method *must* be stored for future use (e.g. for Direct Debit mandates).

***

### operation\_id?

```ts
optional operation_id: string;
```

A unique identifier for the payment operation.

***

### orderId?

```ts
optional orderId: string;
```

The unique identifier of the order associated with this payment.

***

### paymentDetails?

```ts
optional paymentDetails: any;
```

The payment details the object, which will contain the response from the payment gateway
(e.g. Stripe) as well as any model data.

***

### renderer?

```ts
optional renderer: Function;
```

An optional function to render gateway-specific UI components based on status.

***

### renderless?

```ts
optional renderless: boolean;
```

`true` if the gateway integration should operate in a renderless mode (no UI from gateway itself).

***

### schema?

```ts
optional schema: JsonSchema;
```

The JSON Schema (`JsonSchema`) defining the structure and validation rules for the payment form.

***

### stored\_payment\_methods?

```ts
optional stored_payment_methods: any[];
```

An array of stored payment methods available to the user.

***

### type?

```ts
optional type: GatewayTypes;
```

The specific [GatewayTypes](../enumerations/GatewayTypes.md) of the payment method being used.

***

### uischema?

```ts
optional uischema: UISchemaElement;
```

The UI Schema (`UISchemaElement`) used to configure the presentation and layout of the payment form.
