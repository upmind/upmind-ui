<template>
  <UpmProductConfigure
    :template="template"
    :storefront-route="storefrontRoute || { name: ROUTE.STOREFRONT }"
    :catalogue-route="{ name: ROUTE.CATALOGUE }"
  />
</template>
<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useRoute } from "vue-router";

// --- internal

// --- components
import {
  UpmProductConfigure,
  useRoutingEngine,
  useBrand
} from "@upmind-automation/client-vue";

// --- types
import { ROUTE } from "../../../router/types";
import { PRODUCT_TEMPLATE } from "@upmind-automation/client-vue";

// -----------------------------------------------------------------------------

const { storefrontRoute } = useBrand();

const route = useRoute();

const template = computed(() => {
  return (
    (route?.meta?.template as PRODUCT_TEMPLATE) ||
    PRODUCT_TEMPLATE.TWO_COLUMN_RTL
  );
});

definePageMeta({
  name: ROUTE.PRODUCT_CONFIGURE
});
</script>
