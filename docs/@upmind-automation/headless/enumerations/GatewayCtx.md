[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / GatewayCtx

# GatewayCtx

Enumeration defining the context in which payment gateways are being used.
This context determines which gateways are available, how they're configured,
and what operations can be performed (e.g. making a payment vs. just adding a payment detail).

## Enumeration Members

### ADD

```ts
ADD: "add";
```

Addition context: Gateways are presented with the intention of adding and storing
a payment detail for future use, without necessarily making an immediate payment.

***

### PAY

```ts
PAY: "pay";
```

Payment context: Gateways are presented with the intention of making an immediate payment
for items like invoices or wallet top-ups.
