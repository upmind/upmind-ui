# Error Handling Refactor: Unified `ResponseError` Pattern

## Goal

Eliminate the `error` / `errorExternal` split and mixed `ResponseError | ErrorObject[]` union types across product config, basket fields, and basket currency. Replace with a single `error?: ResponseError` context field where `.data` shape determines UI treatment.

## Problem

| Issue | Where | Impact |
|-------|-------|--------|
| `error` and `errorExternal` store mixed shapes | Product machine context | Code guesses with `isArray()`, fragile |
| `clearError` sets `[]` in product, `undefined` in currency/fields | All three machines | Inconsistent — `!!error` behaves differently |
| Consumers reach into `errorExternal.data` AND raw `errorExternal` | `useProductConfig.ts` | Two access paths for one concept |
| `showErrors` gating uses `isArray(errorExternal)` as a proxy for "external" | `useProductConfig.ts` meta | Breaks if `errorExternal` is ever a `ResponseError` with array `.data` |

## Approach

**Single `error?: ResponseError` field.** Branch on `.data` shape, not on which context field it lives in:

| `error.data` shape | Meaning | UI treatment |
|---|---|---|
| `isArray(error.data)` → `ErrorObject[]` | Field-level validation (AJV or API 422) | jsonforms `additionalErrors` / `ConfigErrors` |
| `!isArray(error.data)` | General API/system error | Banner `Alert` with `error.message` |
| `error` is `undefined` | No error | Nothing shown |

**Error origin tracking** via existing `error.origin` field:

| `error.origin` | Source | `showErrors` behavior |
|---|---|---|
| `ErrorOrigin.Upmind` | Basket/API pushed errors | Show immediately |
| `ErrorOrigin.Headless` | Local AJV validation | Show after attempts (existing gating) |
| `ErrorOrigin.External` | External service errors | Show immediately |

This replaces the current `isArray(contextValue(state, "errorExternal"))` proxy with a reliable discriminator.

---

## Integration Point Map

| Integration Point | File | Current Behavior | Constraint |
|---|---|---|---|
| Product context type | `product.machine.ts` ~L849-928 | `error?: ResponseError \| ErrorObject[]`, `errorExternal?: ResponseError \| ErrorObject[]` | Must become single `error?: ResponseError` |
| `setError` action | `product.machine.ts` ~L683-686 | `mapToHeadlessError(data)` → sets `error` | Keep, add `useValidationParser` for 422s (match currency/fields pattern) |
| `setExternalError` action | `product.machine.ts` ~L676-681 | `mapToHeadlessError(data)` → sets `errorExternal` | **Remove entirely** — merge into `setError` |
| `clearError` action | `product.machine.ts` ~L688-690 | Sets `error: []` | Change to `error: undefined` (match currency/fields) |
| `setModel` per-field filtering | `product.machine.ts` ~L516-541 | Filters `errorExternal` array by `instancePath` | **Keep** — filter `error.data` instead, clear `error` when array empties |
| `refreshContext` action | `product.machine.ts` ~L396-454 | Receives `error: errorExternal` from basket data | Normalise incoming basket errors to `ResponseError` with correct `.origin` |
| Global `ERROR` event | `product.machine.ts` ~L330-338 | Sets `errorExternal` + increments `attempts` | Change to set `error` (with `ErrorOrigin.Upmind`) |
| `hasError` guard | `product.machine.ts` ~L694 | `!isEmpty(error)` | Change to `!!error` (since `undefined` = no error) |
| Product composable errors | `useProductConfig.ts` ~L103-110 | Exposes `errors`, `validationErrors`, `additionalErrors`, `externalErrors` separately | Replace with `error`, `validationErrors` (computed), `hasGeneralError` (computed) |
| Product composable meta | `useProductConfig.ts` ~L121-135 | `showErrors` uses `isArray(errorExternal)` proxy | Use `error.origin !== ErrorOrigin.Headless` for immediate display |
| `ConfigErrors` component | `ConfigErrors.vue` ~L51-54 | Props: `errors?: ErrorObject[]` | **No change** — still receives `ErrorObject[]` from `validationErrors` |
| Currency context type | `currency/types.ts` ~L30 | `error?: ResponseError` | **Already correct** — no change needed |
| Currency `setError` | `currency.machine.ts` ~L243 | `mapToHeadlessError` + `useValidationParser` for 422 | **Already correct** — this IS the target pattern |
| Currency `setFeedbackError` | `currency.machine.ts` ~L243-249 | Skips feedback for 422, shows for others | **No change** |
| Fields context type | `fields/types.ts` ~L24 | `error?: ResponseError` | **Already correct** |
| Fields `setError` | `fields.machine.ts` ~L213-222 | Same pattern as currency | **Already correct** |
| Fields composable | `useBasketFields.ts` ~L85 | `errors = useContext(actor, "error")` | Add `validationErrors` and `hasGeneralError` computed properties |
| Currency composable | `useBasketCurrency.ts` ~L62-76 | Only exposes `hasErrors` in meta | Add `validationErrors` and `hasGeneralError` computed properties |

---

## Files to Create/Modify

| Action | File | Changes |
|--------|------|---------|
| MODIFY | `packages/headless/src/modules/product/product.machine.ts` | Remove `errorExternal`, unify to single `error: ResponseError`, update `setError`/`clearError`/`setModel`/`refreshContext`/guards |
| MODIFY | `packages/headless/src/modules/product/product.types.ts` | Remove `errorExternal` from context type, change `error` to `ResponseError` only |
| MODIFY | `packages/headless/src/modules/product/useProductConfig.ts` | Replace 4 error accessors with `error` + 2 computed, update `showErrors`/`hasErrors` meta |
| MODIFY | `packages/headless/src/modules/basket/useBasketCurrency.ts` | Add `validationErrors`, `hasGeneralError` computed properties |
| MODIFY | `packages/headless/src/modules/basket/useBasketFields.ts` | Add `validationErrors`, `hasGeneralError` computed properties |
| MODIFY | `packages/client-vue/src/modules/product/components/ConfigErrors.vue` | No props change — verify wiring still works with new accessor names |
| MODIFY | Any Vue component consuming `externalErrors` or `additionalErrors` | Update to use `validationErrors` / `hasGeneralError` |

---

## Implementation Steps

### Phase 1: Currency & Fields (low risk, validates pattern)

1. [ ] **Add composable computed properties** to `useBasketCurrency.ts` and `useBasketFields.ts`:
   - `validationErrors: computed(() => isArray(error.data) ? error.data : undefined)`
   - `hasGeneralError: computed(() => !!error && !isArray(error.data))`
2. [ ] **Verify** currency and fields machines already match target pattern (`setError` with `useValidationParser` for 422s, `clearError: undefined`)
3. [ ] **Update any consuming components** for currency/fields to use new computed properties

### Phase 2: Product machine (core refactor)

4. [ ] **Update product context type** — remove `errorExternal`, change `error` to `error?: ResponseError`
5. [ ] **Unify `setError` action** — add `useValidationParser` for 422s (copy pattern from currency/fields):
   ```typescript
   setError: assign({
     error: (_context, { data }) => {
       let error = mapToHeadlessError(data);
       if (error?.status === responseCodes.Unprocessable_Entity) {
         error.data = useValidationParser(error);
       }
       return error;
     }
   })
   ```
6. [ ] **Remove `setExternalError` action** entirely
7. [ ] **Update `clearError`** — change `error: []` to `error: undefined`
8. [ ] **Update `setModel` per-field filtering** — filter `error.data` array, clear `error` when empty:
   ```typescript
   error: ({ error, baseModel }, { data }) => {
     if (!error || !isArray(error.data)) return error;
     const remaining = filter(error.data, (err) => {
       const field = compact(split(trimStart(err.instancePath, "/"), "/"));
       const baseValue = get(baseModel, field);
       const newValue = get(data?.model ?? data, field);
       if (!baseValue && !newValue) return true;
       return isEqual(baseValue, newValue);
     });
     return isEmpty(remaining) ? undefined : { ...error, data: remaining };
   }
   ```
9. [ ] **Update `refreshContext`** — normalise incoming basket errors to `ResponseError` with `ErrorOrigin.Upmind`:
   ```typescript
   error: errorExternal
     ? { ...mapToHeadlessError(errorExternal), origin: ErrorOrigin.Upmind }
     : merge({}, error)
   ```
10. [ ] **Update global `ERROR` event handler** — use `setError` instead of `setExternalError`, ensure origin is `Upmind`
11. [ ] **Update `hasError` guard** — change from `!isEmpty(error)` to `!!error`

### Phase 3: Product composable & UI

12. [ ] **Simplify `useProductConfig.ts` error exposure**:
    - `error` → full `ResponseError` (single accessor)
    - `validationErrors` → `computed(() => isArray(error?.data) ? error.data : undefined)`
    - `hasGeneralError` → `computed(() => !!error && !isArray(error?.data))`
    - Remove `additionalErrors`, `externalErrors` accessors
13. [ ] **Update `showErrors` meta** — replace `isArray(errorExternal)` proxy with origin check:
    ```typescript
    showErrors: !!error && (
      error.origin !== ErrorOrigin.Headless ||
      contextMatches(state, ["attempts"])
    )
    ```
14. [ ] **Update `ConfigErrors` wiring** — pass `validationErrors` (was `additionalErrors`)
15. [ ] **Add banner `Alert`** for general errors when `hasGeneralError` is true
16. [ ] **Search and update** all Vue components that reference `externalErrors` or `additionalErrors`

### Phase 4: Cleanup & type tightening

17. [ ] **Narrow `ResponseError.data` type** (optional, module-level):
    ```typescript
    type ProductError = ResponseError & {
      data: ErrorObject[] | Record<string, unknown> | null;
    };
    ```
18. [ ] **Remove dead code** — any remaining `isArray(error)` guards on the context field itself, old type unions

---

## Acceptance Criteria Mapping

| Criteria | Verification |
|---|---|
| Single `error?: ResponseError` in all three module contexts | Type check — no `errorExternal`, no `ResponseError \| ErrorObject[]` unions |
| Field-level validation errors render in jsonforms | `ConfigErrors` receives `ErrorObject[]` from `validationErrors` computed |
| General API errors show in banner Alert | `hasGeneralError` triggers Alert with `error.message` |
| Per-field error clearing works on product config | Change a field with an error → error for that field disappears, others remain |
| Basket-pushed errors show immediately (no attempt gating) | `error.origin === ErrorOrigin.Upmind` bypasses attempt check |
| Local validation errors gated by attempts | `error.origin === ErrorOrigin.Headless` still requires attempts |
| Currency and fields expose consistent error computed properties | Both have `validationErrors` and `hasGeneralError` |
| `clearError` sets `undefined` everywhere | No more `error: []` — consistent across all three machines |

---

## Open Question: Resolved

**Per-field clearing → Keep it.** Filter `error.data` (the `ErrorObject[]`) on `SET`. When filtered array empties, set `error` to `undefined`. This preserves the valuable UX where errors disappear as users fix individual fields.

---

## Risks

| Risk | Mitigation |
|---|---|
| Components still referencing `additionalErrors` / `externalErrors` | Global search before merging — update all consumers |
| `error.origin` not always set correctly by `mapToHeadlessError` | Verify `discernOrigin()` returns `Upmind` for API errors; explicitly set origin in `refreshContext` |
| Per-field filtering breaks on non-array `.data` | Guard with `if (!isArray(error.data)) return error` (already in plan) |
| `showErrors` regression — errors shown too early or not at all | Test: local validation hidden until attempt, basket errors shown immediately |

---

## Sequencing Rationale

**Currency/fields first** because they already have the target `error?: ResponseError` pattern. The work there is additive (computed properties in composables) not structural. This validates the pattern with minimal risk before tackling the product machine, which requires removing `errorExternal`, updating 6+ actions, and rewiring the composable.

---

## Estimated Effort

| Phase | Effort |
|---|---|
| Phase 1: Currency & Fields | ~30 min |
| Phase 2: Product machine | ~1-2 hrs |
| Phase 3: Product composable & UI | ~1 hr |
| Phase 4: Cleanup | ~30 min |
| **Total** | **~3-4 hrs** |
