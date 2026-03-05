<template>
  <UpmProductConfigure
    :storefront-route="storefrontRoute || { name: ROUTE.STOREFRONT }"
    :catalogue-route="{ name: ROUTE.CATALOGUE }"
  />
</template>
<script lang="ts" setup>
// --- components
import { UpmProductConfigure, useBrand } from "@upmind-automation/client-vue";

// --- types
import { ROUTE } from "../../router";

const { storefrontRoute } = useBrand();
</script>
