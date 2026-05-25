# System Usage

API reference and recipes for the `system` module.

## `useSystem()`

```typescript
const {
  // --- state
  isReady,
  meta,
  errors,
  // --- context
  countries,
  billingCycles,
  // --- get (sync — require ensure*)
  getCountry,
  getRegion,
  getRegions,
  getBillingCycle,
  // --- ensure (async — idempotent)
  ensureCountries,
  ensureBillingCycles,
  fetchRegions,
  // --- deprecated
  fetchCountries,
  // --- cache
  refresh,
  invalidate
} = useSystem();
```

### State

| Property    | Type                                     | Description                                                                                                                     |
| ----------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `isReady()` | `() => Promise<boolean>`                 | Resolves `true` when all activated queries are settled without error. Returns `true` immediately if nothing has been activated. |
| `meta`      | `Computed<SystemMeta>`                   | `{ isEmpty, isReady, hasError, isLoading, isComplete, isAvailable }`                                                            |
| `errors`    | `Computed<{ countries, billingCycles }>` | Last error per query                                                                                                            |

### Context (reactive lists)

| Property        | Type                        | Notes                                        |
| --------------- | --------------------------- | -------------------------------------------- |
| `countries`     | `Computed<ICountry[]>`      | Empty until `ensureCountries()` resolves     |
| `billingCycles` | `Computed<IBillingCycle[]>` | Empty until `ensureBillingCycles()` resolves |

### Sync Getters

> ⚠️ Return `undefined` until the matching `ensure*()` has resolved. See [gotchas.md](./gotchas.md).

| Method            | Signature                                                                           | Returns                                                     |
| ----------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `getCountry`      | `(value?: string) => ICountry`                                                      | Country by 2-letter code or id; falls back to brand default |
| `getRegion`       | `(values: string \| string[], country: string \| ICountry) => IRegion \| undefined` | Region by name(s) within a country                          |
| `getRegions`      | `(country: string \| ICountry) => IRegion[] \| undefined`                           | All regions cached for a country                            |
| `getBillingCycle` | `(months: number) => IBillingCycle \| undefined`                                    | Billing cycle definition by month count                     |

### Async Loaders

| Method                | Signature                                              | Notes                                                     |
| --------------------- | ------------------------------------------------------ | --------------------------------------------------------- |
| `ensureCountries`     | `() => Promise<ICountry[]>`                            | Idempotent — fetches once, returns cached on repeat calls |
| `ensureBillingCycles` | `() => Promise<IBillingCycle[]>`                       | Idempotent                                                |
| `fetchRegions`        | `(country?: ICountry \| string) => Promise<IRegion[]>` | Fetches per-country regions; cached in regions store      |
| `fetchCountries`      | `() => Promise<ICountry[]>`                            | **Deprecated** — alias for `ensureCountries()`            |

### Cache Utilities

| Method         | Description                                       |
| -------------- | ------------------------------------------------- |
| `refresh()`    | Refetch all _activated_ queries in the background |
| `invalidate()` | Invalidate the entire `system` query namespace    |

---

## Recipes

### From a machine `load` service

```typescript
async function load(_context, _event) {
  const { ensureConfig } = useBrand();
  const { ensureCountries, ensureBillingCycles } = useSystem();

  await Promise.all([
    ensureConfig(BrandConfigKeys.SHOW_PROMOTION_AS),
    ensureCountries(),
    ensureBillingCycles()
  ]);

  // ... continue load
}
```

### From a sync schema parser

```typescript
export const useRegisterSchemaParser = (data: any) => {
  const { getCountry } = useSystem();
  return {
    properties: {
      address: {
        properties: {
          country: { default: getCountry()?.code || "" }
        }
      }
    }
  };
};
```

> The caller's machine `load` service is responsible for `ensureCountries()`. The parser itself stays synchronous.

### Region lookup chain

```typescript
const { getCountry, fetchRegions, getRegion } = useSystem();

await ensureCountries();
const country = getCountry("US");

await fetchRegions(country); // Cached after first call per country
const region = getRegion("California", country);
```

### Reactive country list in a component

```vue
<script setup lang="ts">
import { onMounted } from "vue";
import { useSystem } from "@upmind-automation/headless";

const { countries, ensureCountries } = useSystem();

onMounted(() => ensureCountries());
</script>

<template>
  <ul>
    <li v-for="c in countries" :key="c.id">{{ c.name }}</li>
  </ul>
</template>
```

---

## Submodule APIs (at a glance)

| Submodule    | Composable                                            | Common methods                                  |
| ------------ | ----------------------------------------------------- | ----------------------------------------------- |
| Localisation | `useLocalisation(i18n, glob)`, `useI18n`, `useLocale` | `setLocale`, `loadLocaleMessages`, `t`          |
| Places       | `usePlaces()`                                         | `autocomplete`, `getPlaceDetails`, `parsePlace` |
| Recaptcha    | `useRecaptcha()`                                      | `generate(action)`, `isReady`                   |
| Upload       | `useUpload()`                                         | `upload(file)`, `cancel`, `progress`            |
| Analytics    | `useTracking()`, `useDataLayer()`                     | `trackEvent`, `push`                            |

See each submodule's source for full signatures.
