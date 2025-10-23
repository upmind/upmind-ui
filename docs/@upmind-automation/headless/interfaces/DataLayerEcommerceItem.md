[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / DataLayerEcommerceItem

# DataLayerEcommerceItem

Interface representing a single e-commerce item within the data layer.

## Description

This should always represent the unit/base price of the item and not the total price.
The `price` should always be nett, with a custom `gross_price` field added for the gross price.

## Properties

### discount?

```ts
optional discount: number;
```

The discount applied to this specific item.

***

### duration?

```ts
optional duration: number;
```

The billing cycle duration in months for subscription products.

***

### gross\_price?

```ts
optional gross_price: number;
```

The gross unit price of the item (including taxes).

***

### index

```ts
index: number;
```

The zero-based index of the item within a list.

***

### item\_brand?

```ts
optional item_brand: string;
```

The brand associated with the item.

***

### item\_category?

```ts
optional item_category: string;
```

The primary category of the item.

***

### item\_category2?

```ts
optional item_category2: string;
```

The second level category of the item.

***

### item\_category3?

```ts
optional item_category3: string;
```

The third level category of the item.

***

### item\_category4?

```ts
optional item_category4: string;
```

The fourth level category of the item.

***

### item\_category5?

```ts
optional item_category5: string;
```

The fifth level category of the item.

***

### item\_id

```ts
item_id: string;
```

The unique identifier of the item (e.g. product ID, SKU).

***

### item\_name

```ts
item_name: string;
```

The name of the item.

***

### price

```ts
price: number;
```

The net unit price of the item (price should always be nett).

***

### quantity

```ts
quantity: number;
```

The quantity of the item.
