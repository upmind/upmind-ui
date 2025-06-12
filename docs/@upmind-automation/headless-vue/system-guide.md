# System

The `useSystem` composable provides a set of state helpers and API calls to interact with system-related data like, countries, regions, languages, etc. It wraps a state machine that handles requests to the system API.

## API Reference

Please refer to the full API reference on `useSystem` [here](./functions/useSystem.md).

## Usage

```js
import { useSystem } from "@upmind-automation/headless";
```

### Setup in a Vue component

The following example is describing the most common use case for `useSystem` - using `fetch` to retrieve system information, based on keys.

```vue
<script setup>
import { useSystem } from "@upmind-automation/headless";

const { fetch } = useSystem();
const countries = ref();

countries.value = await fetch("countries");
console.log(countries.value);
</script>
```

### System Keys

Here’s a table showing the possible values that can be passed as the `key` to the `fetch` method in `useSystem`:

| Key           | Description                                            |
| ------------- | ------------------------------------------------------ |
| `countries`   | Fetches the list of countries available in the system. |
| `regions`     | Fetches regions based on the selected country.         |
| `languages`   | Fetches the list of available languages.               |
| `statuses`    | Fetches the list of possible statuses for entities.    |
| `departments` | Fetches the available departments within the system.   |

## Advanced Usage

### `meta` Object Options

The `meta` object contains various reactive properties that provide useful information about the state of the brand requests.

| Property          | Type      | Description                                                                                                                   |
| ----------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `meta.isLoading`  | `boolean` | True if any of the system's key states (e.g., countries, regions) are loading.                                                |
| `meta.isReady`    | `boolean` | True if key states (e.g., currencies, billing cycles) have completed loading, and others (e.g., countries, regions) are idle. |
| `meta.isComplete` | `boolean` | True if all relevant system states have completed loading.                                                                    |
| `meta.hasErrors`  | `boolean` | True if any key states have encountered errors.                                                                               |
