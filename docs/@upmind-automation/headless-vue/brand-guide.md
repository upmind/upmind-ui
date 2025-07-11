# Brand

The `useBrand` composable provides a simple interface for interacting with the brand-related information from the Upmind API. It helps manage the brand's configurations, as well as fetch analytics and handle errors.

## API Reference

Please refer to the full API reference on `useBrand` [here](./functions/useBrand.md).

## Usage

The `useBrand` composable returns various properties and methods to interact with the state machine for brand management. Here's how to use it:

To use the `useBrand` composable in your Vue components, simply import it:

```js
import { useBrand } from "@upmind-automation/headless";
```

### Setup in a Vue component

To showcase how `useBrand` can be used, the following example is describing the most common use case for it - using `getConfig` to retrieve brand config and organisation keys.

```vue
<script setup>
import { useBrand } from "@upmind-automation/headless";

const { getConfig } = useBrand();

const fetchBrandConfig = async () => {
  const configData = await getConfig([
    "ANALYTICS_GA_MEASUREMENT_ID",
    "CHECKOUT_FLOW",
    "DEFAULT_CLIENT_HOMEPAGE",
  ]);

  console.log("Fetched Config:", configData);
};

if (meta.isReady.value) {
  console.log("Brand data is ready - fetching keys");
  fetchBrandConfig();
}
</script>
```

### Brand Config and Organisation Keys

These are some of the config and organisation keys you can retrieve. Please note that the list is not extensive - more keys can be added in the future.

| **Key Type** | **Key**                                   | **Description**                                            |
| ------------ | ----------------------------------------- | ---------------------------------------------------------- |
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

For analytics properties, there's a shortcut function in `useBrand` called `getAnalytics`. It basically uses `getConfig` underneath using the necessary config keys to get analytics information (`ANALYTICS_GA_MEASUREMENT_ID` and `ANALYTICS_GTM_CONTAINER_ID`). Here's a quick example on it:

```vue
<script setup>
import { useBrand } from "@/composables/useBrand";

const { getAnayltics } = useBrand();
const analytics = ref(null);

const fetchAnalytics = async () => {
  try {
    analytics.value = await getAnayltics();
    console.log(analytics.value);
  } catch (err) {
    console.error(err);
  }
};

fetchAnalytics();
</script>
```

## Advanced Usage

### `meta` Object Options

The `meta` object contains various reactive properties that provide useful information about the state of the brand requests.

| Property     | Type                   | Description                                                                           |
| ------------ | ---------------------- | ------------------------------------------------------------------------------------- |
| `isLoading`  | `ComputedRef<boolean>` | True if the state machine is in a loading state.                                      |
| `isReady`    | `ComputedRef<boolean>` | True if the machine has completed processing key states (e.g., organization, config). |
| `isComplete` | `ComputedRef<boolean>` | True if the state machine has reached the final "complete" state.                     |
| `hasErrors`  | `ComputedRef<boolean>` | True if any of the state machine's key states have encountered errors.                |

Here's a simple example:

```vue
<script setup>
import { computed } from "vue";
import { useBrand } from "@/composables/useBrand";

const { meta } = useBrand();

if (meta.isLoading.value) {
  console.log("Loading brand data...");
}

if (meta.isReady.value) {
  console.log("Brand data is ready.");
}

if (meta.hasErrors.value) {
  console.error("There were errors fetching the brand data.");
}
</script>
```
