[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / BillingContext

# BillingContext

Interface representing the context for billing management, typically managed by an XState machine.
It holds the state for billing forms, including the data model, schema definitions,
and configuration settings derived from brand keys.

## Properties

### autoupdate?

```ts
optional autoupdate: boolean;
```

`true` if the billing context should automatically update based on changes.

***

### baseModel?

```ts
optional baseModel: BillingModel;
```

The base [BillingModel](BillingModel.md) representing the initial or last saved state of the billing information.

***

### basketId?

```ts
optional basketId: string;
```

The unique identifier of the current shopping basket.

***

### clientId?

```ts
optional clientId: string;
```

The unique identifier of the client for whom billing information is being managed.

***

### config?

```ts
optional config: object;
```

Configuration settings for billing, derived from BrandConfigKeys, indicating
which fields are required.

#### requiresAddress

```ts
requiresAddress: REQUIRE_ADDRESS_FOR_ORDERS;
```

The brand configuration key indicating whether an address is required for orders.

#### requiresCompany

```ts
requiresCompany: REQUIRE_COMPANY_FOR_ORDERS;
```

The brand configuration key indicating whether company information is required for orders.

#### requiresPhone

```ts
requiresPhone: CHECKOUT_REQUIRE_PHONE;
```

The brand configuration key indicating whether a phone number is required during checkout.

***

### error?

```ts
optional error: ResponseError;
```

An error object if any issue occurred during billing operations.

***

### model?

```ts
optional model: BillingModel;
```

The current [BillingModel](BillingModel.md) being managed or displayed in the billing form.

***

### schema?

```ts
optional schema: JsonSchema;
```

The JSON Schema (`JsonSchema`) used to define the structure and validation rules for the billing form.

***

### uischema?

```ts
optional uischema: UISchemaElement;
```

The UI Schema (`UISchemaElement`) used to configure the presentation and layout of the billing form.
