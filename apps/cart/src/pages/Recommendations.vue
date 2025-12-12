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
  useRoutingEngine
} from "@upmind-automation/client-vue";

// --- internal
import { ROUTE } from "../router";
import { LAYOUT_VARIANTS } from "@upmind-automation/client-vue";

// -----------------------------------------------------------------------------
const route = useRoute();

const layout = computed(() => {
  return route?.meta?.template as LAYOUT_VARIANTS;
});
</script>
