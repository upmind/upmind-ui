<template>
  <UpmCheckout
    :template="template"
    :storefront-route="{ name: ROUTE.STOREFRONT }"
    :edit-route="{ name: ROUTE.BASKET_PRODUCT_EDIT }"
    :fields-route="{ name: ROUTE.BASKET }"
  />
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useRoute } from "vue-router";

// --- components
import {
  UpmCheckout,
  useRoutingEngine,
  CHECKOUT_TEMPLATE
} from "@upmind-automation/client-vue";

// --- internal
import { ROUTE } from "~/router/types";

// -----------------------------------------------------------------------------

const route = useRoute();

const template = computed(() => {
  return (
    (route?.meta?.template as CHECKOUT_TEMPLATE) ||
    CHECKOUT_TEMPLATE.TWO_COLUMN_LTR
  );
});

definePageMeta({
  name: ROUTE.CHECKOUT
});
</script>
