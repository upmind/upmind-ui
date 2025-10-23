[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / BasketContext

# BasketContext

Interface representing the context for the main shopping basket, typically managed by an XState machine.
It holds the entire state of the basket, including its products, summary, errors, and references
to spawned child actors for managing related concerns like billing, currency, and promotions.

## Properties

### actors?

```ts
optional actors: object;
```

A record of `ActorRef`s to various child actors (XState machines) spawned by the basket.
These actors manage specific aspects of the basket's functionality.

#### billing?

```ts
optional billing: ActorRef<any, any>;
```

`ActorRef` for the billing-related state machine.

#### currency

```ts
currency: ActorRef<any>;
```

`ActorRef` for the currency management state machine.

#### customFields

```ts
customFields: ActorRef<any>;
```

`ActorRef` for the custom fields state machine.

#### paymentDetail?

```ts
optional paymentDetail: ActorRef<any, any>;
```

#### promotions

```ts
promotions: ActorRef<any>;
```

`ActorRef` for the promotions state machine.

***

### authHelper?

```ts
optional authHelper: ActorRef<any, any>;
```

An `ActorRef` to an authentication helper service for managing session-related concerns.

***

### basket?

```ts
optional basket: IBasket;
```

The raw `IBasket` object representing the current state of the shopping basket.

***

### controller?

```ts
optional controller: AbortController;
```

An `AbortController` instance, used to cancel ongoing fetch requests related to the basket.

***

### error?

```ts
optional error: ResponseError;
```

An error object if any issue occurred during basket operations.

***

### invoice?

```ts
optional invoice: IInvoice;
```

The `IInvoice` object associated with the basket, if the basket has progressed to an invoice stage.

***

### payment?

```ts
optional payment: ActorRef<any, any>;
```

An `ActorRef` to the payment state machine, managing the overall payment process.

***

### paymentDetail?

```ts
optional paymentDetail: PaymentDetailData;
```

***

### products

```ts
products: BasketProduct[];
```

An array of [BasketProduct](BasketProduct.md) objects, representing all products currently in the basket.

***

### summary?

```ts
optional summary: object;
```

A summary object providing formatted details of the basket's financial breakdown.

#### discount

```ts
discount: string | null;
```

The total discount amount applied to the basket, formatted as a string (e.g. "£10.00").

#### products

```ts
products: BasketProduct[];
```

The array of [BasketProduct](BasketProduct.md) objects, usually a filtered or augmented version
of the main `products` array for summary display.

#### subtotal

```ts
subtotal: string;
```

The subtotal amount of the basket (before taxes and after discounts), formatted as a string.

#### taxes

```ts
taxes: object[];
```

An array of tax details, each with a title (e.g. "VAT") and an amount, formatted as a string.

#### total

```ts
total: string;
```

The total amount due for the basket, formatted as a string.
