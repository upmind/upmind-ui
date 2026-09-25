# contract Module

A client's own contracts — the billing envelope that groups a set of contract products together. Two scoped composables: `useContracts` (the pagination-only collection) and `useContract` (the per-contract manager, backed by `contract.machine.ts`). Both support the CLIENT'S OWN scope only — `.as('staff')` and `.as('guest')` are compile-time errors.

Every cancellation write (soft, hard or scheduled) lives on the sibling `contract-product` module, not here. This module keeps exactly ONE write: changing which stored payment method pays the contract's future invoices. A contract only groups product ids; changing what happens to one product is the sibling's job.

## What Is This? (ELI5)

- **`useContracts`** = the list view: "show me all my contracts, one page at a time" — no filter, no sort.
- **`useContract`** = the detail view: "load this one contract and let me change its payment method" — nothing else is writable here.

> **🧪 For Testers:** See [gotchas.md](./gotchas.md) for the payment-method no-op refusal and the read's deliberately narrow `products` shape.

> **👩‍💻 For Developers:** Both composables share one services file (`contract.services.ts`) and one cache key (`["contracts"]`) — the same root the sibling `contract-product` module writes through, so a cancellation write on a product also refreshes this module's own reads.

## Quick Start

```typescript
const contracts = useContracts().as("client");
await contracts.useActions().isReady();
const { data } = contracts.useContext();

const contract = useContract().as("client").withId(contractId);
await contract.useActions().isReady();
const { isActive, isProcessing } = contract.useMeta();
```

See [Usage](./usage.md) for the complete API reference.

## Features

| Feature | Status | Notes |
|---------|--------|-------|
| Page through the client's own contracts | ✅ | `useContracts` — pagination only, no filter or sort surface |
| Load one contract in full detail | ✅ | `useContract` |
| Set the contract's payment method | ✅ | `useContract` — `openPaymentMethod`/`input`/`update`, or the direct `setPaymentMethod` call; offered on every live status and on a cancelled/lapsed contract, refused only when fraudulent |
| No-op refusal on an unchanged payment method | ✅ | Submitting the method the contract already uses, or none, sends nothing and resolves `false` |

## Key Concepts

### One write, on the envelope, not the products

`useContract` carries exactly one write form (`paymentMethod`). Every cancellation capability — stop/resume renewal, request/withdraw an immediate cancellation, book/revoke a scheduled one, invoice consolidation — lives on `useContractProduct` instead, addressed one product at a time. A contract groups the ids of the products it holds; it does not act on them.

### The payment-method form is also offered while unavailable

Unlike every other capability, the payment-method form is offered not only on the contract's live (`available`) status nodes but also on `cancelled` and `lapsed` — a client may still want a valid card on file even after cancellation. It is refused only on a contract flagged fraudulent.

### Actor Types

Client-only by capability. `.as('staff')` and `.as('guest')` resolve no context on either composable's matrix:

```typescript
const contracts = useContracts().as("client");
const contract = useContract().as("client").withId(contractId);
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
