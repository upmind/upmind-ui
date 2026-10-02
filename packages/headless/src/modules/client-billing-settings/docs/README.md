# client-billing-settings

> A client's own invoice-consolidation preference — edited through a diff-only save.

## What Is This?

`client-billing-settings` holds one client's own **invoice-consolidation preference**: whether their invoices are grouped into one consolidated bill, on what cadence, and on which due date. It ships as a **new sibling module**, deliberately named for the wider billing-settings surface it will eventually anchor — the legacy client-billing page groups this preference together with several other billing panels, and those are a separate, not-yet-built capability. This module owns only the preference itself.

The module ships **one composable**, `useBillingSettings`, which opens the client's saved preference in a validated form and saves only what changed.

It acts on the calling client's own record — the only actor the composable resolves is `client`; `self`, `staff`, and `guest` are all compile-time errors. There is no capability here for one client to act on another's preference, and no capability for staff to administer it. A legacy admin surface over this same preference exists and is deliberately not built here — see [dropped-capabilities.md](./dropped-capabilities.md) for the six capabilities that surface names, and the tracked issue where they would be picked up.

> **🧪 For Testers:** The only actor that resolves on the composable is `client`. `staff` and `guest` are compile-time errors — there is nothing in this module for a staff member or a guest to reach a preference with.

## Quick Start

```ts
import { useBillingSettings, ScopeActorTypes } from "@upmind-automation/headless";

// Change a value and save
const manager = useBillingSettings().as(ScopeActorTypes.CLIENT); // callable bare — a client has exactly one preference
await manager.useActions().isReady();
const { model } = manager.useContext(); // the five persisted values (plus the account's currency fields)
await manager.useActions().input({ enabled: 0 }); // turn consolidation off
await manager.useActions().update();
```

## Features

| Capability | Surface | What it does |
| --- | --- | --- |
| Read own preference | `useBillingSettings().useContext().model` / `.baseModel` | The current and last-saved values — the five consolidation fields plus the account's currency fields |
| Know whether to show the surface at all | `useBillingSettings().useMeta().isVisible` | `true` only when the brand has explicitly opted clients in — defaults hidden |
| Edit the preference | `useBillingSettings().useActions().input()` + `.update()` | Validated form input, diff-only save — also persists the account's currency choices when they changed |
| Revert unsaved changes | `…useActions().revert()` | Restores the last-saved values |
| Clear the form | `…useActions().clear()` | Resets the editor to its starting state |
| Know whether the editor is open for input | `…useMeta().isAvailable` | `false` until the brand has opted clients into managing consolidation themselves |
| Validate as the client edits | `…useActions().input()` + `useMeta().isValid` | Reports acceptance and which field is wrong |

## Key Concepts

### One composable, one preference

The composable resolves one target client for every request it issues. A client has exactly one preference, so it is **callable bare**: `useBillingSettings().as(ScopeActorTypes.CLIENT)` with no further argument constructs and settles.

> **👩‍💻 For Developers:** The composable is registered under one internal name (`"client-billing-settings"`). See [architecture.md](./architecture.md).

### The on/off/follow switch is never `null` — the other four fields are

`enabled` always holds one of three literal values (off / on / follow-the-brand); it is never absent. The other four fields (`baseRule`, `dayOfWeek`, `dateOfMonthDay`, `dueDateDay`) each defer to the brand's own default by being `null`. Mixing these two patterns up — treating `enabled` as nullable, or expecting one of the other four to have a third literal state — produces a form that cannot represent the real preference.

> **🧪 For Testers:** Assert `enabled` is always a number (`0`, `1`, or `2`), never `null`. Assert the other four fields can each independently be `null`.

### Turning consolidation OFF sends a literal `0` — never an omission

`InvoiceConsolidationTypes.DISABLED` is `0`, which is falsy in JavaScript. This module's own diff and parsing steps are built specifically so that an explicit `0` survives all the way to the outbound `PUT` body, rather than being silently treated as "nothing to send" the way a naive falsy check would.

> **🧪 For Testers:** Set `enabled: 0` and assert the outgoing body carries the literal key `invoice_consolidation_enabled: 0` — not an omitted key, and not `false`.

### The visibility gate defaults to hidden — and the same key gates whether the editor is open at all

`useBillingSettings().useMeta().isVisible` is `true` only when the brand has explicitly configured the surface to show for clients. An absent or unreadable configuration value, or a fetch that fails outright, all resolve to hidden — never to shown.

The editor's `isAvailable` reads the identical brand configuration: the form only reports itself available once the machine has settled **and** the brand has explicitly opted clients into managing this preference themselves. A brand that never sets the key, or sets it in the staff-only direction, leaves the editor permanently unavailable — the same failure-closed default as `isVisible`.

> **🧪 For Testers:** Seed the brand config key absent, `true`, and `false` and confirm only the `false` case reports `isVisible: true` — and that only the `false` case ever lets the editor's `isAvailable` settle `true`.

### Saves are diff-only, and an empty diff is a genuine no-op

`update()` compares the current model against the base model it was seeded from and sends only what differs. Calling it with nothing dirty resolves successfully with **zero** requests.

> **🧪 For Testers:** Change nothing and call `update()` — assert zero network activity, not a request with an empty body.

### Saving also writes the account's own currency choices, in the same call

`update()` persists two different records in one call when both are dirty: the five consolidation fields, and the account's own billing currency / preferred payment currency. Each is diffed and sent independently — a save touching only one of the two issues exactly one request, never a second, empty one for the other. The preferred-payment-currency field can only ever be written when the brand has separately opted clients into paying in a different currency; the model does not offer the field at all when that choice is closed.

### Errors are state — the module raises nothing

No toast, no notification. Every failure is captured where the consumer can read and render it: `useContext().errors` / `.validationErrors` and `useMeta().hasErrors`.

## Documentation

| Doc | Audience | Content |
| --- | --- | --- |
| **This README** | Everyone | Overview, concepts, quick start |
| [usage.md](./usage.md) | All devs | Full API reference |
| [architecture.md](./architecture.md) | Internal / contributors | Data flow, the shared identity seam, dependencies |
| [gotchas.md](./gotchas.md) | All | The sharp edges — the falsy-zero hazard, the visibility tri-state, the `clear()` debounce race |
| [foundation.md](./foundation.md) | Teams building against the platform on another stack | Framework-neutral platform spec: endpoints, payloads, failure modes |
| [dropped-capabilities.md](./dropped-capabilities.md) | All | The staff-administration surface this module deliberately does not build, and where it is tracked |
| [CHANGELOG.md](./CHANGELOG.md) | All | Change history |
