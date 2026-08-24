# Brand — Usage & API

`useBrand()` is a flat utility composable — not a scoped, actor-aware factory. There is
no `.for(actor, id)`, no state machine, and no `useMeta()` / `useContext()` / `useActions()`
sub-composable split. Guest, client, and staff all read the exact same brand data; brand
config is actor-agnostic, so there is nothing to scope.

## Singleton behaviour

Every call to `useBrand()` — anywhere in the app — shares the same four backing queries
(`modulesQuery`, `brandConfigQuery`, `brandSettingsQuery`, `organisationConfigQuery`).
They are created once, on the first call, and memoized at module scope. A second
`useBrand()` call does not trigger a second fetch; it reads the same in-flight or
resolved query state as the first.

Because the queries are module-scoped rather than instance-scoped, there is no
`destroy()` and no registry lifecycle to manage — unlike a scoped/flow composable,
brand state is never torn down for the life of the app.

## Readiness

```typescript
const { isReady } = useBrand();

const ok = await isReady(); // resolves true once all 4 queries are fetched, false if any errored
```

`isReady()` polls every 100ms until `meta.value.isComplete` is true (all four queries
report `isFetched`), then resolves `true`, or `false` if `meta.value.hasError` is set.

`meta` is a computed with:

| Field         | Meaning                              |
| ------------- | ------------------------------------ |
| `isEmpty`     | at least one query's data is empty   |
| `hasError`    | at least one query errored           |
| `isLoading`   | at least one query is still loading  |
| `isComplete`  | all four queries have fetched        |
| `isAvailable` | brand settings has resolved a `name` |

## State

```typescript
const {
  brandId,
  name,
  countryId,
  currencyId,
  currency,
  currencies,
  image,
  styles,
  favicon,
  uiTheme,
  language,
  languages,
  taxType,
  includesTax,
  defaultPaymentPeriod,
  enforceEmailVerification,
  hasUpmindBranding,
  hasStorefront,
  keepsUserInSitu,
  storefrontUrl,
  storefrontRoute,
  errors,
  uiCart,
  i18nMessages,
  uischema,
  uischema_Display,
  uischema_Route
} = useBrand();
```

All of the above are Vue `ComputedRef`s derived from the four queries — reading them
before `isReady()` resolves returns whatever partial/default value is available, not an
error.

## Methods

```typescript
const {
  hasModuleEnabled,
  getConfig,
  getConfigValue,
  ensureConfig,
  getAnalytics,
  validateCurrency,
  validateLanguage,
  isSupportedLanguage,
  refresh,
  invalidate
} = useBrand();
```

- **`hasModuleEnabled(code)`** — synchronous. `true` if the given module code is present
  in the licensed module catalogue.
- **`getConfig(keys)`** / **`getConfigValue(key)`** — synchronous reads against whatever
  config is _already loaded_. They never trigger a fetch. If a key was never requested
  (see below), `getConfigValue` returns `undefined` and `getConfig` returns `{}` for it —
  neither throws.
- **`ensureConfig(keys)`** — async. Widens the requested key set, triggers
  `fetchBrandConfig`, awaits it, and resolves with just the requested subset picked out of
  the result. Use this when you need a key you're not sure is already loaded.
- **`getAnalytics()`** — convenience wrapper: `ensureConfig` for the GA measurement ID and
  GTM container ID keys.
- **`validateCurrency(model)`** — async. Resolves `{ id?, code? }` against the brand's
  supported currency list; falls back to the brand's default currency if unmatched.
- **`validateLanguage(model)`** — sync. Same resolution against the supported language
  list.
- **`isSupportedLanguage(locale)`** — sync boolean check against the supported language
  list.
- **`refresh()`** — refetches all four queries.
- **`invalidate()`** — invalidates the whole `["brand"]` query-key namespace.

## Reading config keys beyond the default set

`fetchBrandConfig` only ever grows its requested key set — it never shrinks it. The keys
you ask for accumulate in a module-level store (`brandConfigKeysStore`) across every call
to `ensureConfig` / `getAnalytics` / the initial default-key fetch, for the life of the
app.

```typescript
import { BrandConfigKeys } from "@upmind-automation/types";

const { ensureConfig } = useBrand();

const values = await ensureConfig([BrandConfigKeys.SUPPORT_PIN_ENABLED]);
// values.support_pin_enabled is now available — and stays available for every
// future getConfig / getConfigValue call, without calling ensureConfig again.
```

Practical implications:

- **Widening is always safe.** Asking for a new key merges it into the existing set; no
  previously-loaded key is dropped.
- **"Un-requesting" a key does nothing.** There is no way to shrink the set — once a key
  has been requested anywhere in the app during the session, it stays loaded until the
  page reloads or `invalidate()` runs.
- Prefer `getConfigValue` / `getConfig` for a key you know some earlier code path already
  requested (e.g. one in the module's default key list); reach for `ensureConfig` only
  when you need a key that isn't guaranteed to be loaded yet.

## Vue usage example

```vue
<script setup>
import { useBrand } from "@upmind-automation/headless";

const { isReady, currency, name } = useBrand();
</script>

<template>
  <div v-if="!isReady()">Loading brand…</div>
  <div v-else>
    <p>{{ name }} — prices shown in {{ currency?.code }}</p>
  </div>
</template>
```

In practice, resolve `isReady()` once (e.g. in `onMounted` or a top-level app bootstrap)
rather than calling it directly in a template guard on every render — it is an async
poll, not a plain computed.

Brand has no schema-driven form surface — there is no `schema` / `layout` pair to feed a
form renderer. `uischema` (and its `uischema_Display` / `uischema_Route` siblings) is
consumed as opaque brand-configured layout data, not a JSON Schema Form contract.
