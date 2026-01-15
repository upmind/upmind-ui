<template>
  <UpmProductRequiresAction :storefront-route="{ name: ROUTE.STOREFRONT }" />
</template>

<script lang="ts" setup>
import { UpmProductRequiresAction } from "@upmind-automation/client-vue";
import { ROUTE } from "~/funnels/types";

// SEO: Product requires action page - noindex (user-specific)
useHead({
  title: "Action Required"
});

useSeoMeta({
  description: "Your cart item requires additional action.",
  robots: "noindex, nofollow"
});

definePageMeta({
  name: ROUTE.BASKET_PRODUCT_REQUIRES_ACTION
});
</script>
