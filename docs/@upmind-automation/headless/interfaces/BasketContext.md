[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / BasketContext

# BasketContext

## Properties

### actors

```ts
actors: object;
```

#### billingDetails?

```ts
optional billingDetails: ActorRef<any>;
```

#### currency?

```ts
optional currency: ActorRef<any>;
```

#### customFields?

```ts
optional customFields: ActorRef<any>;
```

#### paymentDetails?

```ts
optional paymentDetails: ActorRef<any>;
```

#### promotions?

```ts
optional promotions: ActorRef<any>;
```

---

### basket?

```ts
optional basket: Basket;
```

---

### controller?

```ts
optional controller: AbortController;
```

---

### error?

```ts
optional error: object;
```

#### provisioningErrors?

```ts
optional provisioningErrors: Record<string, any>;
```

---

### invoice?

```ts
optional invoice: any;
```

---

### items?

```ts
optional items: ActorRef<any>[];
```

---

### payment?

```ts
optional payment: ActorRef<any>;
```

---

### paymentDetails?

```ts
optional paymentDetails: ActorRef<any>;
```

---

### products

```ts
products: BasketProduct[];
```

---

### summary?

```ts
optional summary: any;
```
