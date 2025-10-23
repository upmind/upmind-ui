[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useBasket

# useBasket()

```ts
function useBasket(): object;
```

Provides a comprehensive interface for managing the shopping basket state using XState.
It offers reactive access to basket data, meta-information about its status,
and methods for manipulating the basket (e.g. adding/removing items, applying promotions,
refreshing, and proceeding to checkout).

## Returns

### actors

```ts
actors: object;
```

Child machine actors for basket submodules (customFields, paymentDetail, etc).

#### actors.billing

```ts
billing: ComputedRef<Actor | undefined>;
```

#### actors.currency

```ts
currency: ComputedRef<Actor | undefined>;
```

#### actors.customFields

```ts
customFields: ComputedRef<Actor | undefined>;
```

#### actors.paymentDetail

```ts
paymentDetail: ComputedRef<Actor | undefined>;
```

#### actors.promotions

```ts
promotions: ComputedRef<Actor | undefined>;
```

### addPromotion()

```ts
addPromotion: (coupon) => Promise<void>;
```

Adds a promotion code to the basket.

#### Parameters

##### coupon

`string`

The promotion code to add.

#### Returns

`Promise`\<`void`\>

Resolves when added, rejects on error.

### basket

```ts
basket: ComputedRef<IBasket | undefined>;
```

The current basket object.

### basketId

```ts
basketId: ComputedRef<string | undefined>;
```

The current basket ID.

### checkout()

```ts
checkout: () => State<BasketContext, AnyEventObject, any, {
  context: BasketContext;
  value: any;
}, ResolveTypegenMeta<TypegenDisabled, AnyEventObject, BaseActionObject, ServiceMap>>;
```

Initiates the checkout process.

#### Returns

`State`\<[`BasketContext`](../interfaces/BasketContext.md), `AnyEventObject`, `any`, \{
  `context`: [`BasketContext`](../interfaces/BasketContext.md);
  `value`: `any`;
\}, `ResolveTypegenMeta`\<`TypegenDisabled`, `AnyEventObject`, `BaseActionObject`, `ServiceMap`\>\>

### clear()

```ts
clear: () => State<BasketContext, AnyEventObject, any, {
  context: BasketContext;
  value: any;
}, ResolveTypegenMeta<TypegenDisabled, AnyEventObject, BaseActionObject, ServiceMap>>;
```

Clears the basket.

#### Returns

`State`\<[`BasketContext`](../interfaces/BasketContext.md), `AnyEventObject`, `any`, \{
  `context`: [`BasketContext`](../interfaces/BasketContext.md);
  `value`: `any`;
\}, `ResolveTypegenMeta`\<`TypegenDisabled`, `AnyEventObject`, `BaseActionObject`, `ServiceMap`\>\>

### context

```ts
context: ComputedRef<BasketContext | undefined>;
```

The full basket context object.

### count

```ts
count: ComputedRef<number>;
```

The total number of items in the basket (sum of all product quantities).

### currency

```ts
currency: ComputedRef<ICurrency | undefined>;
```

The current basket currency.

### errors

```ts
errors: ComputedRef<ResponseError | undefined>;
```

Any error returned by the basket state machine.

### findProduct()

```ts
findProduct: (mapping) => BasketProduct | undefined;
```

Finds a product in the basket matching the given mapping.

#### Parameters

##### mapping

`Record`\<`string`, `any`\>

The mapping to match.

#### Returns

[`BasketProduct`](../interfaces/BasketProduct.md) \| `undefined`

The found product, or undefined.

### getInvalidProducts()

```ts
getInvalidProducts: () => BasketProduct[];
```

Gets all invalid products in the basket (with errors).

#### Returns

[`BasketProduct`](../interfaces/BasketProduct.md)[]

The invalid basket products.

### getProduct()

```ts
getProduct: (bpid) => Promise<ActorRef<any, any>>;
```

Gets a product actor by basket product ID.

#### Parameters

##### bpid

`string`

The basket product ID.

#### Returns

`Promise`\<`ActorRef`\<`any`, `any`\>\>

The product actor.

### getProducts()

```ts
getProducts: () => BasketProduct[];
```

Gets all products in the basket.

#### Returns

[`BasketProduct`](../interfaces/BasketProduct.md)[]

The basket products.

### invoice

```ts
invoice: ComputedRef<IInvoice | undefined>;
```

The invoice associated with the basket, if any.

### isReady()

```ts
isReady: () => Promise<boolean>;
```

Waits for the basket to be ready (shopping or error state).

#### Returns

`Promise`\<`boolean`\>

Resolves when ready, rejects on error.

### meta

```ts
meta: ComputedRef<{
  hasAccount: boolean;
  hasBilling: boolean;
  hasCurrency: boolean;
  hasError: boolean;
  hasFailed: boolean;
  hasFields: boolean;
  hasInvalidProducts: boolean;
  hasPaid: boolean;
  hasPaymentDetails: boolean;
  hasProducts: boolean;
  hasPromotions: boolean;
  hasTaxes: boolean;
  hasTaxIncluded: boolean;
  isAvailable: boolean;
  isCheckout: boolean;
  isComplete: boolean;
  isConverting: boolean;
  isDirty: boolean;
  isLoading: boolean;
  isPaying: boolean;
  isProcessing: boolean;
  isProcessingDetails: boolean;
  isReadyForBilling: boolean;
  isReadyForCheckout: boolean;
  isReadyForPaymentDetails: boolean;
  needsApproval: boolean;
  needsAuth: boolean;
}>;
```

Meta-information about the basket state.

### productExists()

```ts
productExists: (mapping) => boolean;
```

Checks if a product exists in the basket matching the given mapping.

#### Parameters

##### mapping

`Record`\<`string`, `any`\>

The mapping to match.

#### Returns

`boolean`

True if the product exists, false otherwise.

### products

```ts
products: ComputedRef<BasketProduct[] | undefined>;
```

The list of products in the basket.

### productsInvalid

```ts
productsInvalid: ComputedRef<BasketProduct[]>;
```

The list of invalid products in the basket (with errors).

### promotionCodes

```ts
promotionCodes: ComputedRef<string[]>;
```

The list of promotion codes applied to the basket.

### promotions

```ts
promotions: ComputedRef<IBasketPromotion[] | undefined>;
```

The list of promotions applied to the basket.

### refresh()

```ts
refresh: (data?) => Promise<IBasket | undefined>;
```

Refreshes the basket state from the server.

#### Parameters

##### data?

`IBasket`

Optional basket data to refresh with.

#### Returns

`Promise`\<`IBasket` \| `undefined`\>

The refreshed basket.

### setCurrency()

```ts
setCurrency: (currency) => Promise<any>;
```

Sets the basket currency.

#### Parameters

##### currency

`string`

The currency code to set.

#### Returns

`Promise`\<`any`\>

Resolves when set, rejects on error.

### state

```ts
state: Ref<State<BasketContext, AnyEventObject, any, {
  context: BasketContext;
  value: any;
}, ResolveTypegenMeta<TypegenDisabled, AnyEventObject, BaseActionObject, ServiceMap>>, State<BasketContext, AnyEventObject, any, {
  context: BasketContext;
  value: any;
}, ResolveTypegenMeta<TypegenDisabled, AnyEventObject, BaseActionObject, ServiceMap>>>;
```

### subscribe()

```ts
subscribe: {
  (observer): Subscription;
  (nextListener?, errorListener?, completeListener?): Subscription;
};
```

Subscribes to basket state changes.

#### Call Signature

```ts
(observer): Subscription;
```

##### Parameters

###### observer

`Partial`\<`Observer`\<`State`\<`TContext`, `TEvent`, `any`, `TTypestate`, `TResolvedTypesMeta`\>\>\>

##### Returns

`Subscription`

#### Call Signature

```ts
(
   nextListener?, 
   errorListener?, 
   completeListener?): Subscription;
```

##### Parameters

###### nextListener?

(`state`) => `void`

###### errorListener?

(`error`) => `void`

###### completeListener?

() => `void`

##### Returns

`Subscription`

#### See

https://xstate.js.org/docs/guides/communication.html#service-subscribe

### summary

```ts
summary: ComputedRef<
  | {
  discount: string | null;
  products: BasketProduct[];
  subtotal: string;
  taxes: object[];
  total: string;
}
| undefined>;
```

The basket summary (totals, etc).

### taxes

```ts
taxes: ComputedRef<IAppliedTax[] | undefined>;
```

The taxes applied to the basket.
