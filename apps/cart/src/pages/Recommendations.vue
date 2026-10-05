<template>
  <UpmRecommendations
    :layout="layout"
    :configure-route="{ name: ROUTE.PRODUCT_CONFIGURE }"
    v-slot="{ template }"
  >
    <component :is="recommendationsTemplate(template)" />
  </UpmRecommendations>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { UpmRecommendations } from "@upmind-automation/recommendations";
import { ROUTE } from "../router";
import { recommendationsTemplate } from "../shell/modules/recommendations/shell";
import type { LAYOUT_VARIANTS } from "@upmind-automation/foundation";

// -----------------------------------------------------------------------------
const route = useRoute();

const layout = computed(() => {
  return route?.meta?.template as LAYOUT_VARIANTS;
});
</script>
