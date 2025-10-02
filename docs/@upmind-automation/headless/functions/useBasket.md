[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useBasket

# useBasket()

```ts
function useBasket(): object;
```

## Returns

### actors

```ts
actors: object;
```

Child machine actors for basket submodules (customFields, paymentDetails, etc).

#### actors.billing

```ts
billing: ComputedRef<undefined | Actor>;
```

#### actors.currency

```ts
currency: ComputedRef<undefined | Actor>;
```

#### actors.customFields

```ts
customFields: ComputedRef<undefined | Actor>;
```

#### actors.paymentDetails

```ts
paymentDetails: ComputedRef<undefined | Actor>;
```

#### actors.promotions

```ts
promotions: ComputedRef<undefined | Actor>;
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
basket: ComputedRef<undefined | IBasket>;
```

The current basket object.

### basketId

```ts
basketId: ComputedRef<undefined | string>;
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
context: ComputedRef<undefined | BasketContext>;
```

The full basket context object.

### currency

```ts
currency: ComputedRef<undefined | ICurrency>;
```

The current basket currency.

### errors

```ts
errors: ComputedRef<undefined | ResponseError>;
```

Any error returned by the basket state machine.

### findProduct()

```ts
findProduct: (mapping) => undefined | BasketProduct;
```

Finds a product in the basket matching the given mapping.

#### Parameters

##### mapping

`Record`\<`string`, `any`\>

The mapping to match.

#### Returns

`undefined` \| [`BasketProduct`](../interfaces/BasketProduct.md)

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
invoice: ComputedRef<undefined | IInvoice>;
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
  isReadyForCheckout: boolean;
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
products: ComputedRef<undefined | BasketProduct[]>;
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
promotions: ComputedRef<undefined | IBasketPromotion[]>;
```

The list of promotions applied to the basket.

### refresh()

```ts
refresh: (data?) => Promise<undefined | IBasket>;
```

Refreshes the basket state from the server.

#### Parameters

##### data?

`IBasket`

Optional basket data to refresh with.

#### Returns

`Promise`\<`undefined` \| `IBasket`\>

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
  | undefined
  | {
  discount: null | string;
  products: BasketProduct[];
  subtotal: string;
  taxes: object[];
  total: string;
}>;
```

The basket summary (totals, etc).

### taxes

```ts
taxes: ComputedRef<undefined | IAppliedTax[]>;
```

The taxes applied to the basket.
