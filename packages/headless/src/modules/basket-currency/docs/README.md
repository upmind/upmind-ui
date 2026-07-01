# basket-currency

> **FE-2957** — Seed and manage the cart's display currency.

## What Is This?

Think of `basket-currency` like the cart's currency dial. When a customer opens the store, the dial finds the right currency automatically — checking the live basket first, then any pick the customer made earlier, then their account settings, then their browser language, and finally falling back to the brand default. Once the customer manually turns the dial, it stays put — even through login.

- **Auto-resolve** — the machine picks the best currency on load, no action needed
- **User pick** — `update(currency)` locks the dial; it survives logout and login
- **Login** — auto-resolved default is cleared so the account currency wins
- **Logout** — both keys are cleared; the machine re-resolves for the new anonymous session

## Quick Start

```typescript
import { useBasketCurrency } from "@upmind-automation/headless";

const { isReady, currencyCode, currencies, input, update } =
  useBasketCurrency();

await isReady(); // wait for machine to exit loading

// Display the current currency
console.log(currencyCode.value); // e.g. "EUR"

// Update currency (sends SET + PUTs to basket API)
await update({ code: "GBP" });
```

## Features

| Feature                   | Description                                                                        |
| ------------------------- | ---------------------------------------------------------------------------------- |
| Resolution precedence     | Six-step chain: basket → explicit pick → stored default → account → locale → brand |
| Explicit pick persistence | `update()` survives logout and login via sessionStorage                            |
| Login reactivity          | Clears auto-default so account currency wins on re-login                           |
| Logout reactivity         | Clears both keys; fresh resolution runs for new session                            |
| `?currency=` URL param    | Cart funnel reads `?currency=` on entry and calls `update()`                       |
| Schema + validation       | JSON Schema and UI schema for rendering a currency picker form                     |
| Debounced PUT             | `update` is debounced (leading) to prevent rapid API calls                         |

## Key Concepts

**Two sessionStorage keys** power the persistence model:

| Key                | Set by                 | Cleared by              | Survives login? |
| ------------------ | ---------------------- | ----------------------- | --------------- |
| `currency`         | `update()` — user pick | Nothing                 | Yes             |
| `currency_default` | Auto-resolution        | Login (`AUTHENTICATED`) | No              |

**Resolution order** — the machine calls `resolveBaseModel()` on every load and returns the first match:

1. Server basket currency (the basket's current `currency`, always wins)
2. Explicit user pick (`currency` sessionStorage key)
3. Stored auto-default (`currency_default` sessionStorage key — warm-reload short-circuit)
4. Authenticated account currency (`preferredPaymentCurrencyId` → `currencyId`)
5. Browser locale currency (only when brand config `BASKET_DEFAULT_CURRENCY === "language"`)
6. Brand default currency

> **👩‍💻 For Developers:** Steps 4–6 are computed once and written to `currency_default`. Subsequent reloads hit step 3 and skip the compute entirely. The full chain only runs when the stored default is absent (first visit, or after login clears it).

## Documentation

| Document                             | What it covers                                     |
| ------------------------------------ | -------------------------------------------------- |
| [architecture.md](./architecture.md) | State machine diagram, data flow, design decisions |
| [usage.md](./usage.md)               | Full API reference with copy-paste examples        |
| [gotchas.md](./gotchas.md)           | Edge cases, common mistakes, QA scenarios          |
| [CHANGELOG.md](./CHANGELOG.md)       | Version history                                    |

## Source Files

| File                                                                                    | Purpose                                                   |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| [`useBasketCurrency.ts`](../useBasketCurrency.ts)                                       | Public composable                                         |
| [`basket-currency.machine.ts`](../basket-currency.machine.ts)                           | XState machine (internal)                                 |
| [`basket-currency.services.ts`](../basket-currency.services.ts)                         | load / parse / validate / update (internal)               |
| [`basket-currency.utils.ts`](../basket-currency.utils.ts)                               | `resolveBaseModel`, storage helpers, schema builders      |
| [`basket-currency.types.ts`](../basket-currency.types.ts)                               | `CurrencyContext`, `CurrencyModel`                        |
| [`__tests__/basket-currency.utils.test.ts`](../__tests__/basket-currency.utils.test.ts) | 25 tests covering resolver precedence and storage helpers |
