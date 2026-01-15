<template>
  <UpmProductNotFound :storefront-route="{ name: ROUTE.STOREFRONT }" />
</template>

<script lang="ts" setup>
import { UpmProductNotFound } from "@upmind-automation/client-vue";
import { ROUTE } from "~/funnels/types";

// SEO: Product not found page - noindex (error state)
useHead({
  title: "Product Not Found"
});

useSeoMeta({
  description: "The product you're looking for could not be found.",
  robots: "noindex, nofollow"
});

definePageMeta({
  name: ROUTE.PRODUCT_NOT_FOUND
});
</script>
