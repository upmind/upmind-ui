<template>
  <UpmCheckout
    :storefront-route="{ name: ROUTE.STOREFRONT }"
    :edit-route="{ name: ROUTE.BASKET_PRODUCT_EDIT }"
    :fields-route="{ name: ROUTE.BASKET }"
  />
</template>

<script lang="ts" setup>
// --- components
import { UpmCheckout } from "@upmind-automation/client-vue";

// --- internal
import { ROUTE } from "~/router/types";

definePageMeta({
  name: ROUTE.CHECKOUT
});
</script>
