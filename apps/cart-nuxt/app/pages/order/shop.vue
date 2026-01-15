<template>
  <UpmCatalogue
    :category-route="{ name: ROUTE.CATALOGUE }"
    :configure-route="{ name: ROUTE.PRODUCT_CONFIGURE }"
  />
</template>

<script lang="ts" setup>
import { UpmCatalogue } from "@upmind-automation/client-vue";
import { ROUTE } from "~/funnels/types";

// SEO: Collection page with product listings
useHead({
  title: "Shop"
});

useSeoMeta({
  description:
    "Browse our product catalogue and find the perfect solution for your needs."
});

definePageMeta({
  name: ROUTE.CATALOGUE
});
</script>
