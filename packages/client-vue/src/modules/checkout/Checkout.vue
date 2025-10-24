<template>
  <component :is="templateVariant" v-show="!meta.isCheckout" />

  <!-- Basket processing -->
  <slot name="processing" v-if="meta.isCheckout">
    <CheckoutProcessing />
  </slot>
</template>

<script lang="ts" setup>
// --- external
import { watch, computed } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import {
  useSession,
  useBasket,
  useRoutingEngine,
  ROUTE,
  useDataLayer
} from "@upmind-automation/headless";

// --- components
import CheckoutProcessing from "./components/CheckoutProcessing.vue";

// --- templates
import CheckoutLTR from "./templates/CheckoutLTR.template.vue";
import CheckoutRTL from "./templates/CheckoutRTL.template.vue";
import CheckoutFull from "./templates/CheckoutFull.template.vue";

// --- types
import { CHECKOUT_TEMPLATE } from "./types";
import { isEqual } from "lodash-es";
// -----------------------------------------------------------------------------

const { t } = useI18n();
// ---

const { navigateNext, navigateBack, isResolved, currentRoute } =
  useRoutingEngine();
const { isAuthenticated } = useSession();
const { attempts, meta, isReady, uischema } = useBasket();

const supportedTemplates = {
  [CHECKOUT_TEMPLATE.FULL]: CheckoutFull,
  [CHECKOUT_TEMPLATE.TWO_COLUMN_LTR]: CheckoutLTR,
  [CHECKOUT_TEMPLATE.TWO_COLUMN_RTL]: CheckoutRTL
};

const layout = computed(() => {
  return currentRoute.value?.meta?.template as CHECKOUT_TEMPLATE;
});

const templateVariant = computed(
  () => supportedTemplates[layout.value] ?? CheckoutFull
);

// -----------------------------------------------------------------------------

await isResolved(ROUTE.CHECKOUT);
await isReady().then(() => isAuthenticated().catch(navigateBack));

const { dataLayer } = useDataLayer();
dataLayer({ event: "begin_checkout" }).withEcommerce().push();

// -----------------------------------------------------------------------------

// --- side effects

watch(attempts, (value, oldValue) => {
  // scroll to our errors when we have a new failed attempt
  if (value && !isEqual(value, oldValue)) {
    // scroll to relevant section IF we have errors there AND that section is enabled

    if (uischema.value.showProductsOnCheckout && !meta.value.hasProducts) {
      document
        .getElementById("basket-products")
        ?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    if (uischema.value.showFieldsOnCheckout && !meta.value.hasFields) {
      document
        .getElementById("basket-fields")
        ?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    if (uischema.value.showBillingOnCheckout && !meta.value.hasBilling) {
      document
        .getElementById("basket-billing")
        ?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    // otherwise scroll to top where our general errors are
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

watch(meta, value => {
  if (value.isComplete) navigateNext();
});
</script>
