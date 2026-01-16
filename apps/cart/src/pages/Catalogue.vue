<template>
  <UpmCatalogue
    :category-route="{ name: ROUTE.CATALOGUE }"
    :configure-route="{ name: ROUTE.PRODUCT_CONFIGURE }"
  />
</template>

<script lang="ts" setup>
// --- components
import { UpmCatalogue } from "@upmind-automation/client-vue";

// --- internal
import { ROUTE } from "../router";
</script>
