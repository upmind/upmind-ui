# client-billing-settings — Gotchas

The sharp edges of the consolidation-preference composable. For anyone consuming `useBillingSettings`, or writing tests against it.

> **🧪 For Testers:** Every section below carries a 🧪 expected-behaviour statement. Fixture names point at the recorded request/response pairs in `__tests__/fixtures/`.

## 1. Turning consolidation OFF is `0`, and `0` is falsy — assert the literal, never "truthy or not"

`InvoiceConsolidationTypes.DISABLED` is the number `0`. Anything in a test, or in calling code, that checks "is this field set?" with a plain truthiness test (`if (model.enabled)`) will treat an explicit off exactly the same as "never touched" — which is the single highest-risk failure mode in this module.

```ts
import type { UseBillingSettings } from "@upmind-automation/headless";
declare const manager: ReturnType<UseBillingSettings["fresh"]>;

await manager.useActions().update({ enabled: 0 });
// → PUT body MUST carry: { "invoice_consolidation_enabled": 0 }
// NOT an omitted key, NOT `false`, NOT dropped as "empty"
```

> **🧪 For Testers:** Assert the outbound body's exact key and exact literal value. A test that accepts "either `0` is present, or the key is just missing" is not a stronger assertion — it is a weaker one that would still pass if the code silently dropped the off state.

Fixture: `put-clients-id-case-enabled-off.json` (`{"invoice_consolidation_enabled": 0}`).

## 2. `enabled` is never `null` — the other four fields can be

The on/off/follow switch always holds one of three literal values (`0` / `1` / `2`) and is deliberately **not** modelled nullable — "follow the brand" is its own third enum value, not an absence. The other four fields (`baseRule`, `dayOfWeek`, `dateOfMonthDay`, `dueDateDay`) each defer to the brand's own default by being `null`.

```ts
import type { UseBillingSettings } from "@upmind-automation/headless";
declare const manager: ReturnType<UseBillingSettings["fresh"]>;

// ✅ Right — follow the brand via the switch's own third value
await manager.useActions().update({ enabled: 2 });

// ❌ Wrong — enabled is never modelled nullable; BillingSettingsModel has no
// null for it (update() also accepts a loose record, so it is not caught here)
await manager.useActions().update({ enabled: null });

// ✅ Right — the OTHER four fields defer via null
await manager.useActions().update({ baseRule: null });
```

Fixtures: `put-clients-id-case-enabled-inherit.json` (`enabled: 2`), `put-clients-id-case-base-rule-clear.json` (`baseRule: null`).

## 3. The visibility gate defaults to HIDDEN — an absent key is not "not restricted"

`useMeta().isVisible` is `true` **only** when the brand's own configuration explicitly carries the literal value `false` for the single visibility key. An absent key, a literal `true`, and a failed fetch of that key all resolve to the same outcome: hidden.

```ts
// Brand config key absent entirely  → isVisible === false
// Brand config key === true          → isVisible === false
// Brand config key === false         → isVisible === true  (the ONLY case that shows the surface)
```

> **🧪 For Testers:** Seed all three states and confirm only the explicit `false` case reports `isVisible: true` — and that `isAvailable` follows it: only the explicit `false` case can ever settle `isAvailable` to `true`.

Fixture: `get-config-brand-values-keys-invoices-consolidation-restrict-to-staff.json`.

## 4. The preference read has its own cache entry — it is not shared with client-personal-details

This module reads `clients/{id}?with=accounts,accounts.currency` under its own cache entry. `client-personal-details` reads the same client record with a different slice (`custom_fields,custom_fields.field`) under a different entry. A page mounting both therefore issues one `clients/{id}` request each, not one for the pair.

> **🧪 For Testers:** A test seeding this module alongside `client-personal-details` should expect one `clients/{id}` request per module — assert request COUNT per slice, not a single deduped request.

## 5. `clear()` still races a pending debounced `input()` — `revert()` does not

Typing into the form schedules a debounced parse. Calling `clear()` immediately afterward resets the model right away — but if the debounce window from the last keystroke hasn't closed yet, that pending `input()` call still fires afterward and silently repopulates the field `clear()` just emptied.

```ts
import type { UseBillingSettings } from "@upmind-automation/headless";
declare const manager: ReturnType<UseBillingSettings["fresh"]>;

manager.useActions().input({ baseRule: "daily" }); // debounced — scheduled, not yet sent
manager.useActions().clear(); // model clears NOW
// ...350ms later, the pending input() from the line above still fires
// and silently repopulates baseRule — clear() did not survive
```

`revert()` was fixed against this exact race (it flushes/cancels the pending debounce before restoring); `clear()` was not. This is a known, open one-line gap — the fix is cancelling the pending debounce as the first step of `clear()`, mirroring what `revert()` already does.

> **🧪 For Testers:** Do not assume `clear()` and `revert()` share the same debounce safety just because they look like siblings. Test them separately, and specifically with a still-pending `input()` in flight when each is called.

## 6. One composable, one registry name — repeated calls return the same instance

`useBillingSettings` is registered under the single internal name `client-billing-settings`. A client has exactly one preference, so the everyday call (`.as(ScopeActorTypes.CLIENT)`, no further argument) always lands on the same registry entry.

```ts
import { ScopeActorTypes, useBillingSettings } from "@upmind-automation/headless";

// Both calls return the SAME scoped instance.
const first = useBillingSettings().as(ScopeActorTypes.CLIENT);
const second = useBillingSettings().as(ScopeActorTypes.CLIENT);
```

> **🧪 For Testers:** Destroying the instance from one call site destroys it for every consumer of that scope — destroy it once, when the last consumer unmounts.

## 7. The consolidation write is refused by default — a missing brand opt-in reads as restricted, not as "not yet set"

The consolidation fields are only ever written when the brand has explicitly opted clients into managing them (the same key `useMeta().isVisible` / `isAvailable` read). A brand that has never touched the key, or has set it in the staff-only direction, refuses the `clients/{id}` write **before any request is sent** — checked at the service layer, so a caller reaching past the composable and calling the underlying service directly cannot bypass it either. This gate is independent of the account-currency write, which is refused separately (and only) when a preferred-payment-currency change is attempted while that choice is closed.

> **🧪 For Testers:** Seed the brand config key absent, `true`, and `false` and confirm only the `false` case lets a consolidation-field save issue a request — the other two must reject with zero network activity, even when the model itself is valid.

## 8. `.as()` takes an enum member, never a string literal

The actor argument is typed against the actual enum, not against the string a member happens to resolve to. Passing a plain string that happens to equal a member's value is a type error, not a working shortcut.

```ts
import {
  ScopeActorTypes,
  useBillingSettings
} from "@upmind-automation/headless";

// ❌ Wrong — TS2345, not a working shortcut
// @ts-expect-error — a plain string is not a ScopeActorTypes member
const wrongManager = useBillingSettings().as("client");

// ✅ Right
const manager = useBillingSettings().as(ScopeActorTypes.CLIENT);
```

**This bites hardest in specs**, because `__tests__/**` sits outside this package's own build type-check. A string-literal call can sit in a spec for a long time looking like it works, because nothing in the normal build path ever type-checks it. Runtime behaviour is unaffected either way (the string and the enum member are the same value at runtime) — this is a compile-time coverage gap, not a functional bug.

## 9. `pnpm lint` and `pnpm install` are unsafe to run casually against this module's changes

`pnpm lint` at the repo root aborts inside a shared types submodule before it ever reaches this module, and its `--fix` flag mutates that submodule as a side effect. `pnpm install` at the repo root is unsafe in a sparse worktree missing one or more app-level `package.json` files — it silently drops those apps' entries from the shared lockfile. Neither is a safe verification step for a change scoped to this module; use the module's own targeted test commands instead.

## 10. The trap was the context's NAME, not `.for()` itself — a resource-named member carrying the client's own id

This module used to name its shared context `ClientBillingSettingsContextTypes.SETTINGS` — the context member named the RESOURCE being edited (the settings) while the id it actually carried was the CLIENT's own id. The type and the id it carried disagreed about which entity was named. A short-lived correction (since reversed) misdiagnosed that as `.for()` itself being wrong and dropped the context entirely in favour of a bare `.withId(id)` — which erased the compile-time gate: `resolveClientId` fell back to `id ?? activeUser.value?.id` with no actor check at all, so `staff`/`guest` could name any client id too.

The actual fix (ADR-001 amendment 2026-09-15) is a rename, not a removal: the member is now `ClientBillingSettingsContextTypes.CLIENT = AccessRoleTypes.CLIENT`, matching every sibling client module. The matrix gate is real again — `.for(CLIENT, id)` is spellable **only** for the `client` actor; `self`, `staff` and `guest` are `null as never`, so `.as(ScopeActorTypes.STAFF).for(...)` is a compile-time error exactly as it was before the context was ever dropped.

```ts
import {
  useBillingSettings,
  ScopeActorTypes,
  ClientBillingSettingsContextTypes
} from "@upmind-automation/headless";

const otherClientId = "825d96e7-63ed-0913-46c4-174825283406";

// ✅ Right — only `client` may spell a retarget
const asClient = useBillingSettings()
  .as(ScopeActorTypes.CLIENT)
  .for(ClientBillingSettingsContextTypes.CLIENT, otherClientId);

// ⚠️ Does not compile — the matrix pins `staff` to `null as never`
useBillingSettings()
  .as(ScopeActorTypes.STAFF)
  // @ts-expect-error — staff resolves no context in this module's matrix
  .for(ClientBillingSettingsContextTypes.CLIENT, otherClientId);
```

> **🧪 For Testers:** `.for(ClientBillingSettingsContextTypes.CLIENT, id)` is a compile-time refusal for `staff` and `guest`, not a runtime one — write a type-level check (an `@ts-expect-error`), not a runtime assertion. See [dropped-capabilities.md](./dropped-capabilities.md) for the staff-administration surface that remains unbuilt regardless of this context's name.

## Common Mistakes

### Assuming a diff is computed by "does this field look set" rather than "did this field change"

A hand-rolled diff that filters out falsy-looking values before comparing against the base model will drop an explicit off (`0`) the same way it drops "never touched". The only correct diff test is an identity comparison (`!==`) against the base model, field by field — never a value-emptiness check applied afterward.

### Assuming a client id resolved into `.for(...)` is validated against the caller

The context id this module's `.for(...)` takes is a plain caller-supplied value. Nothing in this contract checks locally that it matches the calling session's own client — `.as(ScopeActorTypes.CLIENT).for(ClientBillingSettingsContextTypes.CLIENT, someOtherId)` compiles and addresses that other id's preference, on the caller's own session bearer. Whether the platform actually honours the request is a server-side authorization decision, not something this contract enforces or advertises. This is narrower than a staff or on-behalf-of capability: there is no way to act _as_ a different party here. A **bare** `.as(ScopeActorTypes.STAFF)` or `.as(ScopeActorTypes.GUEST)` **type-checks** — the shared matrix's `null as never` row removes `.for(...)` and nothing else — and is refused at **runtime** instead. It is `.as(ScopeActorTypes.STAFF).for(...)` that is the compile-time error.

### Assuming the preference needs a `.for()` argument

It doesn't — `useBillingSettings().as(ScopeActorTypes.CLIENT)` alone constructs and settles. A client has exactly one preference; there is nothing to select between.

### Treating `isVisible` as settled the instant the composable is constructed

The visibility gate resolves through its own asynchronous brand-configuration fetch, run as part of the machine's loading phase. Reading `isVisible` before `isReady()` has resolved can observe the flag's default (hidden) rather than its settled value.

## Lifecycle Considerations

### Destroy the instance when done

```ts
import { onUnmounted } from "vue";
import { ScopeActorTypes, useBillingSettings } from "@upmind-automation/headless";

const manager = useBillingSettings().as(ScopeActorTypes.CLIENT);

onUnmounted(() => {
  manager.useActions().destroy(); // stops the underlying machine and deregisters the instance
});
```

### Wait for readiness before reading or editing

```ts
import { ScopeActorTypes, useBillingSettings } from "@upmind-automation/headless";

const manager = useBillingSettings().as(ScopeActorTypes.CLIENT);

await manager.useActions().isReady(); // bounded — resolves false rather than hanging
```
