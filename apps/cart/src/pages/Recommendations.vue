<template>
  <UpmRecommendations
    :layout="layout"
    :configure-route="{ name: ROUTE.PRODUCT_CONFIGURE }"
  />
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { UpmRecommendations } from "@upmind-automation/client-vue";
import { ROUTE } from "../router";
import type { LAYOUT_VARIANTS } from "@upmind-automation/client-vue";

// -----------------------------------------------------------------------------
const route = useRoute();

const layout = computed(() => {
  return route?.meta?.template as LAYOUT_VARIANTS;
});
</script>
