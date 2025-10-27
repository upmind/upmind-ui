[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / PaymentContext

# PaymentContext

Interface representing the context for a payment operation, typically managed by an XState machine.
It extends [PaymentArgs](PaymentArgs.md) with additional details for handling payment cancellations,
approvals, and tracking the payment attempt itself.

## Extends

- [`PaymentArgs`](PaymentArgs.md)

## Properties

### approval?

```ts
optional approval: object;
```

Optional details for handling payment approval, e.g. for 3D Secure redirects.

#### fields

```ts
fields: Record<string, string>;
```

Key-value pairs of form fields required for approval.

#### method

```ts
method: Methods;
```

The HTTP method to use for the approval request.

#### url

```ts
url: string;
```

The URL to which the approval request should be sent.

***

### cancel?

```ts
optional cancel: object;
```

Optional details for handling payment cancellation, e.g. for 3D Secure redirects.

#### fields

```ts
fields: Record<string, string>;
```

Key-value pairs of form fields required for cancellation.

#### method

```ts
method: Methods;
```

The HTTP method to use for the cancellation request.

#### url

```ts
url: string;
```

The URL to which the cancellation request should be sent.

***

### error?

```ts
optional error: ResponseError;
```

An error object if any issue occurred during the payment process.

***

### orderId

```ts
orderId: string;
```

The unique identifier of the order for which the payment is being made.

#### Inherited from

[`PaymentArgs`](PaymentArgs.md).[`orderId`](PaymentArgs.md#orderid)

***

### payment?

```ts
optional payment: IPaymentAttempt;
```

The IPaymentAttempt object representing the current status and details of the payment attempt.

***

### paymentDetail

```ts
paymentDetail: PaymentDetailData;
```

#### Inherited from

[`PaymentArgs`](PaymentArgs.md).[`paymentDetail`](PaymentArgs.md#paymentdetail)
