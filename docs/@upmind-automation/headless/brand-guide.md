# Brand

The [`useBrand`](./functions/useBrand.md) composable provides a simple interface for interacting with the brand-related information from the Upmind API. It helps manage the brand's configurations, as well as fetch analytics and handle errors.

> **Important:** The [`useBrand`](./functions/useBrand.md) composable persists its state to [`localStorage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) to improve performance and reduce API calls. On the initial load, it performs a background refresh to check for any changes to brand settings and update the local storage if necessary.

## API Reference

Please refer to the full API reference on `useBrand` [here](./functions/useBrand.md).

## Usage

The `useBrand` composable returns various properties and methods to interact with the state machine for brand management. Here's how to use it:

To use the `useBrand` composable in your Vue components, simply import it:

```js
import { useBrand } from "@upmind-automation/headless";
```

### Setup in a Vue component

The composable automatically initialises when first called and manages multiple data sources through singleton queries.

```vue
<script setup>
  import { useBrand } from "@upmind-automation/headless";

  const {
    currency,
    getAnalytics,
    getConfig,
    isReady,
    meta,
    name,
  } = useBrand();

  // Wait for brand data to be ready
  const init = async () => {
    const ready = await isReady();
    if (ready) {
      console.log("Brand name:", name.value);
      console.log("Default currency:", currency.value);
    }
  };

  init();
</script>
```

### Brand Config and Organisation Keys

Retrieve specific configuration keys using `getConfig()` or `ensureConfig()`. These methods work with both single keys and arrays of keys.

```vue
<script setup>
  import { useBrand } from "@upmind-automation/headless";

  const { getConfig, ensureConfig } = useBrand();

  // Get already loaded config keys (synchronous)
  const basicConfig = getConfig([
    "ANALYTICS_GA_MEASUREMENT_ID",
    "CHECKOUT_FLOW",
    "DEFAULT_CLIENT_HOMEPAGE"
  ]);

  // Ensure keys are loaded (asynchronous)
  const advancedConfig = await ensureConfig([
  "BILLING_GATEWAY_FORCE_AUTO_PAYMENT",
  "SHOP_TRUNCATE_DESCRIPTIONS"
  ]);
</script>
```

### Configuration Keys

The composable supports both Organization keys (related to account capabilities) and Config keys (brand-specific settings):

| **Key Type** | **Key**                                   | **Description**                                            |
|--------------|-------------------------------------------|------------------------------------------------------------|
| Organisation | `CREATE_USER_API_TOKENS`                  | Whether creating API tokens for users is allowed.          |
| Organisation | `BULK_NOTIFICATIONS_ENABLED`              | Whether bulk notifications are enabled.                    |
| Organisation | `MULTI_BRAND_ENABLED`                     | Support for multiple brand configurations.                 |
| Organisation | `PRODUCT_PROVISIONING_ENABLED`            | Whether product provisioning is enabled.                   |
| Organisation | `REMOVE_UPMIND_BRANDING_ENABLED`          | Whether Upmind branding can be removed.                    |
| Organisation | `UNLIMITED_PAYMENT_GATEWAYS`              | Whether unlimited payment gateways are supported.          |
| Organisation | `UNLIMITED_PROVISION_CONFIGURATIONS`      | Whether unlimited provision configurations are supported.  |
| Organisation | `WEBHOOKS`                                | Whether webhooks for integrations are available.           |
| Config       | `ANALYTICS_GA_MEASUREMENT_ID`             | Availability of Google Analytics Measurement ID.           |
| Config       | `ANALYTICS_GTM_CONTAINER_ID`              | Availability of Google Tag Manager Container ID.           |
| Config       | `BASKET_DEFAULT_CURRENCY`                 | Default currency for the basket.                           |
| Config       | `BILLING_GATEWAY_FORCE_AUTO_PAYMENT`      | Whether auto-payment is forced at the billing gateway.     |
| Config       | `BILLING_GATEWAY_FORCE_CARD_STORAGE`      | Whether card storage is enforced during checkout.          |
| Config       | `CHECKOUT_FLOW`                           | Whether the checkout flow is defined.                      |
| Config       | `CHECKOUT_HIDE_DISCOUNT_CODE_FIELD`       | Whether the discount code field is hidden at checkout.     |
| Config       | `CHECKOUT_SUMMARY_COLOR_STOP1`            | Whether checkout summary color gradient stop 1 is enabled. |
| Config       | `CHECKOUT_SUMMARY_COLOR_STOP2`            | Whether checkout summary color gradient stop 2 is enabled. |
| Config       | `CHECKOUT_SUMMARY_CONTRAST_MODE`          | Whether contrast mode for the checkout summary is enabled. |
| Config       | `CLIENT_NOTES_AND_SECRETS_ENABLED`        | Whether client notes and secrets are allowed.              |
| Config       | `DEFAULT_CLIENT_HOMEPAGE`                 | Default homepage for clients is set.                       |
| Config       | `DISABLE_CLIENT_REGISTRATION`             | Whether client registration is disabled.                   |
| Config       | `PREVENT_CARD_REMOVAL_IF_LAST`            | Whether card removal is prevented when it's the last card. |
| Config       | `REQUIRE_PHONE_ON_REGISTRATION`           | Whether a phone number is required during registration.    |
| Config       | `SHOP_TRUNCATE_DESCRIPTIONS`              | Whether product descriptions in the shop are truncated.    |
| Config       | `SHOW_CLIENT_STORE`                       | Whether the client store is displayed.                     |
| Config       | `SUPPORT_PIN_ENABLED`                     | Whether support PIN authentication is enabled.             |
| Config       | `UI_CLIENT_APP_DISABLE_SUPPORT_SYSTEM`    | Whether the support system in the app is disabled.         |
| Config       | `UI_CLIENT_APP_PAGE_AFTER_LOGIN`          | Page after login for clients is defined.                   |
| Config       | `UI_CLIENT_APP_PAYMENT_TERM_DESCRIPTIONS` | Whether payment terms in the app are described.            |
| Config       | `UI_ENTER_KEY_ACTION`                     | Action on pressing the Enter key in forms.                 |
| Config       | `UI_PRICE_BEFORE_DISCOUNT_POSITION`       | Whether the price before discount is displayed.            |

## Examples

### Analytics Config

Use the shortcut `getAnalytics()` method to retrieve analytics-related configuration:

```vue
<script setup>
  import { useBrand } from "@upmind-automation/headless";

  const { getAnalytics } = useBrand();

  const setupAnalytics = async () => {
    try {
      const analytics = await getAnalytics();

      if (analytics.ANALYTICS_GA_MEASUREMENT_ID) {
        console.log("GA ID:", analytics.ANALYTICS_GA_MEASUREMENT_ID);
      }

      if (analytics.ANALYTICS_GTM_CONTAINER_ID) {
        console.log("GTM ID:", analytics.ANALYTICS_GTM_CONTAINER_ID);
      }
    } catch (error) {
      console.error("Failed to load analytics config:", error);
    }
  };

  setupAnalytics();
</script>
```

### Currency and Language Validation

Validate and normalize currency and language data:

```vue
<script setup>
  import { useBrand } from "@upmind-automation/headless";

  const { currencies, languages, validateCurrency, validateLanguage } = useBrand();

  const handleUserPreferences = async () => {
  // Validate a user's selected currency
  const userCurrency = { code: "USD" };
  const validCurrency = await validateCurrency(userCurrency);

    // Validate a user's selected language
  const userLanguage = { code: "en" };
  const validLanguage = validateLanguage(userLanguage);

  console.log("Valid currency:", validCurrency);
  console.log("Valid language:", validLanguage);
  console.log("All available currencies:", currencies.value);
  console.log("All available languages:", languages.value);
  };
</script>
```

### Storefront Integration

Handle storefront routing and URL generation:

```vue
<script setup>
  import { useBrand } from "@upmind-automation/headless";

  const { storefrontUrl, storefrontRoute, hasStorefront } = useBrand();

  const navigateToStore = () => {
    if (hasStorefront.value) {
      // External storefront URL
      window.open(storefrontUrl.value, '_blank');
      } else if (storefrontRoute.value?.to) {
      // Internal Vue route
      router.push(storefrontRoute.value.to);
    }
  };
</script>
```

## Advanced Usage

### Meta State Management

The `meta` object provides reactive information about the composable's state:

```vue
<script setup>
  import { watch } from 'vue';
  import { useBrand } from "@upmind-automation/headless";

  const { meta, errors } = useBrand();

  watch(meta, (newMeta) => {
    if (newMeta.hasError) {
      console.error("Brand loading errors:", errors.value);
    }

    if (newMeta.isComplete && !newMeta.hasError) {
      console.log("Brand data successfully loaded");
    }
  }, { immediate: true });
</script>
```

### State Management Methods

Control the composable's lifecycle:

```vue
<script setup>
  import { useBrand } from "@upmind-automation/headless";

  const { refresh, invalidate, isReady } = useBrand();

  const handleBrandUpdate = async () => {
    // Force refresh all brand data
    await refresh();

    // Or invalidate cache for complete reload
    invalidate();

    // Wait for new data to be ready
    const ready = await isReady();
    if (ready) {
      console.log("Brand data refreshed");
    }
  };
</script>
```

### Module Checking

Check if specific modules are enabled:

```vue
<script setup>
  import { useBrand } from "@upmind-automation/headless";

  const { hasModuleEnabled } = useBrand();

  const checkFeatures = async () => {
    await isReady();

    if (hasModuleEnabled('web_hosting')) {
      // Show module-specific features
    }
  };
</script>
```

### Key Properties

The composable exposes many reactive properties for brand information:

| Property      | Type                       | Description                                         |
|---------------|----------------------------|-----------------------------------------------------|
| `brandId`     | `ComputedRef<string>`      | Thee current brand ID.                              |
| `name`        | `ComputedRef<string>`      | The current brand name.                             |
| `currency`    | `ComputedRef<ICurrency[]>` | The current currency object for the brand.          |
| `currencies`  | `ComputedRef<ICurrency[]>` | The list of all supported currencies for the brand. |
| `language`    | ` ComputedRef<ILanguage>`  | The current language object for the brand.          |
| `languages`   | `ComputedRef<ILanguage[]>` | The list of all supported languages for the brand.  |
| `includesTax` | ` ComputedRef<boolean>`    | Whether the brand includes tax by default.          |
| `countryId`   | `ComputedRef<string>`      | The country ID for the brand.                       |
| `image`       | `ComputedRef<object>`      | The current image object for the brand.             |
| `styles`      | `ComputedRef<object>`      | The current styles object for the brand.            |
| `favicon`     | `ComputedRef<object>`      | The current favicon object for the brand.           |
| `uiTheme`     | `ComputedRef<object>`      | The current theming object for the brand.           |

### Error Handling

The composable includes comprehensive error handling:

```vue
<script setup>
  import { useBrand } from "@upmind-automation/headless";

  const { meta, errors, isReady } = useBrand();

  const handleErrors = async () => {
    const ready = await isReady();

    if (!ready) {
      console.error("Brand loading failed:", errors.value);

      // Handle specific error scenarios
      if (meta.value.hasError) {
        // Show error message to user
        // Attempt retry logic
      }
    }
  };
</script>
```

### `meta` Object Options

The `meta` object contains various reactive properties that provide useful information about the state of the brand requests.

| Property      | Type                   | Description                                                            |
|---------------|------------------------|------------------------------------------------------------------------|
| `hasError`    | `ComputedRef<boolean>` | True if any of the state machine's key states have encountered errors. |
| `isAvailable` | `ComputedRef<boolean>` | True if the state machine has a brand settings with a name.            |
| `isComplete`  | `ComputedRef<boolean>` | True if the state machine has reached the final "complete" state.      |
| `isEmpty`     | `ComputedRef<boolean>` | True if the state machine is in a loading state.                       |
| `isLoading`   | `ComputedRef<boolean>` | True if the state machine is in a loading state.                       |

Here's a simple example:

```vue
<script setup>
import { useBrand } from "@upmind-automation/headless";

const { meta } = useBrand();

if (meta.isLoading.value) {
  console.log("Loading brand data...");
}

if (meta.hasErrors.value) {
  console.error("There were errors fetching the brand data.");
}
</script>
```
