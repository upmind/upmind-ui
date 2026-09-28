# client-orders Module

Reads a signed-in client's own placed orders — the history, one order in full, and the gates for paying or cancelling it.

## What Is This? (ELI5)

Think of it like a customer's own order-history page at any online shop: a list you can search and filter, and a receipt-style detail page for one order.

- **`useClientOrders`** = the history list — search, filter, sort, page through your own orders.
- **`useClientOrder`** = one order's receipt page — its items, its status, and the pay/cancel buttons' on/off state.

> **🧪 For Testers:** The four accepted differences from the legacy app (equal-filter spelling, the search/filter-bar interaction, the past-the-last-page landing spot, and the pay control's surface shape) are in [gotchas.md](./gotchas.md).

> **👩‍💻 For Developers:** Both composables are **client-only** — there is no staff variant and no `.for(client, id)` retargeting. Every read goes out under the signed-in client's own identity; a signed-out caller sends no request at all.

## Quick Start

```ts
import { ScopeActorTypes, useClientOrders } from "@upmind-automation/headless";

const orders = useClientOrders().as(ScopeActorTypes.SELF);
const { data, pagination } = orders.useContext();
const { isLoading, isEmpty } = orders.useMeta();

await orders.useActions().isReady();
orders.useActions().setPage(2);
```

See [Usage](./usage.md) for the complete API reference.

## Features

| Feature | Status | Notes |
| --- | --- | --- |
| List, page, sort, search and filter a client's own placed orders | ✅ | Forces the `new_contract` category on every request. |
| Read one order in full — detail, items, status meta | ✅ | Items resolve snapshot-first, with a live fallback only when no snapshot was ever captured. |
| Item catalogue images | ✅ | A second, non-blocking read once the order's items are known. |
| Online-gateway condition | ✅ | Read from the response envelope's reported total, never a row count. |
| Pay delegate | ✅ | Delegates to the existing payment engine; the completed-payment stale-mark still needs a real staging payment to prove end-to-end. |
| Cancel delegate | ✅ | Delegates through an injectable port; rejects distinctly until a contract-cancellation flow connects to it. |
| Playground / browser-driven proof | ⏳ | The scoped composables are complete; the labs-nuxt driven page and its e2e harness are a separate, not-yet-landed lane. |

## Key Concepts

### The history and the single read are separate composables

`useClientOrders` (the history) and `useClientOrder` (one order) are two independent scoped composables sharing the same underlying request shape and cache root. They do not share a query instance — reading the history does not load one order, and opening one order does not refresh the history, though a pay or a cancel on one order marks both stale.

### Everything client, everything self

Neither composable accepts a staff actor or a `.for(client, id)` retarget — every attempt to compile one is a type error, and the guard also refuses it at request time. This module reads exactly one identity: whoever is currently signed in.

### Pay and cancel are delegates, not local actions

Paying hands the order to the platform's existing payment engine and republishes its whole surface under the engine's own member names. Cancelling hands the order's contract id to an injectable port — nothing is wired to that port by default, so a cancel attempt on an otherwise-eligible order fails with a distinct error until something registers against it.

### Actor Types

The module uses the scoped composable pattern with `.as()`, but only ever resolves the client (self) actor:

```ts
import { ScopeActorTypes, useClientOrders } from "@upmind-automation/headless";

// The only supported actor — a customer reading their OWN orders.
const clientOrders = useClientOrders().as(ScopeActorTypes.SELF);

// A staff actor, or a `.for('client', id)` retarget, does not compile here —
// there is no staff cell and no delegated-entity cell for this module.
```

## Documentation

| Doc | Audience | Content |
| --- | --- | --- |
| **This README** | Everyone | Overview, concepts, quick start |
| [Foundation](./foundation.md) | Architects rebuilding on another stack | Rebuild-grade capability + data-shape reference |
| [Usage](./usage.md) | All devs | API reference, examples |
| [Architecture](./architecture.md) | Internal / contributors | Data flow, dependencies, internals |
| [Gotchas](./gotchas.md) | All | Edge cases, accepted divergences from the legacy app |
| [Changelog](./CHANGELOG.md) | All | Version history |

## Playground

A runnable demo lives in the labs playground, once its driven page lands:

```bash
cd playgrounds/labs-nuxt
pnpm dev
```

Then navigate to `/useClientOrders` (the history) or `/useClientOrder/<orderId>` (one order).

**Playground location:** `playgrounds/labs-nuxt/modules/scenarios/useClientOrders/`, `playgrounds/labs-nuxt/modules/scenarios/useClientOrder/`.

> **🔧 For Contributors:** The driven browser page and its e2e proof are a separate lane from this module's own test suite — do not assume the playground page is live just because the composables are.
