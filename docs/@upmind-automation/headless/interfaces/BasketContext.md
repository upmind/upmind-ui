[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / BasketContext

# BasketContext

## Properties

### actors?

```ts
optional actors: object;
```

#### billing

```ts
billing: ActorRef<any>;
```

#### currency

```ts
currency: ActorRef<any>;
```

#### customFields

```ts
customFields: ActorRef<any>;
```

#### paymentDetails

```ts
paymentDetails: ActorRef<any>;
```

#### promotions

```ts
promotions: ActorRef<any>;
```

***

### authHelper?

```ts
optional authHelper: ActorRef<any, any>;
```

***

### basket?

```ts
optional basket: IBasket;
```

***

### controller?

```ts
optional controller: AbortController;
```

***

### error?

```ts
optional error: ResponseError;
```

***

### invoice?

```ts
optional invoice: IInvoice;
```

***

### payment?

```ts
optional payment: ActorRef<any, any>;
```

***

### paymentDetails?

```ts
optional paymentDetails: any;
```

***

### products

```ts
products: BasketProduct[];
```

***

### summary?

```ts
optional summary: object;
```

#### discount

```ts
discount: null | string;
```

#### products

```ts
products: BasketProduct[];
```

#### subtotal

```ts
subtotal: string;
```

#### taxes

```ts
taxes: object[];
```

#### total

```ts
total: string;
```
