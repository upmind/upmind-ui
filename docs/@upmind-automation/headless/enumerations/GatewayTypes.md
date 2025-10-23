[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / GatewayTypes

# GatewayTypes

Enumeration defining the types of payment gateways and payment methods available in the Upmind system.
This local enum extends and specifies additional types beyond the base `GatewayTypesEnum` from `@upmind-automation/types`.
These numeric values categorise different payment processing methods.

## Enumeration Members

### BANK\_TRANSFER

```ts
BANK_TRANSFER: 2;
```

Bank-to-bank transfer payments. Corresponds to `GatewayTypesEnum.BANK_TRANSFER`.

***

### CARD

```ts
CARD: 1;
```

Credit and debit card payment processing. Corresponds to `GatewayTypesEnum.CARD`.

***

### DIRECT\_DEBIT

```ts
DIRECT_DEBIT: 3;
```

Direct debit payments that automatically withdraw funds from customer bank accounts. Corresponds to `GatewayTypesEnum.DIRECT_DEBIT`.

***

### FREE

```ts
FREE: -1;
```

Free payment type for zero-cost transactions or promotional offerings.
This bypasses actual payment processing.

***

### MOBILE

```ts
MOBILE: 6;
```

Mobile payment methods, including digital wallets and carrier billing. Corresponds to `GatewayTypesEnum.MOBILE`.

***

### OFFLINE

```ts
OFFLINE: 5;
```

Offline payment methods that do not require real-time online processing. Corresponds to `GatewayTypesEnum.OFFLINE`.

***

### SEPA

```ts
SEPA: 4;
```

Single Euro Payments Area (SEPA) payment methods. Corresponds to `GatewayTypesEnum.SEPA`.

***

### STORED

```ts
STORED: 0;
```

Represents payment via a previously stored payment method.
This is used when a customer selects a saved credit card, direct debit mandate, etc.

***

### WALLET

```ts
WALLET: 7;
```

Digital wallet and stored value account payments. Corresponds to `GatewayTypesEnum.WALLET`.
