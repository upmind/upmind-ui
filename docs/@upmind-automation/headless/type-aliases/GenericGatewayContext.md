[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / GenericGatewayContext

# GenericGatewayContext

```ts
type GenericGatewayContext = object;
```

## Properties

### canStore?

```ts
optional canStore: boolean;
```

`true` if the selected payment method can be stored for future use.

***

### container?

```ts
optional container: HTMLElement;
```

***

### error?

```ts
optional error: ResponseError;
```

An error object if any issue occurred during payment gateway operations.

***

### model?

```ts
optional model: GatewayData;
```

The data model of the payment form, holding user input.

***

### mustAutoPay?

```ts
optional mustAutoPay: boolean;
```

`true` if auto-payment should be enabled for stored payment details.

***

### mustStore?

```ts
optional mustStore: boolean;
```

`true` if the selected payment method *must* be stored for future use (e.g. for Direct Debit mandates).

***

### paymentDetail?

```ts
optional paymentDetail: PaymentDetailData;
```

will contain the response from Card, as wel las any model data

***

### schema?

```ts
optional schema: JsonSchema;
```

The JSON Schema (`JsonSchema`) defining the structure and validation rules for the payment form.

***

### sdk?

```ts
optional sdk: unknown;
```

***

### supported

```ts
supported: boolean;
```

***

### uischema?

```ts
optional uischema: UISchemaElement;
```

The UI Schema (`UISchemaElement`) used to configure the presentation and layout of the payment form.

***

### validationHelper()?

```ts
optional validationHelper: (callback) => void;
```

#### Parameters

##### callback

`any`

#### Returns

`void`

***

### validationObserver?

```ts
optional validationObserver: ActorRef<any>;
```
