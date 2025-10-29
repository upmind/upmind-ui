[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / IBasketSubproductModel

# IBasketSubproductModel

Interface representing the data model for a subproduct within a basket product.
This defines how subproducts (like add-ons or options) are structured when
being added or configured in the basket.

## Properties

### billing\_cycle\_months

```ts
billing_cycle_months: number;
```

The billing cycle duration in months for the subproduct.

***

### product\_id

```ts
product_id: string;
```

The unique identifier of the subproduct.

***

### unit\_quantity

```ts
unit_quantity: number;
```

The quantity of the subproduct.
