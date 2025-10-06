[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useInvoice

# useInvoice()

```ts
function useInvoice(invoiceId): object;
```

Composable to manage a single invoice.
It provides methods to load and manage the state of an invoice.

## Parameters

### invoiceId

`string`

The ID of the invoice to load.

## Returns

### data

```ts
data: undefined | Ref<Invoice, Invoice> = query.data;
```

The reactive data property containing the invoice details.
This is populated by the query and updates automatically when the query state changes.

### error

```ts
error: undefined | Ref<null, null> | Ref<Error, Error> = query.error;
```

The current error state of the query.
This will be populated if the query fails to fetch data.

### invalidate()

```ts
invalidate: <T>(data?) => Promise<undefined | T>;
```

#### Type Parameters

##### T

`T` = `any`

#### Parameters

##### data?

`T`

#### Returns

`Promise`\<`undefined` \| `T`\>

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
  isComplete: undefined | boolean;
  isEmpty: boolean;
  isLoading: boolean;
  isPaid: boolean;
}>;
```

Meta-information about the invoice state.
Contains loading status, error state, and data availability.
