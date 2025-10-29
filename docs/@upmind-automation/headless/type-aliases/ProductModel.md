[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / ProductModel

# ProductModel

```ts
type ProductModel = object;
```

Represents the product model used for configuration, which is built and verified by a schema.
This is the core data structure for configuring a product's attributes, options, and provision fields.

## Extended by

- [`ProductProps`](../interfaces/ProductProps.md)

## Properties

### attributes?

```ts
optional attributes: SubproductModel;
```

Optional subproduct model for attributes.

***

### id?

```ts
optional id: string;
```

The unique identifier of the product instance (if existing).

***

### options?

```ts
optional options: SubproductModel;
```

Optional subproduct model for options.

***

### productId

```ts
productId: string;
```

The unique identifier of the base product.

***

### provisionFields?

```ts
optional provisionFields: Record<string, any>;
```

Key-value pairs for provision field values.

***

### quantity

```ts
quantity: number;
```

The quantity of the product.

***

### term?

```ts
optional term: number;
```

The selected billing term in months.
