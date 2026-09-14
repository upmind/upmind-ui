# client-billing-settings — Gotchas

The sharp edges of the consolidation-preference read view and its editor. For anyone consuming `useBillingSettings` / `useBillingSettingsManager`, or writing tests against them.

> **🧪 For Testers:** Every section below carries a 🧪 expected-behaviour statement. Fixture names point at the recorded request/response pairs in `__tests__/fixtures/`.

## 1. Turning consolidation OFF is `0`, and `0` is falsy — assert the literal, never "truthy or not"

`InvoiceConsolidationTypes.DISABLED` is the number `0`. Anything in a test, or in calling code, that checks "is this field set?" with a plain truthiness test (`if (model.enabled)`) will treat an explicit off exactly the same as "never touched" — which is the single highest-risk failure mode in this module.

```ts
await manager.useActions().update({ enabled: 0 });
// → PUT body MUST carry: { "invoice_consolidation_enabled": 0 }
// NOT an omitted key, NOT `false`, NOT dropped as "empty"
```

> **🧪 For Testers:** Assert the outbound body's exact key and exact literal value. A test that accepts "either `0` is present, or the key is just missing" is not a stronger assertion — it is a weaker one that would still pass if the code silently dropped the off state.

Fixture: `put-clients-id-case-enabled-off.json` (`{"invoice_consolidation_enabled": 0}`).

## 2. `enabled` is never `null` — the other four fields can be

The on/off/follow switch always holds one of three literal values (`0` / `1` / `2`) and is deliberately **not** modelled nullable — "follow the brand" is its own third enum value, not an absence. The other four fields (`baseRule`, `dayOfWeek`, `dateOfMonthDay`, `dueDateDay`) each defer to the brand's own default by being `null`.

```ts
// ✅ Right — follow the brand via the switch's own third value
await manager.useActions().update({ enabled: 2 });

// ❌ Wrong — enabled is never modelled nullable; this is a type error
await manager.useActions().update({ enabled: null });

// ✅ Right — the OTHER four fields defer via null
await manager.useActions().update({ baseRule: null });
```

Fixtures: `put-clients-id-case-enabled-inherit.json` (`enabled: 2`), `put-clients-id-case-base-rule-clear.json` (`baseRule: null`).

## 3. The visibility gate defaults to HIDDEN — an absent key is not "not restricted"

`useMeta().isVisible` (on both composables) is `true` **only** when the brand's own configuration explicitly carries the literal value `false` for the single visibility key. An absent key, a literal `true`, and a failed fetch of that key all resolve to the same outcome: hidden.

```ts
// Brand config key absent entirely  → isVisible === false
// Brand config key === true          → isVisible === false
// Brand config key === false         → isVisible === true  (the ONLY case that shows the surface)
```

> **🧪 For Testers:** Seed all three states and confirm only the explicit `false` case reports `isVisible: true` — on **both** the read view and the editor independently. A regression here has historically inverted the polarity on the editor half while leaving the read half correct, so testing only one half is not sufficient.

Fixture: `get-config-brand-values-keys-invoices-consolidation-restrict-to-staff.json`.

## 4. The shared cache key can be poisoned by a sibling module this module does not control

This module reads `clients/{id}?with=custom_fields,custom_fields.field` under the **same** cache key as `client-personal-details` and `client-custom-fields` — deliberately, so a page mounting more than one of the three dedupes onto a single request. This module's own reads are safe: it uses the reactive query primitive, which applies field-selection per observer, in isolation.

**The risk is a sibling, not this module.** `client-custom-fields` reads this same shared key through the platform's one-shot fetch-and-select primitive (its own `loadClientBrandId`, selecting just `brand_id`), which bakes its own field-selection **inside** the cached function itself. If that call wins the race to populate the entry, the cache holds that bare `brand_id` string for the entry's full freshness window — and this module's own reactive read, mounting afterward, silently reports every field as `undefined` instead of erroring. The same hazard has been observed in practice in `client-personal-details`'s own service file, which is why that module's own one-shot reads deliberately bypass the shared cache too.

> **🧪 For Testers:** If a test seeds this module in isolation, this risk cannot surface — it requires the sibling's own one-shot read to run first, in the same process, against the same cache. Do not assume an isolated pass proves the shared key is safe in a real multi-module page.

## 5. `clear()` still races a pending debounced `input()` — `revert()` does not

Typing into the form schedules a debounced parse. Calling `clear()` immediately afterward resets the model right away — but if the debounce window from the last keystroke hasn't closed yet, that pending `input()` call still fires afterward and silently repopulates the field `clear()` just emptied.

```ts
manager.useActions().input({ baseRule: "daily" }); // debounced — scheduled, not yet sent
manager.useActions().clear(); // model clears NOW
// ...350ms later, the pending input() from the line above still fires
// and silently repopulates baseRule — clear() did not survive
```

`revert()` was fixed against this exact race (it flushes/cancels the pending debounce before restoring); `clear()` was not. This is a known, open one-line gap — the fix is cancelling the pending debounce as the first step of `clear()`, mirroring what `revert()` already does.

> **🧪 For Testers:** Do not assume `clear()` and `revert()` share the same debounce safety just because they look like siblings. Test them separately, and specifically with a still-pending `input()` in flight when each is called.

## 6. The read view and the editor are registered under two DIFFERENT internal names — do not assume they share a scope key

Some other scoped modules in this codebase register a query-backed collection and a machine-backed editor under one shared internal name, relying on the editor always supplying its own `.for()` or `.fresh()` to keep the two composables' scope keys apart. **This module cannot use that pattern**, because a client has exactly one preference — the editor's normal, everyday call (`.as(ScopeActorTypes.CLIENT)`, no further argument) would produce the _identical_ scope key the read view's own normal call produces, under a shared name. So this module's two composables are registered under two distinct internal names instead; they still share one scope matrix and one identity-resolution function underneath.

```ts
// Both of these resolve the SAME target client, through the SAME seam —
// but they are two SEPARATE registry entries, not one shared instance.
const settings = useBillingSettings().as(ScopeActorTypes.CLIENT);
const manager = useBillingSettingsManager().as(ScopeActorTypes.CLIENT);
```

> **🧪 For Testers:** Do not expect destroying one composable's instance to affect the other's — they are independent registry entries even though they act on the same client.

## 7. A staged, unprocessed import locks the editor independently of the machine's own state

A save attempted while the owning client record is a staged, unprocessed import is refused **before any request is sent**, checked directly against a fresh one-shot read of the record — not against whatever the machine's own context happens to hold. This means the lockout applies even to a caller that reaches past the composable and calls the underlying service directly.

> **🧪 For Testers:** `useMeta().isEditable` folds this check together with "not processing" and "not externally locked" into one flag — prefer asserting on `isEditable` for UI-gating tests, and assert on `isStaged` specifically when you need to isolate this one cause.

## 8. `.as()` takes an enum member, never a string literal

Both scoping methods on both composables are typed against the actual enum, not against the string a member happens to resolve to. Passing a plain string that happens to equal a member's value is a type error, not a working shortcut.

```ts
// ❌ Wrong — TS2345, not a working shortcut
const manager = useBillingSettingsManager().as("client");

// ✅ Right
const manager = useBillingSettingsManager().as(ScopeActorTypes.CLIENT);
```

**This bites hardest in specs and playground files**, because `__tests__/**` and any future playground page both sit outside this package's own build type-check. A string-literal call can sit in either for a long time looking like it works, because nothing in the normal build path ever type-checks it. Runtime behaviour is unaffected either way (the string and the enum member are the same value at runtime) — this is a compile-time coverage gap, not a functional bug.

## 9. `pnpm lint` and `pnpm install` are unsafe to run casually against this module's changes

`pnpm lint` at the repo root aborts inside a shared types submodule before it ever reaches this module, and its `--fix` flag mutates that submodule as a side effect. `pnpm install` at the repo root is unsafe in a sparse worktree missing one or more app-level `package.json` files — it silently drops those apps' entries from the shared lockfile. Neither is a safe verification step for a change scoped to this module; use the module's own targeted test commands instead.

## Common Mistakes

### Assuming a diff is computed by "does this field look set" rather than "did this field change"

A hand-rolled diff that filters out falsy-looking values before comparing against the base model will drop an explicit off (`0`) the same way it drops "never touched". The only correct diff test is an identity comparison (`!==`) against the base model, field by field — never a value-emptiness check applied afterward.

### Assuming the editor needs a `.for()` argument

It doesn't — `useBillingSettingsManager().as(ScopeActorTypes.CLIENT)` alone constructs and settles. A client has exactly one preference; there is nothing to select between.

### Treating `isVisible` as settled the instant the composable is constructed

The visibility gate resolves through its own asynchronous fetch, run in parallel with the rest of construction. Reading `isVisible` before `isReady()` has resolved (on the read view) can observe the flag's default rather than its settled value.

## Lifecycle Considerations

### Destroy the instance when done

```ts
onUnmounted(() => {
  settings.useActions().destroy();
  manager.useActions().destroy(); // also stops the underlying machine
});
```

### Wait for readiness before reading or editing

```ts
await settings.useActions().isReady(); // also waits for the visibility gate to settle
await manager.useActions().isReady(); // bounded — resolves false rather than hanging
```
