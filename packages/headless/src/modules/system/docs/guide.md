# System

The [`useSystem`](./functions/useSystem.md) composable provides a comprehensive interface for interacting with system-related data from the Upmind API. It manages countries, regions, languages, currencies, billing cycles, statuses, and departments with built-in caching and error handling.

> **Important:** The [`useSystem`](./functions/useSystem.md) composable persists its state to [`localStorage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) to improve performance and reduce API calls. On the initial load, it performs a background refresh to check for any changes to system settings and update the local storage if necessary.

## API Reference

Please refer to the full API reference on `useSystem` [here](./functions/useSystem.md).

## Usage

```js
import { useSystem } from "@upmind-automation/headless";
```

### Setup in a Vue component

The composable automatically initialises essential data (countries, currencies, billing cycles) when first called. Optional data is fetched on demand.

```vue
<script setup>
  import { useSystem } from "@upmind-automation/headless";

  const { countries, currencies, fetchLanguages, getCountry, isReady } = useSystem();

  const init = async () => {
    const ready = await isReady();
    if (ready) {
      console.log("Available countries:", countries.value);
      console.log("Available currencies:", currencies.value);

      // Get a specific country
      const country = getCountry('US');
      console.log("US Country:", country);
    }
  };

  init();
</script>
```

### Fetching Optional Data

Some data is loaded on-demand to optimise performance:

```vue
<script setup>
  import { useSystem } from "@upmind-automation/headless";

  const { fetchDepartments, fetchLanguages, fetchRegions, fetchStatuses } = useSystem();

  const loadAdditionalData = async () => {
    // Fetch optional system data
    const departments = await fetchDepartments();
    const languages = await fetchLanguages();
    const statuses = await fetchStatuses();

    console.log("Departments:", departments);
    console.log("Languages:", languages);
    console.log("Statuses:", statuses);
  };
</script>
```

## Available Data Types

### Essential Data (Auto-loaded)

| Key             | Type              | Description                                      |
|-----------------|-------------------|--------------------------------------------------|
| `billingCycles` | `IBillingCycle[]` | Available billing cycles (monthly, yearly, etc.) |
| `countries`     | `ICountry[]`      | List of countries available in the system        |
| `currencies`    | `ICurrency[]`     | List of available currencies                     |

### Optional Data (On-demand)

| Key           | Type                    | Description                                 |
|---------------|-------------------------|---------------------------------------------|
| `departments` | `ITicketDepartment[]`   | Available support departments               |
| `languages`   | `ILanguage[]`           | Available languages                         |
| `regions`     | `IRegion[]`             | Regions/states for specific countries       |
| `statuses`    | `IStatus[]`             | Possible statuses for entities              |

## Examples

### Working with Countries and Regions

```vue
<script setup>
  import { useSystem } from "@upmind-automation/headless";

  const { fetchRegions, getCountry, getRegion, getRegions } = useSystem();

  const handleLocationSelection = async () => {
    // Get country by code or ID
    const country = getCountry('US');

    // Check if regions are already cached
    let regions = getRegions(country);

    if (!regions) {
      // Fetch regions from API if not cached
      regions = await fetchRegions(country);
    }

    // Find specific region
    const california = getRegion('California', country);
    // or multiple possible names
    const region = getRegion(['CA', 'California'], country);

    console.log("California:", california);
    console.log("Country:", country);
    console.log("Regions:", regions);
  };
</script>
```

### Currency and Language Handling

```vue
<script setup>
  import { useSystem } from "@upmind-automation/headless";

  const { fetchLanguages, getCurrency, getLanguage } = useSystem();

  const handleUserPreferences = async () => {
    // Get currency by code or ID
    const usd = getCurrency('USD');

    // Load languages if needed
    await fetchLanguages();

    // Get language by code
    const english = getLanguage('en');

    console.log("USD Currency:", usd);
    console.log("English Language:", english);
  };
</script>
```

### Working with Billing and Support Data

```vue
<script setup>
  import { useSystem } from "@upmind-automation/headless";

  const { fetchDepartments, fetchStatuses, getBillingCycle, getDepartment, getStatus } = useSystem();

  const handleBusinessData = async () => {
    // Get billing cycle by months
    const monthly = getBillingCycle(1);
    const yearly = getBillingCycle(12);

    // Load and get refund status data
    await fetchStatuses();
    const refundStatus = getStatus('wallet_refund_request_pending');

    // Load and get department data
    await fetchDepartments();
    const generalDepartment = getDepartment('general');

    console.log("Monthly billing:", monthly);
    console.log("Refund status:", refundStatus);
    console.log("General department:", generalDepartment);
    console.log("Yearly billing:", yearly);
  };
</script>
```

## Advanced Usage

### Meta State Management

Monitor the loading state of system data:

```vue
<script setup>
  import { watch } from 'vue';
  import { useSystem } from "@upmind-automation/headless";

  const { meta, errors } = useSystem();

  watch(meta, (newMeta) => {
    if (newMeta.hasError) {
      console.error("System loading errors:", errors.value);
    }

    if (newMeta.isReady) {
      console.log("System data is ready for use");
    }

    if (newMeta.isLoading) {
      console.log("Loading system data...");
    }
    }, { immediate: true }
  );
</script>
```

### Cache Management

Control the composable's caching behaviour:

```vue
<script setup>
  import { useSystem } from "@upmind-automation/headless";

  const { refresh, invalidate, isReady } = useSystem();

  const handleDataRefresh = async () => {
    // Force refresh all system data
    await refresh();

    // Or invalidate cache for complete reload
    invalidate();

    // Wait for data to be ready again
    const ready = await isReady();
    if (ready) {
      console.log("System data refreshed");
    }
  };
</script>
```

### Error Handling

Handle errors for specific data types:

```vue
<script setup>
  import { useSystem } from "@upmind-automation/headless";

  const { errors, meta } = useSystem();

  const checkForErrors = () => {
    if (meta.value.hasError) {
      const systemErrors = errors.value;

      if (systemErrors.countries) {
        console.error("Countries loading failed:", systemErrors.countries);
      }

      if (systemErrors.currencies) {
        console.error("Currencies loading failed:", systemErrors.currencies);
      }

      if (systemErrors.languages) {
        console.error("Languages loading failed:", systemErrors.languages);
      }

      // Handle other specific errors as needed
      }
  };
</script>
```

## Key Properties

The composable exposes reactive properties for all system data:

| Property        | Type                                 | Description                              |
|-----------------|--------------------------------------|------------------------------------------|
| `billingCycles` | `ComputedRef<IBillingCycle[]>`       | Available billing cycles                 |
| `countries`     | `ComputedRef<ICountry[]>`            | Available countries                      |
| `currencies`    | `ComputedRef<ICurrency[]>`           | Available currencies                     |
| `departments`   | `ComputedRef<ITicketDepartment[]>`   | Available departments (loaded on-demand) |
| `errors`        | `ComputedRef<Record<string, Error>>` | Errors by data type                      |
| `languages`     | `ComputedRef<ILanguage[]>`           | Available languages (loaded on-demand)   |
| `statuses`      | `ComputedRef<IStatus[]>`             | Available statuses (loaded on-demand)    |

## Meta Object Properties

The `meta` object provides reactive state information:

| Property      | Type                   | Description                                         |
|---------------|------------------------|-----------------------------------------------------|
| `hasError`    | `ComputedRef<boolean>` | True if any queries have encountered errors         |
| `isAvailable` | `ComputedRef<boolean>` | Always true (system is always considered available) |
| `isComplete`  | `ComputedRef<boolean>` | True if all active queries have completed           |
| `isEmpty`     | `ComputedRef<boolean>` | True if any essential data is empty                 |
| `isLoading`   | `ComputedRef<boolean>` | True if any queries are currently loading           |
| `isReady`     | `ComputedRef<boolean>` | True if complete and no errors                      |
