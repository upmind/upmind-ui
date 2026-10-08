# contract-product Gotchas

Edge cases, known issues, and things to watch out for.

> **🧪 For Testers:** Focus on the subscription-only write guards and the future-cancellation date validity below.

---

## Subscription-only writes fail silently, not loudly 🧪

`stopRenewing`, `resumeRenewing` (implicitly — `resumeRenewing` is only reachable from `expiring`, which itself requires `isSubscription`) and `setConsolidation` all carry an `isSubscription` guard on the machine transition. Sending one of these on a one-time (non-subscription) product does not throw — the event is simply refused, the machine never enters `processing`, and the action resolves `false`.

```typescript
import { ScopeActorTypes, useContractProduct } from "@upmind-automation/headless";

declare const productId: string;
declare function showError(message: string): void;

const product = useContractProduct().as(ScopeActorTypes.CLIENT).withId(productId);

// ❌ Wrong — assumes a thrown error is the ONLY failure signal, and never catches
const unchecked = await product.useActions().stopRenewing();
if (unchecked === false) showError("Cannot stop renewal");

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

`scheduleCancellation` does **not** accept "today or later". The date has to be an exact multiple of the product's billing cycle from its `nextDueDate`, and not earlier than the next anniversary strictly after today. Sending an off-anniversary date is a caller bug the machine does not itself reject at the transition level. Build the picker from `minFutureCancellationDate` and whole billing cycles, so no other date is offered.

```typescript
import { ScopeActorTypes, useContractProduct } from "@upmind-automation/headless";

declare const productId: string;
declare const pickedDate: string;

const product = useContractProduct().as(ScopeActorTypes.CLIENT).withId(productId);
await product.useActions().isReady();
const { minFutureCancellationDate } = product.useContext();

// ❌ Wrong — picks an arbitrary future date
await product.useActions().scheduleCancellation({ futureCancellationDate: "2026-11-01" });

// ✅ Correct — offer only the earliest anniversary and whole cycles after it
if (minFutureCancellationDate.value) {
  await product.useActions().scheduleCancellation({ futureCancellationDate: pickedDate });
}
```

**Test scenario:** build a date picker constrained to `minFutureCancellationDate` plus whole-cycle steps; assert it offers no date off that grid.

---

## Quick search silently drops terms under three characters 🧪

The collection's quick search (`query`) validates against the query model's own schema, which requires a minimum of 3 characters. A shorter term fails validation rather than being sent as a narrower (or looser) search — treat it the same as any other invalid `setCriteria` model, not as a filter that degrades gracefully.

```typescript
import { ScopeActorTypes, useContractProducts } from "@upmind-automation/headless";

declare const term: string;

const { setCriteria } = useContractProducts().as(ScopeActorTypes.CLIENT).useActions();

// ❌ Wrong — assumes any non-empty term is sent as-is
setCriteria({ query: "ab" });

// ✅ Correct — enforce the minimum length before setting criteria
if (term.length >= 3) setCriteria({ query: term });
```

**Test scenario:** call `setCriteria({ query: "ab" })` and assert the model fails validation rather than issuing a request with `query=ab`.

---

## `unavailable` (staged/cancelled/lapsed/fraud) accepts the five lifecycle writes and nothing else

Once a product is placed on `unavailable`, only the five lifecycle writes move it: `setAutoRenew`, `issueNextInvoice`, `endTrial`, `setClientLabel` and `setBillingEntity`. They are accepted there on purpose, because the platform judges the request, and a client can still label a cancelled product or change what it bills to. The first four are events on the `unavailable` node. `setBillingEntity` runs in the `billingEntity` form region that `unavailable` holds beside its `status` region. The cancellation, consolidation and change-of-plan events have no handler on any `unavailable` node. `REFRESH` always re-enters `#loading` from the top, and the settled read walks the load's ordered list of status guards again from scratch, so that is the only way back to `available`.

Each lifecycle write is also gated by the record. A write whose gate is closed resolves `false` with nothing sent, on `unavailable` as on `available`. A write also resolves `false` at once when the product is on no placed node (loading, or on `error`) or when another write is in flight. Read the gate in `useMeta()` (`canEndTrial`, `canSetBillingEntity` and the rest) before the call. `isUnavailable` is `true` on any `unavailable` node.

---

## Unpaid invoices do not close the auto-renew switch-off

`canDisableAutoRenew` does not read the unpaid invoices of the product, and the platform does not need it to. The platform allows the switch-off while unpaid invoices exist (checked on staging on 2026-10-07: `200`). It refuses only when the catalogue product's `can_disable_auto_create_renew_invoice` is `false`, with a `409`; `canDisableAutoRenew` reads that flag, and an absent flag counts as allowed. Whether to warn the client about unpaid invoices first is a choice of the consuming interface. The manager does not request that set, because `useInvoices` owns `GET invoices`. 

A consumer that wants the hint reads `useInvoices().as(ScopeActorTypes.CLIENT).for(InvoicesContextTypes.CONTRACT_PRODUCT, id)`. `contractProduct.unpaidRecurringInvoices` is the list the product record carries, not the filtered read.

## `setBillingEntity()` validates, and a pick of the current entity is a no-op

`setBillingEntity()` opens the billing-entity form, waits for the client's addresses and companies, feeds the picked id and submits. The form validates the id against the picker schema (`schemas.billingEntity`), and the call rejects with the validation errors when the id fails. An id that matches nothing in the picker list fails the same way. A pick of the entity the contract already bills to sends nothing, closes the form and resolves the current product. That is a success, not a refusal.

A refusal by the platform rejects and keeps the form open, with its model, on its `error` node. The caller can correct the pick and submit again with `submitBillingEntity()`, or close the form with `cancelForm`. `false` means a closed gate, or a product on no placed node. `schemas.billingEntity` carries `default`, the current billing entity: the company when the record has one, else the address. The default is absent on a list row, which carries neither id.

## `billingAddressId` and `billingCompanyId` are `undefined` on a list row

The list read does not include the contract, so every row from `useContractProducts` leaves `billingAddressId` and `billingCompanyId` `undefined`. `undefined` does not mean the contract has no address or no company. The manager's single-product read carries both.

## Two invoice writes and `migrate` also invalidate `["invoices"]`

`issueNextInvoice()`, `endTrial()` and the `migrate()` of a change of plan raise an invoice. Each invalidates the module root `["contracts"]` and the invoices root `["invoices"]`, with `exact: false` on both. The other four lifecycle writes invalidate `["contracts"]` only. The invoices list has a long stale time, so without the second invalidation a raised invoice would be missing from a cached list and from the unpaid set above.

## `endTrial()` can resolve `null`; `issueNextInvoice()` cannot

`endTrial()` resolves `null` when the end of trial raised no invoice. That is a success. A trial that ends by cancelling resolves the platform's credit note (category `credit_note`), not a regular invoice. `issueNextInvoice()` rejects with a `DetailedError` when the platform returns no invoice. `issuedInvoice` keeps the last result of either write, and survives `refresh()` and later writes of other kinds, so it is not the current state of the product.

---

## The cancellation form can vanish entirely, not just lose one option 🧪

The form is not "always three options, some disabled". The offered option list is **empty** — the form itself has nothing to offer — the moment any ONE of these is true: the subscription has already auto-expired (stopped renewing with a calculated end date), a hard cancellation request is already pending, or a future cancellation is already booked. Only once none of those hold does each of the three options get evaluated on its own narrower condition (soft and scheduled: not a pending contract; hard: the platform's own `canCancel` flag; scheduled: additionally needs a computable billing anniversary).

```typescript
import { ScopeActorTypes, useContractProduct } from "@upmind-automation/headless";
import type { JsonSchema7 } from "@jsonforms/core";

declare const productId: string;
declare function render(schema: JsonSchema7 | undefined): void;

const product = useContractProduct().as(ScopeActorTypes.CLIENT).withId(productId);

// ❌ Wrong — assumes the form always has at least the soft option
product.useActions().openCancellation();
const { cancellation } = product.useContext();
render(cancellation.value?.schema); // schema may have an EMPTY option enum

// ✅ Correct — check there is something to offer before opening the form at all
const { hasCancellationOptions } = product.useMeta();
if (hasCancellationOptions.value) {
  product.useActions().openCancellation();
}
```

**Test scenario:** load a product with a pending hard cancellation request, call `openCancellation()`, and assert the resulting form's `option` enum is empty rather than missing only the HARD entry.

## The consolidation form reads no brand setting and no permission

`canConsolidate()` is a pure function of the record: a live (not staged) subscription, the CLIENT's own `invoiceConsolidationEnabled` preference (`enabled` or `inherit`), and the catalogue PRODUCT's own `invoice_consolidation_enabled` flag. The brand-level `INVOICE_CONSOLIDATION_ENABLED` / `INVOICE_CONSOLIDATION_RESTRICT_TO_STAFF` config is deliberately not read — see the `@decision` beside `canConsolidate` in `contract-product.utils.ts`.

## No actor-permission check backs the cancellation or consolidation forms — a known limitation, not a design choice

Neither form reads the platform's own actor-permission model (e.g. whether THIS signed-in identity specifically may modify THIS product) — both are gated on record and preference facts only. A consumer that needs to enforce "can this actor act on this product" beyond what the record itself already implies has to add that check itself; this module does not perform one.

## `hasScheduledFutureCancellation` and `canScheduleFutureCancellation` are not opposites

`hasScheduledFutureCancellation` reports whether one is currently booked. `canScheduleFutureCancellation` reports whether booking a **new** one is currently allowed — which also requires not cancelling, not pending, and a computable anniversary. A product can have neither true (no anniversary computable, e.g. missing `nextDueDate`).

While a write is in flight (`isProcessing`), the machine has left the whole `available.status` region. So `isCancelling` and `isPending` both read `false`. This can make `canScheduleFutureCancellation` read `true` mid-write. No new booking can be sent until the write settles. Gate a "schedule cancellation" control on `!isProcessing` too, not on `canScheduleFutureCancellation` alone.

---

## A change of plan: the dry-run preview fails silently 🧪

Each change to the chosen plan's options re-runs a dry run that prices the change. When the dry run fails, the module raises no error. It clears the cost, so `migrationPreview` is `undefined`, `isMigrationPreviewed` is `false` and `hasError` stays `false`. The form then waits for the next change, and the commit stays available. A UI that shows the cost only while `migrationPreview` is set shows no cost for a choice the platform cannot price.

## A change of plan: the commit is forced and the platform judges it

`migrate()` asks the configurator to commit with a forced update, so local validation does not gate it. `canCommitMigration` checks only that no dry run is in flight and the configurator can take the commit. The platform decides whether the change is valid. A refusal rejects `migrate()` with a `DetailedError`, and the form returns to its error state with the chosen plan kept. `migrate()` resolves `false` when the commit is not offered at all (no configurator ready).

## A change of plan: the plan catalogue keeps the contract's currency and no promotions

The plan list and the plan count read the catalogue with the contract's currency and account, not the basket's. They send `omit_promotions=1` when a plan loads, and they filter to orderable, recurring plans (the list also to the product's current billing term). They read no basket and no category tree. A plan's price can therefore differ from the storefront price a basket would show.

## A change of plan: `migrate()` resolves when the write lands, even if the re-read fails

The commit is one write, followed by a re-read of the product. `migrate()` resolves with the invoice as soon as the write succeeds. A failed re-read leaves the machine on its `error` node (`hasError` is `true`, `refresh()` retries), and does not reject `migrate()`. Check `migrationResult` for the outcome of the commit, and `hasError` for the state of the re-read.

## A change of plan: `isMigrationTargetsLoading` is the first page only

`isMigrationTargetsLoading` is `false` while a further page loads. Read `isMigrationTargetsLoadingMore` for that. `migrationsCount` is `0` until the count lands, so `0` does not mean "no plans". Read `hasNoMigrationTargets` once the list has loaded.

## Common Mistakes
## Common Mistakes

### Reading `contractProduct.raw` for a field the view model already maps

The view model on `useContractProduct().useContext().contractProduct` already maps every field this module reads. Reach for `.raw` only when a consumer needs an unmapped wire field. An example is `tags`, which a local wire-type augmentation carries, not the shared platform interface. Do not use `.raw` as a shortcut around the mapper.

### Assuming the collection and the manager share a cache entry per product

They don't. The collection's list query and one manager instance's machine context are independent reads with independent cache keys under the same `["contracts"]` root. A write through the manager invalidates the whole root, so the list refetches. The manager's own context updates only from its own re-read, not from the list's.

---

## Edge Cases

| Scenario | Expected Behavior | Notes |
|----------|-------------------|-------|
| Product has no `nextDueDate` | `minFutureCancellationDate` is `null` | No anchor at all to compute from |
| Product has a `nextDueDate` but `billingCycleMonths <= 0` | `minFutureCancellationDate` returns the **`nextDueDate` string itself**, NOT `null` | `canScheduleFutureCancellation` is `false` for such a product, but `minFutureCancellationDate` falls back to `nextDueDate` when it finds no anniversary — do not treat a falsy `minFutureCancellationDate` as the guard for "hide the date picker"; a one-time product still returns a truthy date string here |
| Client has delegated products and holds the choice "exclude" | `exclude_delegated=1` | The held choice wins |
| Client has delegated products and holds the choice "include" | `exclude_delegated=0` | The held choice wins |
| Client has delegated products and holds no choice | `exclude_delegated=0` — delegated products are **included** | The default choice is "include" |
| Client has delegated products, and the stored "exclude" choice has not loaded yet | The first list read can go out with `exclude_delegated=0` | The list read waits on the client id alone, not on the held choice |
| Client has no delegated products | `exclude_delegated=1`, whatever choice is held | Nothing is delegated, so the held choice is not read into the request |
| The brand's portal setting `@context.oneTimePurchases` is `"hidden"` | The list always sends `billing_cycle_days` `neq` `0`, and the filter bar does not offer the one-off position | A request that also asks for one-off purchases (`eq`) is rejected with a validation error. The category counts read does not carry the forced hide |
| `.for('delegated')` selector context | The exclude-delegated force-set is always `0`, the held preference is never read | This turns exclusion OFF — the client's own products and their delegated products both come back. It is not a delegated-only view; nothing narrows the result to delegated items alone |
| An invoice's status is `ADJUSTED` | The `isDue` flag is true, the `isCancellable` flag is false | The cancellable set is narrower than the due set |

---

## Lifecycle Considerations

### Destroy the Instance When Done

```typescript
import { onUnmounted } from "vue";
import { ScopeActorTypes, useContractProduct, useContractProducts } from "@upmind-automation/headless";

declare const productId: string;

const products = useContractProducts().as(ScopeActorTypes.CLIENT);
const product = useContractProduct().as(ScopeActorTypes.CLIENT).withId(productId);

onUnmounted(() => {
  products.useActions().destroy();  // also stops the delegated-preference reader
  product.useActions().destroy();
});
```

### Wait for Ready State

```typescript
import { ScopeActorTypes, useContractProduct, useContractProducts } from "@upmind-automation/headless";

declare const productId: string;

const products = useContractProducts().as(ScopeActorTypes.CLIENT);
const product = useContractProduct().as(ScopeActorTypes.CLIENT).withId(productId);

await products.useActions().isReady();
await product.useActions().isReady();
```
