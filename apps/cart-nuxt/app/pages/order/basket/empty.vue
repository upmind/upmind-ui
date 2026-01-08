<template>
  <UpmEmpty :storefront-route="{ name: ROUTE.STOREFRONT }" />
</template>

<script lang="ts" setup>
// --- components
import { UpmEmpty, useRoutingEngine } from "@upmind-automation/client-vue";

// --- internal
import { ROUTE } from "~/router/types";

// -----------------------------------------------------------------------------

definePageMeta({
  name: ROUTE.BASKET_EMPTY
});
</script>
