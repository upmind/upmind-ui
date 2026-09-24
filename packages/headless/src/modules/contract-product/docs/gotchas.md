# contract-product Gotchas

Edge cases, known issues, and things to watch out for.

> **🧪 For Testers:** Focus on the subscription-only write guards and the future-cancellation date validity below.

---

## Subscription-only writes fail silently, not loudly 🧪

`stopRenewing`, `resumeRenewing` (implicitly — `resumeRenewing` is only reachable from `expiring`, which itself requires `isSubscription`) and `setConsolidation` all carry an `isSubscription` guard on the machine transition. Sending one of these on a one-time (non-subscription) product does not throw — the event is simply refused, the machine never enters `processing`, and the action resolves `false`.

```typescript
// ❌ Wrong — assumes a thrown error is the ONLY failure signal, and never catches
const result = await product.useActions().stopRenewing();
if (result === false) showError("Cannot stop renewal");

// ✅ Correct — both signals matter: a resolved `false` means the machine refused
// the event outright (e.g. sent on a one-time product); a REJECTED promise means
// the write (or its re-read) reached the server and failed.
try {
  const result = await product.useActions().stopRenewing();
  if (result === false) showError("Cannot stop renewal on a one-time product");
} catch (error) {
  showError("Stopping renewal failed");
}
```

**Test scenario:** load a one-time (non-subscription) contract product, call `stopRenewing()`, and assert the resolved value is `false` and no `PUT .../modify_renew` request was sent. Separately: force the write's re-read to fail and assert the call REJECTS rather than resolving `false`.

---

## A future-cancellation date must land exactly on a billing anniversary 🧪

`scheduleCancellation` does **not** accept "today or later". The date has to be an exact multiple of the product's billing cycle from its `nextDueDate`, and not earlier than the next anniversary strictly after today. Sending an off-anniversary date is a caller bug the machine does not itself reject at the transition level — validate first.

```typescript
// ❌ Wrong — picks an arbitrary future date
await product.useActions().scheduleCancellation({ futureCancellationDate: "2026-11-01" });

// ✅ Correct — validate against the product's own anniversaries first
import { isSelectableFutureCancellationDate } from "@upmind-automation/headless";

if (isSelectableFutureCancellationDate(contractProduct, pickedDate)) {
  await product.useActions().scheduleCancellation({ futureCancellationDate: pickedDate });
}
```

**Test scenario:** build a date picker constrained to `minFutureCancellationDate(product)` plus whole-cycle steps; assert `isSelectableFutureCancellationDate` rejects any date off that grid.

---

## `unavailable` (staged/cancelled/lapsed/fraud) has no way out except a fresh read

Once a product is placed on `unavailable`, no event moves it — not even `REFRESH` targets a child of `unavailable` directly; `REFRESH` always re-enters `#loading` from the top, which then re-evaluates the `always` priority list from scratch. Do not attempt to `send()` a write event while `isStaged`/`isCancelled`/`isLapsed`/`isFraud` is true — none of those child states declare a handler for it.

---

## The cancellation form can vanish entirely, not just lose one option 🧪

The form is not "always three options, some disabled". `cancellationOptions()` returns an **empty list** — the form itself has nothing to offer — the moment any ONE of these is true: the subscription has already auto-expired (stopped renewing with a calculated end date), a hard cancellation request is already pending, or a future cancellation is already booked. Only once none of those hold does each of the three options get evaluated on its own narrower condition (soft and scheduled: not a pending contract; hard: the platform's own `canCancel` flag; scheduled: additionally needs a computable billing anniversary).

```typescript
// ❌ Wrong — assumes the form always has at least the soft option
const { cancellation } = product.useContext();
render(cancellation.value.schema); // schema may have an EMPTY option enum

// ✅ Correct — check there is something to offer before rendering the form at all
if (!isEmpty(cancellationOptions(contractProduct))) {
  product.useActions().openCancellation();
}
```

**Test scenario:** load a product with a pending hard cancellation request, call `openCancellation()`, and assert the resulting form's `option` enum is empty rather than missing only the HARD entry.

## The consolidation form reads no brand setting and no permission

`canConsolidate()` is a pure function of the record: a live (not staged) subscription, the CLIENT's own `invoiceConsolidationEnabled` preference (`enabled` or `inherit`), and the catalogue PRODUCT's own `invoice_consolidation_enabled` flag. The brand-level `INVOICE_CONSOLIDATION_ENABLED` / `INVOICE_CONSOLIDATION_RESTRICT_TO_STAFF` config is deliberately not read — see the `@decision` beside `canConsolidate` in `contract-product.utils.ts`.

## No actor-permission check backs the cancellation or consolidation forms — a known limitation, not a design choice

Neither form reads the platform's own actor-permission model (e.g. whether THIS signed-in identity specifically may modify THIS product) — both are gated on record and preference facts only. A consumer that needs to enforce "can this actor act on this product" beyond what the record itself already implies has to add that check itself; this module does not perform one.

## `hasScheduledFutureCancellation` and `canScheduleFutureCancellation` are not opposites

`hasScheduledFutureCancellation` reports whether one is currently booked. `canScheduleFutureCancellation` reports whether booking a **new** one is currently allowed — which also requires not cancelling, not pending, and a computable anniversary. A product can have neither true (no anniversary computable, e.g. missing `nextDueDate`). While a write is in flight (`isProcessing`), the machine has left the whole `available.status` region, so `isCancelling` and `isPending` both read `false` — this can make `canScheduleFutureCancellation` read `true` mid-write, even though no new booking can actually be sent until the write settles. Gate a "schedule cancellation" control on `!isProcessing` too, not on `canScheduleFutureCancellation` alone.

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
| Product has no `nextDueDate` | All anniversary helpers return `null`/`false` | No anchor at all to compute from |
| Product has a `nextDueDate` but `billingCycleMonths <= 0` | `minFutureCancellationDate` returns the **`nextDueDate` string itself**, NOT `null`; the other anniversary helpers (`anniversaryCycleForDate`, `isSelectableFutureCancellationDate`) still return `null`/`false` | `minFutureCancellationCycle`/`anniversaryAnchor` return `null` for this input, and `minFutureCancellationDate` falls back to `product.nextDueDate` when its own cycle lookup is `null` — do not treat a falsy `minFutureCancellationDate` as the guard for "hide the date picker"; a one-time product still returns a truthy date string here |
| Client explicitly sets the exclude preference to `true` | Delegated products are excluded | Preference wins in either direction whenever it is actually held |
| Client explicitly sets the exclude preference to `false` | Delegated products are included | Preference wins in either direction whenever it is actually held |
| Client has delegated products and holds no stored preference | Delegated products are **included**, not excluded | The preference store coerces an untouched preference to `false` before this module ever reads it, so once the preference has loaded the force-set's own "exclude by default when the client has any" branch does not fire. Before it loads, the preference reads as undefined and that branch DOES fire — one excluded render, then a refetch |
| Client has no delegated products | Delegated products excluded is moot | No delegated rows exist to exclude |
| `.for('delegated')` selector context | The exclude-delegated force-set is always `0`, the held preference is never read | This turns exclusion OFF — the client's own products and their delegated products both come back. It is not a delegated-only view; nothing narrows the result to delegated items alone |
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
