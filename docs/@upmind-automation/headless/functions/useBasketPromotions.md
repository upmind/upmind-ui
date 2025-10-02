[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useBasketPromotions

# useBasketPromotions()

```ts
function useBasketPromotions(): object;
```

## Returns

### add()

```ts
add: (value?) => Promise<void>;
```

Adds the promotion to the basket.

#### Parameters

##### value?

`string`

The new promotion model.

#### Returns

`Promise`\<`void`\>

Resolves when updated, rejects on error.

### clear()

```ts
clear: () => void;
```

Clears the promotion state.

#### Returns

`void`

### context

```ts
context: ComputedRef<undefined | PromotionsContext>;
```

The full promotion context object.

### errors

```ts
errors: ComputedRef<undefined | string>;
```

Any error returned by the promotion actor.

### input()

```ts
input: (value) => void;
```

Sends a SET event to update the promotion model.

#### Parameters

##### value

`PromotionModel`

The new promotion model to set.

#### Returns

`void`

Does not return anything.

### isReady()

```ts
isReady: () => Promise<boolean>;
```

Waits for the promotion actor to be ready (not loading or error state).

#### Returns

`Promise`\<`boolean`\>

Resolves true if ready, false if error.

### meta

```ts
meta: ComputedRef<{
  hasErrors: boolean;
  hasPromotions: boolean;
  isAvailable: boolean;
  isComplete: boolean;
  isDirty: boolean;
  isLoading: boolean;
  isProcessing: boolean;
  isValid: boolean;
}>;
```

Meta information about the basket promotion state.

### model

```ts
model: ComputedRef<undefined | PromotionModel>;
```

The current promotion model.

### promotions

```ts
promotions: ComputedRef<undefined | IBasketPromotion[]>;
```

The list of available promotions.

### remove()

```ts
remove: (value) => Promise<void>;
```

Removes a promotion from the basket.

#### Parameters

##### value

`string`

The promotion model to remove.

#### Returns

`Promise`\<`void`\>

Resolves when removed, rejects on error.

### schema

```ts
schema: ComputedRef<undefined | JsonSchema>;
```

The promotion schema.

### uischema

```ts
uischema: ComputedRef<undefined | UISchemaElement>;
```

The promotion UI schema.

### validationErrors

```ts
validationErrors: ComputedRef<
  | undefined
| ValidationErrorObject<string, Record<string, any>, unknown>[]>;
```

Any validation errors returned by the promotion actor.
