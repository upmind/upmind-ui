<template>
  <UpmProductRecommendations
    :configure-route="{ name: ROUTE.PRODUCT_CONFIGURE }"
  />
</template>
<script lang="ts" setup>
// --- components
import {
  UpmProductRecommendations,
  useRoutingEngine
} from "@upmind-automation/client-vue";

// --- internal
import { ROUTE } from "../../router";

// -----------------------------------------------------------------------------
</script>
