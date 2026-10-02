# contract Module

A client's own contracts — the billing envelope that groups a set of contract products together. Two scoped composables: `useContracts` (the filterable, sortable, pageable collection) and `useContract` (the per-contract manager, backed by `contract.machine.ts`). Both support the CLIENT'S OWN scope only — `.as('staff')` and `.as('guest')` are compile-time errors.

Every cancellation write (soft, hard or scheduled) lives on the sibling `contract-product` module, not here. This module keeps exactly ONE write: changing which stored payment method pays the contract's future invoices. A contract only groups product ids; changing what happens to one product is the sibling's job.

## What Is This? (ELI5)

- **`useContracts`** = the list view: "show me all my contracts, filtered, sorted, one page at a time."
- **`useContract`** = the detail view: "load this one contract and let me change its payment method" — nothing else is writable here.

> **🧪 For Testers:** See [gotchas.md](./gotchas.md) for the payment-method no-op refusal and the embedded `products` rows' unfilled members.

> **👩‍💻 For Developers:** Both composables share one services file (`contract.services.ts`) and one cache key (`["contracts"]`) — the same root the sibling `contract-product` module writes through, so a cancellation write on a product also refreshes this module's own reads.

## Quick Start

```typescript
import { ScopeActorTypes, useContract, useContracts } from "@upmind-automation/headless";

declare const contractId: string;

const contracts = useContracts().as(ScopeActorTypes.CLIENT);
await contracts.useActions().isReady();
const { data } = contracts.useContext();

const contract = useContract().as(ScopeActorTypes.CLIENT).withId(contractId);
await contract.useActions().isReady();
const { isActive, isProcessing } = contract.useMeta();
```

See [Usage](./usage.md) for the complete API reference.

## Features

| Feature | Status | Notes |
|---------|--------|-------|
| Filter, sort and page through the client's own contracts | ✅ | `useContracts` — quick search; filters on name, order number, status code, created/next-due date ranges, recurring total; sort on created_at, next_due_date, total_amount, status |
| Load one contract in full detail | ✅ | `useContract` |
| Look up one of the client's own contracts by name (picker) | ✅ | `useContracts` — `useContext().schemas.contractPicker`; searches `filters.name.like` via its own `GET contracts?with=status` request |
| Set the contract's payment method | ✅ | `useContract` — `openPaymentMethod`/`input`/`update`, or the direct `setPaymentMethod` call; offered only for a subscription the client owns — never a one-off contract, never one delegated to the client. Within that, offered on every live status and on a cancelled/lapsed contract, refused when fraudulent |
| No-op refusal on an unchanged payment method | ✅ | Submitting the method the contract already uses, or none, sends nothing and resolves `false` |

## Key Concepts

### One write, on the envelope, not the products

`useContract` carries exactly one write form (`paymentMethod`). Every cancellation capability — stop/resume renewal, request/withdraw an immediate cancellation, book/revoke a scheduled one, invoice consolidation — lives on `useContractProduct` instead, addressed one product at a time. A contract groups the ids of the products it holds; it does not act on them.

### The payment-method form is also offered while unavailable

The form is offered only for a subscription (billing cycle above zero) the client owns. A one-off contract, or a contract with a product delegated to the client, never offers it. Within that, and unlike every other capability, the form is offered not only on the contract's live (`available`) status nodes but also on `cancelled` and `lapsed` — a client may still want a valid card on file even after cancellation. It is refused on a contract flagged fraudulent.

### How the status node is placed

The settled read places the status node directly: the load's completion walks one ordered list of guards over the record that read returned (cancelled, lapsed, fraud, cancelling, then the four published codes). A record that matches none lands on `error`.

### Actor Types

Client-only by capability. `.as('staff')` and `.as('guest')` resolve no context on either composable's matrix:

```typescript
import { ScopeActorTypes, useContract, useContracts } from "@upmind-automation/headless";

declare const contractId: string;

const contracts = useContracts().as(ScopeActorTypes.CLIENT);
const contract = useContract().as(ScopeActorTypes.CLIENT).withId(contractId);
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
