<template>
  <UpmRecommendations
    :layout="layout"
    :configure-route="{ name: ROUTE.PRODUCT_CONFIGURE }"
  />
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useRoute } from "vue-router";

// --- components
import {
  UpmRecommendations,
  LAYOUT_VARIANTS
} from "@upmind-automation/client-vue";

// --- internal
import { ROUTE } from "~/funnels/types";

// -----------------------------------------------------------------------------
const route = useRoute();

const layout = computed(() => {
  return route?.meta?.template as LAYOUT_VARIANTS;
});

definePageMeta({
  name: ROUTE.RECOMMENDATIONS
});
</script>
