<template>
  <UpmOrder :storefront-route="{ name: ROUTE.STOREFRONT }" />
</template>

<script lang="ts" setup>
// --- components
import { UpmOrder, useRoutingEngine } from "@upmind-automation/client-vue";

// --- internal
import { ROUTE } from "~/router/types";

// -----------------------------------------------------------------------------

definePageMeta({
  name: ROUTE.ORDER
});
</script>
