<template>
  <UpmProductRecommendations
    :configure-route="{ name: ROUTE.PRODUCT_CONFIGURE }"
    v-slot="{ template }"
  >
    <component :is="recommendationsTemplate(template)" />
  </UpmProductRecommendations>
</template>
<script lang="ts" setup>
import { UpmProductRecommendations } from "@upmind-automation/recommendations";
import { ROUTE } from "../../router";
import { recommendationsTemplate } from "../../shell/modules/recommendations/shell";

// -----------------------------------------------------------------------------
</script>
