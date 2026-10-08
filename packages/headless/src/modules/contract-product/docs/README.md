# contract-product Module

A client's own contract products — the individual, billable line items inside their contracts. Two scoped composables: `useContractProducts` (the query-backed collection) and `useContractProduct` (the per-product manager, backed by `contract-product.machine.ts`). The collection is client scope only: `.as('staff')` and `.as('guest')` do not resolve a context on its matrix. The manager is a SINGLE-RECORD READ — its matrix refuses every actor a context, so `.for()` does not compile for anyone, while `.as()` itself stays open (`.as('staff').withId(id)` type-checks; the services reject a caller the session cannot address).

Every cancellation write — soft (stop/resume renewal), hard (immediate request/withdraw) and scheduled (book/revoke a future date) — lives on this module's manager, not on the sibling `contract` module. A contract only groups product ids; changing what happens to one product is this module's job.

## What Is This? (ELI5)

- **`useContractProducts`** = the list view: "show me all my contract products, filtered and sorted".
- **`useContractProduct`** = the detail view: "load this one contract product and let me act on it" — one combined cancellation form offering stop/resume renewal, request/withdraw an immediate cancellation, or book/revoke a scheduled one (whichever of those the product currently allows), plus a separate consolidation form, a change of plan to another plan the product allows, and five single-call lifecycle writes (renewal invoicing, next invoice, end of trial, client label, billing entity). Those five are accepted on a staged, cancelled or lapsed product too.

> **🧪 For Testers:** See [gotchas.md](./gotchas.md) for the future-cancellation anniversary rules and the subscription-only write guards.

> **👩‍💻 For Developers:** The collection's services (`contract-products.services.ts`) own the module's one cache key (`["contracts"]`), and the manager's services (`contract-product.services.ts`) import it — every write invalidates the whole module's cache, not just the touched query.

## Quick Start

```typescript
import { ScopeActorTypes, useContractProduct, useContractProducts } from "@upmind-automation/headless";

declare const productId: string;

const products = useContractProducts().as(ScopeActorTypes.CLIENT);
await products.useActions().isReady();
const { data } = products.useContext();

const product = useContractProduct().as(ScopeActorTypes.CLIENT).withId(productId);
await product.useActions().isReady();
const { isActive, isSubscription } = product.useMeta();
```

See [Usage](./usage.md) for the complete API reference.

## Features

| Feature | Status | Notes |
|---------|--------|-------|
| List / filter / sort the client's own contract products | ✅ | `useContractProducts` |
| Include/exclude delegated products | ✅ | `exclude_delegated` is always `1` when nothing is delegated to the client. Otherwise it follows the held choice, which defaults to `0` (included). Forced OFF (included) on the `DELEGATED` selector context, which does not narrow to delegated-only |
| Hide one-off purchases for a brand | ✅ | When the brand's portal setting `@context.oneTimePurchases` is `"hidden"`, the list always excludes one-off purchases and the filter bar does not offer them |
| Owning contract's billing-cycle label | ✅ | `contractBillingCycleLabel` — undefined when the read carries no contract relation |
| Display title and price summary per row | ✅ | `title` (the shared product title) and `priceTermSummary` ("£4 monthly", "£60") on every mapped product |
| Dashboard grouped counts | ✅ | `loadGroupedCounts` |
| Purchased-category read | ✅ | `loadPurchasedCategories` |
| Load one contract product in detail | ✅ | `useContractProduct` |
| One combined cancellation form (soft / hard / scheduled) | ✅ | `openCancellation`, `set`, `submitCancellation` — offered options depend on the record; disappears entirely once auto-expiring, mid-request, or already scheduled |
| Stop / resume automatic renewal (soft cancellation) | ✅ | Subscription products only; `stopRenewing` / `resumeRenewing` |
| Request / withdraw an immediate cancellation (hard cancellation) | ✅ | `requestCancellation` / `withdrawCancellation` — moved here from the contract module (a contract only groups product ids) |
| Book / revoke a scheduled (future-dated) cancellation | ✅ | `scheduleCancellation` / `revokeScheduledCancellation`. The module sends whatever date it is given — it does not validate the date itself. `minFutureCancellationDate` gives the earliest valid date; the caller steps whole billing cycles from it |
| Consolidation form | ✅ | `openConsolidation`, `set`, `submitConsolidation` (or `setConsolidation` directly) — offered only to a live, non-staged subscription whose client preference and catalogue product both allow it. A choice equal to the current value is not sent |
| Change of plan (upgrade / downgrade) | ✅ | `openMigration`, `selectMigrationTarget`, `migrate` — offered only to a recurring single product that is active or suspended and has plans its own plan allows. The cost is previewed by a dry run before the commit. See [usage.md](./usage.md) |
| Turn renewal invoicing on or off | ✅ | `setAutoRenew(on)`, gated by `canDisableAutoRenew` / `canEnableAutoRenew`. Not `stopRenewing` |
| Raise the next invoice now | ✅ | `issueNextInvoice()`, gated by `canIssueNextInvoice`. Resolves the invoice |
| End a trial early | ✅ | `endTrial()`, gated by `canEndTrial`. Resolves the invoice (the credit note when the trial ends by cancelling), or `null` when it raised none |
| Set the client label | ✅ | `setClientLabel(label)`, gated by `canUpdateContractProduct`. `""` clears it |
| Change the billing entity | ✅ | `setBillingEntity(pick)`, where `pick` is `BillingEntityChoice \| string`: the picker id, or `{ address }` or `{ company }`, gated by `canSetBillingEntity`. The billing entity is a form region on both `available` and `unavailable`: `openBillingEntity` opens it, `set` feeds it, `submitBillingEntity` sends it. A pick of the current entity sends nothing, closes the form and resolves the current product. A platform refusal rejects and keeps the form open with its model. An id the loaded list does not hold rejects with the validation errors. `false` means a closed gate. Needs the manager's read: a list row has no `billingAddressId` / `billingCompanyId` |
| Unpaid-invoice facts | ✅ | The meta flags `hasUnpaidRecurringInvoices`, `isDue` and `isCancellable`, read off `unpaidRecurringInvoices`. The full unpaid set of a product is a `useInvoices` read |

## Key Concepts

### The status/setup/trial parallel regions

A loaded contract product's lifecycle is reported as three simultaneous facts, not one status string: which published status it sits in (or `staged`/`cancelled`/`lapsed`/`fraud`, reported as `unavailable`), whether setup is complete, and whether it's on a trial. All three are exposed as independent meta flags.

The settled read places the status node directly: the load's completion walks one ordered list of guards over the record that read returned (staged, cancelled, lapsed, fraud, cancelling, expiring, then the four published codes). A record that matches none lands on `error`.

### One cancellation form, three options

`openCancellation()` opens ONE form; `submitCancellation()` reads `model.option` and routes to whichever write that option means. "Soft" (`stopRenewing`/`resumeRenewing`) takes effect at the current paid-through end date and carries no target date. "Hard" (`requestCancellation`/`withdrawCancellation`) asks for immediate cancellation, reviewed by staff. "Scheduled" (`scheduleCancellation`/`revokeScheduledCancellation`) books an exact future anniversary date with no review. All three are independent capabilities on independent server endpoints, and the six direct-call actions (`stopRenewing`, `resumeRenewing`, `requestCancellation`, `withdrawCancellation`, `scheduleCancellation`, `revokeScheduledCancellation`) each open + set + submit the form in one call, so existing callers never have to drive the form manually. Which options the form actually offers (zero, one, two or all three) depends entirely on the product's own record facts — see gotchas.md.

### Actor Types

Client-only by capability, and the two composables enforce it differently. On the COLLECTION, `.as('staff')`, `.as('guest')` and `.as('self')` resolve no context — `self` is not a shorthand for `client` here, it is its own non-resolving entry. On the MANAGER, the matrix refuses every actor, so `.for()` is a compile error for all four; `.as()` compiles for any actor and the services reject a caller the session cannot address:

```typescript
import {
  ContractProductsContextTypes,
  ScopeActorTypes,
  useContractProduct,
  useContractProducts
} from "@upmind-automation/headless";

declare const id: string;

const products = useContractProducts().as(ScopeActorTypes.CLIENT);
// "delegated" turns the exclude-delegated preference OFF — it returns the
// client's own products together with any delegated ones, not a delegated-only list.
const withDelegated = useContractProducts().as(ScopeActorTypes.CLIENT).for(ContractProductsContextTypes.DELEGATED);
const product = useContractProduct().as(ScopeActorTypes.CLIENT).withId(id);
```

## Documentation

| Doc | Audience | Content |
|-----|----------|---------|
| **This README** | Everyone | Overview, concepts, quick start |
| [foundation.md](./foundation.md) | External / portable spec | Framework-agnostic capability + data reference |
| [Usage](./usage.md) | All Devs | API reference, examples |
| [Architecture](./architecture.md) | Internal / Contributors | State machine, data flow, dependencies |
| [Gotchas](./gotchas.md) | All | Edge cases, known issues |
| [Changelog](./CHANGELOG.md) | All | Version history |
