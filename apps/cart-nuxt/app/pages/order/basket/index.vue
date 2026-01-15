<template>
  <UpmBasket
    :storefront-route="{ name: ROUTE.STOREFRONT }"
    :basket-route="{ name: ROUTE.BASKET }"
    :edit-route="{ name: ROUTE.BASKET_PRODUCT_EDIT }"
  />
</template>

<script lang="ts" setup>
import { UpmBasket } from "@upmind-automation/client-vue";
import { ROUTE } from "~/funnels/types";

// SEO: Shopping cart page - noindex as cart contents are user-specific
useHead({
  title: "Your Cart"
});

useSeoMeta({
  description: "Review your cart items before checkout.",
  robots: "noindex, nofollow" // Cart pages should not be indexed
});

definePageMeta({
  name: ROUTE.BASKET
});
</script>
