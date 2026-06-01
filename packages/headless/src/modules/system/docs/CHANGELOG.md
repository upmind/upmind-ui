# Changelog

All notable changes to the system module.

Format follows [Keep a Changelog](https://keepachangelog.com/).

---

## [Unreleased]

### Changed — FE-1698: Lazy `useSystem`

`useSystem` no longer eagerly fetches countries and billing cycles on instantiation. Data is now loaded on-demand.

#### Added

- `ensureCountries(): Promise<ICountry[]>` — async, idempotent loader. Activates and caches the countries query.
- `ensureBillingCycles(): Promise<IBillingCycle[]>` — async, idempotent loader for billing cycles.
- [`docs/gotchas.md`](./gotchas.md) — explains the lazy-loading contract and where each consumer machine should `ensure*()`.
- JSDoc warnings on sync utilities that depend on lazy data:
  - `parseSummaryDetailWithPrice`, `parseProvisioningSchema` ([`product/utils.ts`](../../product/utils.ts))

#### Changed

- `isReady()` resolves immediately when no queries have been activated.
- `refresh()` only refetches queries that have been activated (no longer triggers unnecessary network calls).
- `meta.isComplete` is `true` when no queries are activated (was previously `false`).
- The post-load background refresh side effect now only runs when there are activated queries.
- Machine `load` services updated to `await Promise.all([... ensureCountries(), ensureBillingCycles()])`:
  - `product` machine (`packages/headless/src/modules/product/services.ts`)
  - `session/guest` machine (already had `ensureCountries`)

#### Deprecated

- `fetchCountries()` — kept as alias for `ensureCountries()`. Migrate callers to `ensureCountries()`.

#### Migration Guide

**Before (sync getter usable anywhere):**

```typescript
const { getCountry } = useSystem();
const code = getCountry()?.code; // worked because of eager fetch
```

**After (must ensure upstream):**

```typescript
// In the machine load service:
const { ensureCountries } = useSystem();
await ensureCountries();

// In the sync util it invokes:
const { getCountry } = useSystem();
const code = getCountry()?.code; // populated because load awaited
```

If a sync schema parser, formatter, or assign action calls `getCountry()` / `getBillingCycle()`, audit the **calling machine's `load` service** and add the matching `ensure*()` to its `Promise.all`. See [`gotchas.md`](./gotchas.md) for the full pattern and the per-machine table.

#### Why

Eager fetching meant every consumer paid the country + billing-cycle network cost on first composable use, even on flows that never needed them (e.g. direct deep-links into payment, error pages). Lazy loading scopes the cost to flows that actually consume the data.
