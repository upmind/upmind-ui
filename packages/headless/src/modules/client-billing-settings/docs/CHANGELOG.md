# Changelog

All notable changes to the `client-billing-settings` module are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added

- **A new sibling module** covering a client's own invoice-consolidation preference — the read view (`useBillingSettings`) and the editor (`useBillingSettingsManager`), sharing one scope matrix and one identity-resolution seam.
- **A diff-only save** across five persisted fields, with correct clear semantics: the on/off/follow switch survives an explicit off (`0`) all the way to the outbound request; the other four fields survive an explicit clear as a literal `null`. Both are present in the body, never omitted, and a field is only ever sent when it actually changed.
- **A visibility gate that defaults to hidden** — the preference surface is shown to a client only when the brand has explicitly opted in; an absent key, an explicit non-opt-in, or a failed fetch of the gate all fail toward hidden, on both the read view and the editor.
- **A staged-import lockout** — a save attempted while the owning client record is a staged, unprocessed import is refused before any request is sent, checked independently of the editor's own general edit-lock.
- **An external lock** (`setDisabled()`) that a consumer can apply from outside the editor's own gates, independent of whether the record itself would otherwise allow editing.
- **`revert()`** — restores the model to its last-saved values, safe even when a debounced form input is still pending.
- **A bounded editor readiness** — `isReady()` times out rather than waiting forever on a failed lookup.
- **The manager is callable with no argument** — `useBillingSettingsManager().as(ScopeActorTypes.CLIENT)` constructs and settles.
- **The barrel is the module's only public surface** — curated named exports only; the services, mappers, schemas, and machine-config file each carry an internal marker.
- **A shared cache key with two sibling modules** (`client-personal-details`, `client-custom-fields`) — reading the same underlying client record under the same key, safely, because this module's own reads use the reactive query primitive rather than a one-shot selecting read.

### Changed

- **The shared context member is named `CLIENT`**, matching every sibling client module. It briefly carried the resource-flavoured name `SETTINGS` (the id it carried was the CLIENT's own, not the settings record's), and was for a short period dropped entirely by a since-reversed change that misread that mismatch as `.for()` itself being wrong. `ClientBillingSettingsContextTypes` and `CLIENT_BILLING_SETTINGS_SCOPE_MATRIX` are exported from the module barrel (and the package root); they were not released under the `SETTINGS` name, so this rename ships with no migration burden. `client` is the only actor the matrix grants the context to; `self`, `staff` and `guest` remain `null as never`. See [gotchas.md](./gotchas.md#10-the-trap-was-the-contexts-name-not-for-itself--a-resource-named-member-carrying-the-clients-own-id).

### Known limitations

- **A staff-administration surface for reading or writing another client's preference is not built.** The scope matrix refuses `staff` and `guest` a `.for()` context at compile time — see [dropped-capabilities.md](./dropped-capabilities.md#the-refusal-and-where-it-is-enforced). A legacy administrative surface over this same preference exists and is recorded, capability by capability, with its own tracked issue — see [dropped-capabilities.md](./dropped-capabilities.md).
- **A wider client-billing-settings surface this module is named for is not built here.** Resolving what a `null` field displays as (the brand's own default), deciding which fields are visible for a given cadence-rule selection, and coordinating a combined save/revert across other billing panels on the same page are all a separate, not-yet-built capability. This module writes the preference and reports its own persisted values only.
- **`clear()` still carries a debounce race that `revert()` was fixed against.** A pending, still-debounced form input can fire after `clear()` has already reset the model, silently repopulating the field `clear()` just emptied. This is a known, open, one-line gap — see [gotchas.md](./gotchas.md#5-clear-still-races-a-pending-debounced-input--revert-does-not).
- **No playground page exists yet.** One is expected once the wider billing-settings surface this module forwards to lands.

### Recorded fixtures

Fifteen request/response pairs, captured live against a staging environment, back the documented behaviour:

| Fixture | Covers |
| --- | --- |
| `get-clients-id.json` | the preference read, plus the staged-import flag |
| `get-config-brand-values-keys-invoices-consolidation-restrict-to-staff.json` | the visibility-gate read |
| `put-clients-id-case-enabled-off.json` | the on/off/follow switch set to off (`0`) |
| `put-clients-id-case-enabled-on.json` | the on/off/follow switch set to on (`1`) |
| `put-clients-id-case-enabled-inherit.json` | the on/off/follow switch set to follow-the-brand (`2`) |
| `put-clients-id-case-base-rule-set.json` / `-clear.json` | the cadence rule set, and cleared back to follow-the-brand |
| `put-clients-id-case-day-of-week-set.json` / `-clear.json` | the weekly cadence day set, and cleared |
| `put-clients-id-case-day-of-month-set.json` / `-clear.json` | the monthly cadence day set, and cleared |
| `put-clients-id-case-due-date-day-set.json` / `-clear.json` | the invoice due-date day set, and cleared |
| `put-clients-id-case-diff-only.json` | two fields changed in a single save, and only those two on the wire |
| `put-clients-id-case-restore.json` | multiple fields restored to follow-the-brand together |

### Not captured

- The rejection shape for a save whose diff is invalid against the schema, or a save attempted against a staged import, has not needed a live capture — this module's own checks stop both cases locally before any request is issued.

---

## Migration Guide

This module is newly introduced — there is no prior shape to migrate from. The one exception: an in-flight consumer that imported the context member under its former name (`ClientBillingSettingsContextTypes.SETTINGS`, since renamed) hits a compile error — see "Addressing a named client's preference" below.

### Addressing a named client's preference

**Breaking change (pre-release):** the context member is named `CLIENT`, not `SETTINGS`.

```ts
import {
  useBillingSettings,
  ScopeActorTypes,
  ClientBillingSettingsContextTypes
} from "@upmind-automation/headless";

const clientId = "825d96e7-63ed-0913-46c4-174825283406";

// Before
// useBillingSettings().as(ScopeActorTypes.CLIENT).for(ClientBillingSettingsContextTypes.SETTINGS, clientId);

// After
const settings = useBillingSettings()
  .as(ScopeActorTypes.CLIENT)
  .for(ClientBillingSettingsContextTypes.CLIENT, clientId);
```

### Reading a client's own consolidation preference

```ts
const settings = useBillingSettings().as(ScopeActorTypes.CLIENT);
const { data } = settings.useContext();
await settings.useActions().isReady();
```

### Turning consolidation off

```ts
const manager = useBillingSettingsManager().as(ScopeActorTypes.CLIENT);
await manager.useActions().update({ enabled: 0 }); // → { "invoice_consolidation_enabled": 0 }
```

### Clearing a field back to "follow the brand"

```ts
await manager.useActions().update({ baseRule: null }); // → { "invoice_consolidation_base_rule": null }
```
