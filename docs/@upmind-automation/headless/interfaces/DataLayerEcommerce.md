[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / DataLayerEcommerce

# DataLayerEcommerce

Interface representing e-commerce purchase or transaction data to be pushed to the data layer.
This typically follows the Google Analytics Enhanced E-commerce schema for purchase events.

## Properties

### coupon?

```ts
optional coupon: string;
```

The coupon code applied to the entire purchase, if any.

***

### currency

```ts
currency: string;
```

The ISO 4217 currency code of the transaction (e.g. "GBP", "USD").

***

### gross\_value?

```ts
optional gross_value: number;
```

The total gross value of the transaction (including taxes).

***

### items

```ts
items: DataLayerEcommerceItem[];
```

An array of [DataLayerEcommerceItem](DataLayerEcommerceItem.md) objects included in the purchase.

***

### purchase\_type?

```ts
optional purchase_type: string;
```

The type of purchase (e.g. "new_customer", "repeat_customer", "subscription").

***

### tax?

```ts
optional tax: number;
```

The total tax amount for the transaction.

***

### transaction\_id?

```ts
optional transaction_id: string;
```

The unique transaction identifier (e.g. order ID).

***

### value

```ts
value: number;
```

The total net value of the transaction (always net value).
