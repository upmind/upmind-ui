<template>
  <UpmBasketProductEdit
    :template="template"
    :storefront-route="{ name: ROUTE.STOREFRONT }"
  />
</template>
<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useRoute } from "vue-router";

// --- internal

// --- components
import {
  UpmBasketProductEdit,
  useRoutingEngine
} from "@upmind-automation/client-vue";

// --- types
import { ROUTE } from "../../router";
import { BASKET_PRODUCT_TEMPLATE } from "@upmind-automation/client-vue";

// -----------------------------------------------------------------------------

const route = useRoute();

const template = computed(() => {
  return (
    (route?.meta?.template as BASKET_PRODUCT_TEMPLATE) ||
    BASKET_PRODUCT_TEMPLATE.TWO_COLUMN_RTL
  );
});
</script>
