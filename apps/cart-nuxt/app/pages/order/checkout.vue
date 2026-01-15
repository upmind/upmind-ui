<template>
  <UpmCheckout
    :storefront-route="{ name: ROUTE.STOREFRONT }"
    :edit-route="{ name: ROUTE.BASKET_PRODUCT_EDIT }"
    :fields-route="{ name: ROUTE.BASKET }"
  />
</template>

<script lang="ts" setup>
import { UpmCheckout } from "@upmind-automation/client-vue";
import { ROUTE } from "~/funnels/types";

// SEO: Checkout page - noindex to prevent indexing of checkout flow
useHead({
  title: "Checkout"
});

useSeoMeta({
  description: "Complete your purchase securely.",
  robots: "noindex, nofollow"
});

definePageMeta({
  name: ROUTE.CHECKOUT
});
</script>
