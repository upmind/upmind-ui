# Gotchas

Known edge cases, common mistakes, and things to watch for in the system module.

---

## 1. Lazy Loading — `getCountry()` / `getBillingCycle()` return `undefined` until `ensure*` is called (FE-1698)

> **🧪 For Testers:** If a country defaults to nothing or a billing cycle label renders blank/wrong, the upstream service likely forgot to call `ensureCountries()` / `ensureBillingCycles()` before its parser ran.

**Problem:** As of FE-1698, `useSystem()` no longer eagerly fetches countries or billing cycles on init. They're loaded **on-demand** via:

- `ensureCountries(): Promise<ICountry[]>`
- `ensureBillingCycles(): Promise<IBillingCycle[]>`

The synchronous accessors `getCountry()` / `getBillingCycle()` return `undefined` until the data has been loaded. This means a sync schema parser or formatter that calls them **before any `ensure*` has fired** will silently produce wrong defaults — no error, just blank country fields, missing labels, etc.

### The pattern

> Each XState **machine's `load` service** should `await ensure*()` for whatever sync data its actions/utils will need.

By the time a sync schema parser, formatter, or assign action runs **inside that machine**, the data is loaded and `getCountry()` / `getBillingCycle()` work correctly.

```typescript
// ✅ Correct — machine load service ensures upfront
async function load(_context, _event) {
  const { ensureConfig } = useBrand();
  const { ensureCountries, ensureBillingCycles } = useSystem();

  await Promise.all([
    ensureConfig(BrandConfigKeys.SHOW_PROMOTION_AS),
    ensureCountries(),
    ensureBillingCycles()
  ]);
  // ... rest of load
}
```

```typescript
// ✅ Sync utility runs AFTER load — getCountry() is populated
export const useRegisterSchemaParser = (data: any) => {
  const { getCountry } = useSystem();
  return {
    properties: {
      phone: {
        properties: {
          country: { default: getCountry()?.code || "" } // Safe — load() already awaited ensureCountries()
        }
      }
    }
  };
};
```

### Anti-patterns

```typescript
// ❌ Sync util tries to use getCountry() in a path that didn't ensure first
export function parseProvisioningSchema(data, product) {
  const { getCountry } = useSystem();
  const defaultCountry = getCountry(); // undefined! No upstream ensure()
  // ...
}
```

```typescript
// ❌ Adding ensure() inside a sync function — it returns a promise but you can't await it
export function parseProductSummary(raw) {
  const { ensureBillingCycles, getBillingCycle } = useSystem();
  ensureBillingCycles(); // fire-and-forget — STILL undefined this call
  return getBillingCycle(raw.billing_cycle_months); // Likely undefined
}
```

### Where to ensure — principles, not a list

A hardcoded "this machine ensures X" table goes stale the moment someone refactors. Apply these rules instead:

#### 1. Ensure as **late** as possible — at the narrowest state that needs the data

If only the `register` substate parses a country default, ensure inside the service that gates that substate (e.g. `getCustomFields`), not in the top-level `load`. This way unrelated paths (login, labs, deep-links to states that don't need country/cycle data) don't pay for the fetch.

#### 2. Ensure in the **machine** that owns the path, not in the sync util

`ensure*()` is async and idempotent. Sync utils (`getCountry`, `getBillingCycle`, schema parsers, formatters) must stay sync. Adding `ensure*().then(...)` inside a sync util is the **fire-and-forget anti-pattern** above — it returns before the data arrives.

#### 3. Fire-and-forget is fine **inside an async service that the consuming code awaits afterwards**

```typescript
async function getCustomFields(_ctx, _ev) {
  const { ensureCountries } = useSystem();
  ensureCountries(); // kicks off the fetch in parallel
  return get({ url: "..." }); // by the time this resolves, countries is populated
}
```

The async work that follows (network call, machine transition, action) gives the in-flight `ensure*()` time to land. Don't rely on this if there's nothing async between the `ensure*()` call and the sync `get*()`.

#### 4. Prefer transitive coverage over duplicating

If a machine spawns or subscribes to another machine that already ensures (e.g. `basketProduct`, `recommendationsEngine` and `productCatalogue` all sit downstream of `useBasket`), don't re-ensure. The basket machine's `load` ensures both, and the basketHelper subscription propagates readiness.

#### 5. The locality rule

When you write a sync util that calls `getCountry()` or `getBillingCycle()`, ask: **"which machine state does this util run inside?"** That state's invoked service is where `ensure*()` belongs. If you can't answer that question, the util is being called from an ambiguous context and probably needs a refactor.

#### Audit checklist

- [ ] Search the codebase for `getCountry(` and `getBillingCycle(` (excluding the system module itself).
- [ ] For each call, trace which machine state runs the surrounding util.
- [ ] Confirm that state's service (or an upstream service it awaits) calls the matching `ensure*()`.
- [ ] If the util is called from multiple states, the **earliest converging** async service is where to ensure — usually the machine's `load` or its first invoked service.

### Test scenarios for QA

#### A. Deep-link into a flow that uses sync `getCountry()` / `getBillingCycle()`

For each of the routes below, **clear localStorage** and **hard-refresh directly** onto the URL (don't navigate from another page — that would warm the caches via the wrong machine):

| Route                                | What to verify                                                                                      |
| ------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `/order/auth/register/`              | Phone country default populates. Country dropdown defaults to brand country. No blank labels.       |
| `/order/basket/.../shop/`            | Catalogue prices show billing cycle labels ("Monthly", "Annually", etc.).                           |
| `/order/product/{pid}/`              | Product configurator shows term cards with cycle labels and country defaults in any address inputs. |
| `/order/basket/.../recommendations/` | Recommendation cards show prices with cycle labels.                                                 |
| `/order/.../domains/`                | TLD search results show prices with cycle labels.                                                   |
| `/order/basket/.../checkout/`        | Billing details form has country defaults populated.                                                |

**Pass criteria:**

- Country dropdowns default to the brand's country (not blank).
- Billing cycle labels render as words ("Monthly", "Annually"), not as raw month numbers or blanks.
- No console errors / warnings about undefined country or billing cycle.

#### B. Cost-of-init checks (no needless fetches)

These pages should **not** trigger every system fetch on init:

| Route                   | Should fire?                              | Should NOT fire                                                   |
| ----------------------- | ----------------------------------------- | ----------------------------------------------------------------- |
| `/order/auth/login/`    | `countries` ❌ (login doesn't need it)    | `clients_fields` (only register loads custom fields)              |
| Labs `/`                | nothing system-related                    | `countries`, `billing_cycles`, `orders/current`, `clients_fields` |
| `/order/auth/register/` | `countries` + `clients_fields` (parallel) | duplicate countries calls under different locales                 |

Open the network tab, hard-refresh, and confirm only the expected endpoints fire — once each.

#### C. If something is missing

| Symptom                                             | Likely cause                                                                                                                                                                                                        |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Blank country default                               | The current state's invoked service didn't `ensure*()` — apply principle 1 above                                                                                                                                    |
| Blank billing-cycle label                           | Same — trace back to which machine state runs the parser util                                                                                                                                                       |
| Duplicate `countries` / `billing_cycles` calls      | A caller is invoking `ensure*()` before brand/locale has resolved. The composable internally awaits brand readiness; duplicates here usually mean a separate code path is hitting `services.fetch*` directly (rare) |
| `getCountry()` returning `undefined` in a sync util | Anti-pattern: the util is being called from a state whose service didn't ensure first — see "Anti-patterns" above                                                                                                   |

---

## See also

- [`useSystem.ts`](../useSystem.ts) — composable definition
- FE-1698 — Lazy `useSystem` migration ticket
