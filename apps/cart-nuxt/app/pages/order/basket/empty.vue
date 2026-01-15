<template>
  <UpmEmpty :storefront-route="{ name: ROUTE.STOREFRONT }" />
</template>

<script lang="ts" setup>
import { UpmEmpty } from "@upmind-automation/client-vue";
import { ROUTE } from "~/funnels/types";

// SEO: Empty basket page - noindex
useHead({
  title: "Your Cart is Empty"
});

useSeoMeta({
  description: "Your shopping cart is empty. Start shopping to add items.",
  robots: "noindex, nofollow"
});

definePageMeta({
  name: ROUTE.BASKET_EMPTY
});
</script>
