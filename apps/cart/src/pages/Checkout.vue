<template>
  <UpmCheckout
    :template="template"
    :storefront-route="{ name: ROUTE.STOREFRONT }"
    :edit-route="{ name: ROUTE.BASKET_PRODUCT_EDIT }"
  />
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useRoute } from "vue-router";

// --- internal
import { ROUTE } from "../router";

// --- components
import { UpmCheckout, useRoutingEngine } from "@upmind-automation/client-vue";

// --- types
import { CHECKOUT_TEMPLATE } from "@upmind-automation/client-vue";
// -----------------------------------------------------------------------------

const route = useRoute();

const template = computed(() => {
  return (
    (route?.meta?.template as CHECKOUT_TEMPLATE) ||
    CHECKOUT_TEMPLATE.TWO_COLUMN_LTR
  );
});
</script>
