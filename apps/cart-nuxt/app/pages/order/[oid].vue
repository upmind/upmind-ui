<template>
  <UpmOrder :storefront-route="{ name: ROUTE.STOREFRONT }" />
</template>

<script lang="ts" setup>
import { UpmOrder } from "@upmind-automation/client-vue";
import { ROUTE } from "~/funnels/types";

// SEO: Order confirmation page - noindex as order details are user-specific
useHead({
  title: "Order Confirmation"
});

useSeoMeta({
  description: "Your order has been placed successfully.",
  robots: "noindex, nofollow" // Order pages should not be indexed
});

definePageMeta({
  name: ROUTE.ORDER
});
</script>
