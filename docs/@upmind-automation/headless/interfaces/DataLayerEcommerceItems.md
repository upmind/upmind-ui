[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / DataLayerEcommerceItems

# DataLayerEcommerceItems

Interface representing a collection of e-commerce items, often used for add_to_cart, remove_from_cart,
or view_item_list events, which require currency and total value information.

## Properties

### currency

```ts
currency: string;
```

The ISO 4217 currency code for the items (e.g. "GBP", "USD").

***

### gross\_value?

```ts
optional gross_value: number;
```

The total gross value of the items (including taxes).

***

### items

```ts
items: DataLayerEcommerceItem[];
```

An array of [DataLayerEcommerceItem](DataLayerEcommerceItem.md) objects.

***

### value

```ts
value: number;
```

The total net value of the items (always net value).
