<template>
  <UpmProductConfigure
    :storefront-route="storefrontRoute || { name: ROUTE.STOREFRONT }"
    :catalogue-route="{ name: ROUTE.CATALOGUE }"
  />
</template>

<script lang="ts" setup>
import { UpmProductConfigure, useBrand } from "@upmind-automation/client-vue";
import { ROUTE } from "~/funnels/types";

const { storefrontRoute } = useBrand();

// SEO: Product configuration page
useHead({
  title: "Configure Product"
});

useSeoMeta({
  description: "Configure your product options and add to cart."
});

definePageMeta({
  name: ROUTE.PRODUCT_CONFIGURE
});
</script>
