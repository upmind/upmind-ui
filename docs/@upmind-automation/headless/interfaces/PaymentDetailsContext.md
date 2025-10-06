[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / PaymentDetailsContext

# PaymentDetailsContext

## Extends

- [`PaymentDetailsArgs`](PaymentDetailsArgs.md)

## Properties

### actors

```ts
actors: object;
```

#### gateway?

```ts
optional gateway: ActorRef<any, any>;
```

***

### address

```ts
address: IAddress;
```

#### Inherited from

[`PaymentDetailsArgs`](PaymentDetailsArgs.md).[`address`](PaymentDetailsArgs.md#address)

***

### amount

```ts
amount: number;
```

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

***

### clientId

```ts
clientId: string;
```

#### Inherited from

[`PaymentDetailsArgs`](PaymentDetailsArgs.md).[`clientId`](PaymentDetailsArgs.md#clientid)

***

### currency

```ts
currency: ICurrency;
```

#### Inherited from

[`PaymentDetailsArgs`](PaymentDetailsArgs.md).[`currency`](PaymentDetailsArgs.md#currency)

***

### dirty?

```ts
optional dirty: boolean;
```

***

### error?

```ts
optional error: ResponseError;
```

***

### fields?

```ts
optional fields: any;
```

***

### gateway?

```ts
optional gateway: IGateway;
```

***

### gateways?

```ts
optional gateways: Gateway[];
```

***

### model?

```ts
optional model: PaymentDetailModel;
```

***

### mount?

```ts
optional mount: HTMLElement;
```

***

### orderId

```ts
orderId: string;
```

#### Inherited from

[`PaymentDetailsArgs`](PaymentDetailsArgs.md).[`orderId`](PaymentDetailsArgs.md#orderid)

***

### payment\_types?

```ts
optional payment_types: PaymentType;
```

***

### paymentDetails?

```ts
optional paymentDetails: any;
```

***

### schema?

```ts
optional schema: JsonSchema;
```

***

### stored\_payment\_methods?

```ts
optional stored_payment_methods: PaymentDetailModel[];
```

***

### uischema?

```ts
optional uischema: UISchemaElement;
```
