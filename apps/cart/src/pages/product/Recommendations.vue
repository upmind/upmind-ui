<template>
  <UpmProductRecommendations
    :configure-route="{ name: ROUTE.PRODUCT_CONFIGURE }"
    v-slot="{ template }"
  >
    <component :is="recommendationsTemplate(template)" />
  </UpmProductRecommendations>
</template>
<script lang="ts" setup>
import { recommendationsTemplate } from "@upmind-automation/client-vue";
import { UpmProductRecommendations } from "@upmind-automation/recommendations";
import { ROUTE } from "../../router";

// -----------------------------------------------------------------------------
</script>
