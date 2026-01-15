<template>
  <UpmProductRecommendations
    :configure-route="{ name: ROUTE.PRODUCT_CONFIGURE }"
  />
</template>

<script lang="ts" setup>
import { UpmProductRecommendations } from "@upmind-automation/client-vue";
import { ROUTE } from "~/funnels/types";

// SEO: Product recommendations page
useHead({
  title: "Recommended Add-ons"
});

useSeoMeta({
  description: "Enhance your selection with these recommended add-ons."
});

definePageMeta({
  name: ROUTE.PRODUCT_RECOMMENDATIONS
});
</script>
