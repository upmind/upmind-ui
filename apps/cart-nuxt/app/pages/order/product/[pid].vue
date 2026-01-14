<template>
  <UpmProductConfigure
    :storefront-route="storefrontRoute || { name: ROUTE.STOREFRONT }"
    :catalogue-route="{ name: ROUTE.CATALOGUE }"
  />
</template>

<script lang="ts" setup>
// --- components
import { UpmProductConfigure, useBrand } from "@upmind-automation/client-vue";

// --- internal
import { ROUTE } from "~/router/types";

const { storefrontRoute } = useBrand();

definePageMeta({
  name: ROUTE.PRODUCT_CONFIGURE
});
</script>
