# basket-currency — Usage

Source: [`useBasketCurrency.ts`](../useBasketCurrency.ts)

## Import

```typescript
import { useBasketCurrency } from "@upmind-automation/headless";
```

`useBasketCurrency` reads the currency actor from `useBasket().actors.currency`. Call it inside a Vue component's `setup` (or `<script setup>`).

## Full API

```typescript
const {
  // --- state
  isReady, // () => Promise<boolean>
  meta, // ComputedRef<BasketCurrencyMeta>

  // --- context
  context, // ComputedRef<CurrencyContext | undefined>
  currencies, // ComputedRef<ICurrency[] | undefined>
  currency, // ComputedRef<CurrencyModel | undefined>
  currencyCode, // ComputedRef<string | undefined>
  currencyId, // ComputedRef<string | undefined>
  errors, // ComputedRef<ResponseError | undefined>
  model, // ComputedRef<CurrencyModel | undefined>
  schema, // ComputedRef<JsonSchema | undefined>
  uischema, // ComputedRef<UISchemaElement | undefined>

  // --- methods
  clear, // () => void
  input, // (value: CurrencyModel) => Promise<CurrencyModel>
  update // (value?: CurrencyModel) => Promise<void>
} = useBasketCurrency();
```

## `meta` Flags

| Flag           | Type      | True when                                            |
| -------------- | --------- | ---------------------------------------------------- |
| `isAvailable`  | `boolean` | Currency actor is mounted                            |
| `isLoading`    | `boolean` | Machine is in `subscribing` or `loading`             |
| `hasCurrency`  | `boolean` | `context.currency` is set                            |
| `hasErrors`    | `boolean` | Machine is in `error` state                          |
| `isProcessing` | `boolean` | Machine is in `processing` (PUT in flight)           |
| `isValid`      | `boolean` | Machine is in `valid`                                |
| `isDirty`      | `boolean` | `model.id !== baseModel.id` (user has made a change) |
| `isComplete`   | `boolean` | Machine is in `processed` or `complete`              |

## Methods

### `isReady() → Promise<boolean>`

Waits for the machine to exit `subscribing`, `loading`, and `checking`. Resolves `true` when ready, `false` if the machine landed in `error`.

```typescript
const ready = await isReady();
if (!ready) console.warn("Currency actor failed to initialise");
```

### `input(value: CurrencyModel) → Promise<CurrencyModel>`

Sends a `SET` event to update the model and runs parse + validate. Does **not** call the API. Use this for live picker changes.

```typescript
// User selects GBP in a dropdown — update the model without hitting the API
const validated = await input({ code: "GBP" });
console.log(validated.code); // "GBP"
```

### `update(value?: CurrencyModel) → Promise<void>`

Sends `SET` with `update: true`, which PUTs `{ currency_code }` to `/orders/{basketId}/currency` and persists the code as the explicit pick in sessionStorage. Waits up to 60 s for the machine to reach `processed`, `complete`, or `error`.

```typescript
// User clicks "Confirm currency" — persist to basket and sessionStorage
await update({ code: "EUR" });
// The basket now refreshes automatically (machine sends PREFRESH + REFRESH to parent)
```

### `clear() → void`

Sends a `CLEAR` event, which clears the in-memory model and re-enters `checking`. The machine resolves again from the resolver chain (step 1 — server basket currency wins).

```typescript
clear(); // revert to auto-resolved currency
```

## `input` vs `update`

| Method          | Sends                     | API call  | Persists to sessionStorage | When to use                                     |
| --------------- | ------------------------- | --------- | -------------------------- | ----------------------------------------------- |
| `input(value)`  | `SET`                     | No        | No                         | Picker `onChange` — validate without committing |
| `update(value)` | `SET` with `update: true` | Yes (PUT) | Yes (`currency` key)       | Confirm button — commit to basket               |

## Examples

### Display current currency in a component

```vue
<template>
  <span v-if="!meta.isLoading">{{ currencyCode }}</span>
  <span v-else>Loading...</span>
</template>

<script setup lang="ts">
import { useBasketCurrency } from "@upmind-automation/headless";

const { currencyCode, meta } = useBasketCurrency();
</script>
```

### Currency picker with confirm

```vue
<template>
  <select :value="currencyCode" @change="onSelect">
    <option v-for="c in currencies" :key="c.id" :value="c.code">
      {{ c.code }}
    </option>
  </select>
  <button :disabled="!meta.isDirty || meta.isProcessing" @click="onConfirm">
    {{ meta.isProcessing ? "Saving..." : "Confirm" }}
  </button>
  <p v-if="meta.hasErrors">{{ errors?.message }}</p>
</template>

<script setup lang="ts">
import { useBasketCurrency } from "@upmind-automation/headless";

const { currencies, currencyCode, errors, meta, input, update } =
  useBasketCurrency();

async function onSelect(e: Event) {
  const code = (e.target as HTMLSelectElement).value;
  await input({ code }); // validate without API call
}

async function onConfirm() {
  await update(); // PUT to basket, persist explicit pick
}
</script>
```

### Wait for ready before reading currency

```typescript
import { useBasketCurrency } from "@upmind-automation/headless";

const { isReady, currencyCode } = useBasketCurrency();

onMounted(async () => {
  await isReady();
  console.log("Active currency:", currencyCode.value);
});
```

### URL `?currency=` entrypoint (cart funnel)

The cart funnel reads `?currency=` on route entry and calls `useBasket().setCurrency()`, which forwards a `SET { update: true }` event to the currency machine. See [`apps/cart/src/router/funnels/engine/actions.ts`](../../../../apps/cart/src/router/funnels/engine/actions.ts) (`setCurrency` action).

```typescript
// Funnel action — fires automatically on route entry
setCurrency: ({ currentRoute }) => {
  const { setCurrency } = useBasket();
  const { currency } = useQueryParams(currentRoute);
  if (currency) setCurrency(currency);
};
```

## Types

```typescript
import type { CurrencyModel, CurrencyContext } from "./basket-currency.types";
import type { UseBasketCurrency } from "./useBasketCurrency";

type CurrencyModel = {
  id?: ICurrency["id"];
  code?: ICurrency["code"];
};
```

`UseBasketCurrency` is exported as `ReturnType<typeof useBasketCurrency>` — use it to type props that accept the composable return.
