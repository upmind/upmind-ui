[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / GatewayParams

# GatewayParams

```ts
type GatewayParams = object;
```

## Properties

### address?

```ts
optional address: IAddress;
```

***

### amount

```ts
amount: PaymentDetailData["amount"];
```

The numerical amount of the payment.

***

### clientId

```ts
clientId: IClient["id"];
```

***

### ctx

```ts
ctx: GatewayCtx;
```

The GatewayCtx defining whether the gateway is used for paying or adding a detail.

***

### currency

```ts
currency: ICurrency;
```

The ICurrency object relevant to the payment amount.

***

### gateway

```ts
gateway: IGateway;
```

The IGateway object representing the selected payment gateway.

***

### orderId

```ts
orderId: IOrder["id"];
```

The unique identifier of the order associated with this payment.

***

### renderless?

```ts
optional renderless: boolean;
```

`true` if the gateway integration should operate in a renderless mode (no UI from gateway itself).
