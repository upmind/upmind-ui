# Brand — Architecture

## Overview

Brand is a flat composable over four independent TanStack Query queries — there is no
XState machine and no actor split. `useBrand()` fetches the same data for guest, client,
and staff alike; brand identity and policy configuration are not actor-scoped, so there is
no `.for(actor, id)` retargeting and no per-actor service arm to document. The module's
job is to resolve, cache, and expose that data as a single set of computed refs and
methods, and to keep it warm across every call site in the app (see Singletons below).

## The four queries

| Query                     | Endpoint                          | Mapper (`brand.mappers.ts`) | Notable options                                                                                                                                                          |
| ------------------------- | --------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `fetchBrandSettings`      | `GET /brand/settings`             | `mapBrandSettings`          | `staleTime: "static"`; `retry: false` — a 5xx here means the tenant doesn't exist, a deterministic answer, not a transient fault worth retrying; `localStoragePersister` |
| `fetchBrandConfig`        | `GET /config/brand/values`        | `mapBrandConfig`            | `staleTime: "static"`; `withoutLocale: true`; `localStoragePersister`; criteria-driven (see below)                                                                       |
| `fetchModules`            | `GET /org/modules`                | —                           | `staleTime: "static"`; `withoutLocale: true`; `localStoragePersister`                                                                                                    |
| `fetchOrganisationConfig` | `GET /config/organisation/values` | —                           | `staleTime: "static"`; `withoutLocale: true`; `localStoragePersister`                                                                                                    |

`mapBrandSettings` also inverts the settings response's `meta.i18n` block from
key-first (`{ "cart.title": { en: "...", fr: "..." } }`) to locale-first
(`{ en: { "cart.title": "..." } }`) so it can be handed straight to `vue-i18n` as
`LocaleMessages`.

## Singletons

`modulesQuery`, `brandConfigQuery`, `brandSettingsQuery`, and `organisationConfigQuery`
are module-scope `let` bindings, created once on first call via `??=` and reused by every
subsequent `useBrand()` call. This is why brand needs no `destroy()` — there is nothing
per-call-site to tear down, unlike a flow/wizard composable. `useBrand` is one of this
codebase's long-lived singleton composables, alongside `basket` and `session-store`.

## Keyed-config criteria channel

`fetchBrandConfig` does not take a fixed key list. It widens a module-level
`brandConfigKeysStore` — a `@tanstack/vue-store` `Store<BrandConfigKeys[]>` — by merging
in whatever keys the caller passes (defaulting to `defaultBrandConfigKeys` on the first,
unparameterised call), append-only: keys are never removed from the store once added.

It then issues a single `query()` call under a **fixed** `queryKey: ["brand", "config"]`,
carrying the accumulated key set as a filter criterion rather than as part of the key
list itself:

```typescript
criteria: {
  schema: useQuerySchema(),
  model: { filters: { keys: { eq: brandConfigKeysStore.state } } }
}
```

`useQuerySchema()` (`brand.schemas.ts`) declares the single `filters.keys.eq` branch as a
Draft-07 schema. `translateQuery` / `toWireFilterValue` (`packages/headless/src/modules/query/query.utils.ts`)
walk that declaration and emit the key set on the wire as `filter[keys|eq]=<comma-joined
keys>` — the wire format documented in `docs/foundation.md`. `mapBrandConfig`
(`brand.mappers.ts`) then backfills every key in the _requested_ set that the API
response didn't return, defaulting it to `null`, so a consumer always sees the full
requested key set regardless of which keys the platform actually has a value for.

Because the `queryKey` does not vary by key set, a smaller in-flight request resolving
_after_ a larger one has already landed is a real staleness risk — this is already
captured in `docs/foundation.md`'s Lessons section ("Brand config is sparse and keyed,
and the set of keys grows over the session"); this doc cites it rather than restating it.

## Dependencies

### Depends on

| Module   | Usage                                                                                                          |
| -------- | -------------------------------------------------------------------------------------------------------------- |
| `query`  | `useQuery` for all four fetches; `localStoragePersister` for cross-session cold-start caching                  |
| `config` | `useConfig({ brand: () => uiCart.value, basket: undefined })` — resolves `storefrontUrl` / `catalogueDisabled` |

The `basket: undefined` argument is a deliberate singleton guard, not an oversight —
verbatim from `useBrand.ts`:

> Singleton to avoid creating multiple useConfig instances across useBrand calls.
> basket: undefined breaks the useBasket → useBrand → useConfig → useBasket cycle —
> useBrand only consumes data settings (storeUrl, catalogueDisabled), it doesn't
> evaluate conditional rules, so it has no need for basket plumbing.

### Depended on by

See `docs/foundation.md`'s Dependants table for the full, weighted list of modules that
read brand-derived state — not duplicated here.

## Integration points

| System                     | Integration                                                                                                                                                                                                                                     |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@upmind-automation/types` | Supplies `BrandConfigKeys`, `OrgFeatureKeys`, `IBrandSettings`, `IUpmindModule`, `BrandTaxTypes`, `BasketFunnelling`, `DefaultPaymentPeriod`, `UpmindModuleCodes` — the shared enums/types brand's mappers and computed refs are typed against. |

## Module-boundary note

`packages/headless/src/modules/brand/index.ts` re-exports both `./useBrand` and
`../brand-terms` through brand's own barrel:

```typescript
export * from "./useBrand";
export * from "../brand-terms";
```

`brand-terms` (terms & conditions) is a sibling module, not a sub-module of brand — it has
its own directory and its own concerns. Routing its exports through brand's barrel is an
existing module-boundary quirk worth a maintainer's attention; it is noted here for
visibility, not addressed by this doc.
