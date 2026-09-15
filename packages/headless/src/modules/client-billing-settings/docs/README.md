# client-billing-settings

> A client's own invoice-consolidation preference — read and edited through a diff-only save.

## What Is This?

`client-billing-settings` holds one client's own **invoice-consolidation preference**: whether their invoices are grouped into one consolidated bill, on what cadence, and on which due date. It ships as a **new sibling module**, deliberately named for the wider billing-settings surface it will eventually anchor — the legacy client-billing page groups this preference together with several other billing panels, and those are a separate, not-yet-built capability. This module owns only the preference itself.

The module ships **two composables**, because reading and editing are different jobs:

| Surface | Composable | Use it when |
| --- | --- | --- |
| **The read view** | `useBillingSettings` | You are showing the client's currently saved preference |
| **The editor** | `useBillingSettingsManager` | You are showing a form to change the preference |

Both act on the calling client's own record — the only actor either composable resolves is `client`; `self`, `staff`, and `guest` are all compile-time errors. There is no capability here for one client to act on another's preference, and no capability for staff to administer it. A legacy admin surface over this same preference exists and is deliberately not built here — see [dropped-capabilities.md](./dropped-capabilities.md) for the six capabilities that surface names, and the tracked issue where they would be picked up.

> **🧪 For Testers:** The only actor that resolves on either composable is `client`. `staff` and `guest` are compile-time errors — there is nothing in this module for a staff member or a guest to reach a preference with.

## Quick Start

```ts
import {
  useBillingSettings,
  useBillingSettingsManager,
  ScopeActorTypes
} from "@upmind-automation/headless";

// --- The read view
const settings = useBillingSettings().as(ScopeActorTypes.CLIENT);
const { data } = settings.useContext(); // the five persisted values + isStaged
await settings.useActions().isReady();

// --- The editor: change a value and save
const manager = useBillingSettingsManager().as(ScopeActorTypes.CLIENT); // callable bare — a client has exactly one preference
await manager.useActions().isReady();
await manager.useActions().input({ enabled: 0 }); // turn consolidation off
await manager.useActions().update();
```

## Features

| Capability | Surface | What it does |
| --- | --- | --- |
| Read own preference | `useBillingSettings().useContext().data` | The five persisted values, plus `isStaged` |
| Know whether to show the surface at all | `useBillingSettings().useMeta().isVisible` (and the manager's own `isVisible`) | `true` only when the brand has explicitly opted clients in — defaults hidden |
| Edit the preference | `useBillingSettingsManager().useActions().input()` + `.update()` | Validated form input, diff-only save |
| Revert unsaved changes | `…useActions().revert()` | Restores the last-saved values |
| Clear the form | `…useActions().clear()` | Resets the editor to its starting state |
| Lock the editor externally | `…useActions().setDisabled(true)` | Refuses input/save independent of the record's own state |
| Know whether a save is safe right now | `…useMeta().isEditable` | `false` while staged, processing, or externally locked |
| Validate as the client edits | `…useActions().input()` + `useMeta().isValid` | Reports acceptance and which field is wrong |

## Key Concepts

### Two composables, one preference, two DIFFERENT registry names

The read view and the editor share one scope matrix and one identity seam — whichever one issues a request, it resolves the same target client. A client has exactly one preference, so the editor is **callable bare**: `useBillingSettingsManager().as(ScopeActorTypes.CLIENT)` with no further argument constructs and settles.

> **👩‍💻 For Developers:** Because both composables share a single-member context, the "no `.for()` supplied" call produces the identical scope key for both — so, unlike some other converted modules, this module registers the two composables under two DIFFERENT internal names (`"client-billing-settings"` and `"client-billing-settings-manager"`) rather than one shared name. See [architecture.md](./architecture.md).

### The on/off/follow switch is never `null` — the other four fields are

`enabled` always holds one of three literal values (off / on / follow-the-brand); it is never absent. The other four fields (`baseRule`, `dayOfWeek`, `dateOfMonthDay`, `dueDateDay`) each defer to the brand's own default by being `null`. Mixing these two patterns up — treating `enabled` as nullable, or expecting one of the other four to have a third literal state — produces a form that cannot represent the real preference.

> **🧪 For Testers:** Assert `enabled` is always a number (`0`, `1`, or `2`), never `null`. Assert the other four fields can each independently be `null`.

### Turning consolidation OFF sends a literal `0` — never an omission

`InvoiceConsolidationTypes.DISABLED` is `0`, which is falsy in JavaScript. This module's own diff and parsing steps are built specifically so that an explicit `0` survives all the way to the outbound `PUT` body, rather than being silently treated as "nothing to send" the way a naive falsy check would.

> **🧪 For Testers:** Set `enabled: 0` and assert the outgoing body carries the literal key `invoice_consolidation_enabled: 0` — not an omitted key, and not `false`.

### The visibility gate defaults to hidden

`useBillingSettings().useMeta().isVisible` and the manager's own `isVisible` are both `true` only when the brand has explicitly configured the surface to show for clients. An absent or unreadable configuration value, or a fetch that fails outright, all resolve to hidden — never to shown.

> **🧪 For Testers:** Seed the brand config key absent, `true`, and `false` and confirm only the `false` case reports `isVisible: true`, on BOTH composables.

### Saves are diff-only, and an empty diff is a genuine no-op

`update()` compares the current model against the base model it was seeded from and sends only what differs. Calling it with nothing dirty resolves successfully with **zero** requests.

> **🧪 For Testers:** Change nothing and call `update()` — assert zero network activity, not a request with an empty body.

### A staged, unprocessed import locks the editor

While the owning client record is a staged, not-yet-processed import, every save is refused before any request is sent — a check independent of the machine's own general edit-lock, so calling the service directly cannot bypass it.

### Errors are state — the module raises nothing

No toast, no notification. Every failure is captured where the consumer can read and render it: `useContext().error` / `useMeta().hasErrors` on the read view; `useContext().errors` / `.validationErrors` and `useMeta().hasErrors` on the editor.

## Documentation

| Doc | Audience | Content |
| --- | --- | --- |
| **This README** | Everyone | Overview, concepts, quick start |
| [usage.md](./usage.md) | All devs | Full API reference for both composables |
| [architecture.md](./architecture.md) | Internal / contributors | Data flow, the shared identity seam, dependencies |
| [gotchas.md](./gotchas.md) | All | The sharp edges — the falsy-zero hazard, the shared cache key, the visibility tri-state, the `clear()` debounce race |
| [foundation.md](./foundation.md) | Teams building against the platform on another stack | Framework-neutral platform spec: endpoints, payloads, failure modes |
| [dropped-capabilities.md](./dropped-capabilities.md) | All | The staff-administration surface this module deliberately does not build, and where it is tracked |
| [CHANGELOG.md](./CHANGELOG.md) | All | Change history |

## Playground

No playground page exists yet for this module. It is a newly introduced sibling module; the client-billing page a playground would drive also mounts the not-yet-built sibling capability this module's own scope forwards to (brand-default resolution and the combined multi-panel save) — a playground page is expected once that capability lands.
