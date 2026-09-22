# contract-product Module

A client's own contract products — the individual, billable line items inside their contracts. Two scoped composables: `useContractProducts` (the query-backed collection) and `useContractProduct` (the per-product manager, backed by `contract-product.machine.ts`). Client scope only — `staff` and `guest` are compile-time errors on both.

## What Is This? (ELI5)

- **`useContractProducts`** = the list view: "show me all my contract products, filtered and sorted".
- **`useContractProduct`** = the detail view: "load this one contract product and let me act on it" — stop/resume renewal, set consolidation, book or revoke a scheduled cancellation.

> **🧪 For Testers:** See [gotchas.md](./gotchas.md) for the future-cancellation anniversary rules and the subscription-only write guards.

> **👩‍💻 For Developers:** Both composables share one services file (`contract-product.services.ts`) and one cache key (`["contracts"]`) — every write invalidates the whole module's cache, not just the touched query.

## Quick Start

```typescript
const products = useContractProducts().as("client");
await products.useActions().isReady();
const { data } = products.useContext();

const product = useContractProduct().as("client").for("contract-product", productId);
await product.useActions().isReady();
const { isActive, isSubscription } = product.useMeta();
```

See [Usage](./usage.md) for the complete API reference.

## Features

| Feature | Status | Notes |
|---------|--------|-------|
| List / filter / sort the client's own contract products | ✅ | `useContractProducts` |
| Include/exclude delegated products | ✅ | Preference-driven; forced `0` on the `DELEGATED` selector context |
| Dashboard grouped counts | ✅ | `loadGroupedCounts` |
| Purchased-category read | ✅ | `loadPurchasedCategories` |
| Load one contract product in detail | ✅ | `useContractProduct` |
| Stop / resume automatic renewal | ✅ | Subscription products only |
| Set invoice-consolidation preference | ✅ | Subscription products only |
| Book / revoke a scheduled (future-dated) cancellation | ✅ | Anniversary-validated date only |
| Unpaid-invoice due/cancellable predicates | ✅ | Pure functions over `unpaidRecurringInvoices` |

## Key Concepts

### The status/setup/trial parallel regions

A loaded contract product's lifecycle is reported as three simultaneous facts, not one status string: which published status it sits in (or `staged`/`cancelled`/`lapsed`/`fraud`, reported as `unavailable`), whether setup is complete, and whether it's on a trial. All three are exposed as independent meta flags.

### Soft cancel vs. scheduled cancel

"Stop renewing" (`stopRenewing`/`resumeRenewing`) takes effect at the current paid-through end date and carries no target date. "Schedule cancel" (`scheduleCancellation`/`revokeScheduledCancellation`) books an exact future anniversary date. They are independent capabilities on independent server endpoints.

### Actor Types

Client-only. `.as('staff')` and `.as('guest')` do not resolve on either composable's scope matrix:

```typescript
const products = useContractProducts().as("client");
const delegated = useContractProducts().as("client").for("delegated");
const product = useContractProduct().as("client").for("contract-product", id);
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
