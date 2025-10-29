[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useInvoice

# useInvoice()

```ts
function useInvoice(invoiceId): object;
```

Composable function to manage the state and data for a single invoice.
Provides methods to load, access, and invalidate invoice data.

## Parameters

### invoiceId

`string`

The ID of the invoice to manage.

## Returns

The [UseInvoice](../type-aliases/UseInvoice.md) object containing reactive state, computed properties, and methods
 for interacting with the invoice data.

### data

```ts
data: object = query.data;
```

The reactive data property containing the invoice details.
This is populated by the query and updates automatically when the query state changes.

#### data.\[ComputedRefSymbol\]

```ts
[ComputedRefSymbol]: true;
```

#### data.\[RefSymbol\]

```ts
[RefSymbol]: true;
```

Type differentiator only.
We need this to be in public d.ts but don't want it to show up in IDE
autocomplete, so we use a private Symbol instead.

#### data.effect

```ts
effect: ComputedRefImpl;
```

##### Deprecated

computed no longer uses effect

#### data.value

```ts
value: IBasket & object;
```

##### Type Declaration

###### affiliateCommissions

```ts
affiliateCommissions: IAffiliatePendingCommission[] | undefined;
```

###### allowProductCredit

```ts
allowProductCredit: boolean;
```

###### cancellationDatetime

```ts
cancellationDatetime: string | null | undefined;
```

###### currentData

```ts
currentData: IInvoiceContent;
```

###### data

```ts
data: IInvoiceContent[];
```

###### delegateRelated

```ts
delegateRelated: boolean;
```

###### isConsolidation

```ts
isConsolidation: boolean;
```

###### locked

```ts
locked: string | null;
```

###### netAmountConverted

```ts
netAmountConverted: number;
```

###### objectMeta

```ts
objectMeta: IMetaData | undefined;
```

###### partialAmountCredited

```ts
partialAmountCredited: number;
```

###### partialAmountCreditedConverted

```ts
partialAmountCreditedConverted: number;
```

###### partialAmountCreditedFormatted

```ts
partialAmountCreditedFormatted: string;
```

###### partialAmountToCreditConverted

```ts
partialAmountToCreditConverted: number;
```

###### partialAmountToCreditFormatted

```ts
partialAmountToCreditFormatted: string;
```

###### paymentCurrency

```ts
paymentCurrency: ICurrency | undefined;
```

###### paymentCurrencyId

```ts
paymentCurrencyId: string;
```

###### payments

```ts
payments: IPayment[];
```

###### products

```ts
products: IInvoiceProduct[];
```

###### productUpgradeQuantity

```ts
productUpgradeQuantity: number | undefined;
```

###### proforma

```ts
proforma: boolean;
```

###### proformaCreateDatetime

```ts
proformaCreateDatetime: string;
```

###### proformaNumber

```ts
proformaNumber: string;
```

###### taxAmountConverted

```ts
taxAmountConverted: number;
```

###### toBeCredited

```ts
toBeCredited: boolean;
```

### error

```ts
error: Ref<Error, Error> | Ref<null, null> = query.error;
```

The current error state of the query.
This will be populated if the query fails to fetch data.

### invalidate()

```ts
invalidate: <T>(data?) => Promise<T | undefined>;
```

#### Type Parameters

##### T

`T` = `any`

#### Parameters

##### data?

`T`

#### Returns

`Promise`\<`T` \| `undefined`\>

### isReady()

```ts
isReady: () => Promise<boolean>;
```

Resolves when the client items are ready to be used.
Returns true if ready, false if an error occurred.

#### Returns

`Promise`\<`boolean`\>

A promise resolving to true if ready, false if error.

### meta

```ts
meta: ComputedRef<{
  hasError: boolean;
  isAvailable: boolean;
  isComplete: boolean;
  isEmpty: boolean;
  isLoading: boolean;
  isPaid: boolean;
}>;
```

Meta-information about the invoice state.
Contains loading status, error state, and data availability.
