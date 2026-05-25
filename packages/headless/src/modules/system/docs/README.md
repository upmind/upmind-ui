# System Module

The system module owns cross-cutting platform data and integrations: countries, billing cycles, regions, places (Google Maps), localisation (i18n), recaptcha, file uploads, and analytics/tracking.

If a piece of data is "the same regardless of who's logged in" — country list, billing cycle definitions, currency formatting — it lives here.

## What Is This?

Think of `useSystem` as the **reference-data lookup** for the headless app:

- "What's the country object for `GB`?" → `getCountry("GB")`
- "How long is a 12-month billing cycle's display label?" → `getBillingCycle(12)`
- "Which regions does Canada have?" → `fetchRegions("CA")`

Submodules wrap third-party platform concerns (Google Places, reCAPTCHA, GTM/dataLayer) so the rest of the app talks to a single, branded interface.

## Quick Start

```typescript
import { useSystem } from "@upmind-automation/headless";

const { ensureCountries, getCountry, ensureBillingCycles, getBillingCycle } =
  useSystem();

// Load before sync use (typically inside a machine `load` service)
await Promise.all([ensureCountries(), ensureBillingCycles()]);

// Then sync lookups are populated
const country = getCountry("GB");
const cycle = getBillingCycle(12);
```

> **🧪 For Testers:** If a country defaults to nothing or a billing cycle label renders blank, the upstream code probably forgot to `ensure*()` first. See [gotchas.md](./gotchas.md).

> **👩‍💻 For Developers:** Country/billing cycle data is **lazy-loaded** as of FE-1698. Sync getters return `undefined` until the matching `ensure*()` resolves. See [usage.md](./usage.md).

> **🔧 For Contributors:** State is held in module-scoped singleton query refs. The composable is intentionally not a state machine — it's a thin wrapper around TanStack queries plus stores for regions.

## Submodules

| Submodule      | Entry                                                                                        | Purpose                                      |
| -------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `useSystem`    | [`useSystem.ts`](../useSystem.ts)                                                            | Countries, billing cycles, regions           |
| `localisation` | [`useI18n`](../localisation/useI18n.ts), [`useLocale`](../localisation/useLocale.ts)         | i18n setup and locale switching              |
| `places`       | [`usePlaces`](../places/usePlaces.ts)                                                        | Google Places autocomplete + address parsing |
| `recaptcha`    | [`useRecaptcha`](../recaptcha/useRecaptcha.ts)                                               | reCAPTCHA v3 token generation (XState)       |
| `upload`       | [`useUpload`](../upload/useUpload.ts)                                                        | File upload with progress (XState)           |
| `analytics`    | [`useTracking`](../analytics/useTracking.ts), [`useDataLayer`](../analytics/useDataLayer.ts) | GTM / dataLayer integration                  |
| `clientArea`   | [`clientArea/`](../clientArea/)                                                              | Slot + template render utilities             |
| `form`         | [`form/`](../form/)                                                                          | JSON Forms type augmentation                 |

## Documentation

- [Architecture](./architecture.md) — how the pieces fit together
- [Usage](./usage.md) — API reference + recipes
- [Gotchas](./gotchas.md) — known edge cases
- [CHANGELOG](./CHANGELOG.md) — version history

## Key Concept: Lazy Reference Data (FE-1698)

Countries and billing cycles are **fetched on-demand**, not on app boot:

- `ensureCountries()` / `ensureBillingCycles()` — async, idempotent, safe to call from any machine `load`
- `getCountry()` / `getBillingCycle()` — sync, only valid after a corresponding `ensure*()` has resolved at least once

**Rule of thumb:** if you write a sync schema parser/formatter that calls `getCountry()` or `getBillingCycle()`, the **machine that runs it** must `await ensure*()` in its `load` service. See [gotchas.md](./gotchas.md#1-lazy-loading--getcountry--getbillingcycle-return-undefined-until-ensure-is-called-fe-1698).
