# basket-billing Module

Manages the billing details attached to a basket, and the form for creating a new one.

## What Is This? (ELI5)

Think of `basket-billing` as the clipboard the checkout hands you once your basket has a name on it:

- **Pick an address (and a company/phone if the brand needs one)** = fill in the clipboard
- **Commit the selection** = hand the clipboard back — the basket recalculates tax against what you picked
- **Add a new billing detail** = a separate, smaller form for creating a brand-new address/company/phone when the customer has none to choose from

> **🧪 For Testers:** the billing form only exists once a basket is "claimed" by a logged-in client — a guest basket, or a basket that belongs to someone else, never brings billing up at all. See [gotchas.md](./docs/gotchas.md).

> **👩‍💻 For Developers:** `useBasketBilling()` does not own its own lifecycle — it reads a child process the basket module starts. Call `isReady()` only after you already know the basket is claimed, or the wait can hang forever.

## Quick Start

```typescript
import { useBasketBilling } from "@upmind-automation/headless";

const billing = useBasketBilling();

await billing.isReady();

billing.set({ addressId: "addr-1", companyId: null, phoneId: null });
await billing.update({ addressId: "addr-1", companyId: null, phoneId: null });
```

See [Usage](./docs/usage.md) for the complete API reference.

## Features

| Feature                                            | Status | Notes                                                                                |
| -------------------------------------------------- | ------ | ------------------------------------------------------------------------------------ |
| Set a billing selection without committing it      | ✅     | Held on the form; no request is made until `update()`.                               |
| Commit a billing selection                         | ✅     | `PUT /orders/{basketId}?case=billing`; the order's tax is recomputed.                |
| Read billing readiness / requirements              | ✅     | Which of address / company / phone / region the brand requires.                      |
| Pause / resume validation                          | ✅     | Used while the customer is mid-way through adding a new record.                      |
| Create a new billing detail (personal or business) | ✅     | Delegates the actual create to `client-address` / `client-company` / `client-phone`. |

## Key Concepts

### Billing selection vs. billing detail

A **billing selection** is the trio of ids (address, company, phone) held on the basket. A **billing detail** is the underlying customer record a selection points at — this module can create one, but the record itself is owned by a sibling module (`client-address`, `client-company`, `client-phone`).

### The two composables

`useBasketBilling()` manages the selection already on the basket. Its `useUnifiedBillingDetail` (aliasing `useUnified()` in `./unified/`) manages the separate flow for creating a brand-new detail — personal (an address, optionally a phone) or business (a company that carries its own address and phone).

## Documentation

| Doc                                    | Audience                           | Content                                       |
| -------------------------------------- | ---------------------------------- | --------------------------------------------- |
| **This README**                        | Everyone                           | Overview, concepts, quick start               |
| [Foundation](./docs/foundation.md)     | Architects rebuilding the platform | Framework-agnostic capability + endpoint spec |
| [Usage](./docs/usage.md)               | All devs                           | API reference, examples                       |
| [Architecture](./docs/architecture.md) | Internal / Contributors            | State machine, data flow, dependencies        |
| [Gotchas](./docs/gotchas.md)           | All                                | Edge cases, known issues                      |
| [Changelog](./docs/changelog.md)       | All                                | Version history                               |

## Playground

A runnable demo is available in the labs playground:

```bash
cd playgrounds/labs
pnpm dev
```

Then navigate to `/billing` to see the billing form in action.

**Playground location:** `playgrounds/labs/src/pages/billing/`
