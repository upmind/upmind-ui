# contract-product Gotchas

Edge cases, known issues, and things to watch out for.

> **🧪 For Testers:** Focus on the subscription-only write guards and the future-cancellation date validity below.

---

## Subscription-only writes fail silently, not loudly 🧪

`stopRenewing`, `resumeRenewing` (implicitly — `resumeRenewing` is only reachable from `expiring`, which itself requires `isSubscription`) and `setConsolidation` all carry an `isSubscription` guard on the machine transition. Sending one of these on a one-time (non-subscription) product does not throw — the event is simply refused, the machine never enters `processing`, and the action resolves `false`.

```typescript
// ❌ Wrong — assumes a thrown error means "not allowed"
try {
  await product.useActions().stopRenewing();
} catch {
  showError("Cannot stop renewal");
}

// ✅ Correct — check the resolved value, or gate on isSubscription first
const result = await product.useActions().stopRenewing();
if (result === false) showError("Cannot stop renewal on a one-time product");
```

**Test scenario:** load a one-time (non-subscription) contract product, call `stopRenewing()`, and assert the resolved value is `false` and no `PUT .../modify_renew` request was sent.

---

## A future-cancellation date must land exactly on a billing anniversary 🧪

`scheduleCancellation` does **not** accept "today or later". The date has to be an exact multiple of the product's billing cycle from its `nextDueDate`, and not earlier than the next anniversary strictly after today. Sending an off-anniversary date is a caller bug the machine does not itself reject at the transition level — validate first.

```typescript
// ❌ Wrong — picks an arbitrary future date
await product.useActions().scheduleCancellation({ futureCancellationDate: "2026-11-01" });

// ✅ Correct — validate against the product's own anniversaries first
import { isSelectableFutureCancellationDate } from "@upmind-automation/headless/modules/contract-product";

if (isSelectableFutureCancellationDate(contractProduct, pickedDate)) {
  await product.useActions().scheduleCancellation({ futureCancellationDate: pickedDate });
}
```

**Test scenario:** build a date picker constrained to `minFutureCancellationDate(product)` plus whole-cycle steps; assert `isSelectableFutureCancellationDate` rejects any date off that grid.

---

## `unavailable` (staged/cancelled/lapsed/fraud) has no way out except a fresh read

Once a product is placed on `unavailable`, no event moves it — not even `REFRESH` targets a child of `unavailable` directly; `REFRESH` always re-enters `#loading` from the top, which then re-evaluates the `always` priority list from scratch. Do not attempt to `send()` a write event while `isStaged`/`isCancelled`/`isLapsed`/`isFraud` is true — none of those child states declare a handler for it.

---

## `hasScheduledFutureCancellation` and `canScheduleFutureCancellation` are not opposites

`hasScheduledFutureCancellation` reports whether one is currently booked. `canScheduleFutureCancellation` reports whether booking a **new** one is currently allowed — which also requires not cancelling, not pending, and a computable anniversary. A product can have neither true (no anniversary computable, e.g. missing `nextDueDate`) or, transiently, both false during a write.

---

## Common Mistakes

### Reading `contractProduct.raw` for a field the view model already maps

The view model on `useContractProduct().useContext().contractProduct` already maps every field this module reads. Reach for `.raw` only when a consumer genuinely needs an unmapped wire field (e.g. `tags`, which is carried via a local wire-type augmentation rather than the shared platform interface) — not as a shortcut around the mapper.

### Assuming the collection and the manager share a cache entry per product

They don't. The collection's list query and one manager instance's machine context are independent reads with independent cache keys under the same `["contracts"]` root. A write through the manager invalidates the whole root (so the list will refetch), but the manager's own context is only updated by its own re-read, not by the list's.

---

## Edge Cases

| Scenario | Expected Behavior | Notes |
|----------|-------------------|-------|
| Product has no `nextDueDate` or `billingCycleMonths <= 0` | All anniversary helpers return `null`/`false` | `canScheduleFutureCancellation` is also `false` |
| Client has delegated products but sets the exclude preference to `false` | Delegated products are included | Preference wins over the default when explicitly set |
| Client has no delegated products and holds no preference | Delegated products excluded is moot — the force-set resolves to `0` | No delegated rows exist to exclude |
| `.for('delegated')` selector context | The exclude-delegated force-set is always `0`, the held preference is never read | The context itself already narrows to delegated products |
| An invoice's status is `ADJUSTED` | `isDue` is true, `isCancellable` is false | The cancellable set is narrower than the due set |

---

## Lifecycle Considerations

### Destroy the Instance When Done

```typescript
onUnmounted(() => {
  products.useActions().destroy();  // also stops the delegated-preference reader
  product.useActions().destroy();
});
```

### Wait for Ready State

```typescript
await products.useActions().isReady();
await product.useActions().isReady();
```
