# basket-currency — Gotchas

Known edge cases, common mistakes, and QA scenarios. All behaviours below are covered by the unit tests in [`__tests__/basket-currency.utils.test.ts`](../__tests__/basket-currency.utils.test.ts).

---

## 1. Explicit pick survives login — but not a server-supplied basket currency

**Problem:** A user picks GBP before logging in. After login, they expect to see GBP. But the server claims the guest basket onto their account and may reset it to the account's EUR. The machine then sees EUR arriving in step 1 of the resolver (server basket currency), which outranks the explicit pick.

**Why:** The resolver's step 1 (server basket currency) always wins — by design. The server's answer is the ground truth for what currency the basket is actually priced in.

**What survives login:** The explicit pick (`currency` sessionStorage key) is preserved through login and outranks the auto-computed default at step 2. It does NOT outrank a server-supplied basket currency at step 1.

> **🧪 For Testers:** Log in with a user whose account currency is EUR. Before login, pick GBP via `update("GBP")`. After login, if the basket was claimed by the server and reset to EUR, the cart shows EUR (server wins). If no claim/reset occurred, the cart shows GBP (explicit pick at step 2 wins).

---

## 2. `currency_default` must be absent after login

**Problem:** After login, the `currency_default` sessionStorage key persists. The machine short-circuits at step 3 (stored default) and shows the pre-login currency instead of the account currency.

**Why it should not happen:** The `AUTHENTICATED` event triggers `clearDefaultStorage`, which removes `currency_default`. The machine then re-runs resolution from step 1, hitting the account currency at step 4.

**Guard:** The `hasNoExplicitCurrency` guard must be true for `AUTHENTICATED` to fire. If the user has an explicit pick, the `AUTHENTICATED` event is swallowed — correct behaviour.

> **🧪 For Testers:** Check sessionStorage after login. `currency_default` must be absent. If it is present, the `clearDefaultStorage` action did not fire — verify the `AUTHENTICATED` event reaches the machine by checking the auth subscription is still alive.

---

## 3. Logout clears both keys — but actor teardown timing is not guaranteed

**Problem:** On logout, the basket machine may stop the currency actor before the `UNAUTHENTICATED` event fully propagates. In practice `clearStorage` runs (both keys cleared), but if a fresh actor starts before teardown completes you may observe a brief stale-currency flash.

**Why it is safe:** A fresh actor always runs full resolution (step 1–6 above). Even if the old keys are not yet cleared, the new session starts with no basket and no account, so the brand default wins at step 6. You do not need to pre-clear storage manually.

> **🧪 For Testers:** Observe the currency displayed immediately after logout. A brief flash of the previous currency is acceptable; it must resolve to the correct anonymous default within one machine load cycle.

---

## 4. Locale currency only fires when `BASKET_DEFAULT_CURRENCY === "language"`

**Problem:** A brand is configured with `BASKET_DEFAULT_CURRENCY === "brand"`. Users with a Polish browser (`pl` locale) expect PLN, but the cart shows USD (brand default).

**Why:** The locale lane (step 5) is gated by the `BASKET_DEFAULT_CURRENCY` brand config value. When it is `"brand"`, locale is skipped entirely. This is intentional — brands choose which resolution strategy applies.

**Resolution:** Only brands that have opted into language-based resolution (`BasketCurrencySource.LANGUAGE`) see locale-driven currency. Check the brand config before filing a bug.

> **🧪 For Testers:** Test locale resolution only on brands configured with `BASKET_DEFAULT_CURRENCY=language`. On `BASKET_DEFAULT_CURRENCY=brand`, locale is always skipped regardless of `navigator.language`.

---

## 5. Unsupported currency candidates are silently rejected

**Problem:** A user's account currency is CAD, but the brand only supports USD and EUR. The cart shows USD (brand default), not CAD.

**Why:** Every lane in the resolver validates the candidate against `useBrand().currencies`. An unsupported currency is silently dropped and resolution falls through to the next lane. This prevents the basket being priced in a currency the brand cannot handle.

**Test case:** [`(unsupported candidates are ignored)`](../__tests__/basket-currency.utils.test.ts) covers account, locale, and server basket currency rejection.

> **👩‍💻 For Developers:** Never bypass the supported currencies check. If you extend the resolver, always intersect candidates with `useBrand().currencies` before returning.

---

## 6. `input()` does not persist — `update()` is required to commit

**Problem:** Calling `input({ code: "EUR" })` updates the in-memory model and validates it, but does not call the API and does not write to sessionStorage. After a reload, the currency reverts.

**Why:** `input` sends `SET` (no `update` flag). The machine runs `checking` but the `shouldUpdate` guard is false, so it lands in `complete` without calling `update` or `persistModel`.

**Fix:** Call `update({ code: "EUR" })` to PUT to the basket and persist the explicit pick.

> **🧪 For Testers:** Call `input()` and reload the page. The currency must revert to its previous value. Then call `update()` and reload — the currency must persist.

---

## 7. `update()` has a 60 s timeout

**Problem:** The `update()` method in [`useBasketCurrency.ts`](../useBasketCurrency.ts) waits up to 60 seconds for the machine to reach `processed`, `complete`, or `error`. A slow or hung network call will block the call site for up to 60 s, then reject with a `Timeout` error.

**Why:** The machine debounces the PUT (1 s leading), so some wait is required. The 60 s ceiling prevents the call from hanging forever.

> **👩‍💻 For Developers:** If `update()` rejects, check `errors.value` for the underlying `ResponseError`. The machine lands in `error` state; the caller can surface a retry UI.

---

## 8. Changing a machine state node requires a full sweep

The machine uses named state IDs (`#valid`, `#error`, `#complete`). Renaming or nesting any node breaks silent `stateMatches` / `waitFor` references in `useBasketCurrency.ts` without a TypeScript error. After any machine edit, grep for the old state name across the module.

> **🔧 For Contributors:** See `code-generation.md` §"Changing a Machine Node = Sweep the Composables" for the full sweep checklist.
