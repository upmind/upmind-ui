[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / IBasketProductModel

# IBasketProductModel

Interface representing the data model for a product when it's being added
to or configured within the shopping basket. It includes core product details
and optional configurations for attributes, options, provisioning, and promotions.

## Properties

### attributes?

```ts
optional attributes: IBasketSubproductModel[];
```

An optional array of [IBasketSubproductModel](IBasketSubproductModel.md) for product attributes.

***

### billing\_cycle\_months

```ts
billing_cycle_months: number;
```

The billing cycle duration in months for the main product.

***

### options?

```ts
optional options: IBasketSubproductModel[];
```

An optional array of [IBasketSubproductModel](IBasketSubproductModel.md) for product options.

***

### product\_id

```ts
product_id: string;
```

The unique identifier of the main product.

***

### promotions?

```ts
optional promotions: object[];
```

An optional array of promotion codes to apply to this product in the basket.

#### promocode

```ts
promocode: string;
```

***

### provision\_field\_values?

```ts
optional provision_field_values: Record<string, any>;
```

Optional key-value pairs for provisioning field values required for the product.

***

### quantity

```ts
quantity: number;
```

The quantity of the main product.
