<template>
  <UpmRecommendations
    :layout="layout"
    :configure-route="{ name: ROUTE.PRODUCT_CONFIGURE }"
  />
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import {
  UpmRecommendations,
  LAYOUT_VARIANTS
} from "@upmind-automation/client-vue";
import { ROUTE } from "~/funnels/types";

const route = useRoute();

const layout = computed(() => {
  return route?.meta?.template as LAYOUT_VARIANTS;
});

// SEO: Recommendations page
useHead({
  title: "Recommended Products"
});

useSeoMeta({
  description: "Discover products recommended for you based on your selections."
});

definePageMeta({
  name: ROUTE.RECOMMENDATIONS
});
</script>
