<template>
  <UpmCheckout
    :storefront-route="{ name: ROUTE.STOREFRONT }"
    :edit-route="{ name: ROUTE.BASKET_PRODUCT_EDIT }"
    :fields-route="{ name: ROUTE.BASKET }"
  />
</template>

<script lang="ts" setup>
// --- internal
import { ROUTE } from "../router";

// --- components
import { UpmCheckout } from "@upmind-automation/client-vue";
</script>
