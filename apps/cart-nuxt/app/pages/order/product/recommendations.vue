<template>
  <UpmProductRecommendations
    :configure-route="{ name: ROUTE.PRODUCT_CONFIGURE }"
  />
</template>

<script lang="ts" setup>
// --- components
import { UpmProductRecommendations } from "@upmind-automation/client-vue";

// --- internal
import { ROUTE } from "~/router/types";

// -----------------------------------------------------------------------------

definePageMeta({
  name: ROUTE.PRODUCT_RECOMMENDATIONS
});
</script>
