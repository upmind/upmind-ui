[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / IProductConfig

# IProductConfig

Interface representing raw product configuration properties, typically passed
from a backend API or extracted from URL parameters.

## Properties

### bcm?

```ts
optional bcm: number;
```

Billing cycle in months.

***

### coupons?

```ts
optional coupons: string[];
```

Coupon codes.

***

### pfields?

```ts
optional pfields: Record<string, any>;
```

Provision field key-value pairs.

***

### pid?

```ts
optional pid: string;
```

Product ID.

***

### qty?

```ts
optional qty: number;
```

Quantity.

***

### sub\_pids?

```ts
optional sub_pids: string[];
```

Sub-product IDs.
