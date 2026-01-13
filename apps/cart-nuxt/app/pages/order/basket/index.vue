<template>
  <UpmBasket
    :template="template"
    :storefront-route="{ name: ROUTE.STOREFRONT }"
    :basket-route="{ name: ROUTE.BASKET }"
    :edit-route="{ name: ROUTE.BASKET_PRODUCT_EDIT }"
  />
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useRoute } from "vue-router";

// --- components
import {
  UpmBasket,
  useRoutingEngine,
  BASKET_TEMPLATE
} from "@upmind-automation/client-vue";

// --- internal
import { ROUTE } from "~/router/types";

// -----------------------------------------------------------------------------

const route = useRoute();
const template = computed(() => {
  return (
    (route?.meta?.template as BASKET_TEMPLATE) || BASKET_TEMPLATE.TWO_COLUMN_LTR
  );
});

definePageMeta({
  name: ROUTE.BASKET
});
</script>
